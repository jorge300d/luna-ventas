import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

export interface Resumen {
  clientes: number;
  aceptanOfertas: number;
  pedidos: number;
  ventas: number;
  campanas: number;
  whatsappConectado: boolean;
}

export interface Cliente {
  id: number;
  nombre: string | null;
  telefono: string;
  distrito: string | null;
  origen: 'web_pedido' | 'web_contacto' | 'whatsapp' | 'manual';
  aceptaOfertas: boolean;
  aceptaEn: string | null;
  intereses: string;
  totalPedidos: number;
  totalGastado: number;
  ultimoContacto: string | null;
}

export interface Campana {
  id: number;
  titulo: string;
  mensaje: string;
  categoria: string | null;
  estado: 'borrador' | 'programada' | 'enviando' | 'enviada';
  automatica: boolean;
  programadaEn: string | null;
  enviadaEn: string | null;
  destinatarios: number;
  enviados: number;
  leidos: number;
  fallidos: number;
  manuales: number;
}

export interface Destino {
  clienteId: number;
  nombre: string | null;
  telefono: string;
  link: string;
  estado: string;
}

export interface ResultadoEnvio {
  campanaId: number;
  modo: 'automatico' | 'manual';
  total: number;
  enviados: number;
  fallidos: number;
  destinos: Destino[];
}

export interface Pedido {
  id: number;
  cliente: string;
  telefono: string | null;
  distrito: string | null;
  entrega: string;
  estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';
  total: number;
  creadoEn: string;
  items: { nombre: string; talla: string; cantidad: number; precioUnitario: number }[];
}

const CLAVE = 'luna-admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  clave = signal<string>(this.leer());

  private get h() {
    return { headers: new HttpHeaders({ 'X-Admin-Key': this.clave() }) };
  }

  // la clave queda solo en esta pestaña; al cerrar el navegador hay que volver a entrar
  entrar(clave: string) {
    this.clave.set(clave);
    try { sessionStorage.setItem(CLAVE, clave); } catch {}
  }

  salir() {
    this.clave.set('');
    try { sessionStorage.removeItem(CLAVE); } catch {}
  }

  resumen() { return this.http.get<Resumen>(`${this.api}/admin/resumen`, this.h); }
  clientes() { return this.http.get<Cliente[]>(`${this.api}/admin/clientes`, this.h); }
  exportar() { return this.http.get(`${this.api}/admin/clientes.csv`, { ...this.h, responseType: 'blob' }); }
  agregarCliente(c: { nombre: string; telefono: string; aceptaOfertas: boolean }) {
    return this.http.post<Cliente>(`${this.api}/admin/clientes`, c, this.h);
  }
  cambiarOfertas(id: number, acepta: boolean) {
    return this.http.patch<Cliente>(`${this.api}/admin/clientes/${id}/ofertas`, { acepta }, this.h);
  }

  campanas() { return this.http.get<Campana[]>(`${this.api}/admin/campanas`, this.h); }
  crearCampana(c: { titulo: string; mensaje: string; categoria: string; programadaEn: string | null }) {
    return this.http.post<Campana>(`${this.api}/admin/campanas`, c, this.h);
  }
  enviarCampana(id: number) { return this.http.post<ResultadoEnvio>(`${this.api}/admin/campanas/${id}/enviar`, {}, this.h); }
  borrarCampana(id: number) { return this.http.delete(`${this.api}/admin/campanas/${id}`, this.h); }

  pedidos() { return this.http.get<Pedido[]>(`${this.api}/pedidos`, this.h); }
  estadoPedido(id: number, estado: string) { return this.http.patch(`${this.api}/pedidos/${id}/estado`, { estado }, this.h); }

  productos() { return this.http.get<Producto[]>(`${this.api}/productos/todos`, this.h); }
  crearProducto(p: Partial<Producto>) { return this.http.post<Producto>(`${this.api}/productos`, p, this.h); }
  actualizarProducto(p: Producto) { return this.http.put<Producto>(`${this.api}/productos/${p.id}`, p, this.h); }
  ocultarProducto(id: number) { return this.http.delete(`${this.api}/productos/${id}`, this.h); }

  private leer() {
    try { return sessionStorage.getItem(CLAVE) || ''; } catch { return ''; }
  }
}
