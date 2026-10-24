import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  transform(valeur: number | string | null | undefined): string {
    if (valeur === null || valeur === undefined || valeur === '') {
      return '0 FCFA';
    }
    const nombre = typeof valeur === 'string' ? Number(valeur) : valeur;
    if (Number.isNaN(nombre)) {
      return '0 FCFA';
    }
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(nombre)} FCFA`;
  }
}
