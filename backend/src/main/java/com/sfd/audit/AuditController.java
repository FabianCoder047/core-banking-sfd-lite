package com.sfd.audit;

import com.sfd.common.api.PageResponse;
import com.sfd.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audits")
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTEUR')")
@Tag(name = "Audits")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public PageResponse<AuditEvenementDto> lister(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PageableDefault(size = 25, sort = "creeLe", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable) {
        return auditService.lister(principal, pageable);
    }
}
