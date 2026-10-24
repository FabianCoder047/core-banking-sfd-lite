package com.sfd.compta;

import java.math.BigDecimal;

public record LigneEcritureCommand(String compte, Sens sens, BigDecimal montant) {

    public static LigneEcritureCommand debit(String compte, BigDecimal montant) {
        return new LigneEcritureCommand(compte, Sens.D, montant);
    }

    public static LigneEcritureCommand credit(String compte, BigDecimal montant) {
        return new LigneEcritureCommand(compte, Sens.C, montant);
    }
}
