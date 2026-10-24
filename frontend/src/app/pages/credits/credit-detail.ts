import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import {
  Credit,
  Echeance,
  Echeancier,
  Remboursement,
  StatutCredit,
  StatutEcheance,
} from '../../core/models';
import { CreditApi } from '../../core/services/credit-api';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MotifData, MotifDialog } from '../../shared/motif-dialog';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-credit-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="entete">
          <a mat-icon-button routerLink="/credits" matTooltip="Retour aux crédits">
            <mat-icon>arrow_back</mat-icon>
          </a>
          @if (credit(); as c) {
            <div>
              <h1>Dossier {{ c.numero }}</h1>
              <div class="sous-titre">
                <a [routerLink]="['/clients', c.clientId]">{{ c.clientNomComplet }}</a>
                · {{ c.produitLibelle }} · Agence {{ c.agenceCode }}
              </div>
            </div>
          } @else {
            <h1>Dossier de crédit</h1>
          }
        </div>
        @if (credit(); as c) {
          <span [class]="classeStatutEntete(c.statut)">{{ c.statut }}</span>
        }
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }
      @if (chargement()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (credit(); as c) {
        @if (c.statut === 'REJETE' && c.motifRejet) {
          <div class="encart rejet">
            <mat-icon>block</mat-icon>
            <div>
              <strong>Demande rejetée</strong>
              <div>{{ c.motifRejet }}</div>
            </div>
          </div>
        }
        @if (c.statut === 'DEMANDE') {
          <div class="encart attente">
            <mat-icon>hourglass_top</mat-icon>
            <div>
              <strong>En attente d'approbation</strong>
              <div>Un directeur ou un administrateur doit statuer sur cette demande.</div>
            </div>
          </div>
        }

        <div class="grille">
          <mat-card class="bloc">
            <mat-card-header>
              <mat-card-title>Caractéristiques</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="infos">
                <div>
                  <dt>Montant demandé</dt>
                  <dd class="montant">{{ c.montantDemande | fcfa }}</dd>
                </div>
                <div>
                  <dt>Durée</dt>
                  <dd>{{ c.dureeMois }} mois</dd>
                </div>
                <div>
                  <dt>Taux annuel</dt>
                  <dd>{{ c.tauxAnnuel }} %</dd>
                </div>
                <div>
                  <dt>Frais de dossier</dt>
                  <dd>{{ c.fraisDossierPct }} %</dd>
                </div>
                <div>
                  <dt>Amortissement</dt>
                  <dd>
                    {{
                      c.modeAmortissement === 'ANNUITE_CONSTANTE'
                        ? 'Annuité constante'
                        : 'Capital constant'
                    }}
                  </dd>
                </div>
                <div>
                  <dt>Compte de décaissement</dt>
                  <dd>{{ c.compteNumero }}</dd>
                </div>
                <div>
                  <dt>Agent</dt>
                  <dd>{{ c.agentNomComplet }}</dd>
                </div>
                <div>
                  <dt>Date de demande</dt>
                  <dd>{{ c.dateDemande | date: 'dd/MM/yyyy' }}</dd>
                </div>
                @if (c.dateDecaissement) {
                  <div>
                    <dt>Date de décaissement</dt>
                    <dd>{{ c.dateDecaissement | date: 'dd/MM/yyyy' }}</dd>
                  </div>
                }
              </dl>
            </mat-card-content>
          </mat-card>

          <mat-card class="bloc actions-carte">
            <mat-card-header>
              <mat-card-title>Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (c.statut === 'DEMANDE') {
                @if (peutStatuer()) {
                  @if (estCreateur()) {
                    <div class="encart petit">
                      Vous avez créé cette demande : un autre approbateur doit la traiter
                      (séparation des tâches).
                    </div>
                  } @else {
                    <div class="boutons">
                      <button
                        mat-flat-button
                        color="primary"
                        [disabled]="actionEnCours()"
                        (click)="approuver()"
                      >
                        <mat-icon>check_circle</mat-icon> Approuver
                      </button>
                      <button
                        mat-stroked-button
                        color="warn"
                        [disabled]="actionEnCours()"
                        (click)="rejeter()"
                      >
                        <mat-icon>cancel</mat-icon> Rejeter
                      </button>
                    </div>
                  }
                } @else {
                  <p class="texte-doux">Aucune action disponible pour votre rôle.</p>
                }
              } @else if (c.statut === 'APPROUVE') {
                @if (peutDecaisser()) {
                  <p class="texte-doux">
                    Le décaissement créditera le compte {{ c.compteNumero }} de
                    {{ c.montantDemande | fcfa }} et prélèvera les frais de dossier.
                  </p>
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="actionEnCours()"
                    (click)="decaisser()"
                  >
                    <mat-icon>payments</mat-icon> Décaisser le crédit
                  </button>
                } @else {
                  <p class="texte-doux">Le dossier est approuvé et attend son décaissement.</p>
                }
              } @else if (c.statut === 'DECAISSE') {
                @if (peutRembourser()) {
                  <p class="texte-doux">
                    Restant dû : <strong>{{ echeancier()?.totalRestant ?? 0 | fcfa }}</strong>
                  </p>
                  <mat-form-field appearance="outline" class="pleine-largeur">
                    <mat-label>Montant du remboursement (FCFA)</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      step="1"
                      [formControl]="montantRemboursement"
                    />
                    <button
                      matSuffix
                      mat-icon-button
                      type="button"
                      matTooltip="Solder le restant dû"
                      (click)="remplirRestant()"
                    >
                      <mat-icon>done_all</mat-icon>
                    </button>
                    @if (
                      montantRemboursement.hasError('required') ||
                      montantRemboursement.hasError('min')
                    ) {
                      <mat-error>Montant invalide</mat-error>
                    } @else if (
                      montantRemboursement.value &&
                      montantRemboursement.value > (echeancier()?.totalRestant ?? 0)
                    ) {
                      <mat-error>Le montant dépasse le restant dû</mat-error>
                    }
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="
                      montantRemboursement.invalid ||
                      actionEnCours() ||
                      montantRemboursement.value! > (echeancier()?.totalRestant ?? 0)
                    "
                    (click)="rembourser()"
                  >
                    <mat-icon>savings</mat-icon> Encaisser le remboursement
                  </button>
                } @else {
                  <p class="texte-doux">Le crédit est en cours de remboursement.</p>
                }
              } @else if (c.statut === 'SOLDE') {
                <div class="solde-badge">
                  <mat-icon>verified</mat-icon>
                  <div>
                    <strong>Crédit intégralement remboursé</strong>
                    <div>Dossier clôturé.</div>
                  </div>
                </div>
              }

              @if (resultat(); as r) {
                <div class="recu">
                  <mat-icon>receipt_long</mat-icon>
                  <div class="recu-contenu">
                    <strong>{{ r.reference }}</strong>
                    <div>Remboursement de {{ r.montant | fcfa }}</div>
                    <div class="detail-remboursement">
                      <span>Capital : {{ r.partCapital | fcfa }}</span>
                      <span>Intérêts : {{ r.partInteret | fcfa }}</span>
                      <span>Restant dû : {{ r.montantRestantDu | fcfa }}</span>
                    </div>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="bloc">
          <mat-card-header>
            <mat-card-title>Échéancier</mat-card-title>
            <mat-card-subtitle>
              @if (echeancier(); as e) {
                {{ e.echeances.length }} échéance(s) · total dû
                {{ e.totalCapital + e.totalInteret | fcfa }} · payé {{ e.totalPaye | fcfa }} ·
                restant {{ e.totalRestant | fcfa }}
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (echeancier(); as e) {
              @if (e.echeances.length === 0) {
                <div class="etat-vide">L'échéancier sera généré lors du décaissement.</div>
              } @else {
                <div class="table-scroll">
                  <table mat-table [dataSource]="e.echeances">
                    <ng-container matColumnDef="numero">
                      <th mat-header-cell *matHeaderCellDef>N°</th>
                      <td mat-cell *matCellDef="let echeance">{{ echeance.numero }}</td>
                    </ng-container>
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Échéance</th>
                      <td mat-cell *matCellDef="let echeance">
                        {{ echeance.dateEcheance | date: 'dd/MM/yyyy' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="capital">
                      <th mat-header-cell *matHeaderCellDef class="droite">Capital</th>
                      <td mat-cell *matCellDef="let echeance" class="droite montant">
                        {{ echeance.capitalDu | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="interet">
                      <th mat-header-cell *matHeaderCellDef class="droite">Intérêt</th>
                      <td mat-cell *matCellDef="let echeance" class="droite montant">
                        {{ echeance.interetDu | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="total">
                      <th mat-header-cell *matHeaderCellDef class="droite">Total</th>
                      <td mat-cell *matCellDef="let echeance" class="droite montant">
                        {{ totalEcheance(echeance) | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="paye">
                      <th mat-header-cell *matHeaderCellDef class="droite">Payé</th>
                      <td mat-cell *matCellDef="let echeance" class="droite montant positif">
                        {{ payeEcheance(echeance) | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="restant">
                      <th mat-header-cell *matHeaderCellDef class="droite">Restant</th>
                      <td mat-cell *matCellDef="let echeance" class="droite montant">
                        {{ restantEcheance(echeance) | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="statut">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let echeance">
                        <span [class]="classeEcheance(echeance.statut)">{{ echeance.statut }}</span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnes"></tr>
                  </table>
                </div>
              }
            } @else if (!chargement()) {
              <div class="etat-vide">Aucun échéancier disponible.</div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .entete {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .statut-entete {
        font-size: 0.85rem;
        padding: 6px 16px;
      }
      .grille {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 18px;
        align-items: start;
      }
      .bloc {
        margin-bottom: 18px;
      }
      .infos {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 14px 24px;
        margin: 8px 0 0;
      }
      .infos dt {
        color: #6b7280;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
      }
      .infos dd {
        margin: 0;
        font-weight: 500;
      }
      .texte-doux {
        color: #4b5563;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .boutons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        padding-top: 6px;
      }
      .petit {
        padding: 10px 12px;
        font-size: 0.85rem;
      }
      .rejet {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
        margin-bottom: 16px;
      }
      .attente {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #9a3412;
        margin-bottom: 16px;
      }
      .solde-badge {
        display: flex;
        gap: 10px;
        align-items: center;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 10px;
        padding: 12px 14px;
        color: #065f46;
      }
      .recu {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        padding: 12px 14px;
        margin-top: 14px;
        color: #1e40af;
      }
      .recu-contenu {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.88rem;
      }
      .detail-remboursement {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 0.78rem;
        margin-top: 4px;
      }
      .table-scroll {
        overflow-x: auto;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      @media (max-width: 980px) {
        .grille {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .entete {
          flex-wrap: wrap;
        }
        .infos {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
      }
    `,
  ],
})
export class CreditDetailPage implements OnInit {
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly api = inject(CreditApi);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  protected readonly credit = signal<Credit | null>(null);
  protected readonly echeancier = signal<Echeancier | null>(null);
  protected readonly resultat = signal<Remboursement | null>(null);
  protected readonly chargement = signal(false);
  protected readonly actionEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly montantRemboursement = this.fb.control<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);

  protected readonly colonnes = [
    'numero',
    'date',
    'capital',
    'interet',
    'total',
    'paye',
    'restant',
    'statut',
  ];

  ngOnInit(): void {
    this.charger();
  }

  protected peutStatuer(): boolean {
    return this.auth.aRole('ADMIN', 'DIRECTEUR');
  }

  protected estCreateur(): boolean {
    return this.credit()?.agentId === this.auth.utilisateur()?.id;
  }

  protected peutDecaisser(): boolean {
    return this.auth.aRole('ADMIN', 'DIRECTEUR', 'CAISSIER');
  }

  protected peutRembourser(): boolean {
    return this.auth.aRole('ADMIN', 'CAISSIER');
  }

  protected classeStatut(statut: StatutCredit): string {
    switch (statut) {
      case 'DEMANDE':
        return 'badge orange';
      case 'APPROUVE':
        return 'badge bleu';
      case 'REJETE':
        return 'badge rouge';
      case 'SOLDE':
        return 'badge vert';
      default:
        return 'badge bleu';
    }
  }

  protected classeStatutEntete(statut: StatutCredit): string {
    return `${this.classeStatut(statut)} statut-entete`;
  }

  protected classeEcheance(statut: StatutEcheance): string {
    switch (statut) {
      case 'PAYE':
        return 'badge vert';
      case 'PARTIEL':
        return 'badge orange';
      default:
        return 'badge';
    }
  }

  protected totalEcheance(echeance: Echeance): number {
    return echeance.capitalDu + echeance.interetDu;
  }

  protected payeEcheance(echeance: Echeance): number {
    return echeance.capitalPaye + echeance.interetPaye;
  }

  protected restantEcheance(echeance: Echeance): number {
    return echeance.capitalRestant + echeance.interetRestant;
  }

  protected approuver(): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: 'Approuver la demande',
          message: "Confirmer l'approbation de ce dossier de crédit ?",
          libelleConfirmer: 'Approuver',
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.executer(
            () => this.api.approuver(Number(this.id()), 'APPROUVE'),
            'Dossier approuvé',
          );
        }
      });
  }

  protected rejeter(): void {
    const data: MotifData = {
      titre: 'Rejeter la demande',
      message: 'Indiquez le motif du rejet. Il sera visible sur le dossier.',
      libelleConfirmer: 'Rejeter le dossier',
    };
    this.dialog
      .open(MotifDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((motif) => {
        if (typeof motif === 'string' && motif.trim()) {
          this.executer(
            () => this.api.approuver(Number(this.id()), 'REJETE', motif),
            'Dossier rejeté',
          );
        }
      });
  }

  protected decaisser(): void {
    const credit = this.credit();
    if (!credit) {
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: 'Décaisser le crédit',
          message: `Créditer le compte ${credit.compteNumero} de ${this.formater(credit.montantDemande)} et générer l'échéancier ?`,
          libelleConfirmer: 'Décaisser',
        },
        width: '480px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.executer(() => this.api.decaisser(Number(this.id())), 'Crédit décaissé');
        }
      });
  }

  protected remplirRestant(): void {
    this.montantRemboursement.setValue(this.echeancier()?.totalRestant ?? 0);
  }

  protected rembourser(): void {
    const montant = this.montantRemboursement.value;
    if (this.montantRemboursement.invalid || montant == null) {
      this.montantRemboursement.markAsTouched();
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: 'Encaisser un remboursement',
          message: `Encaisser ${this.formater(montant)} sur le compte du client ?`,
          libelleConfirmer: 'Encaisser',
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.actionEnCours.set(true);
          this.erreur.set(null);
          this.api.rembourser(Number(this.id()), Math.trunc(montant)).subscribe({
            next: (resultat) => {
              this.resultat.set(resultat);
              this.snack.open(`Remboursement ${resultat.reference} enregistré`, 'Fermer', {
                duration: 3500,
              });
              this.montantRemboursement.reset();
              this.actionEnCours.set(false);
              this.charger();
            },
            error: (err) => {
              this.erreur.set(messageErreur(err));
              this.actionEnCours.set(false);
            },
          });
        }
      });
  }

  private executer(action: () => Observable<Credit>, message: string): void {
    this.actionEnCours.set(true);
    this.erreur.set(null);
    action().subscribe({
      next: (credit) => {
        this.credit.set(credit);
        this.snack.open(message, 'Fermer', { duration: 3500 });
        this.actionEnCours.set(false);
        this.chargerEcheancier();
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.actionEnCours.set(false);
      },
    });
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.obtenir(Number(this.id())).subscribe({
      next: (credit) => {
        this.credit.set(credit);
        this.chargement.set(false);
        this.chargerEcheancier();
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargement.set(false);
      },
    });
  }

  private chargerEcheancier(): void {
    this.api.echeancier(Number(this.id())).subscribe({
      next: (echeancier) => this.echeancier.set(echeancier),
      error: () => this.echeancier.set(null),
    });
  }

  private formater(montant: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
  }
}
