package com.sfd.credit;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreditDto(
        Long id,
        String numero,
        Long clientId,
        String clientNomComplet,
        Long agenceId,
        String agenceCode,
        Long produitId,
        String produitLibelle,
        Long compteId,
        String compteNumero,
        Long agentId,
        String agentNomComplet,
        BigDecimal montantDemande,
        int dureeMois,
        BigDecimal tauxAnnuel,
        BigDecimal fraisDossierPct,
        ModeAmortissement modeAmortissement,
        StatutCredit statut,
        String motifRejet,
        LocalDate dateDemande,
        LocalDate dateDecaissement) {

    public static CreditDto from(Credit credit) {
        return new CreditDto(
                credit.getId(),
                credit.getNumero(),
                credit.getClient().getId(),
                credit.getClient().getPrenom() + " " + credit.getClient().getNom(),
                credit.getAgence().getId(),
                credit.getAgence().getCode(),
                credit.getProduit().getId(),
                credit.getProduit().getLibelle(),
                credit.getCompte().getId(),
                credit.getCompte().getNumero(),
                credit.getAgent().getId(),
                credit.getAgent().getPrenom() + " " + credit.getAgent().getNom(),
                credit.getMontantDemande(),
                credit.getDureeMois(),
                credit.getTauxAnnuel(),
                credit.getProduit().getFraisDossierPct(),
                credit.getProduit().getModeAmortissement(),
                credit.getStatut(),
                credit.getMotifRejet(),
                credit.getDateDemande(),
                credit.getDateDecaissement());
    }
}
