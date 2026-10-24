package com.sfd.credit;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record DemandeCreditRequest(
        @NotNull Long clientId,
        @NotNull Long produitId,
        @NotNull Long compteId,
        @NotNull @Positive @Digits(integer = 15, fraction = 0) BigDecimal montant,
        @Min(1) int dureeMois) {
}
