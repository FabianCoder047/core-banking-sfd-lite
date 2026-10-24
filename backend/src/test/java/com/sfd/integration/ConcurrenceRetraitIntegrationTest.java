package com.sfd.integration;

import com.sfd.client.ClientDto;
import com.sfd.common.error.BusinessException;
import com.sfd.compta.BalanceDto;
import com.sfd.compta.ComptabiliteService;
import com.sfd.epargne.CompteEpargneDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class ConcurrenceRetraitIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ComptabiliteService comptabiliteService;

    @Test
    void trente_retraits_concurrents_donnent_exactement_dix_succes() throws InterruptedException {
        ClientDto client = nouveauClient("CONCURRENCE");
        CompteEpargneDto compte = nouveauCompte(client.id());
        epargneService.depot(caissier(), compte.id(), new BigDecimal("10000"));

        int tentatives = 30;
        ExecutorService executor = Executors.newFixedThreadPool(tentatives);
        CountDownLatch depart = new CountDownLatch(1);
        CountDownLatch fin = new CountDownLatch(tentatives);
        AtomicInteger succes = new AtomicInteger();
        AtomicInteger soldesInsuffisants = new AtomicInteger();
        AtomicInteger autresErreurs = new AtomicInteger();

        for (int i = 0; i < tentatives; i++) {
            executor.submit(() -> {
                try {
                    depart.await();
                    epargneService.retrait(caissier(), compte.id(), new BigDecimal("1000"));
                    succes.incrementAndGet();
                } catch (BusinessException ex) {
                    if ("SOLDE_INSUFFISANT".equals(ex.getCode())) {
                        soldesInsuffisants.incrementAndGet();
                    } else {
                        autresErreurs.incrementAndGet();
                    }
                } catch (Exception ex) {
                    autresErreurs.incrementAndGet();
                } finally {
                    fin.countDown();
                }
            });
        }

        depart.countDown();
        assertThat(fin.await(60, TimeUnit.SECONDS)).isTrue();
        executor.shutdownNow();

        assertThat(autresErreurs.get()).isZero();
        assertThat(succes.get()).isEqualTo(10);
        assertThat(soldesInsuffisants.get()).isEqualTo(20);
        assertThat(solde(compte.id())).isEqualByComparingTo("0");

        BalanceDto balance = comptabiliteService.balance(directeur(), null, null, null);
        assertThat(balance.equilibree()).isTrue();
        assertThat(balance.totalDebit()).isEqualByComparingTo(balance.totalCredit());
    }
}
