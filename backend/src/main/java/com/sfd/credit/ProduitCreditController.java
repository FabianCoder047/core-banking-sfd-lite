package com.sfd.credit;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produits-credit")
@Tag(name = "Produits de credit")
public class ProduitCreditController {

    private final ProduitCreditService service;

    public ProduitCreditController(ProduitCreditService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ProduitCreditDto> lister() {
        return service.lister();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProduitCreditDto> creer(@Valid @RequestBody ProduitCreditRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProduitCreditDto modifier(@PathVariable Long id, @Valid @RequestBody ProduitCreditRequest request) {
        return service.modifier(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
