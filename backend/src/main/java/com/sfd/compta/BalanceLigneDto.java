package com.sfd.compta;

import java.math.BigDecimal;

public record BalanceLigneDto(
        String numero,
        String libelle,
        TypeCompte type,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal soldeDebit,
        BigDecimal soldeCredit) {
}
