import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const token = auth.token();
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const rediriger = () => {
    auth.viderSession();
    void router.navigate(['/login'], { queryParams: { expire: '1' } });
  };

  return next(requete).pipe(
    catchError((error: HttpErrorResponse) => {
      const authentificationPublique =
        req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');
      if (error.status !== 401 || authentificationPublique) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('sfd.refreshToken');
      if (!refreshToken) {
        rediriger();
        return throwError(() => error);
      }

      return auth.rafraichir().pipe(
        switchMap((reponse) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${reponse.accessToken}` } })),
        ),
        catchError((erreur) => {
          rediriger();
          return throwError(() => erreur);
        }),
      );
    }),
  );
};
