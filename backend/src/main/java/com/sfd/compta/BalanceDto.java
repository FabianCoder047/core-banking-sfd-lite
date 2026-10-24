package com.sfd.compta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BalanceDto(
        LocalDate du,
        LocalDate au,
        Long agenceId,
        List<BalanceLigneDto> lignes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        boolean equilibree) {
}
