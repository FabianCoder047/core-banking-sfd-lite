package com.sfd.credit;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EcheanceCalculee(
        int numero,
        LocalDate dateEcheance,
        BigDecimal capital,
        BigDecimal interet) {

    public BigDecimal total() {
        return capital.add(interet);
    }
}
