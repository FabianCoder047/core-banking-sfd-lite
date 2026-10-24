package com.sfd.client;

import java.time.Instant;
import java.time.LocalDate;

public record ClientDto(
        Long id,
        String numero,
        String nom,
        String prenom,
        LocalDate dateNaissance,
        String sexe,
        String telephone,
        String adresse,
        String profession,
        String numeroPiece,
        String statut,
        Long agenceId,
        String agenceCode,
        Instant creeLe) {

    public static ClientDto from(Client client) {
        return new ClientDto(
                client.getId(),
                client.getNumero(),
                client.getNom(),
                client.getPrenom(),
                client.getDateNaissance(),
                client.getSexe(),
                client.getTelephone(),
                client.getAdresse(),
                client.getProfession(),
                client.getNumeroPiece(),
                client.getStatut(),
                client.getAgence().getId(),
                client.getAgence().getCode(),
                client.getCreeLe());
    }
}
