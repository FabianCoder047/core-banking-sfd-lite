package com.sfd.dashboard;

import java.math.BigDecimal;

public record FluxMensuelDto(
        String mois,
        BigDecimal collecte,
        BigDecimal decaissements,
        BigDecimal remboursements) {
}
