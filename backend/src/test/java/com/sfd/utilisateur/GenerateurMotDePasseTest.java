package com.sfd.utilisateur;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GenerateurMotDePasseTest {

    private final GenerateurMotDePasse generateur = new GenerateurMotDePasse();

    @Test
    void genere_un_mot_de_passe_long_et_compose() {
        String premier = generateur.generer();
        String second = generateur.generer();

        assertThat(premier).hasSize(14);
        assertThat(premier).matches(".*[a-z].*");
        assertThat(premier).matches(".*[A-Z].*");
        assertThat(premier).matches(".*[0-9].*");
        assertThat(premier).matches(".*[!@#$%&*+\\-_=].*");
        assertThat(premier).isNotEqualTo(second);
    }
}
