package com.sfd.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDto(
        long nombreClients,
        BigDecimal encoursEpargne,
        BigDecimal encoursCredit,
        long creditsEnAttente,
        long creditsDecaisses,
        long comptesActifs,
        long echeancesEnRetard,
        BigDecimal montantImpaye,
        Long agenceId,
        List<RepartitionStatutDto> repartitionCredits,
        List<FluxMensuelDto> fluxMensuels,
        List<AgenceStatDto> agences) {
}
