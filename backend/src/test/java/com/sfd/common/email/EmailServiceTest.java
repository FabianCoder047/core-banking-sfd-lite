package com.sfd.common.email;

import com.sfd.common.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;

class EmailServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);

    @Test
    void envoie_le_mot_de_passe_temporaire_par_smtp() {
        EmailService service = new EmailService(mailSender, "smtp", "no-reply@sfd.tg",
                "http://localhost:4200");

        service.envoyerMotDePasseInitial("kossi@sfd.tg", "Kossi", "Abcdef2!Abcdef");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getFrom()).isEqualTo("no-reply@sfd.tg");
        assertThat(message.getTo()).containsExactly("kossi@sfd.tg");
        assertThat(message.getSubject()).isEqualTo("Votre compte SFD Lite");
        assertThat(message.getText()).contains("Kossi", "kossi@sfd.tg", "Abcdef2!Abcdef",
                "http://localhost:4200/login");
    }

    @Test
    void transforme_un_echec_smtp_en_erreur_metier() {
        EmailService service = new EmailService(mailSender, "smtp", "no-reply@sfd.tg",
                "http://localhost:4200");
        doThrow(new MailSendException("SMTP indisponible")).when(mailSender).send(
                org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        assertThatThrownBy(() -> service.envoyerMotDePasseInitial(
                "kossi@sfd.tg", "Kossi", "Abcdef2!Abcdef"))
                .isInstanceOfSatisfying(BusinessException.class,
                        ex -> assertThat(ex.getCode()).isEqualTo("ENVOI_EMAIL_ECHEC"));
    }

    @Test
    void ne_journalise_jamais_le_mot_de_passe_si_smtp_est_desactive() {
        EmailService service = new EmailService(mailSender, "journal", "no-reply@sfd.tg",
                "http://localhost:4200");

        assertThatThrownBy(() -> service.envoyerMotDePasseInitial(
                "kossi@sfd.tg", "Kossi", "Abcdef2!Abcdef"))
                .isInstanceOfSatisfying(BusinessException.class,
                        ex -> assertThat(ex.getCode()).isEqualTo("ENVOI_EMAIL_NON_CONFIGURE"));
        verifyNoInteractions(mailSender);
    }
}
