import { Component, inject } from '@angular/core';
import { ConsentimientoService } from '../services/consentimiento.service';

// aviso de cookies que aparece al entrar por primera vez
@Component({
  selector: 'app-aviso-cookies',
  standalone: true,
  template: `
    @if (consentimiento.decision() === null) {
      <section class="aviso" role="dialog" aria-live="polite" aria-labelledby="cookies-titulo">
        <div class="icono" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/><circle cx="7.5" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
        </div>
        <div class="texto">
          <h2 id="cookies-titulo">Tu privacidad en Luna Ventas</h2>
          <p>Usamos cookies y el almacenamiento de tu navegador solo para que la tienda funcione, por ejemplo para recordar las prendas de tu pedido. No usamos publicidad ni rastreo de terceros.</p>
        </div>
        <div class="botones">
          <button class="btn btn-ghost" type="button" (click)="consentimiento.rechazar()">Rechazar</button>
          <button class="btn btn-dark" type="button" (click)="consentimiento.aceptar()">Aceptar</button>
        </div>
      </section>
    }
  `,
  styles: [`
    .aviso { position: fixed; z-index: 80; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(880px, calc(100vw - 32px)); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; padding: 18px 20px; background: var(--blanco); border: 1px solid var(--linea); border-radius: 22px; box-shadow: 0 30px 60px -28px rgba(59, 42, 63, .55); animation: entra .45s cubic-bezier(.2, .8, .2, 1) .4s both; }
    @keyframes entra { from { opacity: 0; transform: translate(-50%, 24px); } }
    .icono { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; color: var(--tinta); background: linear-gradient(135deg, #FBE9A6, #F6B3D6); }
    h2 { margin: 0 0 4px; font: 600 18px var(--serif); color: var(--tinta); }
    p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--suave); }
    .botones { display: flex; gap: 10px; }
    .btn { padding: 12px 22px; justify-content: center; }
    @media (max-width: 720px) {
      .aviso { grid-template-columns: auto 1fr; gap: 12px 14px; padding: 16px; }
      .icono { width: 44px; height: 44px; border-radius: 14px; }
      .botones { grid-column: 1 / -1; }
      .botones .btn { flex: 1; }
    }
    @media (prefers-reduced-motion: reduce) { .aviso { animation: none; } }
  `],
})
export class AvisoCookiesComponent {
  consentimiento = inject(ConsentimientoService);
}
