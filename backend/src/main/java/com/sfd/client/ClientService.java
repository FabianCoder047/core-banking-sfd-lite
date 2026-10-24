package com.sfd.client;

import com.sfd.agence.Agence;
import com.sfd.agence.AgenceRepository;
import com.sfd.common.api.PageResponse;
import com.sfd.common.error.BusinessException;
import com.sfd.common.security.AccesAgence;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.credit.CreditDto;
import com.sfd.credit.CreditRepository;
import com.sfd.epargne.CompteEpargneDto;
import com.sfd.epargne.CompteEpargneRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final AgenceRepository agenceRepository;
    private final CompteEpargneRepository compteRepository;
    private final CreditRepository creditRepository;

    public ClientService(ClientRepository clientRepository,
                         AgenceRepository agenceRepository,
                         CompteEpargneRepository compteRepository,
                         CreditRepository creditRepository) {
        this.clientRepository = clientRepository;
        this.agenceRepository = agenceRepository;
        this.compteRepository = compteRepository;
        this.creditRepository = creditRepository;
    }

    @Transactional
    public ClientDto creer(AuthPrincipal principal, ClientRequest request) {
        Long agenceId = AccesAgence.agenceCreation(principal, request.agenceId());
        Agence agence = agenceRepository.findById(agenceId)
                .orElseThrow(() -> BusinessException.notFound("AGENCE_INTROUVABLE", "Agence introuvable."));

        Client client = new Client();
        client.setAgence(agence);
        client.setNumero(String.format("CL-%s-%06d", agence.getCode(),
                clientRepository.prochainNumeroSequence()));
        client.setNom(request.nom().trim());
        client.setPrenom(request.prenom().trim());
        client.setDateNaissance(request.dateNaissance());
        client.setSexe(request.sexe());
        client.setTelephone(request.telephone());
        client.setAdresse(request.adresse());
        client.setProfession(request.profession());
        client.setNumeroPiece(request.numeroPiece());
        client.setStatut("ACTIF");
        client.setCreeLe(Instant.now());
        return ClientDto.from(clientRepository.save(client));
    }

    @Transactional(readOnly = true)
    public PageResponse<ClientDto> rechercher(AuthPrincipal principal, String q, Long agenceId, Pageable pageable) {
        Long filtreAgence = AccesAgence.agenceEffective(principal, agenceId);
        String recherche = q == null ? "" : q.trim();
        return PageResponse.from(clientRepository.rechercher(filtreAgence, recherche, pageable), ClientDto::from);
    }

    @Transactional(readOnly = true)
    public ClientFicheDto fiche(AuthPrincipal principal, Long id) {
        Client client = chargerAvecAcces(principal, id);
        List<CompteEpargneDto> comptes = compteRepository.findByClientIdOrderByOuvertLeDesc(id).stream()
                .map(CompteEpargneDto::from).toList();
        List<CreditDto> credits = creditRepository.findByClientIdOrderByDateDemandeDescIdDesc(id).stream()
                .map(CreditDto::from).toList();
        return new ClientFicheDto(ClientDto.from(client), comptes, credits);
    }

    @Transactional(readOnly = true)
    public Client chargerAvecAcces(AuthPrincipal principal, Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("CLIENT_INTROUVABLE", "Client introuvable."));
        AccesAgence.verifier(principal, client.getAgence().getId());
        return client;
    }
}
