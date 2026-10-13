import { Component, HostListener, computed, effect, inject, input, output, signal } from '@angular/core';
import { Producto } from '../models/producto';
import { CarritoService } from '../services/carrito.service';
import { PrendaComponent } from './prenda.component';
import { VisorPrendaComponent } from './visor-prenda.component';
import { linkWhatsapp } from '../site.config';

// ficha de la prenda: visor que gira y se voltea, detalles, talla y botones de compra
@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [PrendaComponent, VisorPrendaComponent],
  template: `
    @if (producto(); as p) {
      <div class="velo" (click)="cerrar.emit()"></div>
      <div class="ficha" role="dialog" aria-modal="true" [attr.aria-label]="p.nombre">
        <button class="x" type="button" (click)="cerrar.emit()" aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>

        <div class="foto">
          @if (p.imagenUrl) {
            <app-visor-prenda [producto]="p" />
          } @else {
            <div class="silueta"><app-prenda [categoria]="p.categoria" [color]="p.color" /></div>
          }
          @if (p.stock === 1) { <span class="sello">Pieza única</span> }
        </div>

        <div class="info">
          <p class="cat">Ropa americana · {{ nombreCategoria(p.categoria) }}</p>
          <h2>{{ p.nombre }}</h2>
          <div class="precio">
            <strong>S/ {{ p.precio }}</strong>
            @if (p.precioAntes) { <s>S/ {{ p.precioAntes }}</s> }
          </div>
          <p class="desc">{{ p.descripcion }}</p>

          <div class="bloque">
            <span class="et">Talla</span>
            <div class="tallas" role="radiogroup" aria-label="Talla">
              @for (t of p.tallas; track t) {
                <button type="button" class="talla" [class.on]="talla() === t" (click)="talla.set(t)" role="radio" [attr.aria-checked]="talla() === t">{{ t }}</button>
              }
            </div>
          </div>

          @if (p.largo) {
            <div class="bloque">
              <span class="et">Largo</span>
              <div class="escala" [attr.aria-label]="'Largo ' + p.largo">
                @for (l of largos; track l) {
                  <span class="paso" [class.on]="l === p.largo" [class.lleno]="nivel(l) <= nivel(p.largo)">{{ l }}</span>
                }
              </div>
            </div>
          }

          <ul class="datos">
            <li><span>Disponibles</span><b>{{ p.stock === 0 ? 'Agotado' : p.stock === 1 ? '1 unidad' : p.stock + ' unidades' }}</b></li>
            <li><span>Entrega</span><b>Recojo en tienda o delivery en Lima</b></li>
            <li><span>Pago</span><b>Yape, Plin o transferencia</b></li>
          </ul>

          <div class="acciones">
            <button class="btn btn-dark" type="button" (click)="agregar(p)" [disabled]="p.stock === 0">
              {{ p.stock === 0 ? 'Agotado' : agregado() ? 'Agregado al pedido ✓' : 'Agregar al pedido' }}
            </button>
            <a class="btn btn-wa" [href]="consulta(p)" target="_blank" rel="noopener">
              <svg class="wa-ico" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>
              Preguntar medidas
            </a>
          </div>
          @if (p.stock === 1) {
            <p class="nota">Es una pieza única de ropa americana: queda separada cuando confirmas tu pedido por WhatsApp.</p>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './producto-detalle.component.css',
})
export class ProductoDetalleComponent {
  carrito = inject(CarritoService);
  producto = input<Producto | null>(null);
  cerrar = output<void>();

  largos = ['corto', 'midi', 'maxi'] as const;
  talla = signal('');
  agregado = signal(false);

  constructor() {
    // al abrir otra prenda se reinicia la ficha y se bloquea el scroll de fondo
    effect(() => {
      const p = this.producto();
      this.talla.set(p?.tallas[0] ?? '');
      this.agregado.set(false);
      document.body.style.overflow = p ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  esc() {
    if (this.producto()) this.cerrar.emit();
  }

  nivel(l: string) {
    return this.largos.indexOf(l as typeof this.largos[number]);
  }

  nombreCategoria(c: string) {
    return { blusas: 'Blusas', vestidos: 'Vestidos', pantalones: 'Pantalones', conjuntos: 'Conjuntos', casacas: 'Casacas', pijamas: 'Pijamas', ninos: 'Niños' }[c] ?? c;
  }

  agregar(p: Producto) {
    this.carrito.agregar(p, this.talla() || p.tallas[0]);
    this.agregado.set(true);
    setTimeout(() => {
      this.cerrar.emit();
      this.carrito.abierto.set(true);
    }, 700);
  }

  consulta(p: Producto) {
    return linkWhatsapp(`Hola Luna Ventas, me interesa el ${p.nombre} (talla ${this.talla() || p.tallas[0]}, S/ ${p.precio}). ¿Me pasan sus medidas?`);
  }
}
