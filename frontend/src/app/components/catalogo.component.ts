import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS, Categoria, Producto } from '../models/producto';
import { ProductosService } from '../services/productos.service';
import { CarritoService } from '../services/carrito.service';
import { PrendaComponent } from './prenda.component';
import { ProductoDetalleComponent } from './producto-detalle.component';

type Orden = 'recientes' | 'menor' | 'mayor';
const POR_PAGINA = 8;

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule, PrendaComponent, ProductoDetalleComponent],
  template: `
    <div class="barra">
      <label class="buscar">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input type="search" placeholder="Busca por prenda, color o estampado…" [ngModel]="texto()" (ngModelChange)="texto.set($event); pagina.set(1)" aria-label="Buscar en el catálogo" />
      </label>

      @if (categoriasConStock().length > 1) {
        <div class="grupo">
          <span class="et">Categoría</span>
          <div class="chips">
            <button class="chip" [class.on]="filtro() === 'todos'" (click)="filtrar('todos')">Todo</button>
            @for (c of categoriasConStock(); track c.id) {
              <button class="chip" [class.on]="filtro() === c.id" (click)="filtrar(c.id)">{{ c.nombre }}</button>
            }
          </div>
        </div>
      }

      <div class="fila">
        <div class="grupo">
          <span class="et">Talla</span>
          <div class="chips">
            <button class="chip" [class.on]="talla() === ''" (click)="talla.set(''); pagina.set(1)">Todas</button>
            @for (t of tallasDisponibles(); track t) {
              <button class="chip" [class.on]="talla() === t" (click)="talla.set(t); pagina.set(1)">{{ t }}</button>
            }
          </div>
        </div>
        <label class="orden">
          <span class="et">Ordenar</span>
          <select [ngModel]="orden()" (ngModelChange)="orden.set($event)" aria-label="Ordenar">
            <option value="recientes">Más recientes</option>
            <option value="menor">Precio: menor a mayor</option>
            <option value="mayor">Precio: mayor a menor</option>
          </select>
        </label>
      </div>
    </div>

    <div class="cab">
      <p>{{ filtrados().length }} {{ filtrados().length === 1 ? 'prenda' : 'prendas' }}</p>
      @if (texto() || talla() || filtro() !== 'todos') {
        <button class="limpiar" (click)="limpiar()">Limpiar filtros</button>
      }
    </div>

    @if (servicio.cargando()) {
      <div class="grid">
        @for (n of [1,2,3,4]; track n) { <div class="card esqueleto"></div> }
      </div>
    } @else {
      <div class="grid">
        @for (p of visibles(); track p.id) {
          <article class="card" [class.agotado]="p.stock === 0">
            <button class="foto" type="button" (click)="abrir(p)" [attr.aria-label]="'Ver ' + p.nombre">
              @if (p.imagenUrl) {
                <img [src]="p.imagenUrl" [alt]="p.nombre" loading="lazy" />
              } @else {
                <div class="silueta" [style.background]="fondo(p)"><app-prenda [categoria]="p.categoria" [color]="p.color" /></div>
              }
              @if (p.stock === 0) { <span class="etiqueta">Agotado</span> }
              @else if (p.stock === 1) { <span class="etiqueta">Pieza única</span> }
              @if (p.precioAntes) { <span class="etiqueta oferta">-{{ descuento(p) }}%</span> }
              <span class="ver-rapido">Ver detalle</span>
            </button>
            <div class="info">
              <h3>{{ p.nombre }}</h3>
              <div class="meta">
                <span>Talla {{ p.tallas.join(' · ') }}</span>
                @if (p.largo) { <span>{{ p.largo }}</span> }
              </div>
              <div class="pie">
                <div class="precio">
                  <strong>S/ {{ p.precio }}</strong>
                  @if (p.precioAntes) { <s>S/ {{ p.precioAntes }}</s> }
                </div>
                <button class="ver" type="button" (click)="abrir(p)">Ver</button>
              </div>
              <button class="btn btn-dark full" type="button" (click)="agregar(p)" [disabled]="p.stock === 0">
                {{ p.stock === 0 ? 'Agotado' : (agregado() === p.id ? 'Agregado ✓' : 'Agregar al pedido') }}
              </button>
            </div>
          </article>
        } @empty {
          <div class="vacio">
            <p>No encontramos prendas con esos filtros.</p>
            <button class="btn btn-ghost" (click)="limpiar()">Ver todo el catálogo</button>
          </div>
        }
      </div>

      @if (filtrados().length > visibles().length) {
        <div class="mas">
          <button class="btn btn-ghost" (click)="pagina.set(pagina() + 1)">Ver más prendas ({{ filtrados().length - visibles().length }})</button>
        </div>
      }
    }

    <app-producto-detalle [producto]="seleccionado()" (cerrar)="seleccionado.set(null)" />
  `,
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent {
  servicio = inject(ProductosService);
  carrito = inject(CarritoService);

  filtro = signal<Categoria | 'todos'>('todos');
  talla = signal('');
  texto = signal('');
  orden = signal<Orden>('recientes');
  pagina = signal(1);
  agregado = signal<number | null>(null);
  seleccionado = signal<Producto | null>(null);

  categoriasConStock = computed(() => {
    const usadas = new Set(this.servicio.productos().map(p => p.categoria));
    return CATEGORIAS.filter(c => usadas.has(c.id));
  });

  tallasDisponibles = computed(() => {
    const orden = ['XS', 'S', 'S/M', 'M', 'M/L', 'L', 'XL', 'XXL'];
    const set = new Set(this.servicio.productos().flatMap(p => p.tallas));
    return [...set].sort((a, b) => {
      const ia = orden.indexOf(a), ib = orden.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'es', { numeric: true });
    });
  });

  filtrados = computed(() => {
    const f = this.filtro();
    const t = this.talla();
    const q = this.normalizar(this.texto());
    let lista = this.servicio.productos().filter(p =>
      (f === 'todos' || p.categoria === f) &&
      (!t || p.tallas.includes(t)) &&
      (!q || this.normalizar(`${p.nombre} ${p.descripcion} ${p.largo ?? ''}`).includes(q)));
    if (this.orden() === 'menor') lista = [...lista].sort((a, b) => a.precio - b.precio);
    if (this.orden() === 'mayor') lista = [...lista].sort((a, b) => b.precio - a.precio);
    // lo agotado va al final
    return [...lista].sort((a, b) => Number(a.stock === 0) - Number(b.stock === 0));
  });

  visibles = computed(() => this.filtrados().slice(0, this.pagina() * POR_PAGINA));

  constructor() {
    this.servicio.cargar();
  }

  // lo usa la portada al tocar una categoría
  filtrar(c: Categoria | 'todos') {
    this.filtro.set(c);
    this.pagina.set(1);
  }

  limpiar() {
    this.filtro.set('todos');
    this.talla.set('');
    this.texto.set('');
    this.pagina.set(1);
  }

  abrir(p: Producto) {
    this.seleccionado.set(p);
  }

  fondo(p: Producto) {
    return `linear-gradient(160deg, ${p.color}22, ${p.color}55)`;
  }

  descuento(p: Producto) {
    return Math.round((1 - p.precio / (p.precioAntes || p.precio)) * 100);
  }

  agregar(p: Producto) {
    if (p.tallas.length > 1) {
      // si hay varias tallas se elige en la ficha
      this.abrir(p);
      return;
    }
    this.carrito.agregar(p, p.tallas[0]);
    this.agregado.set(p.id);
    setTimeout(() => this.agregado.set(null), 1400);
  }

  private normalizar(s: string) {
    return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  }
}
