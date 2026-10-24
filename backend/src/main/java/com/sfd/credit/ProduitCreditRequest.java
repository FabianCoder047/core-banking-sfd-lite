package com.sfd.credit;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProduitCreditRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 100) String libelle,
        @NotNull @DecimalMin("0") @Digits(integer = 3, fraction = 3) BigDecimal tauxAnnuel,
        @Min(1) int dureeMinMois,
        @Min(1) int dureeMaxMois,
        @NotNull @Positive @Digits(integer = 15, fraction = 0) BigDecimal montantMin,
        @NotNull @Positive @Digits(integer = 15, fraction = 0) BigDecimal montantMax,
        @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal fraisDossierPct,
        @NotNull ModeAmortissement modeAmortissement,
        Boolean actif) {
}
