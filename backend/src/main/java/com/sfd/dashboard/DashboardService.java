package com.sfd.dashboard;

import com.sfd.agence.AgenceRepository;
import com.sfd.client.ClientRepository;
import com.sfd.common.security.AccesAgence;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.credit.CreditRepository;
import com.sfd.credit.EcheanceRepository;
import com.sfd.credit.StatutCredit;
import com.sfd.epargne.CompteEpargneRepository;
import com.sfd.operation.OperationRepository;
import com.sfd.operation.TypeOperation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final int NB_MOIS = 6;

    private final ClientRepository clientRepository;
    private final CompteEpargneRepository compteRepository;
    private final EcheanceRepository echeanceRepository;
    private final CreditRepository creditRepository;
    private final OperationRepository operationRepository;
    private final AgenceRepository agenceRepository;

    public DashboardService(ClientRepository clientRepository,
                            CompteEpargneRepository compteRepository,
                            EcheanceRepository echeanceRepository,
                            CreditRepository creditRepository,
                            OperationRepository operationRepository,
                            AgenceRepository agenceRepository) {
        this.clientRepository = clientRepository;
        this.compteRepository = compteRepository;
        this.echeanceRepository = echeanceRepository;
        this.creditRepository = creditRepository;
        this.operationRepository = operationRepository;
        this.agenceRepository = agenceRepository;
    }

    @Transactional(readOnly = true)
    public DashboardDto tableauDeBord(AuthPrincipal principal, Long agenceId) {
        Long filtre = AccesAgence.agenceEffective(principal, agenceId);
        LocalDate aujourdHui = LocalDate.now(ZoneOffset.UTC);

        List<RepartitionStatutDto> repartition = new ArrayList<>();
        for (StatutCredit statut : StatutCredit.values()) {
            repartition.add(new RepartitionStatutDto(statut,
                    creditRepository.compterParStatut(statut, filtre)));
        }

        return new DashboardDto(
                clientRepository.compter(filtre),
                compteRepository.sommeSoldes(filtre),
                echeanceRepository.encoursCapital(filtre),
                creditRepository.compterParStatut(StatutCredit.DEMANDE, filtre),
                creditRepository.compterParStatut(StatutCredit.DECAISSE, filtre),
                compteRepository.compterActifs(filtre),
                echeanceRepository.compterEnRetard(aujourdHui, filtre),
                echeanceRepository.montantImpaye(aujourdHui, filtre),
                filtre,
                repartition,
                fluxMensuels(filtre),
                statistiquesAgences(filtre));
    }

    private List<FluxMensuelDto> fluxMensuels(Long filtre) {
        YearMonth dernierMois = YearMonth.now(ZoneOffset.UTC);
        YearMonth premierMois = dernierMois.minusMonths(NB_MOIS - 1L);
        Instant du = premierMois.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        Map<String, BigDecimal> collecte = chargerFlux(TypeOperation.DEPOT, du, filtre);
        Map<String, BigDecimal> decaissements = chargerFlux(TypeOperation.DECAISSEMENT, du, filtre);
        Map<String, BigDecimal> remboursements = chargerFlux(TypeOperation.REMBOURSEMENT, du, filtre);

        List<FluxMensuelDto> flux = new ArrayList<>(NB_MOIS);
        for (int i = 0; i < NB_MOIS; i++) {
            String mois = premierMois.plusMonths(i).toString();
            flux.add(new FluxMensuelDto(
                    mois,
                    collecte.getOrDefault(mois, BigDecimal.ZERO),
                    decaissements.getOrDefault(mois, BigDecimal.ZERO),
                    remboursements.getOrDefault(mois, BigDecimal.ZERO)));
        }
        return flux;
    }

    private Map<String, BigDecimal> chargerFlux(TypeOperation type, Instant du, Long filtre) {
        Map<String, BigDecimal> valeurs = new HashMap<>();
        for (Object[] ligne : operationRepository.sommeParMois(type, du, filtre)) {
            valeurs.put(String.valueOf(ligne[0]), montant(ligne[1]));
        }
        return valeurs;
    }

    private List<AgenceStatDto> statistiquesAgences(Long filtre) {
        List<AgenceStatDto> stats = new ArrayList<>();
        for (Object[] ligne : agenceRepository.statistiquesParAgence(filtre)) {
            stats.add(new AgenceStatDto(
                    ((Number) ligne[0]).longValue(),
                    String.valueOf(ligne[1]),
                    String.valueOf(ligne[2]),
                    ((Number) ligne[3]).longValue(),
                    montant(ligne[4]),
                    montant(ligne[5]),
                    ((Number) ligne[6]).longValue()));
        }
        return stats;
    }

    private BigDecimal montant(Object valeur) {
        if (valeur == null) {
            return BigDecimal.ZERO;
        }
        return valeur instanceof BigDecimal decimal ? decimal : new BigDecimal(valeur.toString());
    }
}
