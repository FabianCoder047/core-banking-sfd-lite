import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estConnecte() ? true : inject(Router).createUrlTree(['/login']);
};

export const premierLoginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estConnecte()) {
    return router.createUrlTree(['/login']);
  }
  return auth.doitChangerMotDePasse() ? router.createUrlTree(['/mot-de-passe']) : true;
};

export function roleGuard(roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.estConnecte()) {
      return router.createUrlTree(['/login']);
    }
    if (auth.doitChangerMotDePasse()) {
      return router.createUrlTree(['/mot-de-passe']);
    }
    return auth.aRole(...roles) ? true : router.createUrlTree(['/dashboard']);
  };
}
