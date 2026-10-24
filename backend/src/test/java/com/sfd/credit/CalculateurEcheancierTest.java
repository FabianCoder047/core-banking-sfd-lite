package com.sfd.credit;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalculateurEcheancierTest {

    private final CalculateurEcheancier calculateur = new CalculateurEcheancier();
    private final LocalDate date = LocalDate.of(2026, 1, 15);
    private static final BigDecimal CAPITAL = new BigDecimal("1000000");
    private static final BigDecimal TAUX = new BigDecimal("18.000");

    @Test
    void annuite_constante_somme_des_capitaux_egale_capital() {
        List<EcheanceCalculee> echeances = calculateur.calculer(
                CAPITAL, 12, TAUX, ModeAmortissement.ANNUITE_CONSTANTE, date);

        assertThat(echeances).hasSize(12);
        assertThat(sommeCapitaux(echeances)).isEqualByComparingTo(CAPITAL);
        assertThat(echeances.get(0).dateEcheance()).isEqualTo(date.plusMonths(1));
        assertThat(echeances.get(11).dateEcheance()).isEqualTo(date.plusMonths(12));
        assertThat(echeances.get(0).interet()).isEqualByComparingTo("15000");
        assertThat(echeances.get(0).capital()).isEqualByComparingTo("76680");
        assertThat(echeances).allSatisfy(e -> {
            assertThat(e.capital().scale()).isZero();
            assertThat(e.interet().scale()).isZero();
            assertThat(e.capital()).isPositive();
            assertThat(e.interet()).isPositive();
        });
        assertThat(echeances.get(11).interet())
                .isLessThan(echeances.get(0).interet());
    }

    @Test
    void capital_constant_somme_des_capitaux_egale_capital() {
        List<EcheanceCalculee> echeances = calculateur.calculer(
                CAPITAL, 12, TAUX, ModeAmortissement.CAPITAL_CONSTANT, date);

        assertThat(echeances).hasSize(12);
        assertThat(sommeCapitaux(echeances)).isEqualByComparingTo(CAPITAL);
        assertThat(echeances.get(0).capital()).isEqualByComparingTo("83333");
        assertThat(echeances.get(11).capital()).isEqualByComparingTo("83337");
        assertThat(echeances.get(0).interet()).isEqualByComparingTo("15000");
    }

    @Test
    void duree_d_un_mois_annuite_et_capital_constant() {
        for (ModeAmortissement mode : ModeAmortissement.values()) {
            List<EcheanceCalculee> echeances = calculateur.calculer(CAPITAL, 1, TAUX, mode, date);
            assertThat(echeances).hasSize(1);
            assertThat(echeances.get(0).capital()).isEqualByComparingTo(CAPITAL);
            assertThat(echeances.get(0).interet()).isEqualByComparingTo("15000");
            assertThat(echeances.get(0).dateEcheance()).isEqualTo(date.plusMonths(1));
        }
    }

    @Test
    void dernieres_echeances_absorbent_les_ecarts_d_arrondi() {
        BigDecimal capital = new BigDecimal("100000");
        for (ModeAmortissement mode : ModeAmortissement.values()) {
            List<EcheanceCalculee> echeances = calculateur.calculer(
                    capital, 7, new BigDecimal("18.000"), mode, date);
            assertThat(sommeCapitaux(echeances)).isEqualByComparingTo(capital);
            assertThat(sommeCapitaux(echeances).scale()).isZero();
        }
    }

    private BigDecimal sommeCapitaux(List<EcheanceCalculee> echeances) {
        return echeances.stream().map(EcheanceCalculee::capital)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
