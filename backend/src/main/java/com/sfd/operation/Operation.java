package com.sfd.operation;

import com.sfd.agence.Agence;
import com.sfd.credit.Credit;
import com.sfd.epargne.CompteEpargne;
import com.sfd.utilisateur.Utilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "operation")
@Getter
@Setter
@NoArgsConstructor
public class Operation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeOperation type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_id", nullable = false)
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_id")
    private CompteEpargne compte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_id")
    private Credit credit;

    @Column(nullable = false, precision = 18, scale = 0)
    private BigDecimal montant;

    @CreationTimestamp
    @Column(name = "date_operation", nullable = false, updatable = false)
    private Instant dateOperation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extourne_de")
    private Operation extourneDe;
}
