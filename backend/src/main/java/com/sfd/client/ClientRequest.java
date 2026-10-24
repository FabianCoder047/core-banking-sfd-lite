package com.sfd.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ClientRequest(
        @NotBlank @Size(max = 80) String nom,
        @NotBlank @Size(max = 80) String prenom,
        @Past LocalDate dateNaissance,
        @Pattern(regexp = "[MF]") String sexe,
        @Size(max = 20) String telephone,
        @Size(max = 255) String adresse,
        @Size(max = 100) String profession,
        @Size(max = 40) String numeroPiece,
        Long agenceId) {
}
