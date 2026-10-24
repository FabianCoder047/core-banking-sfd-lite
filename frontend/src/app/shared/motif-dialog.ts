import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface MotifData {
  titre: string;
  message: string;
  libelleConfirmer?: string;
  placeholder?: string;
}

@Component({
  selector: 'app-motif-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.titre }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="outline" class="pleine-largeur">
        <mat-label>Motif</mat-label>
        <textarea
          matInput
          rows="3"
          [ngModel]="motif()"
          (ngModelChange)="motif.set($event)"
          [placeholder]="data.placeholder ?? 'Précisez le motif…'"
          maxlength="255"
        ></textarea>
        <mat-hint align="end">{{ motif().length }} / 255</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="motif().trim().length === 0"
        (click)="valider()"
      >
        {{ data.libelleConfirmer ?? 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class MotifDialog {
  protected readonly data = inject<MotifData>(MAT_DIALOG_DATA);
  protected readonly motif = signal('');
  private readonly ref = inject<MatDialogRef<MotifDialog, string | null>>(MatDialogRef);

  protected valider(): void {
    const valeur = this.motif().trim();
    if (valeur) {
      this.ref.close(valeur);
    }
  }
}
