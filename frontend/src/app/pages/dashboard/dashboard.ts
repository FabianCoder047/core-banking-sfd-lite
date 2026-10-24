import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Agence, Dashboard, StatutCredit } from '../../core/models';
import { DashboardApi } from '../../core/services/dashboard-api';
import { AdminApi } from '../../core/services/admin-api';
import { FcfaPipe } from '../../core/fcfa.pipe';
import { messageErreur } from '../../core/error.util';
import { BarChart, GroupeBarres, SerieBarres } from '../../shared/charts/bar-chart';
import { DonutChart, DonutSegment } from '../../shared/charts/donut-chart';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FcfaPipe, BarChart, DonutChart, ...MATERIAL_MODULES],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Bonjour {{ auth.utilisateur()?.prenom }} 👋</h1>
          <div class="sous-titre">
            {{ auth.estGlobal() ? 'Vue consolidée du réseau' : 'Activité de votre agence' }}
            @if (dashboard()?.agenceId) {
              · agence filtrée
            }
          </div>
        </div>
        <div class="actions">
          @if (auth.estGlobal()) {
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filtre-agence">
              <mat-label>Agence</mat-label>
              <mat-select [value]="agenceId()" (valueChange)="changerAgence($event)">
                <mat-option [value]="null">Toutes les agences</mat-option>
                @for (agence of agences(); track agence.id) {
                  <mat-option [value]="agence.id">{{ agence.code }} — {{ agence.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          <a mat-flat-button color="primary" routerLink="/caisse">
            <mat-icon>point_of_sale</mat-icon> Opération de caisse
          </a>
        </div>
      </div>

      @if (erreur(); as message) {
        <div class="encart negatif">{{ message }}</div>
      }

      @if (chargement()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (dashboard(); as d) {
        <div class="grille-kpi">
          <mat-card class="carte-kpi kpi-bleu">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>groups</mat-icon></span>
              <span class="kpi-libelle">Clients</span>
            </div>
            <div class="kpi-valeur">{{ d.nombreClients }}</div>
            <div class="kpi-detail">
              <mat-icon>account_balance_wallet</mat-icon>
              {{ d.comptesActifs }} compte(s) d'épargne actif(s)
            </div>
          </mat-card>

          <mat-card class="carte-kpi kpi-vert">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>savings</mat-icon></span>
              <span class="kpi-libelle">Encours d'épargne</span>
            </div>
            <div class="kpi-valeur">{{ d.encoursEpargne | fcfa }}</div>
            <div class="kpi-detail">
              <mat-icon>trending_up</mat-icon>
              Solde total des comptes actifs
            </div>
          </mat-card>

          <mat-card class="carte-kpi kpi-indigo">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>request_quote</mat-icon></span>
              <span class="kpi-libelle">Encours de crédit</span>
            </div>
            <div class="kpi-valeur">{{ d.encoursCredit | fcfa }}</div>
            <div class="kpi-detail">
              <mat-icon>schedule</mat-icon>
              Capital restant dû · {{ d.creditsDecaisses }} crédit(s)
            </div>
          </mat-card>

          <mat-card class="carte-kpi kpi-ambre">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>pending_actions</mat-icon></span>
              <span class="kpi-libelle">Demandes en attente</span>
            </div>
            <div class="kpi-valeur">{{ d.creditsEnAttente }}</div>
            <div class="kpi-detail">
              <mat-icon>{{ d.creditsEnAttente > 0 ? 'priority_high' : 'check_circle' }}</mat-icon>
              {{ d.creditsEnAttente > 0 ? 'Dossiers à examiner' : 'Aucun dossier à traiter' }}
            </div>
          </mat-card>

          <mat-card class="carte-kpi kpi-rouge">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>warning</mat-icon></span>
              <span class="kpi-libelle">Impayés</span>
            </div>
            <div class="kpi-valeur" [class.negatif]="d.montantImpaye > 0">
              {{ d.montantImpaye | fcfa }}
            </div>
            <div class="kpi-detail">
              <mat-icon>event_busy</mat-icon>
              {{ d.echeancesEnRetard }} échéance(s) en retard
            </div>
          </mat-card>

          <mat-card class="carte-kpi kpi-sarcelle">
            <div class="kpi-haut">
              <span class="kpi-icone"><mat-icon>shield</mat-icon></span>
              <span class="kpi-libelle">Taux de couverture</span>
            </div>
            <div class="kpi-valeur">{{ couverture() }} %</div>
            <div class="kpi-detail">
              <mat-icon>balance</mat-icon>
              Épargne / encours crédit
            </div>
          </mat-card>
        </div>

        <div class="grille-graphiques">
          <mat-card class="carte-graphique graphique-large">
            <mat-card-header>
              <mat-card-title>Flux de trésorerie</mat-card-title>
              <mat-card-subtitle
                >Collecte, décaissements et remboursements · 6 derniers mois</mat-card-subtitle
              >
              <span class="badge-graphique">FCFA</span>
            </mat-card-header>
            <mat-card-content>
              @if (aDesFlux()) {
                <app-bar-chart
                  [data]="groupesFlux()"
                  [series]="seriesFlux"
                  ariaLabel="Flux mensuels de collecte, décaissements et remboursements"
                />
              } @else {
                <div class="etat-vide">
                  <mat-icon class="icone-vide">insights</mat-icon>
                  Aucune opération de caisse sur la période.
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="carte-graphique">
            <mat-card-header>
              <mat-card-title>Répartition des crédits</mat-card-title>
              <mat-card-subtitle>Par statut de dossier</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (segmentsCredits().length > 0) {
                <app-donut-chart
                  [segments]="segmentsCredits()"
                  [centre]="nombreCredits().toString()"
                  sousTitre="crédits"
                  ariaLabel="Répartition des crédits par statut"
                />
              } @else {
                <div class="etat-vide">
                  <mat-icon class="icone-vide">request_quote</mat-icon>
                  Aucun crédit enregistré.
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="carte-graphique">
            <mat-card-header>
              <mat-card-title>Santé du portefeuille</mat-card-title>
              <mat-card-subtitle>Couverture et risque de crédit</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="sante">
                <div class="jauge" [style.background]="jaugeFond()">
                  <div class="jauge-centre">
                    <strong>{{ couverture() }} %</strong>
                    <small>couverture</small>
                  </div>
                </div>
                <div class="sante-infos">
                  <div class="sante-ligne">
                    <span>Encours épargne</span>
                    <strong>{{ d.encoursEpargne | fcfa }}</strong>
                  </div>
                  <div class="sante-ligne">
                    <span>Encours crédit</span>
                    <strong>{{ d.encoursCredit | fcfa }}</strong>
                  </div>
                  <div class="sante-ligne">
                    <span>Montant impayé</span>
                    <strong [class.negatif]="d.montantImpaye > 0">{{
                      d.montantImpaye | fcfa
                    }}</strong>
                  </div>
                  <div class="sante-ligne">
                    <span>Échéances en retard</span>
                    <strong>{{ d.echeancesEnRetard }}</strong>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          @if (d.agences.length > 0) {
            <mat-card class="carte-graphique graphique-large">
              <mat-card-header>
                <mat-card-title>{{
                  auth.estGlobal() ? 'Performance des agences' : 'Activité de votre agence'
                }}</mat-card-title>
                <mat-card-subtitle>Encours et demandes par agence</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="agences">
                  @for (agence of agencesStats(); track agence.agenceId) {
                    <div class="agence-stat">
                      <div class="agence-entete">
                        <strong>{{ agence.code }}</strong>
                        <span>{{ agence.nom }}</span>
                        <small
                          >{{ agence.clients }} client(s) · {{ agence.demandes }} demande(s)</small
                        >
                      </div>
                      <div class="barre-ligne">
                        <span>Épargne</span>
                        <div class="barre-fond">
                          <i class="barre-remplie epargne" [style.width.%]="agence.partEpargne"></i>
                        </div>
                        <strong>{{ agence.epargne | fcfa }}</strong>
                      </div>
                      <div class="barre-ligne">
                        <span>Crédit</span>
                        <div class="barre-fond">
                          <i class="barre-remplie credit" [style.width.%]="agence.partCredit"></i>
                        </div>
                        <strong>{{ agence.credit | fcfa }}</strong>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <div class="deux-colonnes">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Accès rapides</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="raccourcis">
                @if (auth.aRole('ADMIN', 'AGENT_CREDIT', 'CAISSIER', 'DIRECTEUR')) {
                  <a mat-stroked-button routerLink="/clients"
                    ><mat-icon>person_add</mat-icon> Clients</a
                  >
                }
                @if (auth.aRole('ADMIN', 'CAISSIER')) {
                  <a mat-stroked-button routerLink="/caisse"
                    ><mat-icon>payments</mat-icon> Dépôt / retrait</a
                  >
                }
                @if (auth.aRole('ADMIN', 'AGENT_CREDIT')) {
                  <a mat-stroked-button routerLink="/credits/nouveau"
                    ><mat-icon>request_quote</mat-icon> Nouvelle demande</a
                  >
                }
                @if (auth.aRole('ADMIN', 'DIRECTEUR')) {
                  <a mat-stroked-button routerLink="/approbations"
                    ><mat-icon>fact_check</mat-icon> Approbations</a
                  >
                }
                @if (auth.aRole('ADMIN', 'DIRECTEUR', 'COMPTABLE')) {
                  <a mat-stroked-button routerLink="/comptabilite"
                    ><mat-icon>menu_book</mat-icon> Balance</a
                  >
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Repères métier</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ul class="reperes">
                <li>
                  <mat-icon>check_circle</mat-icon> Toute opération génère ses écritures comptables
                  dans la même transaction.
                </li>
                <li>
                  <mat-icon>lock</mat-icon> Les soldes sont mis à jour sous verrou pessimiste.
                </li>
                <li>
                  <mat-icon>history</mat-icon> Les écritures sont immuables : correction uniquement
                  par extourne.
                </li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .grille-kpi {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }
      .carte-kpi {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 152px;
        padding: 18px;
      }
      .kpi-haut {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .kpi-icone {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        flex: 0 0 auto;
      }
      .kpi-icone mat-icon {
        font-size: 21px;
        width: 21px;
        height: 21px;
      }
      .kpi-libelle {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.045em;
        text-transform: uppercase;
      }
      .kpi-valeur {
        display: flex;
        align-items: flex-end;
        min-height: 2.6em;
        margin-top: 14px;
        color: #0f172a;
        font-size: clamp(1.25rem, 2.1vw, 1.6rem);
        font-weight: 700;
        line-height: 1.18;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      .kpi-detail {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: auto;
        padding-top: 10px;
        color: #64748b;
        font-size: 0.78rem;
        line-height: 1.35;
      }
      .kpi-detail mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        color: #94a3b8;
      }
      .kpi-bleu .kpi-icone {
        background: #eff6ff;
        color: #2563eb;
      }
      .kpi-vert .kpi-icone {
        background: #ecfdf5;
        color: #059669;
      }
      .kpi-indigo .kpi-icone {
        background: #eef2ff;
        color: #4f46e5;
      }
      .kpi-ambre .kpi-icone {
        background: #fffbeb;
        color: #d97706;
      }
      .kpi-rouge .kpi-icone {
        background: #fef2f2;
        color: #dc2626;
      }
      .kpi-sarcelle .kpi-icone {
        background: #f0fdfa;
        color: #0f766e;
      }
      .grille-graphiques {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .carte-graphique {
        min-width: 0;
      }
      .graphique-large {
        grid-column: span 2;
      }
      .carte-graphique mat-card-header {
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .carte-graphique mat-card-title {
        font-size: 1rem;
      }
      .carte-graphique mat-card-subtitle {
        margin-top: 3px;
        font-size: 0.78rem;
      }
      .badge-graphique {
        flex: 0 0 auto;
        padding: 3px 9px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .carte-graphique mat-card-content {
        padding-top: 6px;
      }
      .carte-graphique .etat-vide {
        min-height: 190px;
        color: #94a3b8;
      }
      .icone-vide {
        font-size: 38px;
        width: 38px;
        height: 38px;
        color: #cbd5e1;
      }
      .sante {
        display: flex;
        align-items: center;
        gap: 22px;
        flex-wrap: wrap;
        min-height: 190px;
      }
      .jauge {
        width: 138px;
        height: 138px;
        margin: 0 auto;
        padding: 14px;
        border-radius: 50%;
        flex: 0 0 auto;
      }
      .jauge-centre {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 5px 18px rgba(15, 23, 42, 0.08);
      }
      .jauge-centre strong {
        color: #0f172a;
        font-size: 1.45rem;
        line-height: 1;
      }
      .jauge-centre small {
        margin-top: 5px;
        color: #64748b;
        font-size: 0.65rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .sante-infos {
        display: grid;
        gap: 10px;
        min-width: 180px;
        flex: 1;
      }
      .sante-ligne {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eef2f7;
        font-size: 0.8rem;
      }
      .sante-ligne:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .sante-ligne span {
        color: #64748b;
      }
      .sante-ligne strong {
        color: #0f172a;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .agences {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px 26px;
      }
      .agence-stat {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      .agence-entete {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 2px;
      }
      .agence-entete strong {
        padding: 2px 8px;
        border-radius: 6px;
        background: #0f2b46;
        color: #fff;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
      }
      .agence-entete span {
        color: #334155;
        font-size: 0.83rem;
        font-weight: 600;
      }
      .agence-entete small {
        color: #94a3b8;
        font-size: 0.72rem;
      }
      .barre-ligne {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 0.75rem;
      }
      .barre-ligne strong {
        color: #334155;
        font-size: 0.76rem;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .barre-fond {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: #eef2f7;
      }
      .barre-remplie {
        display: block;
        height: 100%;
        border-radius: inherit;
        transition: width 0.35s ease;
      }
      .barre-remplie.epargne {
        background: linear-gradient(90deg, #0f766e, #2dd4bf);
      }
      .barre-remplie.credit {
        background: linear-gradient(90deg, #1d4ed8, #60a5fa);
      }
      .deux-colonnes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .raccourcis {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding-top: 8px;
      }
      .raccourcis a {
        display: inline-flex;
        gap: 6px;
      }
      .reperes {
        list-style: none;
        padding: 0;
        margin: 8px 0 0;
        display: grid;
        gap: 12px;
        color: #4b5563;
        font-size: 0.9rem;
      }
      .reperes li {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .reperes mat-icon {
        color: #0f766e;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .filtre-agence {
        width: 210px;
      }
      @media (max-width: 1100px) {
        .grille-kpi {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .grille-graphiques {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 800px) {
        .grille-graphiques {
          grid-template-columns: 1fr;
        }
        .graphique-large {
          grid-column: span 1;
        }
        .deux-colonnes {
          grid-template-columns: 1fr;
        }
        .sante {
          min-height: 0;
        }
      }
      @media (max-width: 600px) {
        .grille-kpi {
          grid-template-columns: 1fr;
        }
        .carte-kpi {
          min-height: 138px;
          padding: 15px;
        }
        .filtre-agence {
          width: 100%;
        }
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(DashboardApi);
  private readonly adminApi = inject(AdminApi);

  protected readonly dashboard = signal<Dashboard | null>(null);
  protected readonly agences = signal<Agence[]>([]);
  protected readonly agenceId = signal<number | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  private readonly ordreStatuts: StatutCredit[] = [
    'DEMANDE',
    'APPROUVE',
    'DECAISSE',
    'SOLDE',
    'REJETE',
  ];
  private readonly libellesStatuts: Record<StatutCredit, string> = {
    DEMANDE: 'Demandes',
    APPROUVE: 'Approuvés',
    DECAISSE: 'Décaissés',
    SOLDE: 'Soldés',
    REJETE: 'Rejetés',
  };
  private readonly couleursStatuts: Record<StatutCredit, string> = {
    DEMANDE: '#f59e0b',
    APPROUVE: '#3b82f6',
    DECAISSE: '#0f766e',
    SOLDE: '#10b981',
    REJETE: '#ef4444',
  };
  private readonly formatMois = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: '2-digit',
  });

  protected readonly seriesFlux: SerieBarres[] = [
    { nom: 'Collecte', couleur: '#2563eb' },
    { nom: 'Décaissements', couleur: '#f59e0b' },
    { nom: 'Remboursements', couleur: '#0f766e' },
  ];

  protected readonly groupesFlux = computed<GroupeBarres[]>(() =>
    (this.dashboard()?.fluxMensuels ?? []).map((flux) => ({
      libelle: this.libelleMois(flux.mois),
      valeurs: [flux.collecte, flux.decaissements, flux.remboursements],
    })),
  );

  protected readonly aDesFlux = computed(() =>
    this.groupesFlux().some((groupe) => groupe.valeurs.some((valeur) => valeur > 0)),
  );

  protected readonly segmentsCredits = computed<DonutSegment[]>(() => {
    const repartition = this.dashboard()?.repartitionCredits ?? [];
    const parStatut = new Map(repartition.map((ligne) => [ligne.statut, ligne.nombre]));
    return this.ordreStatuts
      .map((statut) => ({
        label: this.libellesStatuts[statut],
        valeur: parStatut.get(statut) ?? 0,
        couleur: this.couleursStatuts[statut],
      }))
      .filter((segment) => segment.valeur > 0);
  });

  protected readonly nombreCredits = computed(() =>
    (this.dashboard()?.repartitionCredits ?? []).reduce((total, ligne) => total + ligne.nombre, 0),
  );

  protected readonly couverture = computed(() => {
    const dashboard = this.dashboard();
    if (!dashboard) {
      return 0;
    }
    if (dashboard.encoursCredit <= 0) {
      return 100;
    }
    return Math.round((dashboard.encoursEpargne / dashboard.encoursCredit) * 100);
  });

  protected readonly jaugeFond = computed(() => {
    const valeur = Math.max(0, Math.min(100, this.couverture()));
    return `conic-gradient(#0f766e 0 ${valeur}%, #e2e8f0 ${valeur}% 100%)`;
  });

  private readonly maxAgence = computed(() => {
    const agences = this.dashboard()?.agences ?? [];
    return Math.max(1, ...agences.flatMap((agence) => [agence.epargne, agence.credit]));
  });

  protected readonly agencesStats = computed(() =>
    [...(this.dashboard()?.agences ?? [])]
      .sort((a, b) => b.epargne + b.credit - (a.epargne + a.credit))
      .map((agence) => ({
        ...agence,
        partEpargne: this.part(agence.epargne),
        partCredit: this.part(agence.credit),
      })),
  );

  ngOnInit(): void {
    if (this.auth.estGlobal()) {
      this.adminApi.agences().subscribe({ next: (liste) => this.agences.set(liste) });
    }
    this.charger();
  }

  protected changerAgence(id: number | null): void {
    this.agenceId.set(id);
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.api.charger(this.agenceId()).subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.chargement.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err));
        this.chargement.set(false);
      },
    });
  }

  private libelleMois(mois: string): string {
    const [annee, numero] = mois.split('-').map(Number);
    return this.formatMois.format(new Date(annee, numero - 1, 1));
  }

  private part(valeur: number): number {
    if (valeur <= 0) {
      return 0;
    }
    return Math.max(4, Math.min(100, (valeur / this.maxAgence()) * 100));
  }
}
