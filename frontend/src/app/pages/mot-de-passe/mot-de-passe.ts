import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-mot-de-passe',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_MODULES],
  template: `
    <div class="fond">
      <mat-card class="carte">
        <div class="marque">
          <mat-icon>account_balance</mat-icon>
          <div>
            <strong>SFD Lite</strong>
            <small>Première connexion</small>
          </div>
        </div>

        <h1>Changer votre mot de passe</h1>
        <p class="explication">
          Pour votre sécurité, le mot de passe temporaire reçu par e-mail doit être remplacé avant
          d'accéder à l'application.
        </p>

        <div class="compte">
          <mat-icon>mail</mat-icon>
          <span>{{ auth.utilisateur()?.email }}</span>
        </div>

        @if (erreur(); as message) {
          <div class="encart negatif">{{ message }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="soumettre()" class="formulaire">
          <mat-form-field appearance="outline" class="pleine-largeur">
            <mat-label>Mot de passe temporaire</mat-label>
            <input
              matInput
              type="password"
              formControlName="motDePasseActuel"
              autocomplete="current-password"
            />
            <mat-icon matPrefix>lock</mat-icon>
            @if (form.controls.motDePasseActuel.hasError('required')) {
              <mat-error>Obligatoire</mat-error>
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
            <mat-icon matPrefix>password</mat-icon>
            <mat-hint>8 caractères minimum</mat-hint>
            @if (form.controls.nouveauMotDePasse.hasError('minlength')) {
              <mat-error>8 caractères minimum</mat-error>
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
              <mat-error>Obligatoire</mat-error>
            }
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="bouton"
            [disabled]="form.invalid || chargement()"
          >
            {{ chargement() ? 'Enregistrement…' : 'Changer et continuer' }}
          </button>
        </form>

        <button mat-button type="button" class="deconnexion" (click)="auth.deconnecter()">
          Se déconnecter
        </button>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .fond {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 32%),
          linear-gradient(145deg, #0f2b46 0%, #123b5c 52%, #0b2238 100%);
      }
      .carte {
        width: min(100%, 470px);
        padding: 30px 30px 22px;
        border-radius: 18px !important;
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
      }
      .marque {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        color: #0f2b46;
      }
      .marque mat-icon {
        font-size: 38px;
        width: 38px;
        height: 38px;
        color: #0284c7;
      }
      .marque strong,
      .marque small {
        display: block;
      }
      .marque strong {
        font-size: 1.1rem;
      }
      .marque small {
        font-size: 0.76rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.5rem;
        color: #0f172a;
      }
      .explication {
        margin: 0 0 18px;
        color: #64748b;
        line-height: 1.55;
        font-size: 0.9rem;
      }
      .compte {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 18px;
        padding: 10px 12px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #334155;
        font-size: 0.86rem;
        overflow-wrap: anywhere;
      }
      .compte mat-icon {
        font-size: 19px;
        width: 19px;
        height: 19px;
        color: #0284c7;
      }
      .bouton {
        width: 100%;
        height: 46px;
        margin-top: 4px;
      }
      .deconnexion {
        display: block;
        margin: 14px auto 0;
        color: #64748b;
      }
      @media (max-width: 540px) {
        .fond {
          padding: 0;
          align-items: stretch;
        }
        .carte {
          width: 100%;
          min-height: 100dvh;
          border-radius: 0 !important;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px 18px;
        }
        h1 {
          font-size: 1.3rem;
        }
      }
    `,
  ],
})
export class ChangePasswordPage {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    motDePasseActuel: ['', Validators.required],
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  });

  constructor() {
    if (!this.auth.estConnecte()) {
      void this.router.navigate(['/login']);
    } else if (!this.auth.doitChangerMotDePasse()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  protected soumettre(): void {
    if (this.form.invalid || this.chargement()) {
      this.form.markAllAsTouched();
      return;
    }
    const { motDePasseActuel, nouveauMotDePasse, confirmation } = this.form.getRawValue();
    if (nouveauMotDePasse !== confirmation) {
      this.erreur.set('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (nouveauMotDePasse === motDePasseActuel) {
      this.erreur.set('Le nouveau mot de passe doit être différent du mot de passe temporaire.');
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.auth.changerMotDePasse(motDePasseActuel, nouveauMotDePasse).subscribe({
      next: () => {
        this.snack.open('Mot de passe modifié. Bienvenue !', 'Fermer', { duration: 4000 });
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Le changement de mot de passe a échoué.'));
        this.chargement.set(false);
      },
    });
  }
}
