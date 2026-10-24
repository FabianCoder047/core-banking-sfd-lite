package com.sfd.epargne;

import com.sfd.common.api.PageResponse;
import com.sfd.common.api.Montants;
import com.sfd.common.error.BusinessException;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.operation.OperationDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Epargne")
public class CompteController {

    private final EpargneService epargneService;

    public CompteController(EpargneService epargneService) {
        this.epargneService = epargneService;
    }

    @PostMapping("/clients/{clientId}/comptes")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','AGENT_CREDIT','CAISSIER')")
    public ResponseEntity<CompteEpargneDto> ouvrir(@AuthenticationPrincipal AuthPrincipal principal,
                                                   @PathVariable Long clientId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(epargneService.ouvrirCompte(principal, clientId));
    }

    @GetMapping("/clients/{clientId}/comptes")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','AGENT_CREDIT','CAISSIER','COMPTABLE')")
    public List<CompteEpargneDto> comptes(@AuthenticationPrincipal AuthPrincipal principal,
                                          @PathVariable Long clientId) {
        return epargneService.comptesDuClient(principal, clientId);
    }

    @GetMapping("/comptes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','AGENT_CREDIT','CAISSIER','COMPTABLE')")
    public CompteEpargneDto obtenir(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return epargneService.obtenir(principal, id);
    }

    @PostMapping("/comptes/{id}/depots")
    @PreAuthorize("hasAnyRole('ADMIN','CAISSIER')")
    public ResponseEntity<OperationDto> depot(@AuthenticationPrincipal AuthPrincipal principal,
                                              @PathVariable Long id,
                                              @Valid @RequestBody OperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(epargneService.depot(principal, id, request.montant()));
    }

    @PostMapping("/comptes/{id}/retraits")
    @PreAuthorize("hasAnyRole('ADMIN','CAISSIER')")
    public ResponseEntity<OperationDto> retrait(@AuthenticationPrincipal AuthPrincipal principal,
                                                @PathVariable Long id,
                                                @Valid @RequestBody OperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(epargneService.retrait(principal, id, request.montant()));
    }

    @GetMapping("/comptes/{id}/releve")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','CAISSIER')")
    public PageResponse<OperationDto> releve(@AuthenticationPrincipal AuthPrincipal principal,
                                             @PathVariable Long id,
                                             @RequestParam(required = false) LocalDate du,
                                             @RequestParam(required = false) LocalDate au,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int taille) {
        if (page < 0 || taille < 1 || taille > 100) {
            throw new BusinessException("PAGINATION_INVALIDE", "Parametres de pagination invalides.");
        }
        return epargneService.releve(principal, id, du, au, page, taille);
    }
}
