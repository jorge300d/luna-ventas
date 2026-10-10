import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../services/carrito.service';
import { ProductosService } from '../services/productos.service';
import { PrendaComponent } from './prenda.component';
import { SITE, linkWhatsapp } from '../site.config';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [FormsModule, PrendaComponent],
  template: `
    <div class="fondo" [class.on]="carrito.abierto()" (click)="carrito.abierto.set(false)"></div>
    <aside class="panel" [class.on]="carrito.abierto()" aria-label="Tu pedido" [attr.aria-hidden]="!carrito.abierto()">
      <header>
        <h2>Tu pedido</h2>
        <button class="cerrar" (click)="carrito.abierto.set(false)" aria-label="Cerrar">×</button>
      </header>

      @if (carrito.items().length === 0) {
        <div class="vacio">
          <p>Aún no agregas prendas.</p>
          <a href="#catalogo" class="btn btn-dark" (click)="carrito.abierto.set(false)">Ver catálogo</a>
        </div>
      } @else {
        <ul class="items">
          @for (i of carrito.items(); track i.producto.id + i.talla) {
            <li>
              <div class="mini" [style.background]="i.producto.color + '33'">
                <app-prenda [categoria]="i.producto.categoria" [color]="i.producto.color" />
              </div>
              <div class="det">
                <strong>{{ i.producto.nombre }}</strong>
                <span>Talla {{ i.talla }} · S/ {{ i.producto.precio }}</span>
                <div class="cant">
                  <button (click)="carrito.cambiar(i, -1)" aria-label="Quitar uno">−</button>
                  <span>{{ i.cantidad }}</span>
                  <button (click)="carrito.cambiar(i, 1)" aria-label="Agregar uno">+</button>
                </div>
              </div>
              <button class="quitar" (click)="carrito.quitar(i)">Quitar</button>
            </li>
          }
        </ul>

        <form class="datos" (ngSubmit)="enviar()">
          <label>Tu nombre
            <input name="nombre" [(ngModel)]="nombre" required placeholder="Ej. Rosa" />
          </label>
          <label>Celular
            <input name="telefono" [(ngModel)]="telefono" inputmode="tel" placeholder="9XX XXX XXX" />
          </label>
          <div class="entrega">
            <label class="op"><input type="radio" name="entrega" value="tienda" [(ngModel)]="entrega" /> Recojo en tienda</label>
            <label class="op"><input type="radio" name="entrega" value="delivery" [(ngModel)]="entrega" /> Delivery</label>
          </div>
          @if (entrega === 'delivery') {
            <label>Distrito
              <input name="distrito" [(ngModel)]="distrito" placeholder="Ej. Jesús María" />
            </label>
          }
          <div class="total"><span>Total</span><strong>S/ {{ carrito.total() }}</strong></div>
          <button class="btn btn-wa full" type="submit" [disabled]="!nombre.trim() || enviando()">
            {{ enviando() ? 'Abriendo WhatsApp…' : 'Enviar pedido por WhatsApp' }}
          </button>
          <p class="nota">Confirmamos stock y te pasamos el Yape o Plin por WhatsApp.</p>
        </form>
      }
    </aside>
  `,
  styleUrl: './carrito.component.css',
})
export class CarritoComponent {
  carrito = inject(CarritoService);
  api = inject(ProductosService);

  nombre = '';
  telefono = '';
  distrito = '';
  entrega: 'tienda' | 'delivery' = 'tienda';
  enviando = signal(false);

  enviar() {
    if (!this.nombre.trim()) return;
    this.enviando.set(true);
    const items = this.carrito.items();

    this.api.registrarPedido({
      cliente: this.nombre.trim(),
      telefono: this.telefono.trim(),
      distrito: this.entrega === 'delivery' ? this.distrito.trim() : SITE.distrito,
      entrega: this.entrega,
      items: items.map(i => ({ productoId: i.producto.id, talla: i.talla, cantidad: i.cantidad })),
    }).subscribe(res => {
      const lineas = items.map(i => `- ${i.cantidad} x ${i.producto.nombre} (talla ${i.talla}) S/ ${i.cantidad * i.producto.precio}`);
      const msg = [
        `Hola Luna Ventas, soy ${this.nombre.trim()}. Quiero hacer este pedido:`,
        ...lineas,
        `Total: S/ ${this.carrito.total()}`,
        this.entrega === 'delivery' ? `Delivery a: ${this.distrito || 'por confirmar'}` : 'Recojo en tienda',
        res?.id ? `N° de pedido: ${res.id}` : '',
      ].filter(Boolean).join('\n');

      window.open(linkWhatsapp(msg), '_blank');
      this.carrito.vaciar();
      this.carrito.abierto.set(false);
      this.enviando.set(false);
    });
  }
}
