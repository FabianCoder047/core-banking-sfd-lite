package com.sfd.compta;

import java.math.BigDecimal;

public record LigneEcritureDto(
        Long id,
        String compteNumero,
        String compteLibelle,
        Sens sens,
        BigDecimal montant) {

    public static LigneEcritureDto from(LigneEcriture ligne) {
        return new LigneEcritureDto(
                ligne.getId(),
                ligne.getCompteComptable().getNumero(),
                ligne.getCompteComptable().getLibelle(),
                ligne.getSens(),
                ligne.getMontant());
    }
}
