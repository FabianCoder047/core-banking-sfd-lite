package com.sfd.dashboard;

import com.sfd.agence.AgenceRepository;
import com.sfd.client.ClientRepository;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.credit.CreditRepository;
import com.sfd.credit.EcheanceRepository;
import com.sfd.credit.StatutCredit;
import com.sfd.epargne.CompteEpargneRepository;
import com.sfd.operation.OperationRepository;
import com.sfd.operation.TypeOperation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private ClientRepository clientRepository;
    private CompteEpargneRepository compteRepository;
    private EcheanceRepository echeanceRepository;
    private CreditRepository creditRepository;
    private OperationRepository operationRepository;
    private AgenceRepository agenceRepository;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        clientRepository = mock(ClientRepository.class);
        compteRepository = mock(CompteEpargneRepository.class);
        echeanceRepository = mock(EcheanceRepository.class);
        creditRepository = mock(CreditRepository.class);
        operationRepository = mock(OperationRepository.class);
        agenceRepository = mock(AgenceRepository.class);
        service = new DashboardService(clientRepository, compteRepository, echeanceRepository,
                creditRepository, operationRepository, agenceRepository);
    }

    @Test
    void agrege_les_indicateurs_et_complete_les_mois_sans_operation() {
        Long agence = 1L;
        when(clientRepository.compter(agence)).thenReturn(4L);
        when(compteRepository.sommeSoldes(agence)).thenReturn(new BigDecimal("2500000"));
        when(compteRepository.compterActifs(agence)).thenReturn(3L);
        when(echeanceRepository.encoursCapital(agence)).thenReturn(new BigDecimal("2000000"));
        when(echeanceRepository.compterEnRetard(any(LocalDate.class), eq(agence))).thenReturn(2L);
        when(echeanceRepository.montantImpaye(any(LocalDate.class), eq(agence)))
                .thenReturn(new BigDecimal("75000"));
        when(creditRepository.compterParStatut(any(StatutCredit.class), eq(agence)))
                .thenAnswer(invocation -> invocation.getArgument(0) == StatutCredit.DECAISSE ? 3L : 1L);

        String moisCourant = YearMonth.now(ZoneOffset.UTC).toString();
        when(operationRepository.sommeParMois(eq(TypeOperation.DEPOT), any(Instant.class), eq(agence)))
                .thenReturn(List.<Object[]>of(new Object[]{moisCourant, new BigDecimal("1000")}));
        when(operationRepository.sommeParMois(eq(TypeOperation.DECAISSEMENT), any(Instant.class), eq(agence)))
                .thenReturn(List.<Object[]>of());
        when(operationRepository.sommeParMois(eq(TypeOperation.REMBOURSEMENT), any(Instant.class), eq(agence)))
                .thenReturn(List.<Object[]>of());

        when(agenceRepository.statistiquesParAgence(agence)).thenReturn(List.<Object[]>of(
                new Object[]{agence, "AG001", "Agence de Lome", 4L,
                        new BigDecimal("2500000"), new BigDecimal("2000000"), 1L}));

        DashboardDto dto = service.tableauDeBord(
                new AuthPrincipal(10L, "agent@sfd.tg", "AGENT_CREDIT", agence), null);

        assertThat(dto.agenceId()).isEqualTo(agence);
        assertThat(dto.nombreClients()).isEqualTo(4L);
        assertThat(dto.comptesActifs()).isEqualTo(3L);
        assertThat(dto.creditsEnAttente()).isEqualTo(1L);
        assertThat(dto.creditsDecaisses()).isEqualTo(3L);
        assertThat(dto.echeancesEnRetard()).isEqualTo(2L);
        assertThat(dto.montantImpaye()).isEqualByComparingTo(new BigDecimal("75000"));
        assertThat(dto.repartitionCredits()).hasSize(StatutCredit.values().length);
        assertThat(dto.agences()).singleElement()
                .extracting(AgenceStatDto::code)
                .isEqualTo("AG001");

        assertThat(dto.fluxMensuels()).hasSize(6);
        FluxMensuelDto dernier = dto.fluxMensuels().get(5);
        assertThat(dernier.mois()).isEqualTo(moisCourant);
        assertThat(dernier.collecte()).isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(dto.fluxMensuels().get(0).collecte()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.fluxMensuels().get(5).decaissements()).isEqualByComparingTo(BigDecimal.ZERO);

        verify(clientRepository).compter(agence);
        verify(operationRepository).sommeParMois(eq(TypeOperation.DEPOT), any(Instant.class), eq(agence));
    }
}
