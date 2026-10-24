package com.sfd.credit;

import java.math.BigDecimal;

public record ProduitCreditDto(
        Long id,
        String code,
        String libelle,
        BigDecimal tauxAnnuel,
        int dureeMinMois,
        int dureeMaxMois,
        BigDecimal montantMin,
        BigDecimal montantMax,
        BigDecimal fraisDossierPct,
        ModeAmortissement modeAmortissement,
        boolean actif) {

    public static ProduitCreditDto from(ProduitCredit produit) {
        return new ProduitCreditDto(
                produit.getId(), produit.getCode(), produit.getLibelle(), produit.getTauxAnnuel(),
                produit.getDureeMinMois(), produit.getDureeMaxMois(), produit.getMontantMin(),
                produit.getMontantMax(), produit.getFraisDossierPct(), produit.getModeAmortissement(),
                produit.isActif());
    }
}
