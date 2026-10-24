package com.sfd.credit;

import java.math.BigDecimal;
import java.util.List;

public record EcheancierDto(
        Long creditId,
        String numero,
        BigDecimal montant,
        StatutCredit statut,
        List<EcheanceDto> echeances,
        BigDecimal totalCapital,
        BigDecimal totalInteret,
        BigDecimal totalPaye,
        BigDecimal totalRestant) {
}
