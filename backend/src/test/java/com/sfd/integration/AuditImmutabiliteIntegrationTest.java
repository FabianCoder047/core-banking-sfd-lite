package com.sfd.integration;

import com.sfd.audit.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuditImmutabiliteIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void les_evenements_d_audit_ne_peuvent_pas_etre_supprimes() {
        auditService.enregistrerRequete("POST", "/api/comptes/1/depots", 201,
                "127.0.0.1", agent());
        Long id = jdbcTemplate.queryForObject(
                "SELECT max(id) FROM audit_evenement", Long.class);

        assertThatThrownBy(() -> jdbcTemplate.update(
                "DELETE FROM audit_evenement WHERE id = ?", id))
                .isInstanceOf(RuntimeException.class);
    }
}
