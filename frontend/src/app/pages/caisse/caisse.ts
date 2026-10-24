import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import { Client, CompteEpargne, Operation, PageResponse, TypeOperation } from '../../core/models';
import { ClientApi } from '../../core/services/client-api';
import { EpargneApi } from '../../core/services/epargne-api';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MATERIAL_MODULES } from '../../shared/material';

type TypeCaisse = 'DEPOT' | 'RETRAIT';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Opérations de caisse</h1>
          <div class="sous-titre">Dépôts et retraits sur les comptes d'épargne</div>
        </div>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      <div class="caisse-grille">
        <mat-card class="colonne">
          <mat-card-header>
            <mat-card-title>1. Client et compte</mat-card-title>
            <mat-card-subtitle>Recherchez un client puis choisissez son compte</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="recherche-ligne">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="recherche">
                <mat-label>Nom, numéro ou téléphone</mat-label>
                <input matInput [formControl]="recherche" (keyup.enter)="chercher()" />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button mat-stroked-button (click)="chercher()" [disabled]="chargementRecherche()">
                Rechercher
              </button>
            </div>

            @if (chargementRecherche()) {
              <mat-progress-bar mode="indeterminate" />
            }

            @if (resultats().length > 0 && !client()) {
              <div class="resultats">
                @for (resultat of resultats(); track resultat.id) {
                  <button type="button" class="resultat" (click)="choisirClient(resultat)">
                    <span class="identite">
                      <strong>{{ resultat.prenom }} {{ resultat.nom }}</strong>
                      <small
                        >{{ resultat.numero }} · {{ resultat.telephone || 'sans téléphone' }}</small
                      >
                    </span>
                    <span class="badge" [class.vert]="resultat.statut === 'ACTIF'">{{
                      resultat.statut
                    }}</span>
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                }
              </div>
            }

            @if (client(); as c) {
              <div class="client-selectionne">
                <div>
                  <strong>{{ c.prenom }} {{ c.nom }}</strong>
                  <div class="sous-texte">
                    {{ c.numero }} · {{ c.telephone || 'sans téléphone' }}
                  </div>
                </div>
                <button
                  mat-icon-button
                  matTooltip="Changer de client"
                  (click)="reinitialiserClient()"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              @if (comptes().length === 0) {
                <div class="etat-vide">Ce client n'a aucun compte d'épargne.</div>
              } @else {
                <div class="comptes">
                  @for (compte of comptes(); track compte.id) {
                    <button
                      type="button"
                      class="compte"
                      [class.selectionne]="compteSelectionne()?.id === compte.id"
                      [disabled]="compte.statut !== 'ACTIF'"
                      (click)="selectionnerCompte(compte)"
                    >
                      <span class="identite">
                        <strong>{{ compte.numero }}</strong>
                        <small>{{ compte.statut }}</small>
                      </span>
                      <span class="solde montant">{{ compte.solde | fcfa }}</span>
                    </button>
                  }
                </div>
              }
            } @else if (resultats().length === 0 && !chargementRecherche()) {
              <div class="etat-vide">Lancez une recherche pour sélectionner un client.</div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="colonne">
          <mat-card-header>
            <mat-card-title>2. Opération</mat-card-title>
            <mat-card-subtitle>Le solde est mis à jour immédiatement</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (compteSelectionne(); as compte) {
              <div class="solde-carte">
                <span class="libelle">Solde disponible</span>
                <strong class="montant">{{ compte.solde | fcfa }}</strong>
                <span class="compte-numero">{{ compte.numero }}</span>
              </div>

              <mat-button-toggle-group
                class="type-operation"
                [value]="typeOperation()"
                (change)="changerType($event.value)"
                hideSingleSelectionIndicator
              >
                <mat-button-toggle value="DEPOT"
                  ><mat-icon>add_circle</mat-icon> Dépôt</mat-button-toggle
                >
                <mat-button-toggle value="RETRAIT"
                  ><mat-icon>remove_circle</mat-icon> Retrait</mat-button-toggle
                >
              </mat-button-toggle-group>

              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Montant (FCFA)</mat-label>
                <input
                  matInput
                  type="number"
                  min="1"
                  step="1"
                  [formControl]="montant"
                  (keyup.enter)="soumettre()"
                />
                <span matTextSuffix>FCFA</span>
                @if (montant.hasError('required') || montant.hasError('min')) {
                  <mat-error>Montant invalide</mat-error>
                }
              </mat-form-field>

              <div class="raccourcis-montant">
                @for (valeur of montantsRapides; track valeur) {
                  <button mat-stroked-button type="button" (click)="montant.setValue(valeur)">
                    {{ valeur | fcfa }}
                  </button>
                }
              </div>

              @if (typeOperation() === 'RETRAIT' && montant.value && montant.value > compte.solde) {
                <div class="encart negatif petit">Le montant dépasse le solde disponible.</div>
              }
              @if (erreurOperation(); as message) {
                <div class="encart negatif petit">{{ message }}</div>
              }

              <button
                mat-flat-button
                color="primary"
                class="pleine-largeur bouton-valider"
                [disabled]="
                  montant.invalid ||
                  enregistrement() ||
                  (typeOperation() === 'RETRAIT' && (montant.value ?? 0) > compte.solde)
                "
                (click)="soumettre()"
              >
                @if (enregistrement()) {
                  Traitement…
                } @else {
                  Valider le {{ typeOperation() === 'DEPOT' ? 'dépôt' : 'retrait' }}
                }
              </button>

              @if (derniereOperation(); as operation) {
                <div class="recu">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <strong>{{ operation.reference }}</strong>
                    <div>
                      {{ libelleType(operation.type) }} de {{ operation.montant | fcfa }} enregistré
                    </div>
                    @if (soldeApres() !== null) {
                      <div class="sous-texte">Nouveau solde : {{ soldeApres() | fcfa }}</div>
                    }
                  </div>
                </div>
              }
            } @else {
              <div class="etat-vide">
                <mat-icon class="icone-vide">point_of_sale</mat-icon>
                <p>Sélectionnez un compte pour saisir une opération.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      @if (compteSelectionne()) {
        <mat-card class="bloc">
          <mat-card-header>
            <mat-card-title>Dernières opérations du compte</mat-card-title>
            <mat-card-subtitle>{{ compteSelectionne()?.numero }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (chargementReleve()) {
              <mat-progress-bar mode="indeterminate" />
            }
            @if (releve(); as page) {
              @if (page.contenu.length === 0) {
                <div class="etat-vide">Aucune opération enregistrée.</div>
              } @else {
                <div class="table-scroll">
                  <table mat-table [dataSource]="page.contenu">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let operation">
                        {{ operation.dateOperation | date: 'dd/MM/yyyy HH:mm' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="reference">
                      <th mat-header-cell *matHeaderCellDef>Référence</th>
                      <td mat-cell *matCellDef="let operation">
                        <strong>{{ operation.reference }}</strong>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let operation">
                        {{ libelleType(operation.type) }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="montant">
                      <th mat-header-cell *matHeaderCellDef class="droite">Montant</th>
                      <td
                        mat-cell
                        *matCellDef="let operation"
                        class="droite montant"
                        [class.positif]="estCredit(operation.type)"
                        [class.negatif]="!estCredit(operation.type)"
                      >
                        {{ estCredit(operation.type) ? '+' : '−' }} {{ operation.montant | fcfa }}
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnes"></tr>
                  </table>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .caisse-grille {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        align-items: start;
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
        margin-top: 12px;
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
        margin-top: 10px;
      }
      .sous-texte {
        color: #6b7280;
        font-size: 0.8rem;
      }
      .comptes {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }
      .compte {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .compte:hover:not(:disabled) {
        border-color: #93c5fd;
      }
      .compte.selectionne {
        border-color: #1d4ed8;
        background: #eff6ff;
        box-shadow: 0 0 0 1px #1d4ed8 inset;
      }
      .compte:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .compte .identite {
        display: flex;
        flex-direction: column;
      }
      .compte small {
        color: #6b7280;
      }
      .solde-carte {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: #0f2b46;
        color: #e2e8f0;
        border-radius: 12px;
        padding: 16px 18px;
        margin-bottom: 16px;
      }
      .solde-carte .libelle {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }
      .solde-carte strong {
        font-size: 1.8rem;
      }
      .solde-carte .compte-numero {
        font-size: 0.8rem;
        opacity: 0.7;
      }
      .type-operation {
        width: 100%;
        margin-bottom: 14px;
      }
      .type-operation mat-button-toggle {
        flex: 1;
      }
      .raccourcis-montant {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 14px;
      }
      .bouton-valider {
        height: 46px;
      }
      .petit {
        padding: 10px 12px;
        font-size: 0.85rem;
        margin-bottom: 12px;
      }
      .recu {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin-top: 14px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 10px;
        padding: 12px 14px;
        color: #065f46;
      }
      .recu .sous-texte {
        color: #047857;
      }
      .etat-vide {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .icone-vide {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #cbd5e1;
      }
      .bloc {
        margin-top: 18px;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      @media (max-width: 980px) {
        .caisse-grille {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .recherche-ligne {
          flex-wrap: wrap;
        }
        .recherche {
          flex: 1 1 100%;
        }
        .client-selectionne,
        .compte {
          flex-wrap: wrap;
        }
        .solde-carte strong {
          font-size: 1.45rem;
        }
      }
    `,
  ],
})
export class CaissePage implements OnInit {
  private readonly clientApi = inject(ClientApi);
  private readonly epargneApi = inject(EpargneApi);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly recherche = this.fb.nonNullable.control('');
  protected readonly montant = this.fb.control<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);
  protected readonly resultats = signal<Client[]>([]);
  protected readonly client = signal<Client | null>(null);
  protected readonly comptes = signal<CompteEpargne[]>([]);
  protected readonly compteSelectionne = signal<CompteEpargne | null>(null);
  protected readonly typeOperation = signal<TypeCaisse>('DEPOT');
  protected readonly chargementRecherche = signal(false);
  protected readonly chargementReleve = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurOperation = signal<string | null>(null);
  protected readonly derniereOperation = signal<Operation | null>(null);
  protected readonly soldeApres = signal<number | null>(null);
  protected readonly releve = signal<PageResponse<Operation> | null>(null);

  protected readonly colonnes = ['date', 'reference', 'type', 'montant'];
  protected readonly montantsRapides = [5000, 10000, 25000, 50000];

  ngOnInit(): void {
    this.chercher();
    const compteId = Number(this.route.snapshot.queryParamMap.get('compte'));
    if (compteId > 0) {
      this.epargneApi.obtenir(compteId).subscribe({
        next: (compte) => this.chargerClient(compte.clientId, compte.id),
        error: (err) => this.erreur.set(messageErreur(err)),
      });
    }
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
    this.compteSelectionne.set(null);
    this.releve.set(null);
    this.derniereOperation.set(null);
    this.soldeApres.set(null);
    this.erreurOperation.set(null);
  }

  protected selectionnerCompte(compte: CompteEpargne): void {
    this.compteSelectionne.set(compte);
    this.derniereOperation.set(null);
    this.soldeApres.set(null);
    this.erreurOperation.set(null);
    this.chargerReleve(compte.id);
  }

  protected changerType(type: TypeCaisse): void {
    this.typeOperation.set(type);
    this.erreurOperation.set(null);
  }

  protected soumettre(): void {
    const compte = this.compteSelectionne();
    if (!compte || this.montant.invalid || this.enregistrement()) {
      this.montant.markAsTouched();
      return;
    }
    const montant = Math.trunc(this.montant.value ?? 0);
    if (montant <= 0) {
      this.montant.markAsTouched();
      return;
    }
    const type = this.typeOperation();
    const libelle = type === 'DEPOT' ? 'dépôt' : 'retrait';
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: `Confirmer le ${libelle}`,
          message: `Enregistrer un ${libelle} de ${this.formater(montant)} sur le compte ${compte.numero} ?`,
          libelleConfirmer: type === 'DEPOT' ? 'Encaisser' : 'Débourser',
          danger: type === 'RETRAIT',
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.executer(type, compte, montant);
        }
      });
  }

  protected libelleType(type: TypeOperation): string {
    switch (type) {
      case 'DEPOT':
        return 'Dépôt';
      case 'RETRAIT':
        return 'Retrait';
      case 'DECAISSEMENT':
        return 'Décaissement';
      case 'REMBOURSEMENT':
        return 'Remboursement';
      case 'FRAIS_DOSSIER':
        return 'Frais de dossier';
      default:
        return type;
    }
  }

  protected estCredit(type: TypeOperation): boolean {
    return type === 'DEPOT' || type === 'DECAISSEMENT';
  }

  private executer(type: TypeCaisse, compte: CompteEpargne, montant: number): void {
    this.enregistrement.set(true);
    this.erreurOperation.set(null);
    const requete =
      type === 'DEPOT'
        ? this.epargneApi.depot(compte.id, montant)
        : this.epargneApi.retrait(compte.id, montant);
    requete.subscribe({
      next: (operation) => {
        this.derniereOperation.set(operation);
        this.snack.open(
          `${this.libelleType(operation.type)} ${operation.reference} enregistré`,
          'Fermer',
          {
            duration: 3500,
          },
        );
        this.montant.reset();
        this.enregistrement.set(false);
        this.actualiserCompte(compte.id);
      },
      error: (err) => {
        this.erreurOperation.set(messageErreur(err));
        this.enregistrement.set(false);
      },
    });
  }

  private actualiserCompte(compteId: number): void {
    this.epargneApi.obtenir(compteId).subscribe({
      next: (compte) => {
        this.compteSelectionne.set(compte);
        this.soldeApres.set(compte.solde);
        this.comptes.update((liste) => liste.map((c) => (c.id === compte.id ? compte : c)));
        this.chargerReleve(compte.id);
      },
      error: (err) => this.erreur.set(messageErreur(err)),
    });
  }

  private chargerClient(clientId: number, compteId?: number): void {
    this.erreur.set(null);
    this.clientApi.fiche(clientId).subscribe({
      next: (fiche) => {
        this.client.set(fiche.client);
        this.comptes.set(fiche.comptes);
        const voulu = compteId ? fiche.comptes.find((compte) => compte.id === compteId) : undefined;
        const actif =
          voulu ?? fiche.comptes.find((compte) => compte.statut === 'ACTIF') ?? fiche.comptes[0];
        if (actif) {
          this.selectionnerCompte(actif);
        } else {
          this.compteSelectionne.set(null);
        }
      },
      error: (err) => this.erreur.set(messageErreur(err)),
    });
  }

  private chargerReleve(compteId: number): void {
    this.chargementReleve.set(true);
    this.epargneApi.releve(compteId, 0, 10).subscribe({
      next: (page) => {
        this.releve.set(page);
        this.chargementReleve.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementReleve.set(false);
      },
    });
  }

  private formater(montant: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
  }
}
