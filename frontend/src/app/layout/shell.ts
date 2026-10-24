import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Role } from '../core/models';
import { MATERIAL_MODULES } from '../shared/material';

interface LienMenu {
  libelle: string;
  route: string;
  icone: string;
  roles?: Role[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ...MATERIAL_MODULES],
  template: `
    <mat-sidenav-container class="conteneur">
      <mat-sidenav
        [mode]="mobile() ? 'over' : 'side'"
        [opened]="ouvert()"
        (openedChange)="ouvert.set($event)"
        class="sidenav"
      >
        <div class="marque">
          <mat-icon>account_balance</mat-icon>
          <div>
            <strong>SFD Lite</strong>
            <small>Microfinance · UEMOA</small>
          </div>
        </div>
        <nav>
          @for (lien of menu(); track lien.route) {
            <a
              mat-button
              class="lien"
              [routerLink]="lien.route"
              routerLinkActive="actif"
              [routerLinkActiveOptions]="{ exact: lien.route === '/dashboard' }"
              (click)="fermerMenu()"
            >
              <mat-icon>{{ lien.icone }}</mat-icon>
              <span>{{ lien.libelle }}</span>
            </a>
          }
        </nav>
        <div class="pied">
          <mat-icon>location_on</mat-icon>
          <span>{{ auth.utilisateur()?.agenceNom ?? 'Siège' }}</span>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="barre">
          <button mat-icon-button (click)="basculerMenu()" aria-label="Ouvrir ou fermer le menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="titre">SFD Lite</span>
          <span class="espace"></span>
          <div class="compte">
            <a class="identite" routerLink="/mon-compte" matTooltip="Mon compte">
              <strong>{{ auth.utilisateur()?.prenom }} {{ auth.utilisateur()?.nom }}</strong>
              <small>{{ libelleRole() }}</small>
            </a>
            <button mat-icon-button matTooltip="Se déconnecter" (click)="auth.deconnecter()">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-toolbar>
        <main>
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .conteneur {
        height: 100dvh;
        background: #f4f6f9;
      }
      .sidenav {
        width: 250px;
        background: #0f2b46;
        color: #e5edf7;
        display: flex;
        flex-direction: column;
      }
      .marque {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 22px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }
      .marque mat-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
        color: #7dd3fc;
      }
      .marque strong {
        display: block;
        font-size: 1.1rem;
      }
      .marque small {
        opacity: 0.65;
        font-size: 0.72rem;
      }
      nav {
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }
      .lien {
        justify-content: flex-start;
        color: #cbd5e1 !important;
        border-radius: 10px;
        padding: 10px 12px;
        gap: 12px;
        width: 100%;
      }
      .lien mat-icon {
        color: #94a3b8;
      }
      .lien:hover {
        background: rgba(255, 255, 255, 0.06);
      }
      .lien.actif {
        background: #1d4ed8;
        color: #fff !important;
      }
      .lien.actif mat-icon {
        color: #fff;
      }
      .pied {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 16px 20px;
        font-size: 0.8rem;
        opacity: 0.75;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }
      .pied mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .barre {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .titre {
        font-weight: 600;
        margin-left: 4px;
      }
      .espace {
        flex: 1;
      }
      .compte {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .identite {
        text-align: right;
        line-height: 1.2;
        text-decoration: none;
        color: inherit;
        border-radius: 8px;
        padding: 4px 6px;
      }
      .identite:hover {
        background: #f1f5f9;
      }
      .identite strong {
        display: block;
        font-size: 0.85rem;
      }
      .identite small {
        color: #6b7280;
        font-size: 0.72rem;
      }
      main {
        min-height: calc(100dvh - 64px);
      }
      @media (max-width: 900px) {
        .sidenav {
          width: min(82vw, 280px);
        }
        .identite {
          display: none;
        }
        .barre {
          --mat-toolbar-standard-height: 58px;
          min-height: 58px;
        }
        main {
          min-height: calc(100dvh - 58px);
        }
      }
      @media (max-width: 420px) {
        .titre {
          display: none;
        }
        .compte {
          gap: 2px;
        }
      }
    `,
  ],
})
export class Shell {
  protected readonly auth = inject(AuthService);
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly mobile = signal(false);
  protected readonly ouvert = signal(true);

  constructor() {
    this.breakpoint
      .observe('(max-width: 900px)')
      .pipe(takeUntilDestroyed())
      .subscribe((etat) => {
        this.mobile.set(etat.matches);
        this.ouvert.set(!etat.matches);
      });
  }

  protected basculerMenu(): void {
    this.ouvert.set(!this.ouvert());
  }

  protected fermerMenu(): void {
    if (this.mobile()) {
      this.ouvert.set(false);
    }
  }

  protected readonly liens: LienMenu[] = [
    { libelle: 'Tableau de bord', route: '/dashboard', icone: 'dashboard' },
    {
      libelle: 'Clients',
      route: '/clients',
      icone: 'groups',
      roles: ['ADMIN', 'DIRECTEUR', 'AGENT_CREDIT', 'CAISSIER'],
    },
    {
      libelle: 'Opérations de caisse',
      route: '/caisse',
      icone: 'point_of_sale',
      roles: ['ADMIN', 'CAISSIER'],
    },
    { libelle: 'Crédits', route: '/credits', icone: 'request_quote' },
    {
      libelle: 'Approbations',
      route: '/approbations',
      icone: 'fact_check',
      roles: ['ADMIN', 'DIRECTEUR'],
    },
    {
      libelle: 'Comptabilité',
      route: '/comptabilite',
      icone: 'menu_book',
      roles: ['ADMIN', 'DIRECTEUR', 'COMPTABLE'],
    },
    {
      libelle: 'Audits',
      route: '/audits',
      icone: 'manage_search',
      roles: ['ADMIN', 'DIRECTEUR'],
    },
    { libelle: 'Administration', route: '/admin', icone: 'settings', roles: ['ADMIN'] },
    { libelle: 'Mon compte', route: '/mon-compte', icone: 'account_circle' },
  ];

  protected readonly menu = computed(() =>
    this.liens.filter((lien) => !lien.roles || this.auth.aRole(...lien.roles)),
  );

  protected readonly libelleRole = computed(() => {
    const role = this.auth.utilisateur()?.role;
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
  });
}
