package com.sfd.compta;

import com.sfd.common.error.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompteComptableService {

    private final CompteComptableRepository repository;

    public CompteComptableService(CompteComptableRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CompteComptableDto> lister() {
        return repository.findAllByOrderByNumeroAsc().stream().map(CompteComptableDto::from).toList();
    }

    @Transactional
    public CompteComptableDto creer(CompteComptableRequest request) {
        if (repository.existsByNumero(request.numero())) {
            throw new BusinessException("COMPTE_COMPTABLE_EXISTANT", "Ce numero de compte existe deja.");
        }
        CompteComptable compte = new CompteComptable();
        compte.setNumero(request.numero());
        compte.setLibelle(request.libelle());
        compte.setType(request.type());
        return CompteComptableDto.from(repository.save(compte));
    }

    @Transactional
    public CompteComptableDto modifier(Long id, CompteComptableRequest request) {
        CompteComptable compte = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("COMPTE_COMPTABLE_INTROUVABLE", "Compte comptable introuvable."));
        repository.findByNumero(request.numero())
                .filter(c -> !c.getId().equals(id))
                .ifPresent(c -> {
                    throw new BusinessException("COMPTE_COMPTABLE_EXISTANT", "Ce numero de compte existe deja.");
                });
        compte.setNumero(request.numero());
        compte.setLibelle(request.libelle());
        compte.setType(request.type());
        return CompteComptableDto.from(compte);
    }

    @Transactional
    public void supprimer(Long id) {
        CompteComptable compte = repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("COMPTE_COMPTABLE_INTROUVABLE", "Compte comptable introuvable."));
        repository.delete(compte);
    }
}
