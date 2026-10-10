import { Injectable, computed, effect, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models/producto';

const CLAVE = 'luna-carrito';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  items = signal<ItemCarrito[]>(this.leer());
  abierto = signal(false);

  cantidad = computed(() => this.items().reduce((s, i) => s + i.cantidad, 0));
  total = computed(() => this.items().reduce((s, i) => s + i.cantidad * i.producto.precio, 0));

  constructor() {
    // guardo el carrito para que no se pierda al recargar
    effect(() => {
      try { localStorage.setItem(CLAVE, JSON.stringify(this.items())); } catch {}
    });
  }

  agregar(producto: Producto, talla: string) {
    this.items.update(lista => {
      const existe = lista.find(i => i.producto.id === producto.id && i.talla === talla);
      if (existe) {
        return lista.map(i => i === existe ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...lista, { producto, talla, cantidad: 1 }];
    });
  }

  cambiar(item: ItemCarrito, delta: number) {
    this.items.update(lista => lista
      .map(i => i === item ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0));
  }

  quitar(item: ItemCarrito) {
    this.items.update(lista => lista.filter(i => i !== item));
  }

  vaciar() {
    this.items.set([]);
  }

  private leer(): ItemCarrito[] {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; }
  }
}
