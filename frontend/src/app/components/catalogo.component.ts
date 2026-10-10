import { Component, computed, inject, signal } from '@angular/core';
import { CATEGORIAS, Categoria, Producto } from '../models/producto';
import { ProductosService } from '../services/productos.service';
import { CarritoService } from '../services/carrito.service';
import { PrendaComponent } from './prenda.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [PrendaComponent],
  template: `
    <div class="filtros" role="tablist" aria-label="Filtrar por categoría">
      <button class="chip" [class.on]="filtro() === 'todos'" (click)="filtro.set('todos')">Todo</button>
      @for (c of categorias; track c.id) {
        <button class="chip" [class.on]="filtro() === c.id" (click)="filtro.set(c.id)">{{ c.nombre }}</button>
      }
    </div>

    @if (servicio.cargando()) {
      <div class="grid">
        @for (n of [1,2,3,4]; track n) { <div class="card esqueleto"></div> }
      </div>
    } @else {
      <div class="grid">
        @for (p of visibles(); track p.id) {
          <article class="card">
            <div class="foto" [style.background]="fondo(p)">
              @if (p.imagenUrl) {
                <img [src]="p.imagenUrl" [alt]="p.nombre" loading="lazy" />
              } @else {
                <div class="silueta"><app-prenda [categoria]="p.categoria" [color]="p.color" /></div>
              }
              @if (p.nuevo) { <span class="etiqueta">Nuevo</span> }
              @if (p.precioAntes) { <span class="etiqueta oferta">-{{ descuento(p) }}%</span> }
            </div>
            <div class="info">
              <h3>{{ p.nombre }}</h3>
              <p class="desc">{{ p.descripcion }}</p>
              <div class="precio">
                <strong>S/ {{ p.precio }}</strong>
                @if (p.precioAntes) { <s>S/ {{ p.precioAntes }}</s> }
              </div>
              <div class="tallas" role="radiogroup" [attr.aria-label]="'Talla de ' + p.nombre">
                @for (t of p.tallas; track t) {
                  <button class="talla" [class.on]="tallaDe(p) === t" (click)="elegir(p, t)">{{ t }}</button>
                }
              </div>
              <button class="btn btn-dark full" (click)="agregar(p)" [disabled]="p.stock === 0">
                {{ p.stock === 0 ? 'Agotado' : (agregado() === p.id ? 'Agregado ✓' : 'Agregar al pedido') }}
              </button>
            </div>
          </article>
        } @empty {
          <p class="vacio">No hay prendas en esta categoría por ahora. Escríbenos y te mostramos lo que llegó.</p>
        }
      </div>
    }
  `,
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent {
  servicio = inject(ProductosService);
  carrito = inject(CarritoService);
  categorias = CATEGORIAS;

  filtro = signal<Categoria | 'todos'>('todos');
  tallas = signal<Record<number, string>>({});
  agregado = signal<number | null>(null);

  visibles = computed(() => {
    const f = this.filtro();
    return this.servicio.productos().filter(p => f === 'todos' || p.categoria === f);
  });

  constructor() {
    this.servicio.cargar();
  }

  fondo(p: Producto) {
    return `linear-gradient(160deg, ${p.color}22, ${p.color}55)`;
  }

  descuento(p: Producto) {
    return Math.round((1 - p.precio / (p.precioAntes || p.precio)) * 100);
  }

  tallaDe(p: Producto) {
    return this.tallas()[p.id] ?? p.tallas[0];
  }

  elegir(p: Producto, t: string) {
    this.tallas.update(m => ({ ...m, [p.id]: t }));
  }

  agregar(p: Producto) {
    this.carrito.agregar(p, this.tallaDe(p));
    this.agregado.set(p.id);
    setTimeout(() => this.agregado.set(null), 1400);
  }
}
