import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AdminService, Campana, Cliente, Pedido, ResultadoEnvio, Resumen } from '../../services/admin.service';
import { CATEGORIAS, Categoria, Producto } from '../../models/producto';
import { LogoComponent } from '../../components/logo.component';

type Pestana = 'inicio' | 'clientes' | 'ofertas' | 'pedidos' | 'prendas';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, LogoComponent],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css',
})
export class PanelComponent {
  admin = inject(AdminService);
  categorias = CATEGORIAS;

  pestana = signal<Pestana>('inicio');
  cargando = signal(false);
  error = signal('');
  aviso = signal('');

  resumen = signal<Resumen | null>(null);
  clientes = signal<Cliente[]>([]);
  campanas = signal<Campana[]>([]);
  pedidos = signal<Pedido[]>([]);
  prendas = signal<Producto[]>([]);
  resultado = signal<ResultadoEnvio | null>(null);
  abiertos = signal<Set<number>>(new Set());

  // filtros de clientes
  buscar = signal('');
  soloOfertas = signal(false);
  clientesVisibles = computed(() => {
    const q = this.buscar().toLowerCase().trim();
    return this.clientes().filter(c =>
      (!this.soloOfertas() || c.aceptaOfertas) &&
      (!q || (c.nombre || '').toLowerCase().includes(q) || c.telefono.includes(q)));
  });

  claveInput = '';
  nuevoCliente = { nombre: '', telefono: '', aceptaOfertas: true };
  nuevaCampana = { titulo: '', mensaje: '', categoria: '', programadaEn: '' };
  nuevaPrenda = this.prendaVacia();

  constructor() {
    if (this.admin.clave()) this.cargarTodo();
  }

  entrar() {
    if (!this.claveInput.trim()) return;
    this.admin.entrar(this.claveInput.trim());
    this.claveInput = '';
    this.cargarTodo();
  }

  salir() {
    this.admin.salir();
    this.resumen.set(null);
  }

  ir(p: Pestana) {
    this.pestana.set(p);
    this.aviso.set('');
    this.error.set('');
  }

  cargarTodo() {
    this.cargando.set(true);
    this.error.set('');
    this.admin.resumen().subscribe({
      next: r => {
        this.resumen.set(r);
        this.cargando.set(false);
        this.cargarClientes();
        this.cargarCampanas();
        this.cargarPedidos();
        this.cargarPrendas();
      },
      error: e => this.fallo(e),
    });
  }

  cargarClientes() { this.admin.clientes().subscribe({ next: l => this.clientes.set(l), error: e => this.fallo(e) }); }
  cargarCampanas() { this.admin.campanas().subscribe({ next: l => this.campanas.set(l), error: e => this.fallo(e) }); }
  cargarPedidos() { this.admin.pedidos().subscribe({ next: l => this.pedidos.set(l), error: e => this.fallo(e) }); }
  cargarPrendas() { this.admin.productos().subscribe({ next: l => this.prendas.set(l), error: e => this.fallo(e) }); }

  // ---- clientes ----
  agregarCliente() {
    const c = this.nuevoCliente;
    if (!c.nombre.trim() || !c.telefono.trim()) return;
    this.admin.agregarCliente(c).subscribe({
      next: () => {
        this.nuevoCliente = { nombre: '', telefono: '', aceptaOfertas: true };
        this.ok('Cliente guardado.');
        this.cargarClientes();
        this.refrescarResumen();
      },
      error: e => this.fallo(e),
    });
  }

  cambiarOfertas(c: Cliente) {
    this.admin.cambiarOfertas(c.id, !c.aceptaOfertas).subscribe({
      next: act => {
        this.clientes.update(l => l.map(x => x.id === act.id ? act : x));
        this.refrescarResumen();
      },
      error: e => this.fallo(e),
    });
  }

