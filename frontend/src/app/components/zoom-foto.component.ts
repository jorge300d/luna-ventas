import { Component, input, output, signal } from '@angular/core';
import { LogoComponent } from './logo.component';

// zoom a pantalla completa con el fondo de estudio de Luna Ventas
// rueda o botones para acercar, arrastrar para mover, doble clic alterna (Esc lo maneja la ficha)
@Component({
  selector: 'app-zoom-foto',
  standalone: true,
  imports: [LogoComponent],
  template: `
    <div class="zoom estudio" role="dialog" aria-modal="true" [attr.aria-label]="'Zoom: ' + alt()" (wheel)="rueda($event)">
      <div class="marca"><app-logo [size]="40" /><span>Luna Ventas</span></div>
      <button class="x" type="button" (click)="cerrar.emit()" aria-label="Cerrar zoom">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <div class="lienzo" [class.mueve]="arrastrando()"
        (pointerdown)="bajar($event)" (pointermove)="mover($event)" (pointerup)="subir()" (pointercancel)="subir()"
        (dblclick)="alternar()">
        <img [src]="src()" [alt]="alt()" draggable="false"
          [style.transform]="'translate(' + x() + 'px,' + y() + 'px) scale(' + escala() + ')'" />
      </div>

      <div class="barra">
        <button type="button" (click)="cambiar(-0.5)" [disabled]="escala() <= 1" aria-label="Alejar">−</button>
        <span>{{ (escala() * 100).toFixed(0) }}%</span>
        <button type="button" (click)="cambiar(0.5)" [disabled]="escala() >= 4" aria-label="Acercar">+</button>
        <button type="button" class="txt" (click)="reiniciar()" [disabled]="escala() === 1">Restablecer</button>
      </div>
    </div>
  `,
  styles: [`
    .zoom { position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; animation: aparece .2s ease; }
    @keyframes aparece { from { opacity: 0; } }
    .marca { position: absolute; left: 16px; top: 14px; z-index: 2; display: flex; align-items: center; gap: 10px; font: 600 22px var(--serif); color: var(--tinta); pointer-events: none; }
    .x { position: absolute; top: 14px; right: 14px; z-index: 3; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--linea); background: rgba(255,255,255,.92); color: var(--tinta); display: grid; place-items: center; cursor: pointer; }
    .lienzo { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; cursor: grab; touch-action: none; user-select: none; padding: 64px 16px 8px; }
    .lienzo.mueve { cursor: grabbing; }
    .lienzo img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 22px 26px rgba(59,42,63,.18)); transition: transform .15s ease-out; pointer-events: none; }
    .lienzo.mueve img { transition: none; }
    .barra { align-self: center; display: flex; align-items: center; gap: 6px; margin: 0 0 calc(16px + env(safe-area-inset-bottom, 0px)); padding: 6px; background: rgba(255,255,255,.94); border: 1px solid var(--linea); border-radius: 999px; box-shadow: 0 14px 30px -16px rgba(59,42,63,.5); }
    .barra button { min-width: 42px; height: 42px; border-radius: 999px; border: 0; background: var(--crema); color: var(--tinta); font: 600 20px var(--sans); cursor: pointer; }
    .barra button.txt { font-size: 13px; padding: 0 14px; }
    .barra button:disabled { opacity: .4; cursor: not-allowed; }
    .barra span { min-width: 52px; text-align: center; font: 600 13px var(--sans); color: var(--suave); }
  `],
})
export class ZoomFotoComponent {
  src = input.required<string>();
  alt = input('');
  cerrar = output<void>();

  escala = signal(1);
  x = signal(0);
  y = signal(0);
  arrastrando = signal(false);

  private px = 0;
  private py = 0;

  cambiar(d: number) {
    const e = Math.min(4, Math.max(1, this.escala() + d));
    this.escala.set(e);
    if (e === 1) { this.x.set(0); this.y.set(0); }
  }

  alternar() { this.escala() > 1 ? this.reiniciar() : this.escala.set(2.5); }

  reiniciar() { this.escala.set(1); this.x.set(0); this.y.set(0); }

  rueda(e: WheelEvent) {
    e.preventDefault();
    this.cambiar(e.deltaY < 0 ? 0.25 : -0.25);
  }

  bajar(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.arrastrando.set(true);
    this.px = e.clientX;
    this.py = e.clientY;
  }

  mover(e: PointerEvent) {
    if (!this.arrastrando() || this.escala() === 1) return;
    this.x.update(v => v + e.clientX - this.px);
    this.y.update(v => v + e.clientY - this.py);
    this.px = e.clientX;
    this.py = e.clientY;
  }

  subir() { this.arrastrando.set(false); }
}
