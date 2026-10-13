import { Component, inject } from '@angular/core';
import { ConsentimientoService } from '../services/consentimiento.service';

// aviso de cookies que aparece al entrar por primera vez
@Component({
  selector: 'app-aviso-cookies',
  standalone: true,
  template: `
    @if (consentimiento.decision() === null) {
      <section class="aviso" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
        <p>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/></svg>
          Usamos cookies solo para que la tienda funcione. Sin publicidad.
        </p>
        <div class="botones">
          <button class="b no" type="button" (click)="consentimiento.rechazar()">Rechazar</button>
          <button class="b si" type="button" (click)="consentimiento.aceptar()">Aceptar</button>
        </div>
      </section>
    }
  `,
  styles: [`
    .aviso { position: fixed; z-index: 80; left: 20px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); width: min(420px, calc(100vw - 32px)); display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 14px; background: var(--blanco); border: 1px solid var(--linea); border-radius: 16px; box-shadow: 0 18px 40px -24px rgba(59, 42, 63, .5); animation: entra .4s ease .5s both; }
    @keyframes entra { from { opacity: 0; transform: translateY(12px); } }
    p { margin: 0; flex: 1; display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; line-height: 1.45; color: var(--suave); }
    p svg { flex: none; color: var(--rosa-fuerte); margin-top: 1px; }
    .botones { display: flex; gap: 6px; flex: none; }
    .b { border-radius: 999px; padding: 7px 13px; font: 600 12.5px var(--sans); cursor: pointer; border: 1px solid var(--linea); }
    .no { background: #fff; color: var(--tinta); }
    .si { background: var(--tinta); color: #fff; border-color: var(--tinta); }
    .b:hover { filter: brightness(.96); }
    @media (max-width: 480px) { .aviso { left: 16px; right: 16px; width: auto; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); } }
    @media (prefers-reduced-motion: reduce) { .aviso { animation: none; } }
  `],
})
export class AvisoCookiesComponent {
  consentimiento = inject(ConsentimientoService);
}
