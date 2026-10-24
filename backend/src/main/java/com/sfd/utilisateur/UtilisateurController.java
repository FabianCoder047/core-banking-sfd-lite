package com.sfd.utilisateur;

import com.sfd.common.api.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/utilisateurs")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Utilisateurs")
public class UtilisateurController {

    private final UtilisateurService service;

    public UtilisateurController(UtilisateurService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<UtilisateurDto> lister(@RequestParam(required = false) Long agenceId,
                                               @PageableDefault(size = 20, sort = "nom") Pageable pageable) {
        return service.lister(agenceId, pageable);
    }

    @GetMapping("/{id}")
    public UtilisateurDto obtenir(@PathVariable Long id) {
        return service.obtenir(id);
    }

    @PostMapping
    public ResponseEntity<UtilisateurDto> creer(@Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(request));
    }

    @PutMapping("/{id}")
    public UtilisateurDto modifier(@PathVariable Long id, @Valid @RequestBody UtilisateurRequest request) {
        return service.modifier(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
