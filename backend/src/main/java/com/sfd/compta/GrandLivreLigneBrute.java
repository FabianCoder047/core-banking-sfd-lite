package com.sfd.compta;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GrandLivreLigneBrute(
        Long ecritureId,
        LocalDate dateComptable,
        Journal journal,
        String libelle,
        Sens sens,
        BigDecimal montant) {
}
