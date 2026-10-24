package com.sfd.credit;

import com.sfd.common.api.PageResponse;
import com.sfd.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/credits")
@Tag(name = "Credits")
public class CreditController {

    private final CreditService creditService;

    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public PageResponse<CreditDto> lister(@AuthenticationPrincipal AuthPrincipal principal,
                                          @RequestParam(required = false) StatutCredit statut,
                                          @RequestParam(required = false) Long clientId,
                                          @RequestParam(required = false) Long agenceId,
                                          @PageableDefault(size = 20) Pageable pageable) {
        return creditService.lister(principal, statut, clientId, agenceId, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public CreditDto obtenir(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return creditService.obtenir(principal, id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','AGENT_CREDIT')")
    public ResponseEntity<CreditDto> demander(@AuthenticationPrincipal AuthPrincipal principal,
                                              @Valid @RequestBody DemandeCreditRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(creditService.demander(principal, request));
    }

    @PostMapping("/{id}/approbation")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR')")
    public CreditDto approuver(@AuthenticationPrincipal AuthPrincipal principal,
                               @PathVariable Long id,
                               @Valid @RequestBody ApprobationRequest request) {
        return creditService.approuver(principal, id, request);
    }

    @PostMapping("/{id}/decaissement")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','CAISSIER')")
    public ResponseEntity<CreditDto> decaisser(@AuthenticationPrincipal AuthPrincipal principal,
                                               @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(creditService.decaisser(principal, id));
    }

    @GetMapping("/{id}/echeancier")
    @PreAuthorize("isAuthenticated()")
    public EcheancierDto echeancier(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return creditService.echeancier(principal, id);
    }

    @PostMapping("/{id}/remboursements")
    @PreAuthorize("hasAnyRole('ADMIN','CAISSIER')")
    public ResponseEntity<RemboursementDto> rembourser(@AuthenticationPrincipal AuthPrincipal principal,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody RemboursementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(creditService.rembourser(principal, id, request.montant()));
    }
}
