package com.sfd.compta;

import com.sfd.agence.Agence;
import com.sfd.operation.Operation;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ecriture")
@Getter
@Setter
@NoArgsConstructor
public class Ecriture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Journal journal;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(name = "date_comptable", nullable = false)
    private LocalDate dateComptable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_id", nullable = false)
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id")
    private Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extourne_de")
    private Ecriture extourneDe;

    @CreationTimestamp
    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @OneToMany(mappedBy = "ecriture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneEcriture> lignes = new ArrayList<>();

    public void ajouterLigne(CompteComptable compte, Sens sens, java.math.BigDecimal montant) {
        LigneEcriture ligne = new LigneEcriture();
        ligne.setEcriture(this);
        ligne.setCompteComptable(compte);
        ligne.setSens(sens);
        ligne.setMontant(montant);
        this.lignes.add(ligne);
    }
}
