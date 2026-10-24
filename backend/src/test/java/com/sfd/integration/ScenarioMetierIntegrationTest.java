package com.sfd.integration;

import com.sfd.client.ClientDto;
import com.sfd.common.api.PageResponse;
import com.sfd.common.error.BusinessException;
import com.sfd.compta.BalanceDto;
import com.sfd.compta.ComptabiliteService;
import com.sfd.compta.GrandLivreDto;
import com.sfd.credit.*;
import com.sfd.epargne.CompteEpargneDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScenarioMetierIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ComptabiliteService comptabiliteService;

    @Test
    void cycle_complet_epargne_credit_remboursement_et_balance_equilibree() {
        ClientDto client = nouveauClient("SCENARIO");
        CompteEpargneDto compte = nouveauCompte(client.id());

        epargneService.depot(caissier(), compte.id(), new BigDecimal("200000"));
        assertThat(solde(compte.id())).isEqualByComparingTo("200000");

        ProduitCredit produit = produit("COMMERCE");
        CreditDto demande = creditService.demander(agent(), new DemandeCreditRequest(
                client.id(), produit.getId(), compte.id(), new BigDecimal("1000000"), 6));
        assertThat(demande.statut()).isEqualTo(StatutCredit.DEMANDE);
        assertThat(demande.tauxAnnuel()).isEqualByComparingTo("18.000");

        CreditDto approuve = creditService.approuver(directeur(), demande.id(),
                new ApprobationRequest(DecisionCredit.APPROUVE, null));
        assertThat(approuve.statut()).isEqualTo(StatutCredit.APPROUVE);

        CreditDto decaisse = creditService.decaisser(caissier(), demande.id());
        assertThat(decaisse.statut()).isEqualTo(StatutCredit.DECAISSE);
        // 200 000 + 1 000 000 - frais 1,5 % (15 000)
        assertThat(solde(compte.id())).isEqualByComparingTo("1185000");

        EcheancierDto echeancier = creditService.echeancier(agent(), demande.id());
        assertThat(echeancier.echeances()).hasSize(6);
        assertThat(echeancier.totalCapital()).isEqualByComparingTo("1000000");
        assertThat(echeancier.totalInteret()).isPositive();
        assertThat(echeancier.echeances().get(0).dateEcheance())
                .isAfter(LocalDate.now(ZoneOffset.UTC).minusDays(1));

        RemboursementDto remboursement = creditService.rembourser(caissier(), demande.id(),
                new BigDecimal("100000"));
        assertThat(remboursement.partInteret()).isEqualByComparingTo("15000");
        assertThat(remboursement.partCapital()).isEqualByComparingTo("85000");
        assertThat(solde(compte.id())).isEqualByComparingTo("1085000");
        assertThat(remboursement.statutCredit()).isEqualTo(StatutCredit.DECAISSE);

        assertThatThrownBy(() -> creditService.rembourser(caissier(), demande.id(),
                new BigDecimal("99999999")))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SURPAIEMENT");

        BalanceDto balance = comptabiliteService.balance(directeur(), null, null, null);
        assertThat(balance.equilibree()).isTrue();
        assertThat(balance.totalDebit()).isEqualByComparingTo(balance.totalCredit());

        GrandLivreDto grandLivre = comptabiliteService.grandLivre(directeur(), "301", null, null, null);
        assertThat(grandLivre.solde()).isEqualByComparingTo("915000");
        assertThat(grandLivre.totalDebit()).isEqualByComparingTo("1000000");
        assertThat(grandLivre.totalCredit()).isEqualByComparingTo("85000");

        BigDecimal restant = creditService.echeancier(agent(), demande.id()).totalRestant();
        RemboursementDto solde = creditService.rembourser(caissier(), demande.id(), restant);
        assertThat(solde.montantRestantDu()).isZero();
        assertThat(solde.statutCredit()).isEqualTo(StatutCredit.SOLDE);

        PageResponse<CreditDto> credits = creditService.lister(directeur(), StatutCredit.SOLDE,
                client.id(), null, org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(credits.contenu()).hasSize(1);

        BalanceDto balanceFinale = comptabiliteService.balance(directeur(), null, null, null);
        assertThat(balanceFinale.equilibree()).isTrue();
        assertThat(balanceFinale.totalDebit()).isEqualByComparingTo(balanceFinale.totalCredit());
    }

    @Test
    void le_directeur_ne_peut_pas_approuver_sa_propre_demande() {
        ClientDto client = nouveauClient("AUTOAPPRO");
        CompteEpargneDto compte = nouveauCompte(client.id());
        ProduitCredit produit = produit("URGENCE");

        CreditDto demande = creditService.demander(directeur(), new DemandeCreditRequest(
                client.id(), produit.getId(), compte.id(), new BigDecimal("100000"), 3));

        assertThatThrownBy(() -> creditService.approuver(directeur(), demande.id(),
                new ApprobationRequest(DecisionCredit.APPROUVE, null)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("AUTO_APPROBATION_INTERDITE");
    }

    @Test
    void transitions_interdites_et_motif_de_rejet_obligatoire() {
        ClientDto client = nouveauClient("TRANSITION");
        CompteEpargneDto compte = nouveauCompte(client.id());
        ProduitCredit produit = produit("SCOLAIRE");
        CreditDto demande = creditService.demander(agent(), new DemandeCreditRequest(
                client.id(), produit.getId(), compte.id(), new BigDecimal("100000"), 6));

        assertThatThrownBy(() -> creditService.decaisser(caissier(), demande.id()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("TRANSITION_INTERDITE");

        assertThatThrownBy(() -> creditService.approuver(directeur(), demande.id(),
                new ApprobationRequest(DecisionCredit.REJETE, "  ")))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("MOTIF_REJET_REQUIS");

        CreditDto rejet = creditService.approuver(directeur(), demande.id(),
                new ApprobationRequest(DecisionCredit.REJETE, "Dossier incomplet"));
        assertThat(rejet.statut()).isEqualTo(StatutCredit.REJETE);
        assertThat(rejet.motifRejet()).isEqualTo("Dossier incomplet");
    }
}
