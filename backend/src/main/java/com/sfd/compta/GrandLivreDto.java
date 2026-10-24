package com.sfd.compta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GrandLivreDto(
        String compte,
        String libelle,
        LocalDate du,
        LocalDate au,
        List<GrandLivreLigneDto> lignes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal solde) {
}
