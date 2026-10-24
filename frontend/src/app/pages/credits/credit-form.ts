import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import { Client, CompteEpargne, ProduitCredit } from '../../core/models';
import { ClientApi } from '../../core/services/client-api';
import { CreditApi, ProduitApi } from '../../core/services/credit-api';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="entete">
          <a mat-icon-button routerLink="/credits" matTooltip="Retour aux crédits">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div>
            <h1>Nouvelle demande de crédit</h1>
            <div class="sous-titre">La demande sera soumise à approbation avant décaissement</div>
          </div>
        </div>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      <div class="grille">
        <div class="colonne">
          <mat-card class="bloc">
            <mat-card-header>
              <mat-card-title>1. Client</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (client(); as c) {
                <div class="client-selectionne">
                  <div>
                    <strong>{{ c.prenom }} {{ c.nom }}</strong>
                    <div class="sous-texte">{{ c.numero }} · {{ c.agenceCode }}</div>
                  </div>
                  <button
                    mat-icon-button
                    matTooltip="Changer de client"
                    (click)="reinitialiserClient()"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              } @else {
                <div class="recherche-ligne">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="recherche">
                    <mat-label>Nom, numéro ou téléphone</mat-label>
                    <input matInput [formControl]="recherche" (keyup.enter)="chercher()" />
                    <mat-icon matPrefix>search</mat-icon>
                  </mat-form-field>
                  <button
                    mat-stroked-button
                    (click)="chercher()"
                    [disabled]="chargementRecherche()"
                  >
                    Rechercher
                  </button>
                </div>
                @if (chargementRecherche()) {
                  <mat-progress-bar mode="indeterminate" />
                }
                @if (resultats().length > 0) {
                  <div class="resultats">
                    @for (resultat of resultats(); track resultat.id) {
                      <button type="button" class="resultat" (click)="choisirClient(resultat)">
                        <span class="identite">
                          <strong>{{ resultat.prenom }} {{ resultat.nom }}</strong>
                          <small
                            >{{ resultat.numero }} ·
                            {{ resultat.telephone || 'sans téléphone' }}</small
                          >
                        </span>
                        <mat-icon>chevron_right</mat-icon>
                      </button>
                    }
                  </div>
                } @else if (!chargementRecherche()) {
                  <div class="etat-vide">Recherchez le client qui demande le crédit.</div>
                }
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="bloc">
            <mat-card-header>
              <mat-card-title>2. Compte de décaissement</mat-card-title>
              <mat-card-subtitle
                >Le montant et les frais seront mouvementés sur ce compte</mat-card-subtitle
              >
            </mat-card-header>
            <mat-card-content>
              @if (!client()) {
                <div class="etat-vide">Sélectionnez d'abord un client.</div>
              } @else if (comptes().length === 0) {
                <div class="etat-vide">Ce client n'a aucun compte d'épargne actif.</div>
              } @else {
                <mat-form-field appearance="outline" class="pleine-largeur">
                  <mat-label>Compte d'épargne</mat-label>
                  <mat-select [formControl]="compteId">
                    @for (compte of comptes(); track compte.id) {
                      <mat-option [value]="compte.id" [disabled]="compte.statut !== 'ACTIF'">
                        {{ compte.numero }} — {{ compte.solde | fcfa }}
                      </mat-option>
                    }
                  </mat-select>
                  @if (compteId.hasError('required')) {
                    <mat-error>Compte obligatoire</mat-error>
                  }
                </mat-form-field>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <div class="colonne">
          <mat-card class="bloc">
            <mat-card-header>
              <mat-card-title>3. Conditions du crédit</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Produit de crédit</mat-label>
                <mat-select [formControl]="produitId" (selectionChange)="produitChange()">
                  @for (produit of produits(); track produit.id) {
                    <mat-option [value]="produit.id">{{ produit.libelle }}</mat-option>
                  }
                </mat-select>
                @if (produitId.hasError('required')) {
                  <mat-error>Produit obligatoire</mat-error>
                }
              </mat-form-field>

              @if (produit(); as p) {
                <div class="caracteristiques">
                  <div>
                    <span>Taux annuel</span><strong>{{ p.tauxAnnuel }} %</strong>
                  </div>
                  <div>
                    <span>Durée</span
                    ><strong>{{ p.dureeMinMois }} à {{ p.dureeMaxMois }} mois</strong>
                  </div>
                  <div>
                    <span>Montant</span
                    ><strong>{{ p.montantMin | fcfa }} à {{ p.montantMax | fcfa }}</strong>
                  </div>
                  <div>
                    <span>Frais de dossier</span><strong>{{ p.fraisDossierPct }} %</strong>
                  </div>
                  <div>
                    <span>Amortissement</span>
                    <strong>{{
                      p.modeAmortissement === 'ANNUITE_CONSTANTE'
                        ? 'Annuité constante'
                        : 'Capital constant'
                    }}</strong>
                  </div>
                </div>
              }

              <div class="ligne-champs">
                <mat-form-field appearance="outline">
                  <mat-label>Montant demandé (FCFA)</mat-label>
                  <input matInput type="number" min="1" step="1" [formControl]="montant" />
                  @if (montant.hasError('required')) {
                    <mat-error>Montant obligatoire</mat-error>
                  } @else if (produit() && !montantDansBornes()) {
                    <mat-error>Hors des bornes du produit</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Durée (mois)</mat-label>
                  <input matInput type="number" min="1" step="1" [formControl]="dureeMois" />
                  @if (dureeMois.hasError('required')) {
                    <mat-error>Durée obligatoire</mat-error>
                  } @else if (produit() && !dureeDansBornes()) {
                    <mat-error>Hors des bornes du produit</mat-error>
                  }
                </mat-form-field>
              </div>

              @if (produit() && montant.value) {
                <div class="estimation">
                  <div>
                    <span>Frais de dossier estimés</span>
                    <strong>{{ fraisEstimes() | fcfa }}</strong>
                  </div>
                  <div>
                    <span>Montant net crédité</span>
                    <strong>{{ montantNet() | fcfa }}</strong>
                  </div>
                </div>
              }

              <div class="actions">
                <a mat-button routerLink="/credits">Annuler</a>
                <button
                  mat-flat-button
                  color="primary"
                  [disabled]="!formulaireValide() || enregistrement()"
                  (click)="soumettre()"
                >
                  @if (enregistrement()) {
                    Envoi…
                  } @else {
                    Soumettre la demande
                  }
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .entete {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .grille {
        display: grid;
        grid-template-columns: 1fr 1.15fr;
        gap: 18px;
        align-items: start;
      }
      .colonne {
        display: flex;
        flex-direction: column;
      }
      .bloc {
        margin-bottom: 18px;
      }
      .recherche-ligne {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .recherche {
        flex: 1;
      }
      .resultats {
        margin-top: 10px;
        display: grid;
        gap: 4px;
        max-height: 260px;
        overflow: auto;
      }
      .resultat {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 10px;
        padding: 10px 12px;
        cursor: pointer;
        text-align: left;
        font: inherit;
      }
      .resultat:hover {
        background: #f8fafc;
      }
      .resultat .identite {
        flex: 1;
      }
      .client-selectionne {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .sous-texte {
        color: #6b7280;
        font-size: 0.8rem;
      }
      .caracteristiques {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 16px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;
      }
      .caracteristiques div {
        display: flex;
        flex-direction: column;
      }
      .caracteristiques span {
        color: #6b7280;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .caracteristiques strong {
        font-size: 0.88rem;
      }
      .ligne-champs {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 12px;
      }
      .estimation {
        display: flex;
        gap: 30px;
        padding: 10px 0 14px;
      }
      .estimation span {
        display: block;
        color: #6b7280;
        font-size: 0.75rem;
      }
      .estimation strong {
        font-size: 1.05rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      @media (max-width: 980px) {
        .grille {
          grid-template-columns: 1fr;
        }
        .ligne-champs {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .caracteristiques {
          grid-template-columns: 1fr;
        }
        .estimation {
          flex-wrap: wrap;
          gap: 14px 24px;
        }
        .recherche-ligne {
          flex-wrap: wrap;
        }
        .recherche {
          flex: 1 1 100%;
        }
      }
    `,
  ],
})
export class CreditFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientApi = inject(ClientApi);
  private readonly creditApi = inject(CreditApi);
  private readonly produitApi = inject(ProduitApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly recherche = this.fb.nonNullable.control('');
  protected readonly produitId = this.fb.control<number | null>(null, Validators.required);
  protected readonly compteId = this.fb.control<number | null>(null, Validators.required);
  protected readonly montant = this.fb.control<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);
  protected readonly dureeMois = this.fb.control<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);

  protected readonly resultats = signal<Client[]>([]);
  protected readonly produits = signal<ProduitCredit[]>([]);
  protected readonly client = signal<Client | null>(null);
  protected readonly comptes = signal<CompteEpargne[]>([]);
  protected readonly chargementRecherche = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    this.produitApi.lister().subscribe({
      next: (liste) => this.produits.set(liste.filter((produit) => produit.actif)),
      error: (err) => this.erreur.set(messageErreur(err)),
    });

    const clientId = Number(this.route.snapshot.queryParamMap.get('clientId'));
    if (clientId > 0) {
      this.chargerClient(clientId);
    }
  }

  protected produit(): ProduitCredit | null {
    const id = this.produitId.value;
    return this.produits().find((produit) => produit.id === id) ?? null;
  }

  protected chercher(): void {
    this.chargementRecherche.set(true);
    this.erreur.set(null);
    this.clientApi.rechercher(this.recherche.value, 0, 20).subscribe({
      next: (page) => {
        this.resultats.set(page.contenu);
        this.chargementRecherche.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementRecherche.set(false);
      },
    });
  }

  protected choisirClient(client: Client): void {
    this.chargerClient(client.id);
  }

  protected reinitialiserClient(): void {
    this.client.set(null);
    this.comptes.set([]);
    this.compteId.reset();
  }

  protected produitChange(): void {
    const produit = this.produit();
    if (!produit) {
      return;
    }
    if (this.dureeMois.value == null) {
      this.dureeMois.setValue(produit.dureeMinMois);
    }
  }

  protected montantDansBornes(): boolean {
    const produit = this.produit();
    const montant = this.montant.value;
    return (
      !!produit &&
      montant != null &&
      Number.isInteger(montant) &&
      montant >= produit.montantMin &&
      montant <= produit.montantMax
    );
  }

  protected dureeDansBornes(): boolean {
    const produit = this.produit();
    const duree = this.dureeMois.value;
    return (
      !!produit && duree != null && duree >= produit.dureeMinMois && duree <= produit.dureeMaxMois
    );
  }

  protected formulaireValide(): boolean {
    return (
      !!this.client() &&
      this.compteId.valid &&
      this.produitId.valid &&
      this.montantDansBornes() &&
      this.dureeDansBornes()
    );
  }

  protected fraisEstimes(): number {
    const produit = this.produit();
    const montant = this.montant.value ?? 0;
    if (!produit) {
      return 0;
    }
    return Math.round((montant * produit.fraisDossierPct) / 100);
  }

  protected montantNet(): number {
    return (this.montant.value ?? 0) - this.fraisEstimes();
  }

  protected soumettre(): void {
    const client = this.client();
    const produitId = this.produitId.value;
    const compteId = this.compteId.value;
    const montant = this.montant.value;
    const dureeMois = this.dureeMois.value;
    if (
      !client ||
      !produitId ||
      !compteId ||
      montant == null ||
      dureeMois == null ||
      !this.formulaireValide()
    ) {
      this.erreur.set(
        'Veuillez compléter tous les champs obligatoires dans les bornes du produit.',
      );
      return;
    }
    this.enregistrement.set(true);
    this.erreur.set(null);
    this.creditApi
      .demander({
        clientId: client.id,
        produitId,
        compteId,
        montant: Math.trunc(montant),
        dureeMois: Math.trunc(dureeMois),
      })
      .subscribe({
        next: (credit) => {
          this.snack.open(`Demande ${credit.numero} enregistrée`, 'Fermer', { duration: 3500 });
          void this.router.navigate(['/credits', credit.id]);
        },
        error: (err) => {
          this.erreur.set(messageErreur(err));
          this.enregistrement.set(false);
        },
      });
  }

  private chargerClient(clientId: number): void {
    this.erreur.set(null);
    this.clientApi.fiche(clientId).subscribe({
      next: (fiche) => {
        this.client.set(fiche.client);
        this.comptes.set(fiche.comptes.filter((compte) => compte.statut === 'ACTIF'));
        const premier = this.comptes()[0];
        if (premier) {
          this.compteId.setValue(premier.id);
        }
      },
      error: (err) => this.erreur.set(messageErreur(err)),
    });
  }
}
