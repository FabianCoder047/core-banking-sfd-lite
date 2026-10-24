package com.sfd.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEvenementRepository extends JpaRepository<AuditEvenement, Long> {

    Page<AuditEvenement> findAllByOrderByCreeLeDesc(Pageable pageable);

    Page<AuditEvenement> findByAgenceIdOrderByCreeLeDesc(Long agenceId, Pageable pageable);
}
