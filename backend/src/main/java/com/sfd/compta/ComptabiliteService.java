package com.sfd.compta;

import com.sfd.agence.Agence;
import com.sfd.common.api.Montants;
import com.sfd.common.error.BusinessException;
import com.sfd.common.security.AccesAgence;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.operation.Operation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComptabiliteService {

    public static final String COMPTE_CAISSE = "101";
    public static final String COMPTE_DEPOTS = "201";
    public static final String COMPTE_CREDITS = "301";
    public static final String COMPTE_INTERETS = "701";
    public static final String COMPTE_FRAIS = "702";

    private final EcritureRepository ecritureRepository;
    private final CompteComptableRepository compteRepository;

    public ComptabiliteService(EcritureRepository ecritureRepository,
                               CompteComptableRepository compteRepository) {
        this.ecritureRepository = ecritureRepository;
        this.compteRepository = compteRepository;
    }

    /**
     * Enregistre une ecriture equilibree. Levee ECRITURE_DESEQUILIBREE avant toute
     * persistance, donc rollback complet de la transaction appelante (RG-12, RG-13).
     */
    @Transactional
    public Ecriture enregistrer(Operation operation, Journal journal, String libelle,
                                List<LigneEcritureCommand> lignes) {
        return enregistrer(operation.getAgence(), operation, journal, libelle,
                LocalDate.now(ZoneOffset.UTC), lignes);
    }

    @Transactional
    public Ecriture enregistrer(Agence agence, Operation operation, Journal journal, String libelle,
                                LocalDate dateComptable, List<LigneEcritureCommand> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            throw ecritureDesequilibree(BigDecimal.ZERO, BigDecimal.ZERO);
        }

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        Map<String, CompteComptable> comptes = new HashMap<>();
        for (LigneEcritureCommand ligne : lignes) {
            if (!Montants.estPositif(ligne.montant())) {
                throw new BusinessException("MONTANT_INVALIDE", "Chaque ligne d'ecriture doit etre strictement positive.");
            }
            CompteComptable compte = comptes.computeIfAbsent(ligne.compte(), numero -> compteRepository.findByNumero(numero)
                    .orElseThrow(() -> BusinessException.notFound("COMPTE_COMPTABLE_INTROUVABLE",
                            "Compte comptable inconnu : " + numero)));
            if (ligne.sens() == Sens.D) {
                totalDebit = totalDebit.add(Montants.arrondir(ligne.montant()));
            } else {
                totalCredit = totalCredit.add(Montants.arrondir(ligne.montant()));
            }
        }

        if (totalDebit.signum() == 0 || totalDebit.compareTo(totalCredit) != 0) {
            throw ecritureDesequilibree(totalDebit, totalCredit);
        }

        Ecriture ecriture = new Ecriture();
        ecriture.setJournal(journal);
        ecriture.setLibelle(libelle);
        ecriture.setDateComptable(dateComptable);
        ecriture.setAgence(agence);
        ecriture.setOperation(operation);
        for (LigneEcritureCommand ligne : lignes) {
            ecriture.ajouterLigne(comptes.get(ligne.compte()), ligne.sens(), Montants.arrondir(ligne.montant()));
        }
        return ecritureRepository.save(ecriture);
    }

    /**
     * Extourne comptable : nouvelle ecriture inverse, une seule fois (RG-14).
     */
    @Transactional
    public EcritureDto extourner(Long ecritureId) {
        Ecriture originale = ecritureRepository.findWithLignesById(ecritureId)
                .orElseThrow(() -> BusinessException.notFound("ECRITURE_INTROUVABLE", "Ecriture introuvable."));
        if (originale.getExtourneDe() != null) {
            throw new BusinessException("EXTOURNE_IMPOSSIBLE", "Une ecriture d'extourne ne peut pas etre extournee.");
        }
        if (ecritureRepository.existsByExtourneDeId(ecritureId)) {
            throw new BusinessException("ECRITURE_DEJA_EXTOURNEE", "Cette ecriture a deja ete extournee.");
        }

        Ecriture inverse = new Ecriture();
        inverse.setJournal(originale.getJournal());
        inverse.setLibelle(tronquer("Extourne : " + originale.getLibelle()));
        inverse.setDateComptable(LocalDate.now(ZoneOffset.UTC));
        inverse.setAgence(originale.getAgence());
        inverse.setExtourneDe(originale);
        for (LigneEcriture ligne : originale.getLignes()) {
            inverse.ajouterLigne(ligne.getCompteComptable(),
                    ligne.getSens() == Sens.D ? Sens.C : Sens.D,
                    ligne.getMontant());
        }
        return EcritureDto.from(ecritureRepository.save(inverse));
    }

    @Transactional(readOnly = true)
    public BalanceDto balance(AuthPrincipal principal, LocalDate du, LocalDate au, Long agenceId) {
        LocalDate debut = du == null ? LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1) : du;
        LocalDate fin = au == null ? LocalDate.now(ZoneOffset.UTC) : au;
        verifierPeriode(debut, fin);
        Long filtreAgence = AccesAgence.agenceEffective(principal, agenceId);

        Map<String, BalanceLigneBrute> mouvements = new HashMap<>();
        for (BalanceLigneBrute brute : ecritureRepository.balance(debut, fin, filtreAgence)) {
            mouvements.put(brute.numero(), brute);
        }

        List<BalanceLigneDto> lignes = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        for (CompteComptable compte : compteRepository.findAllByOrderByNumeroAsc()) {
            BalanceLigneBrute brute = mouvements.get(compte.getNumero());
            BigDecimal debit = brute == null ? BigDecimal.ZERO : brute.totalDebit();
            BigDecimal credit = brute == null ? BigDecimal.ZERO : brute.totalCredit();
            BigDecimal solde = debit.subtract(credit);
            lignes.add(new BalanceLigneDto(
                    compte.getNumero(),
                    compte.getLibelle(),
                    compte.getType(),
                    debit,
                    credit,
                    solde.signum() > 0 ? solde : BigDecimal.ZERO,
                    solde.signum() < 0 ? solde.negate() : BigDecimal.ZERO));
            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);
        }
        return new BalanceDto(debut, fin, filtreAgence, lignes, totalDebit, totalCredit,
                totalDebit.compareTo(totalCredit) == 0);
    }

    @Transactional(readOnly = true)
    public GrandLivreDto grandLivre(AuthPrincipal principal, String numeroCompte,
                                    LocalDate du, LocalDate au, Long agenceId) {
        CompteComptable compte = compteRepository.findByNumero(numeroCompte)
                .orElseThrow(() -> BusinessException.notFound("COMPTE_COMPTABLE_INTROUVABLE",
                        "Compte comptable inconnu : " + numeroCompte));
        LocalDate debut = du == null ? LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1) : du;
        LocalDate fin = au == null ? LocalDate.now(ZoneOffset.UTC) : au;
        verifierPeriode(debut, fin);
        Long filtreAgence = AccesAgence.agenceEffective(principal, agenceId);

        List<GrandLivreLigneDto> lignes = new ArrayList<>();
        BigDecimal cumul = BigDecimal.ZERO;
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        for (GrandLivreLigneBrute brute : ecritureRepository.grandLivre(numeroCompte, debut, fin, filtreAgence)) {
            BigDecimal debit = brute.sens() == Sens.D ? brute.montant() : BigDecimal.ZERO;
            BigDecimal credit = brute.sens() == Sens.C ? brute.montant() : BigDecimal.ZERO;
            cumul = cumul.add(debit).subtract(credit);
            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);
            lignes.add(new GrandLivreLigneDto(brute.ecritureId(), brute.dateComptable(), brute.journal(),
                    brute.libelle(), brute.sens(), debit, credit, cumul));
        }
        return new GrandLivreDto(compte.getNumero(), compte.getLibelle(), debut, fin, lignes,
                totalDebit, totalCredit, cumul);
    }

    @Transactional(readOnly = true)
    public EcritureDto obtenirEcriture(Long id) {
        return EcritureDto.from(ecritureRepository.findWithLignesById(id)
                .orElseThrow(() -> BusinessException.notFound("ECRITURE_INTROUVABLE", "Ecriture introuvable.")));
    }

    private void verifierPeriode(LocalDate du, LocalDate au) {
        if (du.isAfter(au)) {
            throw new BusinessException("PERIODE_INVALIDE", "La date de debut doit preceder la date de fin.");
        }
    }

    private BusinessException ecritureDesequilibree(BigDecimal debit, BigDecimal credit) {
        return new BusinessException("ECRITURE_DESEQUILIBREE",
                "Ecriture desequilibree : debits=" + debit + ", credits=" + credit + ".");
    }

    private String tronquer(String valeur) {
        return valeur.length() <= 200 ? valeur : valeur.substring(0, 200);
    }
}
