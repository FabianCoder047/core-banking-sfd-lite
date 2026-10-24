package com.sfd.credit;

import com.sfd.agence.Agence;
import com.sfd.client.Client;
import com.sfd.epargne.CompteEpargne;
import com.sfd.utilisateur.Utilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "credit")
@Getter
@Setter
@NoArgsConstructor
public class Credit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 25)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_id", nullable = false)
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private ProduitCredit produit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private CompteEpargne compte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agent_id", nullable = false)
    private Utilisateur agent;

    @Column(name = "montant_demande", nullable = false, precision = 18, scale = 0)
    private BigDecimal montantDemande;

    @Column(name = "duree_mois", nullable = false)
    private int dureeMois;

    @Column(name = "taux_annuel", nullable = false, precision = 6, scale = 3)
    private BigDecimal tauxAnnuel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatutCredit statut = StatutCredit.DEMANDE;

    @Column(name = "motif_rejet", length = 255)
    private String motifRejet;

    @Column(name = "date_demande", nullable = false)
    private LocalDate dateDemande = LocalDate.now();

    @Column(name = "date_decaissement")
    private LocalDate dateDecaissement;

    @OneToMany(mappedBy = "credit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("numero asc")
    private List<Echeance> echeances = new ArrayList<>();

    public void ajouterEcheance(Echeance echeance) {
        echeance.setCredit(this);
        this.echeances.add(echeance);
    }
}
