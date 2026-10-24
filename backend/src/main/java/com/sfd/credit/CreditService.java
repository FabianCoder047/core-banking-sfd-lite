package com.sfd.credit;

import com.sfd.client.Client;
import com.sfd.client.ClientRepository;
import com.sfd.common.api.Montants;
import com.sfd.common.api.PageResponse;
import com.sfd.common.error.BusinessException;
import com.sfd.common.security.AccesAgence;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.compta.ComptabiliteService;
import com.sfd.compta.Journal;
import com.sfd.compta.LigneEcritureCommand;
import com.sfd.epargne.CompteEpargne;
import com.sfd.epargne.CompteEpargneRepository;
import com.sfd.epargne.StatutCompte;
import com.sfd.operation.Operation;
import com.sfd.operation.OperationFactory;
import com.sfd.operation.OperationRepository;
import com.sfd.operation.TypeOperation;
import com.sfd.utilisateur.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CreditService {

    private final CreditRepository creditRepository;
    private final EcheanceRepository echeanceRepository;
    private final ProduitCreditRepository produitRepository;
    private final ClientRepository clientRepository;
    private final CompteEpargneRepository compteRepository;
    private final OperationRepository operationRepository;
    private final OperationFactory operationFactory;
    private final ComptabiliteService comptabiliteService;
    private final CalculateurEcheancier calculateur;
    private final UtilisateurRepository utilisateurRepository;
    private final int maxCreditsDecaisse;

    public CreditService(CreditRepository creditRepository,
                         EcheanceRepository echeanceRepository,
                         ProduitCreditRepository produitRepository,
                         ClientRepository clientRepository,
                         CompteEpargneRepository compteRepository,
                         OperationRepository operationRepository,
                         OperationFactory operationFactory,
                         ComptabiliteService comptabiliteService,
                         CalculateurEcheancier calculateur,
                         UtilisateurRepository utilisateurRepository,
                         @Value("${sfd.credit.max-credits-decaisse:2}") int maxCreditsDecaisse) {
        this.creditRepository = creditRepository;
        this.echeanceRepository = echeanceRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.compteRepository = compteRepository;
        this.operationRepository = operationRepository;
        this.operationFactory = operationFactory;
        this.comptabiliteService = comptabiliteService;
        this.calculateur = calculateur;
        this.utilisateurRepository = utilisateurRepository;
        this.maxCreditsDecaisse = maxCreditsDecaisse;
    }

    @Transactional
    public CreditDto demander(AuthPrincipal principal, DemandeCreditRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> BusinessException.notFound("CLIENT_INTROUVABLE", "Client introuvable."));
        AccesAgence.verifier(principal, client.getAgence().getId());
        if ("BLOQUE".equals(client.getStatut())) {
            throw new BusinessException("CLIENT_BLOQUE", "Ce client est bloque et ne peut pas demander de credit.");
        }

        ProduitCredit produit = produitRepository.findById(request.produitId())
                .orElseThrow(() -> BusinessException.notFound("PRODUIT_INTROUVABLE", "Produit de credit introuvable."));
        if (!produit.isActif()) {
            throw new BusinessException("PRODUIT_INACTIF", "Ce produit de credit n'est pas actif.");
        }

        CompteEpargne compte = compteRepository.findById(request.compteId())
                .orElseThrow(() -> BusinessException.notFound("COMPTE_INTROUVABLE", "Compte d'epargne introuvable."));
        if (!compte.getClient().getId().equals(client.getId())) {
            throw new BusinessException("COMPTE_NON_CONFORME", "Le compte de decaissement n'appartient pas au client.");
        }
        AccesAgence.verifier(principal, compte.getAgence().getId());

        BigDecimal montant = Montants.arrondir(request.montant());
        if (montant.compareTo(produit.getMontantMin()) < 0 || montant.compareTo(produit.getMontantMax()) > 0) {
            throw new BusinessException("MONTANT_HORS_BORNES",
                    "Le montant doit etre compris entre " + produit.getMontantMin()
                            + " et " + produit.getMontantMax() + " FCFA.");
        }
        if (request.dureeMois() < produit.getDureeMinMois() || request.dureeMois() > produit.getDureeMaxMois()) {
            throw new BusinessException("DUREE_HORS_BORNES",
                    "La duree doit etre comprise entre " + produit.getDureeMinMois()
                            + " et " + produit.getDureeMaxMois() + " mois.");
        }
        long encours = creditRepository.countByClientIdAndStatut(client.getId(), StatutCredit.DECAISSE);
        if (encours >= maxCreditsDecaisse) {
            throw new BusinessException("LIMITE_CREDITS_ATTEINTE",
                    "Le client a deja atteint la limite de " + maxCreditsDecaisse + " credits en cours.");
        }

        Credit credit = new Credit();
        credit.setNumero(String.format("CR-%s-%06d", client.getAgence().getCode(),
                creditRepository.prochainNumeroSequence()));
        credit.setClient(client);
        credit.setAgence(client.getAgence());
        credit.setProduit(produit);
        credit.setCompte(compte);
        credit.setAgent(utilisateurRepository.getReferenceById(principal.id()));
        credit.setMontantDemande(montant);
        credit.setDureeMois(request.dureeMois());
        credit.setTauxAnnuel(produit.getTauxAnnuel());
        credit.setStatut(StatutCredit.DEMANDE);
        credit.setDateDemande(LocalDate.now(ZoneOffset.UTC));
        return CreditDto.from(creditRepository.save(credit));
    }

    @Transactional
    public CreditDto approuver(AuthPrincipal principal, Long creditId, ApprobationRequest request) {
        Credit credit = creditRepository.findByIdForUpdate(creditId)
                .orElseThrow(() -> BusinessException.notFound("CREDIT_INTROUVABLE", "Credit introuvable."));
        AccesAgence.verifier(principal, credit.getAgence().getId());
        if (credit.getStatut() != StatutCredit.DEMANDE) {
            throw transitionInterdite(credit.getStatut(), "approbation");
        }
        if (credit.getAgent().getId().equals(principal.id())) {
            throw new BusinessException("AUTO_APPROBATION_INTERDITE", HttpStatus.FORBIDDEN,
                    "L'agent qui a cree la demande ne peut pas l'approuver.");
        }
        if (request.decision() == DecisionCredit.REJETE) {
            if (request.motif() == null || request.motif().isBlank()) {
                throw new BusinessException("MOTIF_REJET_REQUIS", "Un motif est obligatoire pour rejeter une demande.");
            }
            credit.setStatut(StatutCredit.REJETE);
            credit.setMotifRejet(request.motif().trim());
        } else {
            credit.setStatut(StatutCredit.APPROUVE);
            credit.setMotifRejet(null);
        }
        return CreditDto.from(credit);
    }

    @Transactional
    public CreditDto decaisser(AuthPrincipal principal, Long creditId) {
        Credit credit = creditRepository.findByIdForUpdate(creditId)
                .orElseThrow(() -> BusinessException.notFound("CREDIT_INTROUVABLE", "Credit introuvable."));
        AccesAgence.verifier(principal, credit.getAgence().getId());
        if (credit.getStatut() != StatutCredit.APPROUVE) {
            throw transitionInterdite(credit.getStatut(), "decaissement");
        }

        CompteEpargne compte = compteRepository.findByIdForUpdate(credit.getCompte().getId())
                .orElseThrow(() -> BusinessException.notFound("COMPTE_INTROUVABLE", "Compte d'epargne introuvable."));
        AccesAgence.verifier(principal, compte.getAgence().getId());
        if (compte.getStatut() != StatutCompte.ACTIF) {
            throw new BusinessException("COMPTE_NON_ACTIF", HttpStatus.CONFLICT,
                    "Le compte de decaissement n'est pas actif.");
        }

        LocalDate dateDecaissement = LocalDate.now(ZoneOffset.UTC);
        List<EcheanceCalculee> calculees = calculateur.calculer(credit.getMontantDemande(),
                credit.getDureeMois(), credit.getTauxAnnuel(),
                credit.getProduit().getModeAmortissement(), dateDecaissement);
        for (EcheanceCalculee calculee : calculees) {
            Echeance echeance = new Echeance();
            echeance.setNumero(calculee.numero());
            echeance.setDateEcheance(calculee.dateEcheance());
            echeance.setCapitalDu(calculee.capital());
            echeance.setInteretDu(calculee.interet());
            echeance.setCapitalPaye(BigDecimal.ZERO);
            echeance.setInteretPaye(BigDecimal.ZERO);
            echeance.setStatut(StatutEcheance.A_PAYER);
            credit.ajouterEcheance(echeance);
        }

        BigDecimal montant = credit.getMontantDemande();
        BigDecimal frais = Montants.arrondir(montant
                .multiply(credit.getProduit().getFraisDossierPct())
                .divide(BigDecimal.valueOf(100), 10, Montants.ARRONDI));
        if (frais.compareTo(montant) > 0) {
            throw new BusinessException("FRAIS_DOSSIER_INVALIDES",
                    "Les frais de dossier ne peuvent pas depasser le montant du credit.");
        }

        compte.setSolde(compte.getSolde().add(montant));

        Operation decaissement = operationFactory.creer(TypeOperation.DECAISSEMENT, credit.getAgence(),
                compte, credit, montant, principal);
        operationRepository.save(decaissement);
        comptabiliteService.enregistrer(decaissement, Journal.CREDIT,
                "Decaissement credit " + credit.getNumero(),
                List.of(LigneEcritureCommand.debit(ComptabiliteService.COMPTE_CREDITS, montant),
                        LigneEcritureCommand.credit(ComptabiliteService.COMPTE_DEPOTS, montant)));

        if (frais.signum() > 0) {
            compte.setSolde(compte.getSolde().subtract(frais));
            Operation fraisOperation = operationFactory.creer(TypeOperation.FRAIS_DOSSIER, credit.getAgence(),
                    compte, credit, frais, principal);
            operationRepository.save(fraisOperation);
            comptabiliteService.enregistrer(fraisOperation, Journal.OD,
                    "Frais de dossier credit " + credit.getNumero(),
                    List.of(LigneEcritureCommand.debit(ComptabiliteService.COMPTE_DEPOTS, frais),
                            LigneEcritureCommand.credit(ComptabiliteService.COMPTE_FRAIS, frais)));
        }

        credit.setStatut(StatutCredit.DECAISSE);
        credit.setDateDecaissement(dateDecaissement);
        return CreditDto.from(credit);
    }

    @Transactional(readOnly = true)
    public CreditDto obtenir(AuthPrincipal principal, Long creditId) {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> BusinessException.notFound("CREDIT_INTROUVABLE", "Credit introuvable."));
        AccesAgence.verifier(principal, credit.getAgence().getId());
        return CreditDto.from(credit);
    }

    @Transactional(readOnly = true)
    public PageResponse<CreditDto> lister(AuthPrincipal principal, StatutCredit statut,
                                          Long clientId, Long agenceId, Pageable pageable) {
        Long filtreAgence = AccesAgence.agenceEffective(principal, agenceId);
        return PageResponse.from(creditRepository.rechercher(filtreAgence, statut, clientId, pageable),
                CreditDto::from);
    }

    @Transactional(readOnly = true)
    public EcheancierDto echeancier(AuthPrincipal principal, Long creditId) {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> BusinessException.notFound("CREDIT_INTROUVABLE", "Credit introuvable."));
        AccesAgence.verifier(principal, credit.getAgence().getId());
        List<Echeance> echeances = echeanceRepository.findByCreditIdOrderByNumeroAsc(creditId);
        return construireEcheancier(credit, echeances);
    }

    @Transactional
    public RemboursementDto rembourser(AuthPrincipal principal, Long creditId, BigDecimal montantDemande) {
        Credit credit = creditRepository.findByIdForUpdate(creditId)
                .orElseThrow(() -> BusinessException.notFound("CREDIT_INTROUVABLE", "Credit introuvable."));
        AccesAgence.verifier(principal, credit.getAgence().getId());
        if (credit.getStatut() != StatutCredit.DECAISSE) {
            throw new BusinessException("CREDIT_NON_DECAISSE",
                    "Seul un credit decaisse peut etre rembourse (statut actuel : " + credit.getStatut() + ").");
        }

        CompteEpargne compte = compteRepository.findByIdForUpdate(credit.getCompte().getId())
                .orElseThrow(() -> BusinessException.notFound("COMPTE_INTROUVABLE", "Compte d'epargne introuvable."));
        if (compte.getStatut() != StatutCompte.ACTIF) {
            throw new BusinessException("COMPTE_NON_ACTIF", HttpStatus.CONFLICT,
                    "Le compte de remboursement n'est pas actif.");
        }

        List<Echeance> echeances = echeanceRepository.findByCreditIdOrderByNumeroAsc(creditId);
        BigDecimal montant = Montants.arrondir(montantDemande);
        BigDecimal totalRestant = echeances.stream()
                .map(Echeance::totalRestant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (montant.compareTo(totalRestant) > 0) {
            throw new BusinessException("SURPAIEMENT",
                    "Le montant depasse le total restant du (" + totalRestant + " FCFA).");
        }
        if (compte.getSolde().compareTo(montant) < 0) {
            throw new BusinessException("SOLDE_INSUFFISANT", "Le solde du compte est insuffisant.");
        }

        List<ImputationRemboursement.Ligne> repartition = ImputationRemboursement.repartir(echeances, montant);
        Map<Integer, Echeance> parNumero = echeances.stream()
                .collect(Collectors.toMap(Echeance::getNumero, Function.identity()));
        BigDecimal partCapital = BigDecimal.ZERO;
        BigDecimal partInteret = BigDecimal.ZERO;
        for (ImputationRemboursement.Ligne ligne : repartition) {
            Echeance echeance = parNumero.get(ligne.numeroEcheance());
            echeance.setCapitalPaye(echeance.getCapitalPaye().add(ligne.capital()));
            echeance.setInteretPaye(echeance.getInteretPaye().add(ligne.interet()));
            echeance.setStatut(echeance.estSoldee() ? StatutEcheance.PAYE : StatutEcheance.PARTIEL);
            partCapital = partCapital.add(ligne.capital());
            partInteret = partInteret.add(ligne.interet());
        }

        boolean toutSolde = echeances.stream().allMatch(Echeance::estSoldee);
        if (toutSolde) {
            credit.setStatut(StatutCredit.SOLDE);
        } else {
            credit.setStatut(StatutCredit.DECAISSE);
        }

        compte.setSolde(compte.getSolde().subtract(montant));
        Operation operation = operationFactory.creer(TypeOperation.REMBOURSEMENT, credit.getAgence(),
                compte, credit, montant, principal);
        operationRepository.save(operation);

        List<LigneEcritureCommand> lignes = new ArrayList<>();
        lignes.add(LigneEcritureCommand.debit(ComptabiliteService.COMPTE_DEPOTS, montant));
        if (partCapital.signum() > 0) {
            lignes.add(LigneEcritureCommand.credit(ComptabiliteService.COMPTE_CREDITS, partCapital));
        }
        if (partInteret.signum() > 0) {
            lignes.add(LigneEcritureCommand.credit(ComptabiliteService.COMPTE_INTERETS, partInteret));
        }
        comptabiliteService.enregistrer(operation, Journal.CREDIT,
                "Remboursement credit " + credit.getNumero(), lignes);

        BigDecimal restant = totalRestant.subtract(montant);
        return new RemboursementDto(operation.getId(), operation.getReference(), montant,
                partCapital, partInteret, restant, credit.getStatut(), operation.getDateOperation(),
                echeances.stream().map(EcheanceDto::from).toList());
    }

    private EcheancierDto construireEcheancier(Credit credit, List<Echeance> echeances) {
        BigDecimal totalCapital = echeances.stream().map(Echeance::getCapitalDu)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalInteret = echeances.stream().map(Echeance::getInteretDu)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaye = echeances.stream()
                .map(e -> e.getCapitalPaye().add(e.getInteretPaye()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRestant = echeances.stream().map(Echeance::totalRestant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new EcheancierDto(credit.getId(), credit.getNumero(), credit.getMontantDemande(),
                credit.getStatut(), echeances.stream().map(EcheanceDto::from).toList(),
                totalCapital, totalInteret, totalPaye, totalRestant);
    }

    private BusinessException transitionInterdite(StatutCredit statut, String action) {
        return new BusinessException("TRANSITION_INTERDITE",
                "Transition impossible depuis le statut " + statut + " pour l'action " + action + ".");
    }
}
