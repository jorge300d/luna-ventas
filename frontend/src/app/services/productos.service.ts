import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, switchMap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { PedidoRequest, Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  origen = signal<'api' | 'local'>('api');

  cargar() {
    this.cargando.set(true);
    // primero intenta la API; si no responde (ej. Render dormido) usa el json local
    this.http.get<Producto[]>(`${environment.apiUrl}/productos`).pipe(
      timeout(6000),
      catchError(() => {
        this.origen.set('local');
        return this.http.get<Producto[]>('data/productos.json');
      }),
      catchError(() => of([] as Producto[])),
    ).subscribe(lista => {
      this.productos.set(lista);
      this.cargando.set(false);
    });
  }

  registrarPedido(pedido: PedidoRequest) {
    // si falla no bloquea, el pedido igual se manda por WhatsApp
    return this.http.post<{ id: number }>(`${environment.apiUrl}/pedidos`, pedido).pipe(
      timeout(6000),
      catchError(() => of(null)),
    );
  }

  enviarContacto(datos: { nombre: string; telefono: string; mensaje: string }) {
    return this.http.post(`${environment.apiUrl}/contactos`, datos).pipe(
      timeout(6000),
      catchError(() => of(null)),
    );
  }
}
