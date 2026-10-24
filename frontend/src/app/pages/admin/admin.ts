import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { messageErreur } from '../../core/error.util';
import { FcfaPipe } from '../../core/fcfa.pipe';
import {
  Agence,
  AgenceRequest,
  CompteComptable,
  ModeAmortissement,
  PageResponse,
  ProduitCredit,
  ProduitCreditRequest,
  Role,
  TypeCompte,
  Utilisateur,
  UtilisateurRequest,
} from '../../core/models';
import { AdminApi } from '../../core/services/admin-api';
import { ComptaApi } from '../../core/services/compta-api';
import { ProduitApi } from '../../core/services/credit-api';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FcfaPipe, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Administration</h1>
          <div class="sous-titre">Agences, utilisateurs, produits de crédit et plan comptable</div>
        </div>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      <mat-tab-group
        [selectedIndex]="onglet()"
        (selectedIndexChange)="onglet.set($event)"
        animationDuration="150ms"
      >
        <mat-tab label="Agences">
          <div class="barre-onglet">
            <span class="compteur">{{ agences().length }} agence(s)</span>
            <button mat-flat-button color="primary" (click)="nouvelleAgence()">
              <mat-icon>add</mat-icon> Nouvelle agence
            </button>
          </div>

          @if (afficherAgence()) {
            <mat-card class="form-carte">
              <mat-card-header>
                <mat-card-title
                  >{{ editionAgence() ? 'Modifier' : 'Créer' }} une agence</mat-card-title
                >
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="agenceForm" (ngSubmit)="sauvegarderAgence()" class="formulaire">
                  <mat-form-field appearance="outline">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code" maxlength="10" />
                    @if (agenceForm.controls.code.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nom</mat-label>
                    <input matInput formControlName="nom" maxlength="100" />
                    @if (agenceForm.controls.nom.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Ville</mat-label>
                    <input matInput formControlName="ville" maxlength="100" />
                  </mat-form-field>
                  <mat-slide-toggle formControlName="active">Agence active</mat-slide-toggle>
                  <div class="actions">
                    <button mat-button type="button" (click)="annulerAgence()">Annuler</button>
                    <button
                      mat-flat-button
                      color="primary"
                      type="submit"
                      [disabled]="agenceForm.invalid || enregistrement()"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          }

          <mat-card>
            <mat-card-content>
              @if (chargementAgences()) {
                <mat-progress-bar mode="indeterminate" />
              }
              <div class="table-scroll">
                <table mat-table [dataSource]="agences()">
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef>Code</th>
                    <td mat-cell *matCellDef="let agence">
                      <strong>{{ agence.code }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="nom">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let agence">{{ agence.nom }}</td>
                  </ng-container>
                  <ng-container matColumnDef="ville">
                    <th mat-header-cell *matHeaderCellDef>Ville</th>
                    <td mat-cell *matCellDef="let agence">{{ agence.ville || '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="active">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let agence">
                      <span [class]="agence.active ? 'badge vert' : 'badge rouge'">
                        {{ agence.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="droite">Actions</th>
                    <td mat-cell *matCellDef="let agence" class="droite actions">
                      <button mat-icon-button matTooltip="Modifier" (click)="editerAgence(agence)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="supprimerAgence(agence)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesAgences"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesAgences"></tr>
                </table>
              </div>
              @if (!chargementAgences() && agences().length === 0) {
                <div class="etat-vide">Aucune agence.</div>
              }
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Utilisateurs">
          <div class="barre-onglet">
            <span class="compteur">{{ utilisateurs()?.total ?? 0 }} utilisateur(s)</span>
            <button mat-flat-button color="primary" (click)="nouvelUtilisateur()">
              <mat-icon>person_add</mat-icon> Nouvel utilisateur
            </button>
          </div>

          @if (afficherUtilisateur()) {
            <mat-card class="form-carte">
              <mat-card-header>
                <mat-card-title
                  >{{ editionUtilisateur() ? 'Modifier' : 'Créer' }} un utilisateur</mat-card-title
                >
                <mat-card-subtitle>
                  @if (editionUtilisateur()) {
                    Les informations du compte peuvent être modifiées. Le mot de passe n'est pas
                    géré depuis cet écran.
                  } @else {
                    Un mot de passe temporaire sera généré et envoyé par e-mail. L'utilisateur devra
                    le changer dès sa première connexion.
                  }
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form
                  [formGroup]="utilisateurForm"
                  (ngSubmit)="sauvegarderUtilisateur()"
                  class="formulaire"
                >
                  <mat-form-field appearance="outline">
                    <mat-label>Adresse e-mail</mat-label>
                    <input matInput type="email" formControlName="email" maxlength="150" />
                    @if (utilisateurForm.controls.email.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                    @if (utilisateurForm.controls.email.hasError('email')) {
                      <mat-error>Format invalide</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nom</mat-label>
                    <input matInput formControlName="nom" maxlength="80" />
                    @if (utilisateurForm.controls.nom.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Prénom</mat-label>
                    <input matInput formControlName="prenom" maxlength="80" />
                    @if (utilisateurForm.controls.prenom.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Rôle</mat-label>
                    <mat-select formControlName="role">
                      <mat-option value="ADMIN">Administrateur</mat-option>
                      <mat-option value="DIRECTEUR">Directeur</mat-option>
                      <mat-option value="AGENT_CREDIT">Agent de crédit</mat-option>
                      <mat-option value="CAISSIER">Caissier</mat-option>
                      <mat-option value="COMPTABLE">Comptable</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Agence</mat-label>
                    <mat-select formControlName="agenceId">
                      <mat-option [value]="null">Aucune (rôles globaux)</mat-option>
                      @for (agence of agences(); track agence.id) {
                        <mat-option [value]="agence.id"
                          >{{ agence.code }} — {{ agence.nom }}</mat-option
                        >
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-slide-toggle formControlName="actif">Compte actif</mat-slide-toggle>
                  <div class="actions">
                    <button mat-button type="button" (click)="annulerUtilisateur()">Annuler</button>
                    <button
                      mat-flat-button
                      color="primary"
                      type="submit"
                      [disabled]="utilisateurForm.invalid || enregistrement()"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          }

          <mat-card>
            <mat-card-content>
              @if (chargementUtilisateurs()) {
                <mat-progress-bar mode="indeterminate" />
              }
              <div class="table-scroll">
                <table mat-table [dataSource]="utilisateurs()?.contenu ?? []">
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>E-mail</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      <strong>{{ utilisateur.email }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="nom">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      {{ utilisateur.prenom }} {{ utilisateur.nom }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Rôle</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      <span [class]="classeRole(utilisateur.role)">{{ utilisateur.role }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="agence">
                    <th mat-header-cell *matHeaderCellDef>Agence</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      {{ utilisateur.agenceNom || 'Global' }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actif">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      <span [class]="utilisateur.actif ? 'badge vert' : 'badge rouge'">
                        {{ utilisateur.actif ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="motDePasse">
                    <th mat-header-cell *matHeaderCellDef>Mot de passe</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      @if (utilisateur.doitChangerMotDePasse) {
                        <span class="badge orange">À changer</span>
                      } @else {
                        <span class="badge vert">Défini</span>
                      }
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="creeLe">
                    <th mat-header-cell *matHeaderCellDef>Créé le</th>
                    <td mat-cell *matCellDef="let utilisateur">
                      {{ utilisateur.creeLe | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="droite">Actions</th>
                    <td mat-cell *matCellDef="let utilisateur" class="droite actions">
                      <button
                        mat-icon-button
                        matTooltip="Modifier"
                        (click)="editerUtilisateur(utilisateur)"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        [matTooltip]="
                          estMoi(utilisateur)
                            ? 'Impossible de désactiver votre propre compte'
                            : 'Désactiver'
                        "
                        [disabled]="estMoi(utilisateur)"
                        (click)="supprimerUtilisateur(utilisateur)"
                      >
                        <mat-icon>person_off</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesUtilisateurs"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesUtilisateurs"></tr>
                </table>
              </div>
              @if (!chargementUtilisateurs() && (utilisateurs()?.contenu?.length ?? 0) === 0) {
                <div class="etat-vide">Aucun utilisateur.</div>
              }
              <mat-paginator
                [length]="utilisateurs()?.total ?? 0"
                [pageSize]="tailleUtilisateurs"
                [pageIndex]="utilisateurs()?.page ?? 0"
                [pageSizeOptions]="[10, 20, 50]"
                (page)="changerPageUtilisateurs($event)"
              />
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Produits de crédit">
          <div class="barre-onglet">
            <span class="compteur">{{ produits().length }} produit(s)</span>
            <button mat-flat-button color="primary" (click)="nouveauProduit()">
              <mat-icon>add</mat-icon> Nouveau produit
            </button>
          </div>

          @if (afficherProduit()) {
            <mat-card class="form-carte">
              <mat-card-header>
                <mat-card-title
                  >{{ editionProduit() ? 'Modifier' : 'Créer' }} un produit de
                  crédit</mat-card-title
                >
              </mat-card-header>
              <mat-card-content>
                <form
                  [formGroup]="produitForm"
                  (ngSubmit)="sauvegarderProduit()"
                  class="formulaire"
                >
                  <mat-form-field appearance="outline">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code" maxlength="20" />
                    @if (produitForm.controls.code.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Libellé</mat-label>
                    <input matInput formControlName="libelle" maxlength="100" />
                    @if (produitForm.controls.libelle.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Taux annuel (%)</mat-label>
                    <input
                      matInput
                      type="number"
                      step="0.001"
                      min="0"
                      formControlName="tauxAnnuel"
                    />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Frais de dossier (%)</mat-label>
                    <input
                      matInput
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      formControlName="fraisDossierPct"
                    />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Durée minimale (mois)</mat-label>
                    <input matInput type="number" step="1" min="1" formControlName="dureeMinMois" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Durée maximale (mois)</mat-label>
                    <input matInput type="number" step="1" min="1" formControlName="dureeMaxMois" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Montant minimum (FCFA)</mat-label>
                    <input matInput type="number" step="1" min="1" formControlName="montantMin" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Montant maximum (FCFA)</mat-label>
                    <input matInput type="number" step="1" min="1" formControlName="montantMax" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Mode d'amortissement</mat-label>
                    <mat-select formControlName="modeAmortissement">
                      <mat-option value="ANNUITE_CONSTANTE">Annuité constante</mat-option>
                      <mat-option value="CAPITAL_CONSTANT">Capital constant</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-slide-toggle formControlName="actif">Produit actif</mat-slide-toggle>
                  <div class="actions">
                    <button mat-button type="button" (click)="annulerProduit()">Annuler</button>
                    <button
                      mat-flat-button
                      color="primary"
                      type="submit"
                      [disabled]="produitForm.invalid || enregistrement()"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          }

          <mat-card>
            <mat-card-content>
              @if (chargementProduits()) {
                <mat-progress-bar mode="indeterminate" />
              }
              <div class="table-scroll">
                <table mat-table [dataSource]="produits()">
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef>Code</th>
                    <td mat-cell *matCellDef="let produit">
                      <strong>{{ produit.code }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="libelle">
                    <th mat-header-cell *matHeaderCellDef>Libellé</th>
                    <td mat-cell *matCellDef="let produit">{{ produit.libelle }}</td>
                  </ng-container>
                  <ng-container matColumnDef="taux">
                    <th mat-header-cell *matHeaderCellDef class="droite">Taux</th>
                    <td mat-cell *matCellDef="let produit" class="droite">
                      {{ produit.tauxAnnuel }} %
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="duree">
                    <th mat-header-cell *matHeaderCellDef>Durée</th>
                    <td mat-cell *matCellDef="let produit">
                      {{ produit.dureeMinMois }} – {{ produit.dureeMaxMois }} mois
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="montants">
                    <th mat-header-cell *matHeaderCellDef class="droite">Montants</th>
                    <td mat-cell *matCellDef="let produit" class="droite montant">
                      {{ produit.montantMin | fcfa }} – {{ produit.montantMax | fcfa }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="frais">
                    <th mat-header-cell *matHeaderCellDef class="droite">Frais</th>
                    <td mat-cell *matCellDef="let produit" class="droite">
                      {{ produit.fraisDossierPct }} %
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="mode">
                    <th mat-header-cell *matHeaderCellDef>Amortissement</th>
                    <td mat-cell *matCellDef="let produit">
                      {{ libelleMode(produit.modeAmortissement) }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actif">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let produit">
                      <span [class]="produit.actif ? 'badge vert' : 'badge rouge'">
                        {{ produit.actif ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="droite">Actions</th>
                    <td mat-cell *matCellDef="let produit" class="droite actions">
                      <button
                        mat-icon-button
                        matTooltip="Modifier"
                        (click)="editerProduit(produit)"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="supprimerProduit(produit)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesProduits"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesProduits"></tr>
                </table>
              </div>
              @if (!chargementProduits() && produits().length === 0) {
                <div class="etat-vide">Aucun produit de crédit.</div>
              }
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Plan comptable">
          <div class="barre-onglet">
            <span class="compteur">{{ comptes().length }} compte(s)</span>
            <button mat-flat-button color="primary" (click)="nouveauCompte()">
              <mat-icon>add</mat-icon> Nouveau compte
            </button>
          </div>

          @if (afficherCompte()) {
            <mat-card class="form-carte">
              <mat-card-header>
                <mat-card-title
                  >{{ editionCompte() ? 'Modifier' : 'Créer' }} un compte comptable</mat-card-title
                >
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="compteForm" (ngSubmit)="sauvegarderCompte()" class="formulaire">
                  <mat-form-field appearance="outline">
                    <mat-label>Numéro</mat-label>
                    <input matInput formControlName="numero" maxlength="10" />
                    @if (compteForm.controls.numero.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Libellé</mat-label>
                    <input matInput formControlName="libelle" maxlength="120" />
                    @if (compteForm.controls.libelle.hasError('required')) {
                      <mat-error>Obligatoire</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Type</mat-label>
                    <mat-select formControlName="type">
                      <mat-option value="ACTIF">Actif</mat-option>
                      <mat-option value="PASSIF">Passif</mat-option>
                      <mat-option value="CHARGE">Charge</mat-option>
                      <mat-option value="PRODUIT">Produit</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <div class="actions">
                    <button mat-button type="button" (click)="annulerCompte()">Annuler</button>
                    <button
                      mat-flat-button
                      color="primary"
                      type="submit"
                      [disabled]="compteForm.invalid || enregistrement()"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          }

          <mat-card>
            <mat-card-content>
              @if (chargementComptes()) {
                <mat-progress-bar mode="indeterminate" />
              }
              <div class="table-scroll">
                <table mat-table [dataSource]="comptes()">
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>Numéro</th>
                    <td mat-cell *matCellDef="let compte">
                      <strong>{{ compte.numero }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="libelle">
                    <th mat-header-cell *matHeaderCellDef>Libellé</th>
                    <td mat-cell *matCellDef="let compte">{{ compte.libelle }}</td>
                  </ng-container>
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let compte">
                      <span [class]="classeType(compte.type)">{{ compte.type }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="droite">Actions</th>
                    <td mat-cell *matCellDef="let compte" class="droite actions">
                      <button mat-icon-button matTooltip="Modifier" (click)="editerCompte(compte)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="supprimerCompte(compte)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="colonnesComptes"></tr>
                  <tr mat-row *matRowDef="let row; columns: colonnesComptes"></tr>
                </table>
              </div>
              @if (!chargementComptes() && comptes().length === 0) {
                <div class="etat-vide">Aucun compte comptable.</div>
              }
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .barre-onglet {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 18px 0 12px;
      }
      .compteur {
        color: #6b7280;
        font-size: 0.9rem;
      }
      .form-carte {
        margin-bottom: 16px;
        border-left: 4px solid #1d4ed8;
      }
      .formulaire {
        align-items: start;
      }
      .formulaire .actions {
        align-self: center;
      }
      .droite {
        text-align: right;
      }
      th.droite {
        text-align: right;
      }
      .table-scroll {
        overflow-x: auto;
      }
      @media (max-width: 600px) {
        .barre-onglet {
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .barre-onglet > button,
        .barre-onglet > a {
          width: 100%;
        }
      }
    `,
  ],
})
export class AdminPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly adminApi = inject(AdminApi);
  private readonly produitApi = inject(ProduitApi);
  private readonly comptaApi = inject(ComptaApi);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly onglet = signal(0);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enregistrement = signal(false);

  protected readonly agences = signal<Agence[]>([]);
  protected readonly utilisateurs = signal<PageResponse<Utilisateur> | null>(null);
  protected readonly produits = signal<ProduitCredit[]>([]);
  protected readonly comptes = signal<CompteComptable[]>([]);

  protected readonly chargementAgences = signal(false);
  protected readonly chargementUtilisateurs = signal(false);
  protected readonly chargementProduits = signal(false);
  protected readonly chargementComptes = signal(false);

  protected readonly afficherAgence = signal(false);
  protected readonly afficherUtilisateur = signal(false);
  protected readonly afficherProduit = signal(false);
  protected readonly afficherCompte = signal(false);

  protected readonly editionAgence = signal<number | null>(null);
  protected readonly editionUtilisateur = signal<number | null>(null);
  protected readonly editionProduit = signal<number | null>(null);
  protected readonly editionCompte = signal<number | null>(null);

  protected readonly colonnesAgences = ['code', 'nom', 'ville', 'active', 'actions'];
  protected readonly colonnesUtilisateurs = [
    'email',
    'nom',
    'role',
    'agence',
    'actif',
    'motDePasse',
    'creeLe',
    'actions',
  ];
  protected readonly colonnesProduits = [
    'code',
    'libelle',
    'taux',
    'duree',
    'montants',
    'frais',
    'mode',
    'actif',
    'actions',
  ];
  protected readonly colonnesComptes = ['numero', 'libelle', 'type', 'actions'];
  protected tailleUtilisateurs = 20;
  protected indexUtilisateurs = 0;

  protected readonly agenceForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(10)]],
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    ville: [''],
    active: [true],
  });

  protected readonly utilisateurForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    nom: ['', [Validators.required, Validators.maxLength(80)]],
    prenom: ['', [Validators.required, Validators.maxLength(80)]],
    role: ['CAISSIER' as Role, Validators.required],
    agenceId: [null as number | null],
    actif: [true],
  });

  protected readonly produitForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    libelle: ['', [Validators.required, Validators.maxLength(100)]],
    tauxAnnuel: [0, [Validators.min(0)]],
    dureeMinMois: [1, [Validators.required, Validators.min(1)]],
    dureeMaxMois: [12, [Validators.required, Validators.min(1)]],
    montantMin: [1, [Validators.required, Validators.min(1)]],
    montantMax: [1, [Validators.required, Validators.min(1)]],
    fraisDossierPct: [0, [Validators.min(0), Validators.max(100)]],
    modeAmortissement: ['ANNUITE_CONSTANTE' as ModeAmortissement, Validators.required],
    actif: [true],
  });

  protected readonly compteForm = this.fb.nonNullable.group({
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    libelle: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['ACTIF' as TypeCompte, Validators.required],
  });

  ngOnInit(): void {
    this.chargerAgences();
    this.chargerUtilisateurs();
    this.chargerProduits();
    this.chargerComptes();
  }

  protected estMoi(utilisateur: Utilisateur): boolean {
    return utilisateur.id === this.auth.utilisateur()?.id;
  }

  protected classeRole(role: Role): string {
    switch (role) {
      case 'ADMIN':
        return 'badge rouge';
      case 'DIRECTEUR':
        return 'badge bleu';
      case 'AGENT_CREDIT':
        return 'badge orange';
      case 'CAISSIER':
        return 'badge vert';
      default:
        return 'badge';
    }
  }

  protected classeType(type: TypeCompte): string {
    switch (type) {
      case 'ACTIF':
        return 'badge bleu';
      case 'PASSIF':
        return 'badge vert';
      case 'PRODUIT':
        return 'badge orange';
      default:
        return 'badge rouge';
    }
  }

  protected libelleMode(mode: ModeAmortissement): string {
    return mode === 'ANNUITE_CONSTANTE' ? 'Annuité constante' : 'Capital constant';
  }

  protected nouvelleAgence(): void {
    this.editionAgence.set(null);
    this.agenceForm.reset({ code: '', nom: '', ville: '', active: true });
    this.afficherAgence.set(true);
  }

  protected editerAgence(agence: Agence): void {
    this.editionAgence.set(agence.id);
    this.agenceForm.reset({
      code: agence.code,
      nom: agence.nom,
      ville: agence.ville ?? '',
      active: agence.active,
    });
    this.afficherAgence.set(true);
  }

  protected annulerAgence(): void {
    this.afficherAgence.set(false);
    this.editionAgence.set(null);
  }

  protected sauvegarderAgence(): void {
    if (this.agenceForm.invalid || this.enregistrement()) {
      this.agenceForm.markAllAsTouched();
      return;
    }
    const valeurs = this.agenceForm.getRawValue();
    const payload: AgenceRequest = {
      code: valeurs.code.trim(),
      nom: valeurs.nom.trim(),
      ville: valeurs.ville.trim() || null,
      active: valeurs.active,
    };
    const id = this.editionAgence();
    const requete = id
      ? this.adminApi.modifierAgence(id, payload)
      : this.adminApi.creerAgence(payload);
    this.enregistrement.set(true);
    requete.subscribe({
      next: (agence) => {
        this.snack.open(`Agence ${agence.code} enregistrée`, 'Fermer', { duration: 3500 });
        this.enregistrement.set(false);
        this.annulerAgence();
        this.chargerAgences();
      },
      error: (err) => this.echec(err),
    });
  }

  protected supprimerAgence(agence: Agence): void {
    this.confirmerSuppression(`Supprimer l'agence ${agence.code} ?`, () => {
      this.adminApi.supprimerAgence(agence.id).subscribe({
        next: () => {
          this.snack.open('Agence supprimée', 'Fermer', { duration: 3000 });
          this.chargerAgences();
        },
        error: (err) => this.echec(err),
      });
    });
  }

  protected nouvelUtilisateur(): void {
    this.editionUtilisateur.set(null);
    this.utilisateurForm.reset({
      email: '',
      nom: '',
      prenom: '',
      role: 'CAISSIER',
      agenceId: null,
      actif: true,
    });
    this.afficherUtilisateur.set(true);
  }

  protected editerUtilisateur(utilisateur: Utilisateur): void {
    this.editionUtilisateur.set(utilisateur.id);
    this.utilisateurForm.reset({
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      agenceId: utilisateur.agenceId,
      actif: utilisateur.actif,
    });
    this.afficherUtilisateur.set(true);
  }

  protected annulerUtilisateur(): void {
    this.afficherUtilisateur.set(false);
    this.editionUtilisateur.set(null);
  }

  protected sauvegarderUtilisateur(): void {
    if (this.utilisateurForm.invalid || this.enregistrement()) {
      this.utilisateurForm.markAllAsTouched();
      return;
    }
    const valeurs = this.utilisateurForm.getRawValue();
    const creation = this.editionUtilisateur() === null;
    if (valeurs.role !== 'ADMIN' && valeurs.role !== 'DIRECTEUR' && !valeurs.agenceId) {
      this.erreur.set('Une agence est obligatoire pour ce rôle.');
      return;
    }
    const payload: UtilisateurRequest = {
      email: valeurs.email.trim(),
      nom: valeurs.nom.trim(),
      prenom: valeurs.prenom.trim(),
      role: valeurs.role as Role,
      agenceId: valeurs.agenceId ?? null,
      actif: valeurs.actif ?? true,
    };
    const id = this.editionUtilisateur();
    const requete = id
      ? this.adminApi.modifierUtilisateur(id, payload)
      : this.adminApi.creerUtilisateur(payload);
    this.enregistrement.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (utilisateur) => {
        this.snack.open(
          creation
            ? `Utilisateur ${utilisateur.email} créé. Le mot de passe temporaire a été envoyé par e-mail.`
            : `Utilisateur ${utilisateur.email} modifié`,
          'Fermer',
          { duration: 5000 },
        );
        this.enregistrement.set(false);
        this.annulerUtilisateur();
        this.chargerUtilisateurs();
      },
      error: (err) => this.echec(err),
    });
  }

  protected supprimerUtilisateur(utilisateur: Utilisateur): void {
    this.confirmerSuppression(
      `Désactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
      () => {
        this.adminApi.supprimerUtilisateur(utilisateur.id).subscribe({
          next: () => {
            this.snack.open('Utilisateur désactivé', 'Fermer', { duration: 3000 });
            this.chargerUtilisateurs();
          },
          error: (err) => this.echec(err),
        });
      },
    );
  }

  protected changerPageUtilisateurs(evenement: PageEvent): void {
    this.indexUtilisateurs = evenement.pageIndex;
    this.tailleUtilisateurs = evenement.pageSize;
    this.chargerUtilisateurs();
  }

  protected nouveauProduit(): void {
    this.editionProduit.set(null);
    this.produitForm.reset({
      code: '',
      libelle: '',
      tauxAnnuel: 0,
      dureeMinMois: 1,
      dureeMaxMois: 12,
      montantMin: 1,
      montantMax: 1,
      fraisDossierPct: 0,
      modeAmortissement: 'ANNUITE_CONSTANTE',
      actif: true,
    });
    this.afficherProduit.set(true);
  }

  protected editerProduit(produit: ProduitCredit): void {
    this.editionProduit.set(produit.id);
    this.produitForm.reset({
      code: produit.code,
      libelle: produit.libelle,
      tauxAnnuel: produit.tauxAnnuel,
      dureeMinMois: produit.dureeMinMois,
      dureeMaxMois: produit.dureeMaxMois,
      montantMin: produit.montantMin,
      montantMax: produit.montantMax,
      fraisDossierPct: produit.fraisDossierPct,
      modeAmortissement: produit.modeAmortissement,
      actif: produit.actif,
    });
    this.afficherProduit.set(true);
  }

  protected annulerProduit(): void {
    this.afficherProduit.set(false);
    this.editionProduit.set(null);
  }

  protected sauvegarderProduit(): void {
    if (this.produitForm.invalid || this.enregistrement()) {
      this.produitForm.markAllAsTouched();
      return;
    }
    const valeurs = this.produitForm.getRawValue();
    if (valeurs.dureeMinMois > valeurs.dureeMaxMois || valeurs.montantMin > valeurs.montantMax) {
      this.erreur.set('Vérifiez les bornes de durée et de montant.');
      return;
    }
    const payload: ProduitCreditRequest = {
      code: valeurs.code.trim(),
      libelle: valeurs.libelle.trim(),
      tauxAnnuel: Number(valeurs.tauxAnnuel),
      dureeMinMois: Number(valeurs.dureeMinMois),
      dureeMaxMois: Number(valeurs.dureeMaxMois),
      montantMin: Number(valeurs.montantMin),
      montantMax: Number(valeurs.montantMax),
      fraisDossierPct: Number(valeurs.fraisDossierPct),
      modeAmortissement: valeurs.modeAmortissement,
      actif: valeurs.actif,
    };
    const id = this.editionProduit();
    const requete = id ? this.produitApi.modifier(id, payload) : this.produitApi.creer(payload);
    this.enregistrement.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (produit) => {
        this.snack.open(`Produit ${produit.code} enregistré`, 'Fermer', { duration: 3500 });
        this.enregistrement.set(false);
        this.annulerProduit();
        this.chargerProduits();
      },
      error: (err) => this.echec(err),
    });
  }

  protected supprimerProduit(produit: ProduitCredit): void {
    this.confirmerSuppression(`Supprimer le produit ${produit.code} ?`, () => {
      this.produitApi.supprimer(produit.id).subscribe({
        next: () => {
          this.snack.open('Produit supprimé', 'Fermer', { duration: 3000 });
          this.chargerProduits();
        },
        error: (err) => this.echec(err),
      });
    });
  }

  protected nouveauCompte(): void {
    this.editionCompte.set(null);
    this.compteForm.reset({ numero: '', libelle: '', type: 'ACTIF' });
    this.afficherCompte.set(true);
  }

  protected editerCompte(compte: CompteComptable): void {
    this.editionCompte.set(compte.id);
    this.compteForm.reset({ numero: compte.numero, libelle: compte.libelle, type: compte.type });
    this.afficherCompte.set(true);
  }

  protected annulerCompte(): void {
    this.afficherCompte.set(false);
    this.editionCompte.set(null);
  }

  protected sauvegarderCompte(): void {
    if (this.compteForm.invalid || this.enregistrement()) {
      this.compteForm.markAllAsTouched();
      return;
    }
    const valeurs = this.compteForm.getRawValue();
    const payload = {
      numero: valeurs.numero.trim(),
      libelle: valeurs.libelle.trim(),
      type: valeurs.type,
    };
    const id = this.editionCompte();
    const requete = id
      ? this.comptaApi.modifierCompte(id, payload)
      : this.comptaApi.creerCompte(payload);
    this.enregistrement.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (compte) => {
        this.snack.open(`Compte ${compte.numero} enregistré`, 'Fermer', { duration: 3500 });
        this.enregistrement.set(false);
        this.annulerCompte();
        this.chargerComptes();
      },
      error: (err) => this.echec(err),
    });
  }

  protected supprimerCompte(compte: CompteComptable): void {
    this.confirmerSuppression(`Supprimer le compte ${compte.numero} — ${compte.libelle} ?`, () => {
      this.comptaApi.supprimerCompte(compte.id).subscribe({
        next: () => {
          this.snack.open('Compte supprimé', 'Fermer', { duration: 3000 });
          this.chargerComptes();
        },
        error: (err) => this.echec(err),
      });
    });
  }

  private confirmerSuppression(message: string, action: () => void): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titre: 'Confirmer la suppression',
          message,
          libelleConfirmer: 'Supprimer',
          danger: true,
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((confirme) => {
        if (confirme === true) {
          action();
        }
      });
  }

  private echec(err: unknown): void {
    this.enregistrement.set(false);
    const message = messageErreur(err);
    this.erreur.set(message);
    this.snack.open(message, 'Fermer', { duration: 5000 });
  }

  private chargerAgences(): void {
    this.chargementAgences.set(true);
    this.adminApi.agences().subscribe({
      next: (liste) => {
        this.agences.set(liste);
        this.chargementAgences.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementAgences.set(false);
      },
    });
  }

  private chargerUtilisateurs(): void {
    this.chargementUtilisateurs.set(true);
    this.adminApi.utilisateurs(this.indexUtilisateurs, this.tailleUtilisateurs).subscribe({
      next: (page) => {
        this.utilisateurs.set(page);
        this.chargementUtilisateurs.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementUtilisateurs.set(false);
      },
    });
  }

  private chargerProduits(): void {
    this.chargementProduits.set(true);
    this.produitApi.lister().subscribe({
      next: (liste) => {
        this.produits.set(liste);
        this.chargementProduits.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementProduits.set(false);
      },
    });
  }

  private chargerComptes(): void {
    this.chargementComptes.set(true);
    this.comptaApi.comptes().subscribe({
      next: (liste) => {
        this.comptes.set(liste);
        this.chargementComptes.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargementComptes.set(false);
      },
    });
  }
}
