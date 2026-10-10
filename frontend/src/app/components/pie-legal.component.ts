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
