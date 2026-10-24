import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import {
  Agence,
  Balance,
  BalanceLigne,
  CompteComptable,
  Ecriture,
  GrandLivre,
  GrandLivreLigne,
  TypeCompte,
} from '../../core/models';
import { AdminApi } from '../../core/services/admin-api';
import { ComptaApi } from '../../core/services/compta-api';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Comptabilité</h1>
          <div class="sous-titre">Balance et grand livre — écritures en partie double</div>
        </div>
        <button mat-stroked-button (click)="exporterCsv()" [disabled]="!peutExporter()">
          <mat-icon>download</mat-icon> Exporter CSV
        </button>
      </div>

      <mat-card class="filtres-carte">
        <mat-card-content>
          <div class="filtres">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Du</mat-label>
              <input matInput type="date" [formControl]="du" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Au</mat-label>
              <input matInput type="date" [formControl]="au" />
            </mat-form-field>
            @if (auth.estGlobal()) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Agence</mat-label>
                <mat-select [formControl]="agenceId">
                  <mat-option [value]="null">Toutes les agences</mat-option>
                  @for (agence of agences(); track agence.id) {
                    <mat-option [value]="agence.id"
                      >{{ agence.code }} — {{ agence.nom }}</mat-option
                    >
                  }
                </mat-select>
              </mat-form-field>
            }
            <button
              mat-flat-button
              color="primary"
              (click)="actualiser()"
              [disabled]="chargement()"
            >
              <mat-icon>refresh</mat-icon> Actualiser
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      <mat-tab-group
        class="onglets"
        [selectedIndex]="onglet()"
        (selectedIndexChange)="changerOnglet($event)"
        animationDuration="150ms"
      >
        <mat-tab label="Balance">
          @if (balance(); as b) {
            <div class="grille-cartes resume">
              <mat-card class="carte-stat">
                <span class="libelle">Total débits</span>
                <span class="valeur">{{ b.totalDebit | fcfa }}</span>
              </mat-card>
              <mat-card class="carte-stat">
                <span class="libelle">Total crédits</span>
                <span class="valeur">{{ b.totalCredit | fcfa }}</span>
              </mat-card>
              <mat-card class="carte-stat">
                <span class="libelle">Période</span>
                <span class="valeur petite"
                  >{{ b.du | date: 'dd/MM/yyyy' }} → {{ b.au | date: 'dd/MM/yyyy' }}</span
                >
              </mat-card>
              <mat-card class="carte-stat">
                <span class="libelle">Équilibre</span>
                <span class="valeur">
                  <span [class]="b.equilibree ? 'badge vert' : 'badge rouge'">
                    {{ b.equilibree ? 'Équilibrée' : 'Déséquilibrée' }}
                  </span>
                </span>
              </mat-card>
            </div>

            <mat-card>
              <mat-card-content>
                @if (chargement()) {
                  <mat-progress-bar mode="indeterminate" />
                }
                <div class="table-scroll">
                  <table mat-table [dataSource]="b.lignes">
                    <ng-container matColumnDef="numero">
                      <th mat-header-cell *matHeaderCellDef>Compte</th>
                      <td mat-cell *matCellDef="let ligne">
                        <strong>{{ ligne.numero }}</strong>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="libelle">
                      <th mat-header-cell *matHeaderCellDef>Libellé</th>
                      <td mat-cell *matCellDef="let ligne">{{ ligne.libelle }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let ligne">
                        <span [class]="classeType(ligne.type)">{{ ligne.type }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="debit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Débit</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.totalDebit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="credit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Crédit</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.totalCredit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="soldeDebit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Solde débiteur</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.soldeDebit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="soldeCredit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Solde créditeur</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.soldeCredit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let ligne" class="actions">
                        <button
                          mat-icon-button
                          matTooltip="Voir le grand livre"
                          (click)="ouvrirGrandLivre(ligne)"
                        >
                          <mat-icon>menu_book</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnesBalance"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnesBalance"></tr>
                  </table>
                </div>
                @if ((balance()?.lignes?.length ?? 0) === 0) {
                  <div class="etat-vide">Aucun mouvement sur la période.</div>
                }
                <div class="totaux">
                  <span>Totaux</span>
                  <span class="montant">{{ b.totalDebit | fcfa }}</span>
                  <span class="montant">{{ b.totalCredit | fcfa }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </mat-tab>

        <mat-tab label="Grand livre">
          <mat-card class="filtre-grand-livre">
            <mat-card-content>
              <div class="filtres">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="compte-select"
                >
                  <mat-label>Compte comptable</mat-label>
                  <mat-select [formControl]="compte">
                    @for (c of comptes(); track c.id) {
                      <mat-option [value]="c.numero">{{ c.numero }} — {{ c.libelle }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button
                  mat-flat-button
                  color="primary"
                  (click)="chargerGrandLivre()"
                  [disabled]="!compte.value"
                >
                  <mat-icon>search</mat-icon> Afficher
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          @if (grandLivre(); as gl) {
            <mat-card>
              <mat-card-header>
                <mat-card-title>{{ gl.compte }} — {{ gl.libelle }}</mat-card-title>
                <mat-card-subtitle>
                  {{ gl.du | date: 'dd/MM/yyyy' }} → {{ gl.au | date: 'dd/MM/yyyy' }} · solde
                  <strong>{{ gl.solde | fcfa }}</strong>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (chargement()) {
                  <mat-progress-bar mode="indeterminate" />
                }
                <div class="table-scroll">
                  <table mat-table [dataSource]="gl.lignes">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let ligne">
                        {{ ligne.dateComptable | date: 'dd/MM/yyyy' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="journal">
                      <th mat-header-cell *matHeaderCellDef>Journal</th>
                      <td mat-cell *matCellDef="let ligne">{{ ligne.journal }}</td>
                    </ng-container>
                    <ng-container matColumnDef="libelle">
                      <th mat-header-cell *matHeaderCellDef>Libellé</th>
                      <td mat-cell *matCellDef="let ligne">{{ ligne.libelle }}</td>
                    </ng-container>
                    <ng-container matColumnDef="sens">
                      <th mat-header-cell *matHeaderCellDef>Sens</th>
                      <td mat-cell *matCellDef="let ligne">
                        <span [class]="ligne.sens === 'D' ? 'badge bleu' : 'badge vert'">{{
                          ligne.sens
                        }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="debit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Débit</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.debit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="credit">
                      <th mat-header-cell *matHeaderCellDef class="droite">Crédit</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.credit | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="solde">
                      <th mat-header-cell *matHeaderCellDef class="droite">Solde progressif</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.soldeProgressif | fcfa }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let ligne" class="actions">
                        <button
                          mat-icon-button
                          matTooltip="Détail de l'écriture"
                          (click)="ouvrirEcriture(ligne)"
                        >
                          <mat-icon>receipt_long</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnesGrandLivre"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnesGrandLivre"></tr>
                  </table>
                </div>
                @if (gl.lignes.length === 0) {
                  <div class="etat-vide">Aucun mouvement sur ce compte pour la période.</div>
                }
                <div class="totaux">
                  <span>Totaux</span>
                  <span class="montant">{{ gl.totalDebit | fcfa }}</span>
                  <span class="montant">{{ gl.totalCredit | fcfa }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <div class="encart etat-vide">Choisissez un compte pour afficher son grand livre.</div>
          }

          @if (ecriture(); as e) {
            <mat-card class="detail-ecriture">
              <mat-card-header>
                <mat-card-title>
                  Écriture #{{ e.id }}
                  @if (e.extourneDe) {
                    <span class="badge orange">Extourne de #{{ e.extourneDe }}</span>
                  }
                </mat-card-title>
                <mat-card-subtitle>
                  {{ e.dateComptable | date: 'dd/MM/yyyy' }} · {{ e.journal }} · {{ e.libelle }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="table-scroll">
                  <table mat-table [dataSource]="e.lignes">
                    <ng-container matColumnDef="compte">
                      <th mat-header-cell *matHeaderCellDef>Compte</th>
                      <td mat-cell *matCellDef="let ligne">
                        <strong>{{ ligne.compteNumero }}</strong>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="libelle">
                      <th mat-header-cell *matHeaderCellDef>Libellé</th>
                      <td mat-cell *matCellDef="let ligne">{{ ligne.compteLibelle }}</td>
                    </ng-container>
                    <ng-container matColumnDef="sens">
                      <th mat-header-cell *matHeaderCellDef>Sens</th>
                      <td mat-cell *matCellDef="let ligne">
                        <span [class]="ligne.sens === 'D' ? 'badge bleu' : 'badge vert'">{{
                          ligne.sens
                        }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="montant">
                      <th mat-header-cell *matHeaderCellDef class="droite">Montant</th>
                      <td mat-cell *matCellDef="let ligne" class="droite montant">
                        {{ ligne.montant | fcfa }}
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="colonnesEcriture"></tr>
                    <tr mat-row *matRowDef="let row; columns: colonnesEcriture"></tr>
                  </table>
                </div>

                <div class="actions detail-actions">
                  <button mat-button (click)="fermerEcriture()">Fermer</button>
                  @if (peutExtourner() && !e.extourneDe) {
                    <button mat-stroked-button color="warn" (click)="extourner(e)">
                      <mat-icon>undo</mat-icon> Extourner l'écriture
                    </button>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .filtres-carte {
        margin-bottom: 16px;
      }
      .filtres-carte .filtres {
        margin-bottom: 0;
      }
      .onglets {
        background: transparent;
      }
      .resume {
        margin-bottom: 16px;
      }
      .resume .valeur.petite {
        font-size: 1rem;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      .table-scroll {
        overflow-x: auto;
      }
      .totaux {
        display: flex;
        justify-content: flex-end;
        gap: 40px;
        padding: 12px 16px 4px;
        border-top: 1px solid #e5e7eb;
        font-weight: 600;
      }
      .filtre-grand-livre {
        margin: 16px 0;
      }
      .filtre-grand-livre .filtres {
        margin-bottom: 0;
      }
      .compte-select {
        min-width: 320px;
      }
      .detail-ecriture {
        margin-top: 18px;
        border-left: 4px solid #1d4ed8;
      }
      .detail-ecriture mat-card-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .detail-actions {
        justify-content: flex-end;
        margin-top: 12px;
      }
      @media (max-width: 600px) {
        .totaux {
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px;
        }
        .compte-select {
          width: 100%;
          min-width: 0;
        }
      }
    `,
  ],
})
export class ComptabilitePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ComptaApi);
  private readonly adminApi = inject(AdminApi);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly du = this.fb.nonNullable.control(this.premierJourDuMois());
  protected readonly au = this.fb.nonNullable.control(this.aujourdhui());
  protected readonly agenceId = this.fb.control<number | null>(null);
  protected readonly compte = this.fb.control<string | null>(null);

  protected readonly balance = signal<Balance | null>(null);
  protected readonly grandLivre = signal<GrandLivre | null>(null);
  protected readonly comptes = signal<CompteComptable[]>([]);
  protected readonly agences = signal<Agence[]>([]);
  protected readonly ecriture = signal<Ecriture | null>(null);
  protected readonly onglet = signal(0);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly colonnesBalance = [
    'numero',
    'libelle',
    'type',
    'debit',
    'credit',
    'soldeDebit',
    'soldeCredit',
    'actions',
  ];
  protected readonly colonnesGrandLivre = [
    'date',
    'journal',
    'libelle',
    'sens',
    'debit',
    'credit',
    'solde',
    'actions',
  ];
  protected readonly colonnesEcriture = ['compte', 'libelle', 'sens', 'montant'];

  ngOnInit(): void {
    this.api.comptes().subscribe({
      next: (liste) => {
        this.comptes.set(liste);
        if (!this.compte.value && liste.length > 0) {
          this.compte.setValue(liste[0].numero);
        }
      },
      error: (err) => this.erreur.set(messageErreur(err)),
    });
    if (this.auth.estGlobal()) {
      this.adminApi.agences().subscribe({ next: (liste) => this.agences.set(liste) });
    }
    this.chargerBalance();
  }

  protected changerOnglet(index: number): void {
    this.onglet.set(index);
    if (index === 1 && !this.grandLivre()) {
      this.chargerGrandLivre();
    }
  }

  protected actualiser(): void {
    if (this.onglet() === 0) {
      this.chargerBalance();
    } else {
      this.chargerGrandLivre();
    }
  }

  protected ouvrirGrandLivre(ligne: BalanceLigne): void {
    this.compte.setValue(ligne.numero);
    this.onglet.set(1);
    this.chargerGrandLivre();
  }

  protected chargerGrandLivre(): void {
    const compte = this.compte.value;
    if (!compte) {
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.ecriture.set(null);
    this.api
      .grandLivre(
        compte,
        this.du.value || undefined,
        this.au.value || undefined,
        this.agenceId.value,
      )
      .subscribe({
        next: (gl) => {
          this.grandLivre.set(gl);
          this.chargement.set(false);
        },
        error: (err) => {
          this.erreur.set(messageErreur(err));
          this.chargement.set(false);
        },
      });
  }

  protected ouvrirEcriture(ligne: GrandLivreLigne): void {
    this.api.ecriture(ligne.ecritureId).subscribe({
      next: (ecriture) => this.ecriture.set(ecriture),
      error: (err) => this.erreur.set(messageErreur(err)),
    });
  }

  protected fermerEcriture(): void {
    this.ecriture.set(null);
  }

  protected peutExtourner(): boolean {
    return this.auth.aRole('ADMIN', 'DIRECTEUR');
  }

  protected extourner(ecriture: Ecriture): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: "Extourner l'écriture",
          message: `Une écriture inverse sera générée pour l'écriture #${ecriture.id}. Cette action est définitive. Confirmer ?`,
          libelleConfirmer: 'Extourner',
          danger: true,
        },
        width: '500px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          this.api.extourner(ecriture.id).subscribe({
            next: (inverse) => {
              this.snack.open(`Extourne #${inverse.id} générée`, 'Fermer', { duration: 4000 });
              this.ecriture.set(null);
              this.chargerGrandLivre();
              this.chargerBalance();
            },
            error: (err) => this.erreur.set(messageErreur(err)),
          });
        }
      });
  }

  protected classeType(type: TypeCompte): string {
    switch (type) {
      case 'ACTIF':
        return 'badge bleu';
      case 'PASSIF':
        return 'badge vert';
      case 'PRODUIT':
        return 'badge orange';
      default:
        return 'badge rouge';
    }
  }

  protected peutExporter(): boolean {
    return this.onglet() === 0 ? !!this.balance() : !!this.grandLivre();
  }

  protected exporterCsv(): void {
    if (this.onglet() === 0) {
      this.exporterBalance();
    } else {
      this.exporterGrandLivre();
    }
  }

  private chargerBalance(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api
      .balance(this.du.value || undefined, this.au.value || undefined, this.agenceId.value)
      .subscribe({
        next: (balance) => {
          this.balance.set(balance);
          this.chargement.set(false);
        },
        error: (err) => {
          this.erreur.set(messageErreur(err));
          this.chargement.set(false);
        },
      });
  }

  private exporterBalance(): void {
    const balance = this.balance();
    if (!balance) {
      return;
    }
    const lignes: string[][] = [
      ['Numéro', 'Libellé', 'Type', 'Débit', 'Crédit', 'Solde débiteur', 'Solde créditeur'],
      ...balance.lignes.map((ligne) => [
        ligne.numero,
        ligne.libelle,
        ligne.type,
        String(ligne.totalDebit),
        String(ligne.totalCredit),
        String(ligne.soldeDebit),
        String(ligne.soldeCredit),
      ]),
      ['', 'TOTAUX', '', String(balance.totalDebit), String(balance.totalCredit), '', ''],
    ];
    this.telechargerCsv(`balance_${balance.du}_${balance.au}.csv`, lignes);
  }

  private exporterGrandLivre(): void {
    const gl = this.grandLivre();
    if (!gl) {
      return;
    }
    const lignes: string[][] = [
      ['Date', 'Journal', 'Libellé', 'Sens', 'Débit', 'Crédit', 'Solde progressif'],
      ...gl.lignes.map((ligne) => [
        ligne.dateComptable,
        ligne.journal,
        ligne.libelle,
        ligne.sens,
        String(ligne.debit),
        String(ligne.credit),
        String(ligne.soldeProgressif),
      ]),
      ['', '', 'TOTAUX', '', String(gl.totalDebit), String(gl.totalCredit), String(gl.solde)],
    ];
    this.telechargerCsv(`grand-livre_${gl.compte}_${gl.du}_${gl.au}.csv`, lignes);
  }

  private telechargerCsv(nom: string, lignes: string[][]): void {
    const contenu =
      '\uFEFF' +
      lignes
        .map((ligne) =>
          ligne.map((cellule) => `"${(cellule ?? '').replaceAll('"', '""')}"`).join(';'),
        )
        .join('\r\n');
    const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
    URL.revokeObjectURL(url);
  }

  private premierJourDuMois(): string {
    const maintenant = new Date();
    return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString().slice(0, 10);
  }

  private aujourdhui(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
