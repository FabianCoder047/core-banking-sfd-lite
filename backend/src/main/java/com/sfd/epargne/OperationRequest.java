package com.sfd.epargne;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record OperationRequest(
        @NotNull @Positive @Digits(integer = 15, fraction = 0) BigDecimal montant) {
}
