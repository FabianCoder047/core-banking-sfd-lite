import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, throwError } from 'rxjs';
import { Role, TokenResponse, Utilisateur } from './models';

const CLE_ACCESS = 'sfd.accessToken';
const CLE_REFRESH = 'sfd.refreshToken';
const CLE_USER = 'sfd.utilisateur';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly utilisateur = signal<Utilisateur | null>(this.lireUtilisateur());
  readonly estConnecte = computed(() => this.utilisateur() !== null);
  readonly doitChangerMotDePasse = computed(
    () => this.utilisateur()?.doitChangerMotDePasse === true,
  );

  login(email: string, motDePasse: string) {
    return this.http
      .post<TokenResponse>('/api/auth/login', { email, motDePasse })
      .pipe(tap((reponse) => this.enregistrer(reponse)));
  }

  changerMotDePasse(motDePasseActuel: string, nouveauMotDePasse: string) {
    return this.http
      .post<TokenResponse>('/api/auth/mot-de-passe', { motDePasseActuel, nouveauMotDePasse })
      .pipe(tap((reponse) => this.enregistrer(reponse)));
  }

  private enregistrer(reponse: TokenResponse): void {
    localStorage.setItem(CLE_ACCESS, reponse.accessToken);
    localStorage.setItem(CLE_REFRESH, reponse.refreshToken);
    localStorage.setItem(CLE_USER, JSON.stringify(reponse.utilisateur));
    this.utilisateur.set(reponse.utilisateur);
  }

  token(): string | null {
    return localStorage.getItem(CLE_ACCESS);
  }

  rafraichir() {
    const refreshToken = localStorage.getItem(CLE_REFRESH);
    if (!refreshToken) {
      return throwError(() => new Error('Aucun jeton de rafraîchissement.'));
    }
    return this.http
      .post<TokenResponse>('/api/auth/refresh', { refreshToken })
      .pipe(tap((reponse) => this.enregistrer(reponse)));
  }

  aRole(...roles: Role[]): boolean {
    const role = this.utilisateur()?.role;
    return !!role && roles.includes(role);
  }

  estGlobal(): boolean {
    return this.aRole('ADMIN', 'DIRECTEUR');
  }

  deconnecter(): void {
    this.viderSession();
    void this.router.navigate(['/login']);
  }

  viderSession(): void {
    localStorage.removeItem(CLE_ACCESS);
    localStorage.removeItem(CLE_REFRESH);
    localStorage.removeItem(CLE_USER);
    this.utilisateur.set(null);
  }

  private lireUtilisateur(): Utilisateur | null {
    const brut = localStorage.getItem(CLE_USER);
    if (!brut) {
      return null;
    }
    try {
      return JSON.parse(brut) as Utilisateur;
    } catch {
      return null;
    }
  }
}
