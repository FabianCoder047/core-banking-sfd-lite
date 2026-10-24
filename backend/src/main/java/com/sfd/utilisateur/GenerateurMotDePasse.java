package com.sfd.utilisateur;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Genere un mot de passe temporaire difficile a deviner, destine a etre change
 * des la premiere connexion.
 */
@Component
public class GenerateurMotDePasse {

    private static final int LONGUEUR = 14;
    private static final String MINUSCULES = "abcdefghijkmnopqrstuvwxyz";
    private static final String MAJUSCULES = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String CHIFFRES = "23456789";
    private static final String SPECIAUX = "!@#$%&*+-_=";
    private static final String TOUS = MINUSCULES + MAJUSCULES + CHIFFRES + SPECIAUX;

    private final SecureRandom random = new SecureRandom();

    public String generer() {
        char[] caracteres = new char[LONGUEUR];
        caracteres[0] = tirer(MINUSCULES);
        caracteres[1] = tirer(MAJUSCULES);
        caracteres[2] = tirer(CHIFFRES);
        caracteres[3] = tirer(SPECIAUX);
        for (int i = 4; i < LONGUEUR; i++) {
            caracteres[i] = tirer(TOUS);
        }
        melanger(caracteres);
        return new String(caracteres);
    }

    private char tirer(String alphabet) {
        return alphabet.charAt(random.nextInt(alphabet.length()));
    }

    private void melanger(char[] caracteres) {
        for (int i = caracteres.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temporaire = caracteres[i];
            caracteres[i] = caracteres[j];
            caracteres[j] = temporaire;
        }
    }
}
