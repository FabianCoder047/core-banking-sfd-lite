package com.sfd.dashboard;

import java.math.BigDecimal;

public record AgenceStatDto(
        Long agenceId,
        String code,
        String nom,
        long clients,
        BigDecimal epargne,
        BigDecimal credit,
        long demandes) {
}
