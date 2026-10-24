import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutSegment {
  label: string;
  valeur: number;
  couleur: string;
}

interface ArcCalcule extends DonutSegment {
  dash: string;
  offset: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut-chart">
      <div class="visuel">
        <svg viewBox="0 0 120 120" role="img" [attr.aria-label]="ariaLabel()">
          <circle class="fond" cx="60" cy="60" r="46" />
          @for (arc of arcs(); track arc.label) {
            <circle
              class="arc"
              cx="60"
              cy="60"
              r="46"
              [attr.stroke]="arc.couleur"
              [attr.stroke-dasharray]="arc.dash"
              [attr.stroke-dashoffset]="arc.offset"
              transform="rotate(-90 60 60)"
            >
              <title>{{ arc.label }} : {{ arc.valeur }}</title>
            </circle>
          }
        </svg>
        <div class="centre">
          <strong>{{ centre() }}</strong>
          <small>{{ sousTitre() }}</small>
        </div>
      </div>

      <ul class="legende">
        @for (segment of segments(); track segment.label) {
          <li>
            <i class="pastille" [style.background]="segment.couleur"></i>
            <span class="libelle">{{ segment.label }}</span>
            <strong>{{ segment.valeur }}</strong>
            <small>{{ pourcentage(segment.valeur) }} %</small>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .donut-chart {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
        flex-wrap: wrap;
      }
      .visuel {
        position: relative;
        width: 174px;
        height: 174px;
        flex: 0 0 auto;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .fond,
      .arc {
        fill: none;
        stroke-width: 14;
      }
      .fond {
        stroke: #eef2f7;
      }
      .arc {
        transition: stroke-dasharray 0.35s ease;
      }
      .centre {
        position: absolute;
        inset: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      }
      .centre strong {
        font-size: 1.7rem;
        line-height: 1;
        color: #0f172a;
        font-variant-numeric: tabular-nums;
      }
      .centre small {
        margin-top: 5px;
        color: #64748b;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .legende {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 9px;
        min-width: 190px;
        flex: 1;
      }
      .legende li {
        display: grid;
        grid-template-columns: 10px minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 8px;
        color: #475569;
        font-size: 0.82rem;
      }
      .legende .libelle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .legende strong {
        color: #0f172a;
        font-variant-numeric: tabular-nums;
      }
      .legende small {
        color: #94a3b8;
        font-size: 0.72rem;
        min-width: 38px;
        text-align: right;
      }
      .pastille {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }
      @media (max-width: 520px) {
        .donut-chart {
          gap: 18px;
        }
        .visuel {
          width: 158px;
          height: 158px;
        }
        .legende {
          min-width: 100%;
        }
      }
    `,
  ],
})
export class DonutChart {
  readonly segments = input.required<DonutSegment[]>();
  readonly centre = input('');
  readonly sousTitre = input('');
  readonly ariaLabel = input('Répartition');

  private readonly circonference = 2 * Math.PI * 46;

  private readonly total = computed(() =>
    this.segments().reduce((somme, segment) => somme + Math.max(0, segment.valeur), 0),
  );

  protected readonly arcs = computed<ArcCalcule[]>(() => {
    const segments = this.segments().filter((segment) => segment.valeur > 0);
    const total = this.total();
    if (total <= 0) {
      return [];
    }
    const gap = segments.length > 1 ? 3 : 0;
    let cumul = 0;
    return segments.map((segment) => {
      const longueur = (segment.valeur / total) * this.circonference;
      const arc = {
        ...segment,
        dash: `${Math.max(longueur - gap, 0)} ${this.circonference}`,
        offset: -cumul,
      };
      cumul += longueur;
      return arc;
    });
  });

  protected pourcentage(valeur: number): number {
    const total = this.total();
    return total > 0 ? Math.round((valeur / total) * 100) : 0;
  }
}
