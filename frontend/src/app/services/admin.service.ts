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
  validoHasta: string | null;
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

export interface Reclamo {
  id: number; numero: string; tipo: 'reclamo' | 'queja'; nombre: string; tipoDocumento: string; numeroDocumento: string;
  domicilio: string; telefono: string | null; correo: string; menorDeEdad: boolean; apoderado: string | null;
  bienTipo: string; monto: number | null; descripcionBien: string; detalle: string; pedido: string;
  estado: 'pendiente' | 'respondido'; respuesta: string | null; respondidoEn: string | null; correoEnviado: boolean; creadoEn: string;
}

export interface SolicitudDatos {
  id: number; tipo: string; nombre: string; numeroDocumento: string; telefono: string | null; correo: string | null;
  detalle: string; estado: 'pendiente' | 'atendida'; nota: string | null; atendidaEn: string | null; creadoEn: string;
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

  datosCliente(id: number) { return this.http.get<unknown>(`${this.api}/admin/clientes/${id}/datos`, this.h); }
  eliminarCliente(id: number) { return this.http.delete(`${this.api}/admin/clientes/${id}`, this.h); }

  reclamos() { return this.http.get<Reclamo[]>(`${this.api}/admin/reclamos`, this.h); }
  responderReclamo(id: number, respuesta: string) { return this.http.patch<Reclamo>(`${this.api}/admin/reclamos/${id}`, { respuesta }, this.h); }
  solicitudes() { return this.http.get<SolicitudDatos[]>(`${this.api}/admin/derechos`, this.h); }
  atenderSolicitud(id: number, nota: string) { return this.http.patch<SolicitudDatos>(`${this.api}/admin/derechos/${id}`, { nota }, this.h); }
  correoConfigurado() { return this.http.get<{ configurado: boolean }>(`${this.api}/admin/correo`, this.h); }

  campanas() { return this.http.get<Campana[]>(`${this.api}/admin/campanas`, this.h); }
  crearCampana(c: { titulo: string; mensaje: string; categoria: string; programadaEn: string | null; validoHasta: string | null }) {
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
