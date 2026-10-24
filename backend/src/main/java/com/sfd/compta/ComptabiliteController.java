package com.sfd.compta;

import com.sfd.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/comptabilite")
@Tag(name = "Comptabilite")
public class ComptabiliteController {

    private final ComptabiliteService comptabiliteService;
    private final CompteComptableService compteComptableService;

    public ComptabiliteController(ComptabiliteService comptabiliteService,
                                  CompteComptableService compteComptableService) {
        this.comptabiliteService = comptabiliteService;
        this.compteComptableService = compteComptableService;
    }

    @GetMapping("/balance")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','COMPTABLE')")
    public BalanceDto balance(@AuthenticationPrincipal AuthPrincipal principal,
                              @RequestParam(required = false) LocalDate du,
                              @RequestParam(required = false) LocalDate au,
                              @RequestParam(required = false) Long agenceId) {
        return comptabiliteService.balance(principal, du, au, agenceId);
    }

    @GetMapping("/grand-livre")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','COMPTABLE')")
    public GrandLivreDto grandLivre(@AuthenticationPrincipal AuthPrincipal principal,
                                    @RequestParam String compte,
                                    @RequestParam(required = false) LocalDate du,
                                    @RequestParam(required = false) LocalDate au,
                                    @RequestParam(required = false) Long agenceId) {
        return comptabiliteService.grandLivre(principal, compte, du, au, agenceId);
    }

    @GetMapping("/ecritures/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','COMPTABLE')")
    public EcritureDto ecriture(@PathVariable Long id) {
        return comptabiliteService.obtenirEcriture(id);
    }

    @PostMapping("/ecritures/{id}/extourne")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR')")
    public ResponseEntity<EcritureDto> extourner(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comptabiliteService.extourner(id));
    }

    @GetMapping("/comptes")
    @PreAuthorize("isAuthenticated()")
    public List<CompteComptableDto> comptes() {
        return compteComptableService.lister();
    }

    @PostMapping("/comptes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompteComptableDto> creerCompte(@Valid @RequestBody CompteComptableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(compteComptableService.creer(request));
    }

    @PutMapping("/comptes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CompteComptableDto modifierCompte(@PathVariable Long id, @Valid @RequestBody CompteComptableRequest request) {
        return compteComptableService.modifier(id, request);
    }

    @DeleteMapping("/comptes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerCompte(@PathVariable Long id) {
        compteComptableService.supprimer(id);
    }
}
