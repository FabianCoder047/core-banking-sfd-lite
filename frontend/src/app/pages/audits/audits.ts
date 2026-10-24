import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { messageErreur } from '../../core/error.util';
import { AuditEvenement, PageResponse } from '../../core/models';
import { AuditApi } from '../../core/services/audit-api';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-audits',
  standalone: true,
  imports: [DatePipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Audits</h1>
          <div class="sous-titre">Historique des accès et des actions effectuées dans l’application</div>
        </div>
        <button mat-stroked-button (click)="charger(page(), taille())" [disabled]="chargement()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      <mat-card>
        <mat-card-content>
          @if (chargement()) {
            <mat-progress-bar mode="indeterminate" />
          }
          <div class="table-scroll">
            <table mat-table [dataSource]="evenements()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let evenement">
                  {{ evenement.creeLe | date: 'dd/MM/yyyy HH:mm:ss' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="categorie">
                <th mat-header-cell *matHeaderCellDef>Catégorie</th>
                <td mat-cell *matCellDef="let evenement">
                  <span [class]="evenement.categorie === 'SECURITE' ? 'badge bleu' : 'badge vert'">
                    {{ evenement.categorie === 'SECURITE' ? 'Sécurité' : 'Métier' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="acteur">
                <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
                <td mat-cell *matCellDef="let evenement">
                  <strong>{{ evenement.acteurEmail || 'Anonyme' }}</strong>
                  @if (evenement.acteurRole) {
                    <small>{{ evenement.acteurRole }}</small>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Action</th>
                <td mat-cell *matCellDef="let evenement">{{ evenement.action }}</td>
              </ng-container>
              <ng-container matColumnDef="requete">
                <th mat-header-cell *matHeaderCellDef>Requête</th>
                <td mat-cell *matCellDef="let evenement">
                  <code>{{ evenement.methode }} {{ evenement.chemin }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="resultat">
                <th mat-header-cell *matHeaderCellDef>Résultat</th>
                <td mat-cell *matCellDef="let evenement">{{ evenement.statutHttp }}</td>
              </ng-container>
              <ng-container matColumnDef="agence">
                <th mat-header-cell *matHeaderCellDef>Agence</th>
                <td mat-cell *matCellDef="let evenement">{{ evenement.agenceId ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="ip">
                <th mat-header-cell *matHeaderCellDef>Adresse IP</th>
                <td mat-cell *matCellDef="let evenement">{{ evenement.adresseIp || '—' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
              <tr mat-row *matRowDef="let row; columns: colonnes"></tr>
              <tr class="mat-mdc-row" *matNoDataRow>
                <td class="mat-mdc-cell vide" [attr.colspan]="colonnes.length">
                  Aucun événement d’audit pour le moment.
                </td>
              </tr>
            </table>
          </div>
          <mat-paginator
            [length]="total()"
            [pageIndex]="page()"
            [pageSize]="taille()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="changerPage($event)"
            aria-label="Pagination des audits"
          />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 24px;
      }
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }
      h1 {
        margin: 0 0 4px;
      }
      .sous-titre {
        color: #64748b;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        min-width: 960px;
      }
      small {
        display: block;
        color: #64748b;
      }
      .vide {
        text-align: center;
        padding: 28px;
        color: #64748b;
      }
      @media (max-width: 600px) {
        .page {
          padding: 16px;
        }
      }
    `,
  ],
})
export class AuditsPage implements OnInit {
  private readonly api = inject(AuditApi);
  protected readonly evenements = signal<AuditEvenement[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly taille = signal(25);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly colonnes = [
    'date',
    'categorie',
    'acteur',
    'action',
    'requete',
    'resultat',
    'agence',
    'ip',
  ];

  ngOnInit(): void {
    this.charger();
  }

  protected changerPage(event: PageEvent): void {
    this.charger(event.pageIndex, event.pageSize);
  }

  protected charger(page = this.page(), taille = this.taille()): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.lister(page, taille).subscribe({
      next: (reponse: PageResponse<AuditEvenement>) => {
        this.evenements.set(reponse.contenu);
        this.total.set(reponse.total);
        this.page.set(reponse.page);
        this.taille.set(reponse.taille);
        this.chargement.set(false);
      },
      error: (error: unknown) => {
        this.erreur.set(messageErreur(error, 'Impossible de charger les audits.'));
        this.chargement.set(false);
      },
    });
  }
}
