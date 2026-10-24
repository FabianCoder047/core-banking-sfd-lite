import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientApi } from '../../core/services/client-api';
import { Agence, Client, PageResponse } from '../../core/models';
import { AdminApi } from '../../core/services/admin-api';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { MATERIAL_MODULES } from '../../shared/material';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Clients</h1>
          <div class="sous-titre">Recherche et gestion des membres du SFD</div>
        </div>
        @if (peutCreer()) {
          <button mat-flat-button color="primary" (click)="ouvrirFormulaire()">
            <mat-icon>person_add</mat-icon> Nouveau client
          </button>
        }
      </div>

      @if (afficherFormulaire()) {
        <mat-card class="formulaire-carte">
          <mat-card-header>
            <mat-card-title>Nouveau client</mat-card-title>
            <mat-card-subtitle>Le numéro client est généré automatiquement.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="creer()" class="formulaire">
              <mat-form-field appearance="outline">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" />
                @if (form.controls.nom.hasError('required')) {
                  <mat-error>Obligatoire</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" />
                @if (form.controls.prenom.hasError('required')) {
                  <mat-error>Obligatoire</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Date de naissance</mat-label>
                <input matInput type="date" formControlName="dateNaissance" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Sexe</mat-label>
                <mat-select formControlName="sexe">
                  <mat-option value="M">Masculin</mat-option>
                  <mat-option value="F">Féminin</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="telephone" placeholder="90 00 00 00" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Profession</mat-label>
                <input matInput formControlName="profession" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>N° pièce d'identité</mat-label>
                <input matInput formControlName="numeroPiece" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Adresse</mat-label>
                <input matInput formControlName="adresse" />
              </mat-form-field>
              @if (auth.estGlobal()) {
                <mat-form-field appearance="outline">
                  <mat-label>Agence</mat-label>
                  <mat-select formControlName="agenceId">
                    <mat-option [value]="null">Mon agence</mat-option>
                    @for (agence of agences(); track agence.id) {
                      <mat-option [value]="agence.id"
                        >{{ agence.code }} — {{ agence.nom }}</mat-option
                      >
                    }
                  </mat-select>
                </mat-form-field>
              }
              <div class="actions">
                <button mat-button type="button" (click)="fermerFormulaire()">Annuler</button>
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="form.invalid || enregistrement()"
                >
                  Enregistrer le client
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          <div class="filtres">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="recherche">
              <mat-label>Rechercher (nom, numéro, téléphone)</mat-label>
              <input matInput [formControl]="recherche" (keyup.enter)="chercher()" />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="chercher()">Rechercher</button>
            <span class="total">{{ page()?.total ?? 0 }} client(s)</span>
          </div>

          @if (erreur(); as message) {
            <div class="encart negatif">{{ message }}</div>
          }

          <div class="table-scroll">
            <table mat-table [dataSource]="page()?.contenu ?? []">
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>Numéro</th>
                <td mat-cell *matCellDef="let client">
                  <strong>{{ client.numero }}</strong>
                </td>
              </ng-container>
              <ng-container matColumnDef="nom">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let client">
                  {{ client.prenom }} {{ client.nom }}
                  @if (client.profession) {
                    <div class="sous-texte">{{ client.profession }}</div>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="telephone">
                <th mat-header-cell *matHeaderCellDef>Téléphone</th>
                <td mat-cell *matCellDef="let client">{{ client.telephone || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="agence">
                <th mat-header-cell *matHeaderCellDef>Agence</th>
                <td mat-cell *matCellDef="let client">{{ client.agenceCode }}</td>
              </ng-container>
              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let client">
                  <span class="badge" [class.vert]="client.statut === 'ACTIF'">{{
                    client.statut
                  }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let client" class="actions">
                  <a
                    mat-icon-button
                    [routerLink]="['/clients', client.id]"
                    matTooltip="Fiche client"
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
            <div class="etat-vide">Aucun client ne correspond à cette recherche.</div>
          }
          @if (chargement()) {
            <mat-progress-bar mode="indeterminate" />
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
      .recherche {
        flex: 1;
        min-width: 260px;
      }
      .total {
        color: #6b7280;
        font-size: 0.85rem;
        margin-left: auto;
      }
      .sous-texte {
        color: #6b7280;
        font-size: 0.78rem;
      }
      .formulaire-carte {
        margin-bottom: 18px;
      }
      @media (max-width: 600px) {
        .recherche {
          flex: 1 1 100%;
          min-width: 0;
        }
        .total {
          width: 100%;
          margin-left: 0;
        }
      }
    `,
  ],
})
export class ClientsListPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ClientApi);
  private readonly adminApi = inject(AdminApi);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  protected readonly colonnes = ['numero', 'nom', 'telephone', 'agence', 'statut', 'actions'];
  protected readonly page = signal<PageResponse<Client> | null>(null);
  protected readonly agences = signal<Agence[]>([]);
  protected readonly chargement = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly afficherFormulaire = signal(false);
  protected readonly recherche = this.fb.nonNullable.control('');
  protected taille = 20;
  protected index = 0;

  protected readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: [''],
    sexe: [''],
    telephone: [''],
    adresse: [''],
    profession: [''],
    numeroPiece: [''],
    agenceId: [null as number | null],
  });

  protected readonly peutCreer = () =>
    this.auth.aRole('ADMIN', 'DIRECTEUR', 'AGENT_CREDIT', 'CAISSIER');

  ngOnInit(): void {
    if (this.auth.estGlobal()) {
      this.adminApi.agences().subscribe({ next: (liste) => this.agences.set(liste) });
    }
    this.charger();
  }

  protected chercher(): void {
    this.index = 0;
    this.charger();
  }

  protected changerPage(evenement: { pageIndex: number; pageSize: number }): void {
    this.index = evenement.pageIndex;
    this.taille = evenement.pageSize;
    this.charger();
  }

  protected ouvrirFormulaire(): void {
    this.afficherFormulaire.set(true);
  }

  protected fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
  }

  protected creer(): void {
    if (this.form.invalid || this.enregistrement()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enregistrement.set(true);
    const valeurs = this.form.getRawValue();
    this.api.creer({ ...valeurs, dateNaissance: valeurs.dateNaissance || undefined }).subscribe({
      next: (client) => {
        this.snack.open(`Client ${client.numero} créé`, 'Fermer', { duration: 3500 });
        this.form.reset();
        this.afficherFormulaire.set(false);
        this.enregistrement.set(false);
        this.charger();
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.enregistrement.set(false);
      },
    });
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.rechercher(this.recherche.value, this.index, this.taille).subscribe({
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
