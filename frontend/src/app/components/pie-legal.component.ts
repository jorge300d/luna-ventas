import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL, SITE } from '../site.config';

// pie con los datos del proveedor y los enlaces legales; va en todas las páginas
@Component({
  selector: 'app-pie-legal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="pie">
      <div class="in">
        <div class="datos">
          <strong>{{ site.nombre }}</strong>
          @if (legal.titular) { <span>{{ legal.titular }}</span> }
          @if (legal.ruc) { <span>RUC {{ legal.ruc }}</span> }
          <span>{{ legal.domicilio || (site.stand + ' · ' + site.distrito) }}</span>
          <span>WhatsApp {{ site.whatsappVisible }}@if (legal.correo) { · {{ legal.correo }} }</span>
          <div class="redes">
            <a [href]="site.tiktok" target="_blank" rel="noopener" aria-label="TikTok de Luna Ventas">
              <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M33.6 6c.5 4.3 2.9 7 7.4 7.3v5c-2.6.3-4.9-.6-7.4-2.1v9.4c0 12-13 15.7-18.3 7.2-3.4-5.5-1.3-15.2 9.6-15.6v5.3c-.8.1-1.7.3-2.5.6-2.4.8-3.8 2.4-3.4 5.2.7 5.3 10.4 6.9 9.6-3.5V6h5z"/></svg>TikTok
            </a>
            <a [href]="site.facebook" target="_blank" rel="noopener" aria-label="Facebook de Luna Ventas">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z"/></svg>Facebook
            </a>
          </div>
        </div>
        <nav aria-label="Información legal">
          <a routerLink="/terminos">Términos y condiciones</a>
          <a routerLink="/privacidad">Política de privacidad</a>
          <a routerLink="/privacidad" fragment="derechos">Tus datos personales</a>
          <a routerLink="/libro-de-reclamaciones" class="libro">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="4" width="22" height="24" rx="2" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M9 4v24" stroke="currentColor" stroke-width="2"/><path d="M13 11h10M13 15h10M13 19h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Libro de Reclamaciones
          </a>
        </nav>
      </div>
      <p class="final">© {{ anio }} {{ site.nombre }} · Precios en soles{{ legal.preciosIncluyenIgv ? ', incluyen IGV' : '' }}.</p>
    </footer>
  `,
  styles: [`
    .pie { border-top: 1px solid var(--linea); padding: 30px 16px 90px; background: #FFFBF5; }
    .in { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .datos { display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; color: var(--suave); }
    .datos strong { font: 600 18px var(--serif); color: var(--tinta); margin-bottom: 4px; }
    .redes { display: flex; gap: 10px; margin-top: 10px; }
    .redes a { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--linea); background: var(--blanco); color: var(--tinta); text-decoration: none; font-size: 13px; font-weight: 600; }
    nav { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
    nav a { color: var(--tinta); }
    .libro { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; text-decoration: none; border: 2px solid var(--tinta); border-radius: 12px; padding: 6px 12px 6px 8px; margin-top: 4px; align-self: flex-start; }
    .final { max-width: 1200px; margin: 22px auto 0; font-size: 12.5px; color: var(--suave); }
  `],
})
export class PieLegalComponent {
  site = SITE;
  legal = LEGAL;
  anio = new Date().getFullYear();
}
