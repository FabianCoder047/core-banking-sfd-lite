package com.sfd.agence;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agences")
@Tag(name = "Agences")
public class AgenceController {

    private final AgenceService service;

    public AgenceController(AgenceService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<AgenceDto> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public AgenceDto obtenir(@PathVariable Long id) {
        return service.obtenir(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgenceDto> creer(@Valid @RequestBody AgenceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AgenceDto modifier(@PathVariable Long id, @Valid @RequestBody AgenceRequest request) {
        return service.modifier(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
