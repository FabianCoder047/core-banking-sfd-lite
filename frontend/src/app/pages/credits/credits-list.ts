import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import { Agence, Credit, PageResponse, StatutCredit } from '../../core/models';
import { AdminApi } from '../../core/services/admin-api';
import { CreditApi } from '../../core/services/credit-api';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-credits-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Crédits</h1>
          <div class="sous-titre">Suivi des demandes, décaissements et remboursements</div>
        </div>
        @if (peutDemander()) {
          <a mat-flat-button color="primary" routerLink="/credits/nouveau">
            <mat-icon>add</mat-icon> Nouvelle demande
          </a>
        }
      </div>

      @if (clientId(); as identifiant) {
        <div class="filtre-client">
          <mat-icon>person</mat-icon>
          Dossiers du client #{{ identifiant }}
          <button mat-button (click)="retirerFiltreClient()">Retirer le filtre</button>
        </div>
      }

      <mat-card>
        <mat-card-content>
          <div class="filtres">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Statut</mat-label>
              <mat-select [formControl]="statut" (selectionChange)="recharger()">
                <mat-option [value]="null">Tous les statuts</mat-option>
                <mat-option value="DEMANDE">Demande</mat-option>
                <mat-option value="APPROUVE">Approuvé</mat-option>
                <mat-option value="REJETE">Rejeté</mat-option>
                <mat-option value="DECAISSE">Décaissé</mat-option>
                <mat-option value="SOLDE">Soldé</mat-option>
              </mat-select>
            </mat-form-field>

            @if (auth.estGlobal()) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Agence</mat-label>
                <mat-select [formControl]="agenceId" (selectionChange)="recharger()">
                  <mat-option [value]="null">Toutes les agences</mat-option>
                  @for (agence of agences(); track agence.id) {
                    <mat-option [value]="agence.id"
                      >{{ agence.code }} — {{ agence.nom }}</mat-option
                    >
                  }
                </mat-select>
              </mat-form-field>
            }
            <span class="total">{{ page()?.total ?? 0 }} dossier(s)</span>
          </div>

          @if (erreur(); as message) {
            <div class="encart negatif">{{ message }}</div>
          }
          @if (chargement()) {
            <mat-progress-bar mode="indeterminate" />
          }

          <div class="table-scroll">
            <table mat-table [dataSource]="page()?.contenu ?? []">
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>Dossier</th>
                <td mat-cell *matCellDef="let credit">
                  <strong>{{ credit.numero }}</strong>
                </td>
              </ng-container>
              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let credit">
                  {{ credit.clientNomComplet }}
                  <div class="sous-texte">{{ credit.agenceCode }}</div>
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
                    matTooltip="Ouvrir le dossier"
                  >
                    <mat-icon>visibility</mat-icon>
                  </a>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
              <tr mat-row *matRowDef="let row; columns: colonnes"></tr>
            </table>
          </div>

          @if (!chargement() && (page()?.contenu?.length ?? 0) === 0) {
            <div class="etat-vide">Aucun dossier ne correspond à ces critères.</div>
          }

          <mat-paginator
            [length]="page()?.total ?? 0"
            [pageSize]="taille"
            [pageIndex]="page()?.page ?? 0"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="changerPage($event)"
          />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .total {
        color: #6b7280;
        font-size: 0.85rem;
        margin-left: auto;
      }
      .sous-texte {
        color: #6b7280;
        font-size: 0.78rem;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      .filtre-client {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #eff6ff;
        color: #1e40af;
        border-radius: 10px;
        padding: 8px 14px;
        margin-bottom: 14px;
      }
      @media (max-width: 600px) {
        .filtre-client {
          flex-wrap: wrap;
        }
        .total {
          width: 100%;
          margin-left: 0;
        }
      }
    `,
  ],
})
export class CreditsListPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(CreditApi);
  private readonly adminApi = inject(AdminApi);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly page = signal<PageResponse<Credit> | null>(null);
  protected readonly agences = signal<Agence[]>([]);
  protected readonly clientId = signal<number | null>(null);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly statut = this.fb.control<StatutCredit | null>(null);
  protected readonly agenceId = this.fb.control<number | null>(null);

  protected readonly colonnes = [
    'numero',
    'client',
    'produit',
    'montant',
    'duree',
    'statut',
    'date',
    'actions',
  ];
  protected taille = 20;
  protected index = 0;

  ngOnInit(): void {
    const client = Number(this.route.snapshot.queryParamMap.get('clientId'));
    if (client > 0) {
      this.clientId.set(client);
    }
    if (this.auth.estGlobal()) {
      this.adminApi.agences().subscribe({ next: (liste) => this.agences.set(liste) });
    }
    this.charger();
  }

  protected peutDemander(): boolean {
    return this.auth.aRole('ADMIN', 'AGENT_CREDIT');
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

  protected recharger(): void {
    this.index = 0;
    this.charger();
  }

  protected retirerFiltreClient(): void {
    this.clientId.set(null);
    this.recharger();
  }

  protected changerPage(evenement: PageEvent): void {
    this.index = evenement.pageIndex;
    this.taille = evenement.pageSize;
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api
      .lister({
        statut: this.statut.value,
        clientId: this.clientId(),
        agenceId: this.agenceId.value,
        page: this.index,
        taille: this.taille,
      })
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.chargement.set(false);
        },
        error: (err) => {
          this.erreur.set(messageErreur(err));
          this.chargement.set(false);
        },
      });
  }
}
