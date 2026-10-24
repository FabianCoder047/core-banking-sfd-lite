import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import { Credit, PageResponse } from '../../core/models';
import { CreditApi } from '../../core/services/credit-api';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MotifData, MotifDialog } from '../../shared/motif-dialog';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-approbations',
  standalone: true,
  imports: [RouterLink, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Approbations</h1>
          <div class="sous-titre">Demandes de crédit en attente de décision</div>
        </div>
        <span class="badge bleu">{{ page()?.total ?? 0 }} en attente</span>
      </div>

      <div class="encart info">
        <mat-icon>shield</mat-icon>
        <div>
          <strong>Séparation des tâches</strong>
          <div>L'agent qui a créé une demande ne peut pas l'approuver lui-même.</div>
        </div>
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
              <ng-container matColumnDef="agent">
                <th mat-header-cell *matHeaderCellDef>Agent</th>
                <td mat-cell *matCellDef="let credit">{{ credit.agentNomComplet }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Demandé le</th>
                <td mat-cell *matCellDef="let credit">
                  {{ credit.dateDemande | date: 'dd/MM/yyyy' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="droite">Décision</th>
                <td mat-cell *matCellDef="let credit" class="droite">
                  <div class="actions">
                    <a
                      mat-icon-button
                      [routerLink]="['/credits', credit.id]"
                      matTooltip="Examiner le dossier"
                    >
                      <mat-icon>visibility</mat-icon>
                    </a>
                    @if (credit.agentId === utilisateurId()) {
                      <span class="badge" matTooltip="Vous avez créé cette demande"
                        >séparation</span
                      >
                    } @else {
                      <button
                        mat-icon-button
                        color="primary"
                        matTooltip="Approuver"
                        [disabled]="enCours() !== null"
                        (click)="approuver(credit)"
                      >
                        <mat-icon>check_circle</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        matTooltip="Rejeter"
                        [disabled]="enCours() !== null"
                        (click)="rejeter(credit)"
                      >
                        <mat-icon>cancel</mat-icon>
                      </button>
                    }
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
              <tr mat-row *matRowDef="let row; columns: colonnes"></tr>
            </table>
          </div>

          @if (!chargement() && (page()?.contenu?.length ?? 0) === 0) {
            <div class="etat-vide">Aucune demande en attente d'approbation.</div>
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
      .info {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1e40af;
        margin-bottom: 16px;
        padding: 12px 16px;
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
    `,
  ],
})
export class ApprobationsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(CreditApi);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly page = signal<PageResponse<Credit> | null>(null);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal<number | null>(null);
  protected readonly utilisateurId = signal<number | null>(this.auth.utilisateur()?.id ?? null);

  protected readonly colonnes = [
    'numero',
    'client',
    'produit',
    'montant',
    'duree',
    'agent',
    'date',
    'actions',
  ];
  protected taille = 20;
  protected index = 0;

  ngOnInit(): void {
    this.charger();
  }

  protected changerPage(evenement: PageEvent): void {
    this.index = evenement.pageIndex;
    this.taille = evenement.pageSize;
    this.charger();
  }

  protected approuver(credit: Credit): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: 'Approuver la demande',
          message: `Approuver le dossier ${credit.numero} de ${credit.clientNomComplet} pour ${this.formater(credit.montantDemande)} ?`,
          libelleConfirmer: 'Approuver',
        },
        width: '480px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.executer(
            credit,
            () => this.api.approuver(credit.id, 'APPROUVE'),
            'Demande approuvée',
          );
        }
      });
  }

  protected rejeter(credit: Credit): void {
    const data: MotifData = {
      titre: 'Rejeter la demande',
      message: `Rejeter le dossier ${credit.numero} de ${credit.clientNomComplet} ?`,
      libelleConfirmer: 'Rejeter',
    };
    this.dialog
      .open(MotifDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((motif) => {
        if (typeof motif === 'string' && motif.trim()) {
          this.executer(
            credit,
            () => this.api.approuver(credit.id, 'REJETE', motif),
            'Demande rejetée',
          );
        }
      });
  }

  private executer(credit: Credit, action: () => Observable<Credit>, message: string): void {
    this.enCours.set(credit.id);
    this.erreur.set(null);
    action().subscribe({
      next: () => {
        this.snack.open(message, 'Fermer', { duration: 3500 });
        this.enCours.set(null);
        this.charger();
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.enCours.set(null);
      },
    });
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.lister({ statut: 'DEMANDE', page: this.index, taille: this.taille }).subscribe({
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

  private formater(montant: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
  }
}
