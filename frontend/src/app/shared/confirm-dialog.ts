import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmData {
  titre: string;
  message: string;
  libelleConfirmer?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titre }}</h2>
    <mat-dialog-content><p>{{ data.message }}</p></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button [color]="data.danger ? 'warn' : 'primary'" [mat-dialog-close]="true">
        {{ data.libelleConfirmer ?? 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
