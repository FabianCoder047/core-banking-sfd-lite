import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { Role } from '../../core/models';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-mon-compte',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Mon compte</h1>
          <div class="sous-titre">Informations personnelles et sécurité de votre accès</div>
        </div>
      </div>

      <div class="grille-compte">
        <mat-card class="carte-profil">
          <div class="entete-profil">
            <div class="avatar">{{ initiales() }}</div>
            <div class="identite-profil">
              <h2>{{ auth.utilisateur()?.prenom }} {{ auth.utilisateur()?.nom }}</h2>
              <span class="badge bleu">{{ libelleRole() }}</span>
            </div>
          </div>

          <mat-card-content>
            <div class="liste-infos">
              <div class="ligne-info">
                <span class="icone-info"><mat-icon>mail</mat-icon></span>
                <div>
                  <small>Adresse e-mail</small>
                  <strong>{{ auth.utilisateur()?.email }}</strong>
                </div>
              </div>

              <div class="ligne-info">
                <span class="icone-info"><mat-icon>badge</mat-icon></span>
                <div>
                  <small>Rôle</small>
                  <strong>{{ libelleRole() }}</strong>
                </div>
              </div>

              <div class="ligne-info">
                <span class="icone-info"><mat-icon>location_on</mat-icon></span>
                <div>
                  <small>Agence</small>
                  <strong>{{ auth.utilisateur()?.agenceNom || 'Aucune — rôle global' }}</strong>
                </div>
              </div>

              <div class="ligne-info">
                <span class="icone-info"><mat-icon>verified_user</mat-icon></span>
                <div>
                  <small>Statut du compte</small>
                  @if (auth.utilisateur()?.actif) {
                    <span class="badge vert">Actif</span>
                  } @else {
                    <span class="badge rouge">Inactif</span>
                  }
                </div>
              </div>

              <div class="ligne-info">
                <span class="icone-info"><mat-icon>event</mat-icon></span>
                <div>
                  <small>Compte créé le</small>
                  <strong>
                    @if (auth.utilisateur()?.creeLe) {
                      {{ auth.utilisateur()?.creeLe | date: 'dd/MM/yyyy' }}
                    } @else {
                      —
                    }
                  </strong>
                </div>
              </div>

              <div class="ligne-info">
                <span class="icone-info"><mat-icon>password</mat-icon></span>
                <div>
                  <small>Mot de passe</small>
                  @if (auth.utilisateur()?.doitChangerMotDePasse) {
                    <span class="badge orange">À changer</span>
                  } @else {
                    <span class="badge bleu">Personnel</span>
                  }
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="carte-securite">
          <mat-card-header>
            <mat-card-title>Modifier le mot de passe</mat-card-title>
            <mat-card-subtitle>
              Saisissez votre mot de passe actuel puis choisissez un nouveau mot de passe.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (succes(); as message) {
              <div class="encart succes">
                <mat-icon>check_circle</mat-icon>
                <span>{{ message }}</span>
              </div>
            }
            @if (erreur(); as message) {
              <div class="encart erreur">
                <mat-icon>error</mat-icon>
                <span>{{ message }}</span>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="soumettre()" class="formulaire">
              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Mot de passe actuel</mat-label>
                <input
                  matInput
                  type="password"
                  formControlName="motDePasseActuel"
                  autocomplete="current-password"
                />
                <mat-icon matPrefix>lock</mat-icon>
                @if (form.controls.motDePasseActuel.hasError('required')) {
                  <mat-error>Le mot de passe actuel est obligatoire.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Nouveau mot de passe</mat-label>
                <input
                  matInput
                  type="password"
                  formControlName="nouveauMotDePasse"
                  autocomplete="new-password"
                />
                <mat-icon matPrefix>lock_reset</mat-icon>
                <mat-hint>8 caractères minimum</mat-hint>
                @if (form.controls.nouveauMotDePasse.hasError('minlength')) {
                  <mat-error>8 caractères minimum.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Confirmer le nouveau mot de passe</mat-label>
                <input
                  matInput
                  type="password"
                  formControlName="confirmation"
                  autocomplete="new-password"
                />
                <mat-icon matPrefix>verified_user</mat-icon>
                @if (form.controls.confirmation.hasError('required')) {
                  <mat-error>La confirmation est obligatoire.</mat-error>
                }
              </mat-form-field>

              <div class="actions">
                <button mat-button type="button" (click)="reinitialiser()">Effacer</button>
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="form.invalid || chargement()"
                >
                  <mat-icon>save</mat-icon>
                  {{ chargement() ? 'Enregistrement…' : 'Modifier le mot de passe' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .grille-compte {
        display: grid;
        grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .carte-profil {
        overflow: hidden;
      }
      .entete-profil {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 20px;
        background: linear-gradient(135deg, #e0f2fe 0%, #eff6ff 100%);
        border-bottom: 1px solid #dbeafe;
      }
      .avatar {
        width: 64px;
        height: 64px;
        flex: 0 0 auto;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1d4ed8;
        color: #fff;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .identite-profil {
        min-width: 0;
      }
      .identite-profil h2 {
        margin: 0 0 7px;
        font-size: 1.2rem;
        color: #0f172a;
        overflow-wrap: anywhere;
      }
      .liste-infos {
        display: grid;
        gap: 4px;
        padding-top: 8px;
      }
      .ligne-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 4px;
        border-bottom: 1px solid #f1f5f9;
      }
      .ligne-info:last-child {
        border-bottom: 0;
      }
      .ligne-info small,
      .ligne-info strong {
        display: block;
      }
      .ligne-info small {
        color: #64748b;
        font-size: 0.75rem;
        margin-bottom: 3px;
      }
      .ligne-info strong {
        color: #1e293b;
        font-size: 0.9rem;
        overflow-wrap: anywhere;
      }
      .icone-info {
        width: 36px;
        height: 36px;
        flex: 0 0 auto;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        color: #0284c7;
      }
      .icone-info mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .carte-securite {
        min-height: 100%;
      }
      .carte-securite mat-card-content {
        padding-top: 18px;
      }
      .carte-securite .formulaire {
        grid-template-columns: 1fr;
        max-width: 560px;
      }
      .carte-securite .formulaire .actions {
        margin-top: 2px;
      }
      .encart {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 0.88rem;
      }
      .encart mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .encart.succes {
        background: #ecfdf5;
        border-color: #a7f3d0;
        color: #065f46;
      }
      .encart.erreur {
        background: #fef2f2;
        border-color: #fecaca;
        color: #991b1b;
      }
      @media (max-width: 900px) {
        .grille-compte {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .entete-profil {
          padding: 20px 14px;
        }
        .avatar {
          width: 54px;
          height: 54px;
          font-size: 1.1rem;
        }
        .identite-profil h2 {
          font-size: 1.05rem;
        }
      }
    `,
  ],
})
export class MonComptePage {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly succes = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    motDePasseActuel: ['', Validators.required],
    nouveauMotDePasse: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    ],
    confirmation: ['', Validators.required],
  });

  protected readonly initiales = computed(() => {
    const utilisateur = this.auth.utilisateur();
    if (!utilisateur) {
      return '';
    }
    return `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`.toUpperCase();
  });

  protected readonly libelleRole = computed(() => this.roleLibelle(this.auth.utilisateur()?.role));

  protected soumettre(): void {
    if (this.form.invalid || this.chargement()) {
      this.form.markAllAsTouched();
      return;
    }
    const { motDePasseActuel, nouveauMotDePasse, confirmation } = this.form.getRawValue();
    this.erreur.set(null);
    this.succes.set(null);
    if (nouveauMotDePasse !== confirmation) {
      this.erreur.set('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (nouveauMotDePasse === motDePasseActuel) {
      this.erreur.set('Le nouveau mot de passe doit être différent du mot de passe actuel.');
      return;
    }
    this.chargement.set(true);
    this.auth.changerMotDePasse(motDePasseActuel, nouveauMotDePasse).subscribe({
      next: () => {
        this.form.reset();
        this.chargement.set(false);
        this.succes.set('Votre mot de passe a bien été modifié.');
        this.snack.open('Mot de passe modifié', 'Fermer', { duration: 3500 });
      },
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Le changement de mot de passe a échoué.'));
        this.chargement.set(false);
      },
    });
  }

  protected reinitialiser(): void {
    this.form.reset();
    this.erreur.set(null);
    this.succes.set(null);
  }

  private roleLibelle(role: Role | undefined): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'DIRECTEUR':
        return 'Directeur';
      case 'AGENT_CREDIT':
        return 'Agent de crédit';
      case 'CAISSIER':
        return 'Caissier';
      case 'COMPTABLE':
        return 'Comptable';
      default:
        return '';
    }
  }
}
