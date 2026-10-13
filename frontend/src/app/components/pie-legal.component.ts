import { Component } from '@angular/core';
import { LogoComponent } from './logo.component';
import { LEGAL, SITE } from '../site.config';

// pie de página: marca, datos de contacto, accesos rápidos y redes
// (los enlaces legales están ocultos por ahora; las páginas siguen existiendo)
@Component({
  selector: 'app-pie-legal',
  standalone: true,
  imports: [LogoComponent],
  template: `
    <footer class="pie">
      <div class="in">
        <div class="marca">
          <div class="logo"><app-logo [size]="46" /><strong>{{ site.nombre }}</strong></div>
          <p>{{ site.lema }}. Piezas únicas seleccionadas en cada fardo.</p>
          <div class="redes">
            <a [href]="site.tiktok" target="_blank" rel="noopener" aria-label="TikTok de Luna Ventas">
              <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M33.6 6c.5 4.3 2.9 7 7.4 7.3v5c-2.6.3-4.9-.6-7.4-2.1v9.4c0 12-13 15.7-18.3 7.2-3.4-5.5-1.3-15.2 9.6-15.6v5.3c-.8.1-1.7.3-2.5.6-2.4.8-3.8 2.4-3.4 5.2.7 5.3 10.4 6.9 9.6-3.5V6h5z"/></svg>
            </a>
            <a [href]="site.facebook" target="_blank" rel="noopener" aria-label="Facebook de Luna Ventas">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z"/></svg>
            </a>
          </div>
        </div>

        <nav class="col" aria-label="Accesos">
          <h4>Tienda</h4>
          <a href="/#catalogo">Catálogo</a>
          <a href="/#lives">Lives en TikTok</a>
          <a href="/#como-comprar">Cómo comprar</a>
          <a href="/#contacto">Contacto</a>
        </nav>

        <div class="col">
          <h4>Visítanos</h4>
          <span>{{ legal.domicilio || (site.direccion + ', Lima') }}</span>
          <a [href]="site.mapaLink" target="_blank" rel="noopener">Ver en Google Maps</a>
        </div>

        <div class="col">
          <h4>Atención</h4>
          <span>WhatsApp {{ site.whatsappVisible }}</span>
          <span>Pagos: Yape, Plin o transferencia</span>
          @if (legal.correo) { <span>{{ legal.correo }}</span> }
        </div>
      </div>

      <div class="final">
        <span>© {{ anio }} {{ site.nombre }}@if (legal.ruc) { · RUC {{ legal.ruc }}}</span>
        <span>Precios en soles{{ legal.preciosIncluyenIgv ? ', incluyen IGV' : '' }}</span>
      </div>
    </footer>
  `,
  styles: [`
    .pie { background: var(--tinta); color: #E9DCE5; padding: 56px 16px 100px; }
    .in { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 36px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo strong { font: 600 22px var(--serif); color: #fff; }
    .marca p { margin: 14px 0 18px; font-size: 14px; line-height: 1.6; color: #C9B7C6; max-width: 300px; }
    .redes { display: flex; gap: 10px; }
    .redes a { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: #fff; border: 1px solid rgba(255,255,255,.22); transition: background .2s, border-color .2s; }
    .redes a:hover { background: var(--rosa-fuerte); border-color: var(--rosa-fuerte); }
    .col { display: flex; flex-direction: column; gap: 9px; font-size: 14px; }
    h4 { margin: 0 0 6px; font: 600 12px var(--sans); letter-spacing: .14em; text-transform: uppercase; color: #F6B3D6; }
    .col a { color: #E9DCE5; text-decoration: none; }
    .col a:hover { color: #fff; text-decoration: underline; }
    .final { max-width: 1200px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.12); display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12.5px; color: #A996A6; }
    @media (max-width: 860px) { .in { grid-template-columns: 1fr 1fr; } .marca { grid-column: 1 / -1; } }
    @media (max-width: 480px) { .in { grid-template-columns: 1fr; gap: 28px; } .pie { padding-top: 44px; } }
  `],
})
export class PieLegalComponent {
  site = SITE;
  legal = LEGAL;
  anio = new Date().getFullYear();
}
