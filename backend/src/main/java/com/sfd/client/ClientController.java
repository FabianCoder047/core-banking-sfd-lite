package com.sfd.client;

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
@RequestMapping("/api/clients")
@PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','AGENT_CREDIT','CAISSIER')")
@Tag(name = "Clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public PageResponse<ClientDto> rechercher(@AuthenticationPrincipal AuthPrincipal principal,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false) Long agenceId,
                                              @PageableDefault(size = 20, sort = "nom") Pageable pageable) {
        return clientService.rechercher(principal, q, agenceId, pageable);
    }

    @GetMapping("/{id}")
    public ClientFicheDto fiche(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return clientService.fiche(principal, id);
    }

    @PostMapping
    public ResponseEntity<ClientDto> creer(@AuthenticationPrincipal AuthPrincipal principal,
                                           @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.creer(principal, request));
    }
}
