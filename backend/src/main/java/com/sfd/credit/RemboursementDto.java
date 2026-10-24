package com.sfd.credit;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RemboursementDto(
        Long operationId,
        String reference,
        BigDecimal montant,
        BigDecimal partCapital,
        BigDecimal partInteret,
        BigDecimal montantRestantDu,
        StatutCredit statutCredit,
        Instant dateOperation,
        List<EcheanceDto> echeances) {
}
