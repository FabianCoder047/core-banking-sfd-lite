package com.sfd.agence;

import com.sfd.common.error.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AgenceService {

    private final AgenceRepository repository;

    public AgenceService(AgenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AgenceDto> lister() {
        return repository.findAllByOrderByCodeAsc().stream().map(AgenceDto::from).toList();
    }

    @Transactional(readOnly = true)
    public AgenceDto obtenir(Long id) {
        return AgenceDto.from(charger(id));
    }

    @Transactional
    public AgenceDto creer(AgenceRequest request) {
        if (repository.existsByCodeIgnoreCase(request.code())) {
            throw new BusinessException("CODE_AGENCE_EXISTANT", "Une agence avec ce code existe deja.");
        }
        Agence agence = new Agence();
        appliquer(agence, request);
        return AgenceDto.from(repository.save(agence));
    }

    @Transactional
    public AgenceDto modifier(Long id, AgenceRequest request) {
        Agence agence = charger(id);
        repository.findByCode(request.code())
                .filter(a -> !a.getId().equals(id))
                .ifPresent(a -> {
                    throw new BusinessException("CODE_AGENCE_EXISTANT", "Une agence avec ce code existe deja.");
                });
        appliquer(agence, request);
        return AgenceDto.from(agence);
    }

    @Transactional
    public void supprimer(Long id) {
        repository.delete(charger(id));
    }

    @Transactional(readOnly = true)
    public Agence charger(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("AGENCE_INTROUVABLE", "Agence introuvable."));
    }

    private void appliquer(Agence agence, AgenceRequest request) {
        agence.setCode(request.code().trim().toUpperCase());
        agence.setNom(request.nom().trim());
        agence.setVille(request.ville());
        agence.setActive(request.active() == null || request.active());
    }
}
