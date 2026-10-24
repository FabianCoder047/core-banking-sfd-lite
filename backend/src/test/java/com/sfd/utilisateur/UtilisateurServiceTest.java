package com.sfd.utilisateur;

import com.sfd.agence.AgenceRepository;
import com.sfd.common.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UtilisateurServiceTest {

    private UtilisateurRepository repository;
    private AgenceRepository agenceRepository;
    private PasswordEncoder passwordEncoder;
    private GenerateurMotDePasse generateur;
    private EmailService emailService;
    private UtilisateurService service;

    @BeforeEach
    void setUp() {
        repository = mock(UtilisateurRepository.class);
        agenceRepository = mock(AgenceRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        generateur = mock(GenerateurMotDePasse.class);
        emailService = mock(EmailService.class);
        service = new UtilisateurService(repository, agenceRepository, passwordEncoder,
                generateur, emailService);
    }

    @Test
    void cree_un_utilisateur_avec_un_mot_de_passe_genere_et_envoye_par_email() {
        String motDePasse = "Abcdef2!Abcdef";
        when(generateur.generer()).thenReturn(motDePasse);
        when(passwordEncoder.encode(motDePasse)).thenReturn("hash-bcrypt");
        when(repository.saveAndFlush(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UtilisateurDto dto = service.creer(new UtilisateurRequest(
                "Nouveau.Utilisateur@SFD.TG", "AGBEKO", "Kossi",
                Role.ADMIN, null, true));

        assertThat(dto.email()).isEqualTo("nouveau.utilisateur@sfd.tg");
        assertThat(dto.doitChangerMotDePasse()).isTrue();
        assertThat(dto.actif()).isTrue();
        verify(passwordEncoder).encode(motDePasse);
        verify(emailService).envoyerMotDePasseInitial(
                "nouveau.utilisateur@sfd.tg", "Kossi", motDePasse);
        verify(repository).saveAndFlush(any(Utilisateur.class));
    }
}
