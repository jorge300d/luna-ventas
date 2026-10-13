import { Component, computed, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AdminService, Campana, Cliente, Pedido, Reclamo, ResultadoEnvio, Resumen, SolicitudDatos } from '../../services/admin.service';
import { CATEGORIAS, Categoria, Producto } from '../../models/producto';
import { LogoComponent } from '../../components/logo.component';

type Pestana = 'inicio' | 'clientes' | 'ofertas' | 'pedidos' | 'prendas' | 'reclamos';

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
  reclamos = signal<Reclamo[]>([]);
  solicitudes = signal<SolicitudDatos[]>([]);
  correoOk = signal(true);
  respuestas: Record<number, string> = {};
  notas: Record<number, string> = {};
  confirmarBorrado = signal<number | null>(null);
  pendientesLegales = computed(() =>
    this.reclamos().filter(r => r.estado === 'pendiente').length + this.solicitudes().filter(s => s.estado === 'pendiente').length);

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
  nuevaCampana = { titulo: '', mensaje: '', categoria: '', programadaEn: '', validoHasta: '' };
  nuevaPrenda = this.prendaVacia();

  constructor() {
    // el panel no debe aparecer en Google
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
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
        this.cargarLegal();
      },
      error: e => this.fallo(e),
    });
  }

  cargarLegal() {
    this.admin.reclamos().subscribe({ next: l => this.reclamos.set(l), error: e => this.fallo(e) });
    this.admin.solicitudes().subscribe({ next: l => this.solicitudes.set(l), error: e => this.fallo(e) });
    this.admin.correoConfigurado().subscribe({ next: r => this.correoOk.set(r.configurado) });
  }

  // ---- reclamos y derechos ----
  // plazo legal: 15 días hábiles (no cuenta sábados ni domingos; los feriados hay que restarlos a mano)
  diasHabilesRestantes(r: Reclamo) {
    const inicio = new Date(r.creadoEn);
    let limite = new Date(inicio);
    let n = 0;
    while (n < 15) {
      limite.setDate(limite.getDate() + 1);
      const d = limite.getDay();
      if (d !== 0 && d !== 6) n++;
    }
    const hoy = new Date();
    let restantes = 0;
    const cursor = new Date(hoy);
    while (cursor < limite) {
      cursor.setDate(cursor.getDate() + 1);
      const d = cursor.getDay();
      if (d !== 0 && d !== 6) restantes++;
    }
    return { limite, restantes: hoy > limite ? -1 : restantes };
  }

  responderReclamo(r: Reclamo) {
    const txt = (this.respuestas[r.id] || '').trim();
    if (txt.length < 10) { this.error.set('Escribe la respuesta al consumidor.'); return; }
    this.admin.responderReclamo(r.id, txt).subscribe({
      next: act => {
        this.reclamos.update(l => l.map(x => x.id === act.id ? act : x));
        this.ok(this.correoOk() ? 'Respuesta registrada y enviada por correo.' : 'Respuesta registrada. Como el correo no está configurado, envíasela tú al consumidor y guarda la constancia.');
      },
      error: e => this.fallo(e),
    });
  }

  atenderSolicitud(s: SolicitudDatos) {
    this.admin.atenderSolicitud(s.id, this.notas[s.id] || '').subscribe({
      next: act => this.solicitudes.update(l => l.map(x => x.id === act.id ? act : x)),
      error: e => this.fallo(e),
    });
  }

  descargarDatos(c: Cliente) {
    this.admin.datosCliente(c.id).subscribe({
      next: datos => {
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `datos-cliente-${c.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: e => this.fallo(e),
    });
  }

  eliminarCliente(c: Cliente) {
    this.admin.eliminarCliente(c.id).subscribe({
      next: () => {
        this.confirmarBorrado.set(null);
        this.clientes.update(l => l.filter(x => x.id !== c.id));
        this.ok('Datos eliminados. Los pedidos quedan sin nombre ni celular, solo con los montos.');
        this.refrescarResumen();
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
    this.admin.crearCampana({ ...c, programadaEn, validoHasta: c.validoHasta || null }).subscribe({
      next: () => {
        this.nuevaCampana = { titulo: '', mensaje: '', categoria: '', programadaEn: '', validoHasta: '' };
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
    let m = this.nuevaCampana.mensaje.trim() || 'escribe aquí tu oferta…';
    const v = this.nuevaCampana.validoHasta;
    if (v) {
      const [y, mo, d] = v.split('-');
      m += ` Válido hasta el ${d}/${mo}/${y} o hasta agotar stock.`;
    } else if (!m.toLowerCase().includes('agotar stock')) {
      m += ' Hasta agotar stock.';
    }
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
      imagenEspaldaUrl: p.imagenEspaldaUrl.trim() || null,
      nuevo: p.nuevo,
      stock: Number(p.stock) || 0,
      largo: (p.largo || null) as Producto['largo'],
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
    return { nombre: '', descripcion: '', categoria: 'blusas' as Categoria, precio: '', precioAntes: '', tallas: 'S, M, L', color: '#E8738F', imagenUrl: '', imagenEspaldaUrl: '', nuevo: true, stock: '1', largo: '' };
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
