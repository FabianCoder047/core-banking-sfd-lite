import { HttpErrorResponse } from '@angular/common/http';

export function messageErreur(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof HttpErrorResponse) {
    const corps = error.error;
    if (corps?.erreurs && typeof corps.erreurs === 'object') {
      return Object.values(corps.erreurs).join(' · ');
    }
    if (corps?.detail) {
      return corps.detail;
    }
    if (error.status === 0) {
      return 'Impossible de joindre le serveur.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
