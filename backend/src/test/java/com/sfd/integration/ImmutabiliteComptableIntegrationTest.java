package com.sfd.integration;

import com.sfd.client.ClientDto;
import com.sfd.epargne.CompteEpargneDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImmutabiliteComptableIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void une_ligne_d_ecriture_ne_peut_pas_etre_modifiee_ni_supprimee() {
        ClientDto client = nouveauClient("IMMUTABLE");
        CompteEpargneDto compte = nouveauCompte(client.id());
        epargneService.depot(caissier(), compte.id(), new BigDecimal("5000"));

        Long ligneId = jdbcTemplate.queryForObject(
                "select l.id from ligne_ecriture l join ecriture e on e.id = l.ecriture_id " +
                        "where e.operation_id in (select o.id from operation o where o.compte_id = ?) " +
                        "order by l.id limit 1", Long.class, compte.id());
        Long ecritureId = jdbcTemplate.queryForObject(
                "select ecriture_id from ligne_ecriture where id = ?", Long.class, ligneId);

        assertThatThrownBy(() -> jdbcTemplate.update(
                "update ligne_ecriture set montant = montant + 1 where id = ?", ligneId))
                .hasMessageContaining("ECRITURE_IMMUABLE");

        assertThatThrownBy(() -> jdbcTemplate.update(
                "delete from ligne_ecriture where id = ?", ligneId))
                .hasMessageContaining("ECRITURE_IMMUABLE");

        assertThatThrownBy(() -> jdbcTemplate.update(
                "update ecriture set libelle = 'modifie' where id = ?", ecritureId))
                .hasMessageContaining("ECRITURE_IMMUABLE");

        assertThatThrownBy(() -> jdbcTemplate.update(
                "delete from ecriture where id = ?", ecritureId))
                .hasMessageContaining("ECRITURE_IMMUABLE");

        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from ligne_ecriture where id = ?", Long.class, ligneId)).isEqualTo(1L);
    }
}
