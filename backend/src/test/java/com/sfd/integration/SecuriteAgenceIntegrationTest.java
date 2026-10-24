package com.sfd.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sfd.agence.Agence;
import com.sfd.client.ClientDto;
import com.sfd.client.ClientRequest;
import com.sfd.credit.*;
import com.sfd.epargne.CompteEpargneDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class SecuriteAgenceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void un_caissier_de_l_agence_a_ne_voit_pas_un_client_de_l_agence_b() throws Exception {
        Agence kara = agence("AG002");
        ClientDto clientKara = clientService.creer(admin(), new ClientRequest(
                "KARA", "Client", null, "F", "91000000", "Kara", "Commercante",
                "PIECE-KARA-" + System.nanoTime(), kara.getId()));
        CompteEpargneDto compteKara = epargneService.ouvrirCompte(admin(), clientKara.id());

        String token = token("caissier@sfd.tg");

        mockMvc.perform(get("/api/clients/" + clientKara.id())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/comptes/" + compteKara.id() + "/depots")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"montant\":1000}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/comptes/" + compteKara.id() + "/retraits")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"montant\":1000}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void sans_jeton_la_requete_est_refusee_et_un_agent_ne_peut_pas_approuver() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("NON_AUTHENTIFIE"));

        String tokenAgent = token("agent@sfd.tg");
        String tokenDirecteur = token("directeur@sfd.tg");

        ClientDto client = nouveauClient("HTTP");
        CompteEpargneDto compte = nouveauCompte(client.id());
        ProduitCredit produit = produit("SCOLAIRE");
        CreditDto demande = creditService.demander(agent(), new DemandeCreditRequest(
                client.id(), produit.getId(), compte.id(), new BigDecimal("100000"), 6));

        mockMvc.perform(post("/api/credits/" + demande.id() + "/approbation")
                        .header("Authorization", "Bearer " + tokenAgent)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROUVE\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCES_REFUSE"));

        mockMvc.perform(post("/api/credits/" + demande.id() + "/approbation")
                        .header("Authorization", "Bearer " + tokenDirecteur)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROUVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("APPROUVE"));
    }

    private String token(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"motDePasse\":\"Sfd@2026!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }
}
