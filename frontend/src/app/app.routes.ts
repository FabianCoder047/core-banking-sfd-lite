import { Routes } from '@angular/router';
import { authGuard, premierLoginGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'mot-de-passe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/mot-de-passe/mot-de-passe').then((m) => m.ChangePasswordPage),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard, premierLoginGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'clients',
        canActivate: [roleGuard(['ADMIN', 'DIRECTEUR', 'AGENT_CREDIT', 'CAISSIER'])],
        loadComponent: () => import('./pages/clients/clients-list').then((m) => m.ClientsListPage),
      },
      {
        path: 'clients/:id',
        canActivate: [roleGuard(['ADMIN', 'DIRECTEUR', 'AGENT_CREDIT', 'CAISSIER'])],
        loadComponent: () =>
          import('./pages/clients/client-detail').then((m) => m.ClientDetailPage),
      },
      {
        path: 'caisse',
        canActivate: [roleGuard(['ADMIN', 'CAISSIER'])],
        loadComponent: () => import('./pages/caisse/caisse').then((m) => m.CaissePage),
      },
      {
        path: 'credits',
        loadComponent: () => import('./pages/credits/credits-list').then((m) => m.CreditsListPage),
      },
      {
        path: 'credits/nouveau',
        canActivate: [roleGuard(['ADMIN', 'AGENT_CREDIT'])],
        loadComponent: () => import('./pages/credits/credit-form').then((m) => m.CreditFormPage),
      },
      {
        path: 'credits/:id',
        loadComponent: () =>
          import('./pages/credits/credit-detail').then((m) => m.CreditDetailPage),
      },
      {
        path: 'approbations',
        canActivate: [roleGuard(['ADMIN', 'DIRECTEUR'])],
        loadComponent: () => import('./pages/credits/approbations').then((m) => m.ApprobationsPage),
      },
      {
        path: 'comptabilite',
        canActivate: [roleGuard(['ADMIN', 'DIRECTEUR', 'COMPTABLE'])],
        loadComponent: () =>
          import('./pages/comptabilite/comptabilite').then((m) => m.ComptabilitePage),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
      },
      {
        path: 'audits',
        canActivate: [roleGuard(['ADMIN', 'DIRECTEUR'])],
        loadComponent: () => import('./pages/audits/audits').then((m) => m.AuditsPage),
      },
      {
        path: 'mon-compte',
        loadComponent: () => import('./pages/mon-compte/mon-compte').then((m) => m.MonComptePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
