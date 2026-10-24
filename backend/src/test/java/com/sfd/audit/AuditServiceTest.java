package com.sfd.audit;

import com.sfd.common.security.AuthPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditServiceTest {

    private final AuditEvenementRepository repository = mock(AuditEvenementRepository.class);
    private final AuditService service = new AuditService(repository);

    @Test
    void un_administrateur_consulte_tous_les_evenements() {
        var pageable = PageRequest.of(0, 25);
        when(repository.findAllByOrderByCreeLeDesc(pageable))
                .thenReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        assertThat(service.lister(new AuthPrincipal(1L, "admin@sfd.tg", "ADMIN", 1L), pageable).total())
                .isZero();

        verify(repository).findAllByOrderByCreeLeDesc(pageable);
    }

    @Test
    void un_directeur_ne_consulte_que_les_evenements_de_son_agence() {
        var pageable = PageRequest.of(0, 25);
        when(repository.findByAgenceIdOrderByCreeLeDesc(2L, pageable))
                .thenReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        assertThat(service.lister(new AuthPrincipal(2L, "directeur@sfd.tg", "DIRECTEUR", 2L), pageable).total())
                .isZero();

        verify(repository).findByAgenceIdOrderByCreeLeDesc(2L, pageable);
    }
}
