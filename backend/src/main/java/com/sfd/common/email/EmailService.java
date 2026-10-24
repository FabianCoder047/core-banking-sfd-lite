package com.sfd.common.email;

import com.sfd.common.error.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mode;
    private final String expediteur;
    private final String urlApplication;

    public EmailService(JavaMailSender mailSender,
                        @Value("${sfd.mail.mode:journal}") String mode,
                        @Value("${sfd.mail.expediteur:no-reply@sfd.tg}") String expediteur,
                        @Value("${sfd.app.url:http://localhost:4200}") String urlApplication) {
        this.mailSender = mailSender;
        this.mode = mode;
        this.expediteur = expediteur;
        this.urlApplication = urlApplication;
    }

    public void envoyerMotDePasseInitial(String destinataire, String prenom, String motDePasse) {
        if (!"smtp".equalsIgnoreCase(mode)) {
            throw new BusinessException("ENVOI_EMAIL_NON_CONFIGURE", HttpStatus.SERVICE_UNAVAILABLE,
                    "L'envoi d'e-mails SMTP n'est pas configure.");
        }
        String sujet = "Votre compte SFD Lite";
        String corps = """
                Bonjour %s,

                Un compte SFD Lite a été créé pour vous.

                Identifiant : %s
                Mot de passe temporaire : %s

                Ce mot de passe doit être changé dès votre première connexion :
                %s/login

                Si vous n'êtes pas à l'origine de cette demande, contactez votre administrateur.

                L'équipe SFD Lite
                """.formatted(prenom, destinataire, motDePasse, urlApplication);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(expediteur);
        message.setTo(destinataire);
        message.setSubject(sujet);
        message.setText(corps);
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new BusinessException("ENVOI_EMAIL_ECHEC", HttpStatus.BAD_GATEWAY,
                    "Le compte n'a pas pu etre cree : l'e-mail contenant le mot de passe n'a pas pu etre envoye.");
        }
    }
}
