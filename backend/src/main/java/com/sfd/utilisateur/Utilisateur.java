package com.sfd.utilisateur;

import com.sfd.agence.Agence;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "utilisateur")
@Getter
@Setter
@NoArgsConstructor
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "mot_de_passe_hash", nullable = false, length = 100)
    private String motDePasseHash;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, length = 80)
    private String prenom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "doit_changer_mot_de_passe", nullable = false)
    private boolean doitChangerMotDePasse;

    @CreationTimestamp
    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;
}
