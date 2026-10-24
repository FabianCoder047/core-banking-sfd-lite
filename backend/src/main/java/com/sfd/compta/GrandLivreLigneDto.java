package com.sfd.compta;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GrandLivreLigneDto(
        Long ecritureId,
        LocalDate dateComptable,
        Journal journal,
        String libelle,
        Sens sens,
        BigDecimal debit,
        BigDecimal credit,
        BigDecimal soldeProgressif) {
}
