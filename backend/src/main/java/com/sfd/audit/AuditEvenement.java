package com.sfd.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "audit_evenement")
@Getter
@Setter
@NoArgsConstructor
public class AuditEvenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String categorie;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "acteur_id")
    private Long acteurId;

    @Column(name = "acteur_email", length = 150)
    private String acteurEmail;

    @Column(name = "acteur_role", length = 20)
    private String acteurRole;

    @Column(name = "agence_id")
    private Long agenceId;

    @Column(nullable = false, length = 10)
    private String methode;

    @Column(nullable = false, length = 255)
    private String chemin;

    @Column(name = "statut_http", nullable = false)
    private int statutHttp;

    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @CreationTimestamp
    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;
}
