package com.sfd.epargne;

import com.sfd.agence.Agence;
import com.sfd.client.Client;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "compte_epargne")
@Getter
@Setter
@NoArgsConstructor
public class CompteEpargne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_id", nullable = false)
    private Agence agence;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(nullable = false, precision = 18, scale = 0)
    private BigDecimal solde = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatutCompte statut = StatutCompte.ACTIF;

    @CreationTimestamp
    @Column(name = "ouvert_le", nullable = false, updatable = false)
    private Instant ouvertLe;
}
