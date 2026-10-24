package com.sfd.epargne;

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
import com.sfd.operation.Operation;
import com.sfd.operation.OperationDto;
import com.sfd.operation.OperationFactory;
import com.sfd.operation.OperationRepository;
import com.sfd.operation.TypeOperation;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class EpargneService {

    private final CompteEpargneRepository compteRepository;
    private final ClientRepository clientRepository;
    private final OperationRepository operationRepository;
    private final OperationFactory operationFactory;
    private final ComptabiliteService comptabiliteService;

    public EpargneService(CompteEpargneRepository compteRepository,
                          ClientRepository clientRepository,
                          OperationRepository operationRepository,
                          OperationFactory operationFactory,
                          ComptabiliteService comptabiliteService) {
        this.compteRepository = compteRepository;
        this.clientRepository = clientRepository;
        this.operationRepository = operationRepository;
        this.operationFactory = operationFactory;
        this.comptabiliteService = comptabiliteService;
    }

    @Transactional
    public CompteEpargneDto ouvrirCompte(AuthPrincipal principal, Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> BusinessException.notFound("CLIENT_INTROUVABLE", "Client introuvable."));
        AccesAgence.verifier(principal, client.getAgence().getId());

        CompteEpargne compte = new CompteEpargne();
        compte.setClient(client);
        compte.setAgence(client.getAgence());
        compte.setNumero(numeroCompte(client.getAgence().getCode()));
        compte.setSolde(BigDecimal.ZERO);
        compte.setStatut(StatutCompte.ACTIF);
        compte.setOuvertLe(Instant.now());
        return CompteEpargneDto.from(compteRepository.save(compte));
    }

    @Transactional(readOnly = true)
    public List<CompteEpargneDto> comptesDuClient(AuthPrincipal principal, Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> BusinessException.notFound("CLIENT_INTROUVABLE", "Client introuvable."));
        AccesAgence.verifier(principal, client.getAgence().getId());
        return compteRepository.findByClientIdOrderByOuvertLeDesc(clientId).stream()
                .map(CompteEpargneDto::from).toList();
    }

    @Transactional(readOnly = true)
    public CompteEpargneDto obtenir(AuthPrincipal principal, Long compteId) {
        CompteEpargne compte = chargerCompte(compteId);
        AccesAgence.verifier(principal, compte.getAgence().getId());
        return CompteEpargneDto.from(compte);
    }

    @Transactional
    public OperationDto depot(AuthPrincipal principal, Long compteId, BigDecimal montant) {
        CompteEpargne compte = verrouillerCompteActif(principal, compteId);
        BigDecimal valeur = Montants.arrondir(montant);
        compte.setSolde(compte.getSolde().add(valeur));

        Operation operation = operationFactory.creer(TypeOperation.DEPOT, compte.getAgence(), compte,
                null, valeur, principal);
        operationRepository.save(operation);
        comptabiliteService.enregistrer(operation, Journal.CAISSE,
                "Depot especes compte " + compte.getNumero(),
                List.of(LigneEcritureCommand.debit(ComptabiliteService.COMPTE_CAISSE, valeur),
                        LigneEcritureCommand.credit(ComptabiliteService.COMPTE_DEPOTS, valeur)));
        return OperationDto.from(operation);
    }

    @Transactional
    public OperationDto retrait(AuthPrincipal principal, Long compteId, BigDecimal montant) {
        CompteEpargne compte = verrouillerCompteActif(principal, compteId);
        BigDecimal valeur = Montants.arrondir(montant);
        if (compte.getSolde().compareTo(valeur) < 0) {
            throw new BusinessException("SOLDE_INSUFFISANT", "Le solde du compte est insuffisant.");
        }
        compte.setSolde(compte.getSolde().subtract(valeur));

        Operation operation = operationFactory.creer(TypeOperation.RETRAIT, compte.getAgence(), compte,
                null, valeur, principal);
        operationRepository.save(operation);
        comptabiliteService.enregistrer(operation, Journal.CAISSE,
                "Retrait especes compte " + compte.getNumero(),
                List.of(LigneEcritureCommand.debit(ComptabiliteService.COMPTE_DEPOTS, valeur),
                        LigneEcritureCommand.credit(ComptabiliteService.COMPTE_CAISSE, valeur)));
        return OperationDto.from(operation);
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationDto> releve(AuthPrincipal principal, Long compteId,
                                             LocalDate du, LocalDate au, int page, int taille) {
        CompteEpargne compte = chargerCompte(compteId);
        AccesAgence.verifier(principal, compte.getAgence().getId());
        Pageable pageable = PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "dateOperation"));
        // Bornes non nulles : evite un parametre Instant non type dans PostgreSQL.
        Instant debut = du == null ? Instant.EPOCH : du.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant fin = au == null ? Instant.parse("9999-12-31T23:59:59Z")
                : au.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return PageResponse.from(operationRepository.releveCompte(compteId, debut, fin, pageable),
                OperationDto::from);
    }

    @Transactional(readOnly = true)
    public CompteEpargne chargerCompte(Long compteId) {
        return compteRepository.findById(compteId)
                .orElseThrow(() -> BusinessException.notFound("COMPTE_INTROUVABLE", "Compte d'epargne introuvable."));
    }

    private CompteEpargne verrouillerCompteActif(AuthPrincipal principal, Long compteId) {
        CompteEpargne compte = compteRepository.findByIdForUpdate(compteId)
                .orElseThrow(() -> BusinessException.notFound("COMPTE_INTROUVABLE", "Compte d'epargne introuvable."));
        AccesAgence.verifier(principal, compte.getAgence().getId());
        if (compte.getStatut() != StatutCompte.ACTIF) {
            throw new BusinessException("COMPTE_NON_ACTIF", HttpStatus.CONFLICT,
                    "Le compte n'est pas actif (statut " + compte.getStatut() + ").");
        }
        return compte;
    }

    private String numeroCompte(String codeAgence) {
        return String.format("EP-%s-%06d", codeAgence, compteRepository.prochainNumeroSequence());
    }
}
