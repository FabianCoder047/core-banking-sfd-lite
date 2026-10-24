package com.sfd.client;

import com.sfd.agence.Agence;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "client")
@Getter
@Setter
@NoArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_id", nullable = false)
    private Agence agence;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, length = 80)
    private String prenom;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 1)
    private String sexe;

    @Column(length = 20)
    private String telephone;

    @Column(length = 255)
    private String adresse;

    @Column(length = 100)
    private String profession;

    @Column(name = "numero_piece", length = 40)
    private String numeroPiece;

    @Column(nullable = false, length = 15)
    private String statut = "ACTIF";

    @CreationTimestamp
    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;
}
