package com.sfd.compta;

import java.math.BigDecimal;

public record BalanceLigneBrute(
        String numero,
        String libelle,
        TypeCompte type,
        BigDecimal totalDebit,
        BigDecimal totalCredit) {
}
