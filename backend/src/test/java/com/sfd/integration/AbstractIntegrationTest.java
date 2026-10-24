package com.sfd.integration;

import com.sfd.agence.Agence;
import com.sfd.agence.AgenceRepository;
import com.sfd.client.ClientDto;
import com.sfd.client.ClientRequest;
import com.sfd.client.ClientService;
import com.sfd.common.security.AuthPrincipal;
import com.sfd.credit.CreditService;
import com.sfd.credit.ProduitCredit;
import com.sfd.credit.ProduitCreditRepository;
import com.sfd.epargne.CompteEpargneDto;
import com.sfd.epargne.CompteEpargneRepository;
import com.sfd.epargne.EpargneService;
import com.sfd.utilisateur.Utilisateur;
import com.sfd.utilisateur.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("sfd")
            .withUsername("sfd")
            .withPassword("sfd");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    protected UtilisateurRepository utilisateurRepository;
    @Autowired
    protected AgenceRepository agenceRepository;
    @Autowired
    protected ClientService clientService;
    @Autowired
    protected EpargneService epargneService;
    @Autowired
    protected CompteEpargneRepository compteRepository;
    @Autowired
    protected ProduitCreditRepository produitRepository;
    @Autowired
    protected CreditService creditService;

    protected AuthPrincipal principal(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(email).orElseThrow();
        return new AuthPrincipal(utilisateur.getId(), utilisateur.getEmail(),
                utilisateur.getRole().name(),
                utilisateur.getAgence() == null ? null : utilisateur.getAgence().getId());
    }

    protected AuthPrincipal agent() {
        return principal("agent@sfd.tg");
    }

    protected AuthPrincipal caissier() {
        return principal("caissier@sfd.tg");
    }

    protected AuthPrincipal directeur() {
        return principal("directeur@sfd.tg");
    }

    protected AuthPrincipal admin() {
        return principal("admin@sfd.tg");
    }

    protected AuthPrincipal comptable() {
        return principal("comptable@sfd.tg");
    }

    protected ClientDto nouveauClient(String suffixe) {
        return clientService.creer(agent(), new ClientRequest(
                "TEST" + suffixe, "Client", null, "M", "90000000", "Lome",
                "Commercant", "PIECE-" + suffixe, null));
    }

    protected CompteEpargneDto nouveauCompte(Long clientId) {
        return epargneService.ouvrirCompte(agent(), clientId);
    }

    protected BigDecimal solde(Long compteId) {
        return compteRepository.findById(compteId).orElseThrow().getSolde();
    }

    protected ProduitCredit produit(String code) {
        return produitRepository.findByCode(code).orElseThrow();
    }

    protected Agence agence(String code) {
        return agenceRepository.findByCode(code).orElseThrow();
    }
}
