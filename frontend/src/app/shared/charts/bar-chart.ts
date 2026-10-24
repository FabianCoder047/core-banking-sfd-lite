import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface SerieBarres {
  nom: string;
  couleur: string;
}

export interface GroupeBarres {
  libelle: string;
  valeurs: number[];
}

interface BarreCalculee {
  nom: string;
  valeur: number;
  x: number;
  y: number;
  hauteur: number;
}

interface GroupeCalcule {
  libelle: string;
  x: number;
  barres: BarreCalculee[];
}

interface GrilleCalculee {
  y: number;
  libelle: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar-chart">
      <svg viewBox="0 0 640 280" role="img" [attr.aria-label]="ariaLabel()">
        @for (grille of grilles(); track $index) {
          <line
            class="grille"
            [attr.x1]="gauche"
            [attr.x2]="largeur - droite"
            [attr.y1]="grille.y"
            [attr.y2]="grille.y"
          />
          <text class="axe" [attr.x]="gauche - 8" [attr.y]="grille.y + 4" text-anchor="end">
            {{ grille.libelle }}
          </text>
        }

        @for (groupe of groupes(); track groupe.libelle) {
          @for (barre of groupe.barres; track barre.nom; let index = $index) {
            <rect
              [attr.x]="barre.x"
              [attr.y]="barre.y"
              [attr.width]="largeurRect()"
              [attr.height]="barre.hauteur"
              rx="4"
              [attr.fill]="series()[index].couleur"
            >
              <title>
                {{ groupe.libelle }} — {{ barre.nom }} : {{ formaterMontant(barre.valeur) }}
              </title>
            </rect>
          }
          <text class="axe" [attr.x]="groupe.x" [attr.y]="hauteur - 12" text-anchor="middle">
            {{ groupe.libelle }}
          </text>
        }
      </svg>

      <div class="legende">
        @for (serie of series(); track serie.nom) {
          <span>
            <i class="pastille" [style.background]="serie.couleur"></i>
            {{ serie.nom }}
          </span>
        }
        <small>Montants en FCFA</small>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .bar-chart {
        width: 100%;
      }
      svg {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      .grille {
        stroke: #e2e8f0;
        stroke-width: 1;
        stroke-dasharray: 3 5;
      }
      .axe {
        fill: #64748b;
        font-size: 11px;
        font-weight: 500;
      }
      .legende {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 8px 20px;
        margin-top: 6px;
        color: #475569;
        font-size: 0.8rem;
      }
      .legende span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .legende small {
        color: #94a3b8;
        font-size: 0.72rem;
      }
      .pastille {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }
    `,
  ],
})
export class BarChart {
  readonly data = input.required<GroupeBarres[]>();
  readonly series = input.required<SerieBarres[]>();
  readonly ariaLabel = input('Graphique de statistiques');

  protected readonly largeur = 640;
  protected readonly hauteur = 280;
  protected readonly gauche = 58;
  protected readonly droite = 12;
  protected readonly haut = 18;
  protected readonly bas = 42;

  private readonly nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  private readonly compact = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  private readonly maxValeur = computed(() => {
    const valeurs = this.data().flatMap((groupe) => groupe.valeurs);
    return Math.max(1, ...valeurs);
  });

  protected readonly largeurBarre = computed(() => {
    const interieur = this.largeur - this.gauche - this.droite;
    const largeurGroupe = interieur / Math.max(1, this.data().length);
    const nombreSeries = Math.max(1, this.series().length);
    return Math.min(26, (largeurGroupe * 0.72) / nombreSeries);
  });

  protected readonly largeurRect = computed(() => Math.max(5, this.largeurBarre() - 3));

  protected readonly grilles = computed<GrilleCalculee[]>(() => {
    const max = this.maxValeur();
    const interieur = this.hauteur - this.haut - this.bas;
    return Array.from({ length: 5 }, (_, index) => ({
      y: this.haut + (interieur * index) / 4,
      libelle: this.compact.format(max * (1 - index / 4)),
    }));
  });

  protected readonly groupes = computed<GroupeCalcule[]>(() => {
    const donnees = this.data();
    const series = this.series();
    const max = this.maxValeur();
    const interieurLargeur = this.largeur - this.gauche - this.droite;
    const interieurHauteur = this.hauteur - this.haut - this.bas;
    const largeurGroupe = interieurLargeur / Math.max(1, donnees.length);
    const largeurBarre = this.largeurBarre();

    return donnees.map((groupe, indexGroupe) => {
      const centre = this.gauche + largeurGroupe * indexGroupe + largeurGroupe / 2;
      const debut = centre - (largeurBarre * series.length) / 2;

      return {
        libelle: groupe.libelle,
        x: centre,
        barres: series.map((serie, indexSerie) => {
          const valeur = groupe.valeurs[indexSerie] ?? 0;
          const hauteur = valeur > 0 ? Math.max(2, (valeur / max) * interieurHauteur) : 0;
          return {
            nom: serie.nom,
            valeur,
            x: debut + indexSerie * largeurBarre + 1.5,
            y: this.haut + interieurHauteur - hauteur,
            hauteur,
          };
        }),
      };
    });
  });

  protected formaterMontant(valeur: number): string {
    return `${this.nombre.format(valeur)} FCFA`;
  }
}
