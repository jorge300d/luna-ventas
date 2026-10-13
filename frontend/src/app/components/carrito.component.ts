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
                @if (i.producto.imagenUrl) {
                  <img [src]="i.producto.imagenUrl" [alt]="i.producto.nombre" />
                } @else {
                  <app-prenda [categoria]="i.producto.categoria" [color]="i.producto.color" />
                }
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
          <label class="acepto">
            <input type="checkbox" name="politica" [(ngModel)]="aceptaPolitica" />
            <span>He leído y acepto la <a href="privacidad" target="_blank" rel="noopener">Política de Privacidad</a> y los <a href="terminos" target="_blank" rel="noopener">Términos y Condiciones</a>, incluido el envío de mis datos a los proveedores tecnológicos indicados. *</span>
          </label>
          <label class="acepto">
            <input type="checkbox" name="ofertas" [(ngModel)]="aceptaOfertas" />
            <span>Opcional: quiero recibir ofertas y novedades de Luna Ventas por WhatsApp. No es necesario para comprar y puedo darme de baja respondiendo BAJA.</span>
          </label>
          <div class="total"><span>Total</span><strong>S/ {{ carrito.total() }}</strong></div>
          <button class="btn btn-wa full" type="submit" [disabled]="!nombre.trim() || !aceptaPolitica || enviando()">
            <svg class="wa-ico" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>{{ enviando() ? 'Abriendo WhatsApp…' : 'Enviar pedido por WhatsApp' }}
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
  aceptaOfertas = false;
  aceptaPolitica = false;
  enviando = signal(false);

  enviar() {
    if (!this.nombre.trim() || !this.aceptaPolitica) return;
    this.enviando.set(true);
    const items = this.carrito.items();

    this.api.registrarPedido({
      cliente: this.nombre.trim(),
      telefono: this.telefono.trim(),
      distrito: this.entrega === 'delivery' ? this.distrito.trim() : SITE.distrito,
      entrega: this.entrega,
      aceptaOfertas: this.aceptaOfertas && !!this.telefono.trim(),
      aceptaPolitica: this.aceptaPolitica,
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
