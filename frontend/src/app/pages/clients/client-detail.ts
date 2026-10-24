import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import {
  ClientFiche,
  CompteEpargne,
  Operation,
  PageResponse,
  StatutCredit,
  TypeOperation,
} from '../../core/models';
import { ClientApi } from '../../core/services/client-api';
import { EpargneApi } from '../../core/services/epargne-api';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="entete">
          <a mat-icon-button routerLink="/clients" matTooltip="Retour aux clients">
            <mat-icon>arrow_back</mat-icon>
          </a>
          @if (fiche()?.client; as client) {
            <div>
              <h1>{{ client.prenom }} {{ client.nom }}</h1>
              <div class="sous-titre">
                {{ client.numero }} · Agence {{ client.agenceCode }} ·
                <span class="badge" [class.vert]="client.statut === 'ACTIF'">{{
                  client.statut
                }}</span>
              </div>
            </div>
          } @else {
            <h1>Fiche client</h1>
          }
        </div>
        <div class="actions">
          @if (peutOuvrirCompte()) {
            <button mat-stroked-button (click)="ouvrirCompte()" [disabled]="actionEnCours()">
              <mat-icon>add_card</mat-icon> Ouvrir un compte
            </button>
          }
          @if (peutDemanderCredit()) {
            <a
              mat-flat-button
              color="primary"
              routerLink="/credits/nouveau"
              [queryParams]="{ clientId: id() }"
            >
              <mat-icon>request_quote</mat-icon> Nouvelle demande
            </a>
          }
        </div>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }
      @if (chargement()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (fiche(); as f) {
        <mat-card class="bloc">
          <mat-card-header>
            <mat-card-title>Informations du client</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <dl class="infos">
              <div>
                <dt>Téléphone</dt>
                <dd>{{ f.client.telephone || '—' }}</dd>
              </div>
              <div>
                <dt>Date de naissance</dt>
                <dd>{{ f.client.dateNaissance | date: 'dd/MM/yyyy' }}</dd>
              </div>
              <div>
                <dt>Sexe</dt>
                <dd>{{ libelleSexe(f.client.sexe) }}</dd>
              </div>
              <div>
                <dt>Profession</dt>
                <dd>{{ f.client.profession || '—' }}</dd>
              </div>
              <div>
                <dt>Pièce d'identité</dt>
                <dd>{{ f.client.numeroPiece || '—' }}</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>{{ f.client.adresse || '—' }}</dd>
              </div>
              <div>
                <dt>Client depuis</dt>
                <dd>{{ f.client.creeLe | date: 'dd/MM/yyyy' }}</dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card class="bloc">
          <mat-card-header>
            <mat-card-title>Comptes d'épargne</mat-card-title>
            <mat-card-subtitle>{{ f.comptes.length }} compte(s)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (f.comptes.length === 0) {
              <div class="etat-vide">
                Aucun compte d'épargne.
                @if (peutOuvrirCompte()) {
                  <button mat-button color="primary" (click)="ouvrirCompte()">
                    Ouvrir le premier compte
                  </button>
                }
              </div>
            } @else {
              <div class="table-scroll">
                <table mat-table [dataSource]="f.comptes">
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>Compte</th>
                    <td mat-cell *matCellDef="let compte">
                      <strong>{{ compte.numero }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="solde">
                    <th mat-header-cell *matHeaderCellDef class="droite">Solde</th>
                    <td mat-cell *matCellDef="let compte" class="droite montant">
                      {{ compte.solde | fcfa }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="statut">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let compte">
                      <span
                        class="badge"
                        [class.vert]="compte.statut === 'ACTIF'"
                        [class.rouge]="compte.statut === 'CLOTURE'"
                      >
                        {{ compte.statut }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="ouvertLe">
                    <th mat-header-cell *matHeaderCellDef>Ouvert le</th>
                    <td mat-cell *matCellDef="let compte">
                      {{ compte.ouvertLe | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="droite">Actions</th>
                    <td mat-cell *matCellDef="let compte" class="droite actions">
                      <button
                        mat-stroked-button
                        (click)="afficherReleve(compte)"
                        [disabled]="compte.statut !== 'ACTIF'"
                      >
                        <mat-icon>receipt_long</mat-icon> Relevé
                      </button>
                      @if (peutOpererCaisse()) {
                        <a
                          mat-stroked-button
                          [routerLink]="['/caisse']"
                          [queryParams]="{ compte: compte.id }"
                        >
                          <mat-icon>point_of_sale</mat-icon> Caisse
                        </a>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesComptes"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesComptes"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="bloc">
          <mat-card-header>
            <mat-card-title>Crédits</mat-card-title>
            <mat-card-subtitle>{{ f.credits.length }} dossier(s)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (f.credits.length === 0) {
              <div class="etat-vide">Aucun crédit pour ce client.</div>
            } @else {
              <div class="table-scroll">
                <table mat-table [dataSource]="f.credits">
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>Dossier</th>
                    <td mat-cell *matCellDef="let credit">
                      <strong>{{ credit.numero }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="produit">
                    <th mat-header-cell *matHeaderCellDef>Produit</th>
                    <td mat-cell *matCellDef="let credit">{{ credit.produitLibelle }}</td>
                  </ng-container>
                  <ng-container matColumnDef="montant">
                    <th mat-header-cell *matHeaderCellDef class="droite">Montant</th>
                    <td mat-cell *matCellDef="let credit" class="droite montant">
                      {{ credit.montantDemande | fcfa }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="duree">
                    <th mat-header-cell *matHeaderCellDef>Durée</th>
                    <td mat-cell *matCellDef="let credit">{{ credit.dureeMois }} mois</td>
                  </ng-container>
                  <ng-container matColumnDef="statut">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let credit">
                      <span [class]="classeStatut(credit.statut)">{{ credit.statut }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Demandé le</th>
                    <td mat-cell *matCellDef="let credit">
                      {{ credit.dateDemande | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let credit" class="actions">
                      <a
                        mat-icon-button
                        [routerLink]="['/credits', credit.id]"
                        matTooltip="Voir le dossier"
                      >
                        <mat-icon>visibility</mat-icon>
                      </a>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesCredits"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesCredits"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      @if (compteSelectionne(); as compte) {
        <mat-card class="bloc releve">
          <mat-card-header>
            <mat-card-title>Relevé — {{ compte.numero }}</mat-card-title>
            <mat-card-subtitle>Solde actuel : {{ compte.solde | fcfa }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (chargementReleve()) {
              <mat-progress-bar mode="indeterminate" />
            }
            @if (releve(); as page) {
              @if (page.contenu.length === 0) {
                <div class="etat-vide">Aucune opération sur ce compte.</div>
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
                        <span [class]="classeOperation(operation.type)">{{ operation.type }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="montant">
                      <th mat-header-cell *matHeaderCellDef class="droite">Montant</th>
                      <td
                        mat-cell
                        *matCellDef="let operation"
                        class="droite montant"
                        [class.positif]="estCreditOperation(operation.type)"
                        [class.negatif]="!estCreditOperation(operation.type)"
                      >
                        {{ estCreditOperation(operation.type) ? '+' : '−' }}
                        {{ operation.montant | fcfa }}
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnesReleve"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnesReleve"></tr>
                  </table>
                </div>
                <mat-paginator
                  [length]="page.total"
                  [pageSize]="tailleReleve"
                  [pageIndex]="page.page"
                  [pageSizeOptions]="[10, 20, 50]"
                  (page)="changerPageReleve($event)"
                />
              }
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
      .bloc {
        margin-bottom: 18px;
      }
      .infos {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px 24px;
        margin: 8px 0 0;
      }
      .infos dt {
        color: #6b7280;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
      }
      .infos dd {
        margin: 0;
        font-weight: 500;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      .releve {
        border-top: 3px solid #1d4ed8;
      }
      td.actions {
        justify-content: flex-end;
      }
      @media (max-width: 600px) {
        .entete {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class ClientDetailPage implements OnInit {
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly api = inject(ClientApi);
  private readonly epargneApi = inject(EpargneApi);
  private readonly snack = inject(MatSnackBar);

  protected readonly fiche = signal<ClientFiche | null>(null);
  protected readonly chargement = signal(false);
  protected readonly actionEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly compteSelectionne = signal<CompteEpargne | null>(null);
  protected readonly releve = signal<PageResponse<Operation> | null>(null);
  protected readonly chargementReleve = signal(false);

  protected readonly colonnesComptes = ['numero', 'solde', 'statut', 'ouvertLe', 'actions'];
  protected readonly colonnesCredits = [
    'numero',
    'produit',
    'montant',
    'duree',
    'statut',
    'date',
    'actions',
  ];
  protected readonly colonnesReleve = ['date', 'reference', 'type', 'montant'];
  protected tailleReleve = 20;

  ngOnInit(): void {
    this.charger();
  }

  protected peutOuvrirCompte(): boolean {
    return this.auth.aRole('ADMIN', 'DIRECTEUR', 'AGENT_CREDIT', 'CAISSIER');
  }

  protected peutDemanderCredit(): boolean {
    return this.auth.aRole('ADMIN', 'AGENT_CREDIT');
  }

  protected peutOpererCaisse(): boolean {
    return this.auth.aRole('ADMIN', 'CAISSIER');
  }

  protected libelleSexe(sexe?: string): string {
    if (sexe === 'M') {
      return 'Masculin';
    }
    if (sexe === 'F') {
      return 'Féminin';
    }
    return '—';
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

  protected classeOperation(type: TypeOperation): string {
    switch (type) {
      case 'DEPOT':
      case 'REMBOURSEMENT':
        return 'badge vert';
      case 'RETRAIT':
        return 'badge rouge';
      case 'FRAIS_DOSSIER':
        return 'badge orange';
      default:
        return 'badge bleu';
    }
  }

  protected estCreditOperation(type: TypeOperation): boolean {
    return type === 'DEPOT' || type === 'DECAISSEMENT';
  }

  protected ouvrirCompte(): void {
    if (this.actionEnCours()) {
      return;
    }
    this.actionEnCours.set(true);
    this.erreur.set(null);
    this.api.ouvrirCompte(Number(this.id())).subscribe({
      next: (compte) => {
        this.snack.open(`Compte ${compte.numero} ouvert`, 'Fermer', { duration: 3500 });
        this.actionEnCours.set(false);
        this.charger();
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.actionEnCours.set(false);
      },
    });
  }

  protected afficherReleve(compte: CompteEpargne): void {
    this.compteSelectionne.set(compte);
    this.chargerReleve(0, this.tailleReleve);
  }

  protected changerPageReleve(evenement: PageEvent): void {
    this.tailleReleve = evenement.pageSize;
    this.chargerReleve(evenement.pageIndex, evenement.pageSize);
  }

  private chargerReleve(page: number, taille: number): void {
    const compte = this.compteSelectionne();
    if (!compte) {
      return;
    }
    this.chargementReleve.set(true);
    this.epargneApi.releve(compte.id, page, taille).subscribe({
      next: (releve) => {
        this.releve.set(releve);
        this.chargementReleve.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementReleve.set(false);
      },
    });
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.fiche(Number(this.id())).subscribe({
      next: (fiche) => {
        this.fiche.set(fiche);
        this.chargement.set(false);
        const selection = this.compteSelectionne();
        if (selection) {
          const actualise = fiche.comptes.find((compte) => compte.id === selection.id);
          if (actualise) {
            this.compteSelectionne.set(actualise);
          }
        }
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargement.set(false);
      },
    });
  }
}