  exportar() {
    this.admin.exportar().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clientes-luna-ventas.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: e => this.fallo(e),
    });
  }

  linkCliente(c: Cliente) {
    const nombre = c.nombre ? ' ' + c.nombre.split(' ')[0] : '';
    return `https://wa.me/${c.telefono}?text=${encodeURIComponent(`Hola${nombre}, te escribimos de Luna Ventas.`)}`;
  }

  // ---- ofertas ----
  crearCampana() {
    const c = this.nuevaCampana;
    if (!c.titulo.trim() || !c.mensaje.trim()) return;
    const programadaEn = c.programadaEn ? new Date(c.programadaEn).toISOString() : null;
    this.admin.crearCampana({ ...c, programadaEn }).subscribe({
      next: () => {
        this.nuevaCampana = { titulo: '', mensaje: '', categoria: '', programadaEn: '' };
        this.ok(programadaEn ? 'Oferta programada.' : 'Oferta guardada. Revisa a quiénes les llega y envíala.');
        this.cargarCampanas();
      },
      error: e => this.fallo(e),
    });
  }

  enviarCampana(c: Campana) {
    this.cargando.set(true);
    this.admin.enviarCampana(c.id).subscribe({
      next: r => {
        this.cargando.set(false);
        this.resultado.set(r);
        this.abiertos.set(new Set());
        this.ok(r.modo === 'automatico'
          ? `Enviada a ${r.enviados} de ${r.total} clientes por WhatsApp.${r.fallidos ? ` ${r.fallidos} no se pudieron enviar.` : ''}`
          : `Lista para enviar a ${r.total} clientes. Toca cada botón para abrir WhatsApp con el mensaje listo.`);
        this.cargarCampanas();
      },
      error: e => this.fallo(e),
    });
  }

  marcarAbierto(id: number) {
    this.abiertos.update(s => new Set(s).add(id));
  }

  borrarCampana(c: Campana) {
    this.admin.borrarCampana(c.id).subscribe({ next: () => this.cargarCampanas(), error: e => this.fallo(e) });
  }

  vistaPrevia() {
    const m = this.nuevaCampana.mensaje.trim() || 'escribe aquí tu oferta…';
    return `Hola Ana, ${m}\n\nResponde BAJA si no deseas recibir más ofertas.`;
  }

  destinatariosNueva() {
    const cat = this.nuevaCampana.categoria;
    return this.clientes().filter(c => c.aceptaOfertas && (!cat || c.intereses.split(',').includes(cat))).length;
  }

  // ---- pedidos ----
  cambiarEstado(p: Pedido, estado: string) {
    this.admin.estadoPedido(p.id, estado).subscribe({
      next: () => this.pedidos.update(l => l.map(x => x.id === p.id ? { ...x, estado: estado as Pedido['estado'] } : x)),
      error: e => this.fallo(e),
    });
  }

  // ---- prendas ----
  crearPrenda() {
    const p = this.nuevaPrenda;
    if (!p.nombre.trim() || !p.precio) return;
    const body: Partial<Producto> = {
      nombre: p.nombre.trim(),
      descripcion: p.descripcion.trim(),
      categoria: p.categoria,
      precio: Number(p.precio),
      precioAntes: p.precioAntes ? Number(p.precioAntes) : null,
      tallas: p.tallas.split(',').map(t => t.trim()).filter(Boolean),
      color: p.color,
      imagenUrl: p.imagenUrl.trim() || null,
      nuevo: p.nuevo,
      stock: Number(p.stock) || 0,
    };
    this.admin.crearProducto(body).subscribe({
      next: () => {
        this.ok(p.nuevo ? 'Prenda publicada. Se armó una oferta automática para quienes compran esa categoría.' : 'Prenda publicada.');
        this.nuevaPrenda = this.prendaVacia();
        this.cargarPrendas();
        this.cargarCampanas();
      },
      error: e => this.fallo(e),
    });
  }

  ocultar(p: Producto) {
    this.admin.ocultarProducto(p.id).subscribe({ next: () => this.cargarPrendas(), error: e => this.fallo(e) });
  }

  nombreCategoria(id: string | null) {
    if (!id) return 'Todos';
    return CATEGORIAS.find(c => c.id === id)?.nombre ?? id;
  }

  origen(o: Cliente['origen']) {
    return { web_pedido: 'Compró en la web', web_contacto: 'Formulario', whatsapp: 'Escribió por WhatsApp', manual: 'Agregado a mano' }[o];
  }

  private prendaVacia() {
    return { nombre: '', descripcion: '', categoria: 'blusas' as Categoria, precio: '', precioAntes: '', tallas: 'S, M, L', color: '#E8738F', imagenUrl: '', nuevo: true, stock: '10' };
  }

  private refrescarResumen() {
    this.admin.resumen().subscribe({ next: r => this.resumen.set(r) });
  }

  private ok(msg: string) {
    this.error.set('');
    this.aviso.set(msg);
  }

  private fallo(e: HttpErrorResponse) {
    this.cargando.set(false);
    if (e.status === 401) {
      this.admin.salir();
      this.error.set('La clave no es correcta.');
    } else if (e.status === 0) {
      this.error.set('No se pudo conectar con el servidor. Si no se usó en un rato, tarda unos segundos en despertar; vuelve a intentar.');
    } else {
      this.error.set(e.error?.message || e.error?.detail || 'Algo falló. Vuelve a intentar.');
    }
  }
}
