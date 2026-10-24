import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_MODULES],
  template: `
    <div class="fond">
      <section class="presentation">
        <div class="logo"><mat-icon>account_balance</mat-icon> SFD Lite</div>
        <h1>Le cœur bancaire de votre système financier décentralisé.</h1>
        <p>
          Épargne, crédit et comptabilité en partie double, sur plusieurs agences. Une solution
          pensée pour la microfinance en zone UEMOA.
        </p>
        <ul>
          <li><mat-icon>savings</mat-icon> Comptes d'épargne et opérations de caisse</li>
          <li><mat-icon>request_quote</mat-icon> Cycle complet du crédit et échéanciers</li>
          <li><mat-icon>menu_book</mat-icon> Écritures automatiques et balance équilibrée</li>
        </ul>
      </section>

      <section class="connexion">
        <mat-card class="carte">
          <mat-card-header>
            <mat-card-title>Connexion</mat-card-title>
            <mat-card-subtitle>Accédez à votre espace de travail</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (erreur()) {
              <div class="erreur">
                <mat-icon>error_outline</mat-icon>
                <span>{{ erreur() }}</span>
              </div>
            }
            @if (sessionExpiree) {
              <div class="info">Votre session a expiré, veuillez vous reconnecter.</div>
            }
            <form [formGroup]="form" (ngSubmit)="soumettre()" class="formulaire">
              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Adresse e-mail</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="username" />
                <mat-icon matPrefix>mail</mat-icon>
                @if (form.controls.email.invalid && form.controls.email.touched) {
                  <mat-error>Adresse e-mail invalide</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="pleine-largeur">
                <mat-label>Mot de passe</mat-label>
                <input
                  matInput
                  [type]="afficher() ? 'text' : 'password'"
                  formControlName="motDePasse"
                  autocomplete="current-password"
                />
                <mat-icon matPrefix>lock</mat-icon>
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="afficher.set(!afficher())"
                  [attr.aria-label]="afficher() ? 'Masquer' : 'Afficher'"
                >
                  <mat-icon>{{ afficher() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="pleine-largeur bouton"
                [disabled]="form.invalid || chargement()"
              >
                @if (chargement()) {
                  Connexion…
                } @else {
                  Se connecter
                }
              </button>
            </form>

            <div class="demo">
              <span>Comptes de démonstration — mot de passe&nbsp;: <code>Sfd&#64;2026!</code></span>
              <div class="comptes">
                @for (compte of comptesDemo; track compte.email) {
                  <button mat-stroked-button type="button" (click)="remplir(compte.email)">
                    {{ compte.libelle }}
                  </button>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <p class="mention">Application de démonstration — données fictives.</p>
      </section>
    </div>
  `,
  styles: [
    `
      .fond {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        background:
          radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.18), transparent 45%),
          linear-gradient(135deg, #0f2b46 0%, #123a5c 55%, #0b1f33 100%);
      }
      .presentation {
        color: #e2e8f0;
        padding: 64px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 18px;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 1.3rem;
        color: #7dd3fc;
      }
      .presentation h1 {
        font-size: 2.4rem;
        line-height: 1.15;
        margin: 8px 0;
        max-width: 560px;
      }
      .presentation p {
        max-width: 520px;
        color: #cbd5e1;
        line-height: 1.6;
      }
      .presentation ul {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }
      .presentation li {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #dbeafe;
      }
      .presentation li mat-icon {
        color: #38bdf8;
      }
      .connexion {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
      }
      .carte {
        width: 100%;
        max-width: 440px;
        padding: 12px;
      }
      .erreur {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        color: #b91c1c;
        background: #fee2e2;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 0.85rem;
      }
      .info {
        background: #e0f2fe;
        color: #075985;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 0.85rem;
      }
      form {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bouton {
        height: 46px;
        margin-top: 4px;
      }
      .demo {
        margin-top: 22px;
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
        font-size: 0.78rem;
        color: #6b7280;
      }
      .demo code {
        background: #f3f4f6;
        padding: 1px 5px;
        border-radius: 4px;
      }
      .comptes {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      .comptes button {
        font-size: 0.72rem;
        padding: 0 8px;
      }
      .mention {
        color: #94a3b8;
        font-size: 0.72rem;
        margin-top: 14px;
      }
      @media (max-width: 900px) {
        .fond {
          grid-template-columns: 1fr;
        }
        .presentation {
          display: none;
        }
        .connexion {
          padding: 20px 14px;
        }
        .carte {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['caissier@sfd.tg', [Validators.required, Validators.email]],
    motDePasse: ['Sfd@2026!', [Validators.required]],
  });
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly afficher = signal(false);
  protected readonly sessionExpiree = new URLSearchParams(window.location.search).has('expire');

  protected readonly comptesDemo = [
    { libelle: 'Admin', email: 'admin@sfd.tg' },
    { libelle: 'Directeur', email: 'directeur@sfd.tg' },
    { libelle: 'Agent crédit', email: 'agent@sfd.tg' },
    { libelle: 'Caissier', email: 'caissier@sfd.tg' },
    { libelle: 'Comptable', email: 'comptable@sfd.tg' },
  ];

  constructor() {
    if (this.auth.estConnecte()) {
      void this.router.navigate([this.destination()]);
    }
  }

  protected remplir(email: string): void {
    this.form.setValue({ email, motDePasse: 'Sfd@2026!' });
  }

  protected soumettre(): void {
    if (this.form.invalid || this.chargement()) {
      this.form.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    const { email, motDePasse } = this.form.getRawValue();
    this.auth.login(email, motDePasse).subscribe({
      next: () => void this.router.navigate([this.destination()]),
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Connexion impossible.'));
        this.chargement.set(false);
      },
    });
  }

  private destination(): string {
    return this.auth.doitChangerMotDePasse() ? '/mot-de-passe' : '/dashboard';
  }
}
