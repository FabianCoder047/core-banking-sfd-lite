package com.sfd.credit;

import com.sfd.common.error.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProduitCreditService {

    private final ProduitCreditRepository repository;
    private final CreditRepository creditRepository;

    public ProduitCreditService(ProduitCreditRepository repository, CreditRepository creditRepository) {
        this.repository = repository;
        this.creditRepository = creditRepository;
    }

    @Transactional(readOnly = true)
    public List<ProduitCreditDto> lister() {
        return repository.findAllByOrderByCodeAsc().stream().map(ProduitCreditDto::from).toList();
    }

    @Transactional
    public ProduitCreditDto creer(ProduitCreditRequest request) {
        if (repository.existsByCodeIgnoreCase(request.code())) {
            throw new BusinessException("CODE_PRODUIT_EXISTANT", "Un produit avec ce code existe deja.");
        }
        ProduitCredit produit = new ProduitCredit();
        appliquer(produit, request);
        return ProduitCreditDto.from(repository.save(produit));
    }

    @Transactional
    public ProduitCreditDto modifier(Long id, ProduitCreditRequest request) {
        ProduitCredit produit = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PRODUIT_INTROUVABLE", "Produit de credit introuvable."));
        repository.findByCode(request.code())
                .filter(p -> !p.getId().equals(id))
                .ifPresent(p -> {
                    throw new BusinessException("CODE_PRODUIT_EXISTANT", "Un produit avec ce code existe deja.");
                });
        appliquer(produit, request);
        return ProduitCreditDto.from(produit);
    }

    @Transactional
    public void supprimer(Long id) {
        ProduitCredit produit = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PRODUIT_INTROUVABLE", "Produit de credit introuvable."));
        if (creditRepository.existsByProduitId(id)) {
            throw new BusinessException("SUPPRESSION_IMPOSSIBLE",
                    "Ce produit est utilise par des credits et ne peut pas etre supprime.");
        }
        repository.delete(produit);
    }

    private void appliquer(ProduitCredit produit, ProduitCreditRequest request) {
        if (request.dureeMinMois() > request.dureeMaxMois()) {
            throw new BusinessException("BORNES_INVALIDES", "La duree minimale depasse la duree maximale.");
        }
        if (request.montantMin().compareTo(request.montantMax()) > 0) {
            throw new BusinessException("BORNES_INVALIDES", "Le montant minimal depasse le montant maximal.");
        }
        produit.setCode(request.code().trim().toUpperCase());
        produit.setLibelle(request.libelle().trim());
        produit.setTauxAnnuel(request.tauxAnnuel());
        produit.setDureeMinMois(request.dureeMinMois());
        produit.setDureeMaxMois(request.dureeMaxMois());
        produit.setMontantMin(request.montantMin());
        produit.setMontantMax(request.montantMax());
        produit.setFraisDossierPct(request.fraisDossierPct());
        produit.setModeAmortissement(request.modeAmortissement());
        produit.setActif(request.actif() == null || request.actif());
    }
}
