package com.sfd.credit;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ImputationRemboursementTest {

    @Test
    void impute_les_echeances_les_plus_anciennes_et_les_interets_en_premier() {
        List<Echeance> echeances = List.of(
                echeance(1, "100000", "10000"),
                echeance(2, "100000", "8000"),
                echeance(3, "100000", "6000"));

        List<ImputationRemboursement.Ligne> lignes =
                ImputationRemboursement.repartir(echeances, new BigDecimal("220000"));

        assertThat(lignes).hasSize(3);
        assertThat(lignes.get(0).numeroEcheance()).isEqualTo(1);
        assertThat(lignes.get(0).interet()).isEqualByComparingTo("10000");
        assertThat(lignes.get(0).capital()).isEqualByComparingTo("100000");

        assertThat(lignes.get(1).numeroEcheance()).isEqualTo(2);
        assertThat(lignes.get(1).interet()).isEqualByComparingTo("8000");
        assertThat(lignes.get(1).capital()).isEqualByComparingTo("100000");

        assertThat(lignes.get(2).numeroEcheance()).isEqualTo(3);
        assertThat(lignes.get(2).interet()).isEqualByComparingTo("2000");
        assertThat(lignes.get(2).capital()).isZero();

        BigDecimal total = lignes.stream().map(l -> l.capital().add(l.interet()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(total).isEqualByComparingTo("220000");
    }

    @Test
    void un_paiement_inferieur_aux_interets_ne_touche_pas_au_capital() {
        List<Echeance> echeances = List.of(echeance(1, "100000", "10000"));

        List<ImputationRemboursement.Ligne> lignes =
                ImputationRemboursement.repartir(echeances, new BigDecimal("4000"));

        assertThat(lignes).hasSize(1);
        assertThat(lignes.get(0).interet()).isEqualByComparingTo("4000");
        assertThat(lignes.get(0).capital()).isZero();
    }

    @Test
    void paiement_du_solde_total_solde_toutes_les_echeances() {
        List<Echeance> echeances = List.of(
                echeance(1, "50000", "5000"),
                echeance(2, "50000", "2500"));

        List<ImputationRemboursement.Ligne> lignes =
                ImputationRemboursement.repartir(echeances, new BigDecimal("107500"));

        BigDecimal capital = lignes.stream().map(ImputationRemboursement.Ligne::capital)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal interet = lignes.stream().map(ImputationRemboursement.Ligne::interet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(capital).isEqualByComparingTo("100000");
        assertThat(interet).isEqualByComparingTo("7500");
    }

    private Echeance echeance(int numero, String capital, String interet) {
        Echeance echeance = new Echeance();
        echeance.setNumero(numero);
        echeance.setCapitalDu(new BigDecimal(capital));
        echeance.setInteretDu(new BigDecimal(interet));
        return echeance;
    }
}
