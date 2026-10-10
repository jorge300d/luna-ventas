import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LegalLayoutComponent } from './legal-layout.component';
import { HojaReclamo, LegalService } from '../../services/legal.service';
import { LEGAL, SITE } from '../../site.config';

@Component({
  selector: 'app-libro',
  standalone: true,
  imports: [LegalLayoutComponent, FormsModule, RouterLink],
  template: `
    <app-legal-layout etiqueta="Conforme al Código de Protección y Defensa del Consumidor" titulo="Libro de Reclamaciones"
      subtitulo="Este establecimiento cuenta con un Libro de Reclamaciones a tu disposición.">

      @if (hoja(); as h) {
        <div class="caja ok">
          <h2>Hoja de reclamación N° {{ h.numero }}</h2>
          <p>Registrada el {{ h.fecha }}.
            @if (h.correoEnviado) { Te enviamos una copia a tu correo. }
            @else { Guarda o imprime esta hoja como constancia. }
            Te responderemos en un plazo máximo de 15 días hábiles.</p>
          <pre>{{ h.hoja }}</pre>
          <button class="btn btn-dark" type="button" (click)="imprimir()">Imprimir o guardar en PDF</button>
        </div>
      } @else {
        <div class="prov">
          <span><strong>Fecha:</strong> {{ hoy }}</span>
          <span><strong>Proveedor:</strong> {{ legal.titular || site.nombre }}@if (legal.ruc) { · RUC {{ legal.ruc }}}</span>
          <span><strong>Domicilio:</strong> {{ legal.domicilio || (site.stand + ', ' + site.distrito) }}</span>
        </div>

        <form class="f" (ngSubmit)="enviar()">
          <fieldset>
            <legend>1. Identificación del consumidor reclamante</legend>
            <label for="r-nombre">Nombre completo *</label>
            <input id="r-nombre" name="nombre" [(ngModel)]="f.nombre" required />
            <div class="dos">
              <div>
                <label for="r-tdoc">Tipo de documento *</label>
                <select id="r-tdoc" name="tdoc" [(ngModel)]="f.tipoDocumento">
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
              <div>
                <label for="r-ndoc">N° de documento *</label>
                <input id="r-ndoc" name="ndoc" [(ngModel)]="f.numeroDocumento" required />
              </div>
            </div>
            <label for="r-dom">Domicilio *</label>
            <input id="r-dom" name="dom" [(ngModel)]="f.domicilio" required />
            <div class="dos">
              <div>
                <label for="r-tel">Teléfono</label>
                <input id="r-tel" name="tel" inputmode="tel" [(ngModel)]="f.telefono" />
              </div>
              <div>
                <label for="r-correo">Correo electrónico *</label>
                <input id="r-correo" name="correo" type="email" [(ngModel)]="f.correo" required />
              </div>
            </div>
            <label class="chk"><input type="checkbox" name="menor" [(ngModel)]="f.menorDeEdad" /> Soy menor de edad</label>
            @if (f.menorDeEdad) {
              <label for="r-apo">Nombre del padre, madre o apoderado *</label>
              <input id="r-apo" name="apo" [(ngModel)]="f.apoderado" />
            }
          </fieldset>

          <fieldset>
            <legend>2. Identificación del bien contratado</legend>
            <div class="radios">
              <label class="chk"><input type="radio" name="bien" value="producto" [(ngModel)]="f.bienTipo" /> Producto</label>
              <label class="chk"><input type="radio" name="bien" value="servicio" [(ngModel)]="f.bienTipo" /> Servicio</label>
            </div>
            <label for="r-monto">Monto reclamado (S/)</label>
            <input id="r-monto" name="monto" type="number" min="0" step="0.1" [(ngModel)]="f.monto" />
            <label for="r-desc">Descripción *</label>
            <input id="r-desc" name="desc" placeholder="Ej. Vestido midi estampado, talla M, pedido del 5/10" [(ngModel)]="f.descripcionBien" required />
          </fieldset>

          <fieldset>
            <legend>3. Detalle de la reclamación y pedido del consumidor</legend>
            <div class="radios">
              <label class="chk"><input type="radio" name="tipo" value="reclamo" [(ngModel)]="f.tipo" /> Reclamo</label>
              <label class="chk"><input type="radio" name="tipo" value="queja" [(ngModel)]="f.tipo" /> Queja</label>
            </div>
            <p class="ayuda"><strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios. <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar o descontento respecto a la atención al público.</p>
            <label for="r-det">Detalle *</label>
            <textarea id="r-det" name="det" rows="4" [(ngModel)]="f.detalle" required></textarea>
            <label for="r-ped">Pedido *</label>
            <textarea id="r-ped" name="ped" rows="2" placeholder="¿Qué solución solicitas?" [(ngModel)]="f.pedido" required></textarea>
          </fieldset>

          <label class="chk acepto"><input type="checkbox" name="acepta" [(ngModel)]="f.aceptaPolitica" />
            <span>Autorizo el uso de mis datos para registrar y atender este reclamo, según la <a routerLink="/privacidad" target="_blank">Política de Privacidad</a>.</span></label>

          <p class="ayuda">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor debe dar respuesta en un plazo no mayor a quince (15) días hábiles.</p>

          @if (error()) { <p class="err">{{ error() }}</p> }
          <button class="btn btn-dark" type="submit" [disabled]="cargando()">{{ cargando() ? 'Registrando…' : 'Registrar' }}</button>
        </form>
      }
    </app-legal-layout>
  `,
  styles: [`
    .prov { display: flex; flex-direction: column; gap: 4px; background: var(--blanco); border: 1px solid var(--linea); border-radius: 16px; padding: 14px 16px; font-size: 14px; margin-bottom: 18px; }
    .f { display: flex; flex-direction: column; gap: 16px; }
    fieldset { border: 1px solid var(--linea); border-radius: 18px; padding: 16px; margin: 0; background: var(--blanco); display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    legend { font: 600 15px var(--sans); padding: 0 6px; }
    label { font-size: 13px; font-weight: 600; margin-top: 4px; }
    input:not([type=checkbox]):not([type=radio]), select, textarea { padding: 11px 12px; border-radius: 12px; border: 1px solid var(--linea); font: 15px var(--sans); background: #fff; color: var(--tinta); width: 100%; }
    .dos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .dos > div { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .chk { display: flex; align-items: flex-start; gap: 8px; font-weight: 500; font-size: 14px; }
    .chk input { accent-color: var(--rosa-fuerte); width: 17px; height: 17px; margin-top: 1px; flex: none; }
    .radios { display: flex; gap: 20px; }
    .ayuda { font-size: 13px; color: var(--suave); margin: 2px 0; line-height: 1.5; }
    .err { color: #A3123F; font-size: 14px; margin: 0; }
    .btn { align-self: flex-start; }
    .ok pre { white-space: pre-wrap; font: 13px/1.55 ui-monospace, Menlo, Consolas, monospace; background: var(--crema); border-radius: 12px; padding: 14px; overflow-x: auto; }
    @media (max-width: 560px) { .dos { grid-template-columns: 1fr; } }
    @media print { .btn { display: none; } }
  `],
})
export class LibroComponent {
  site = SITE;
  legal = LEGAL;
  api = inject(LegalService);
  hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  f = {
    tipo: 'reclamo', nombre: '', tipoDocumento: 'DNI', numeroDocumento: '', domicilio: '', telefono: '', correo: '',
    menorDeEdad: false, apoderado: '', bienTipo: 'producto', monto: null as number | null, descripcionBien: '',
    detalle: '', pedido: '', aceptaPolitica: false,
  };
  cargando = signal(false);
  error = signal('');
  hoja = signal<HojaReclamo | null>(null);

  enviar() {
    const f = this.f;
    const faltan = !f.nombre.trim() || !f.numeroDocumento.trim() || !f.domicilio.trim() || !f.correo.trim()
      || !f.descripcionBien.trim() || !f.detalle.trim() || !f.pedido.trim() || (f.menorDeEdad && !f.apoderado.trim());
    if (faltan) { this.error.set('Completa todos los campos marcados con *.'); return; }
    if (!f.aceptaPolitica) { this.error.set('Debes autorizar el uso de tus datos para poder registrar el reclamo.'); return; }
    this.cargando.set(true);
    this.error.set('');
    this.api.registrarReclamo({ ...f, telefono: f.telefono.trim() || null, apoderado: f.apoderado.trim() || null }).subscribe({
      next: h => { this.cargando.set(false); this.hoja.set(h); window.scrollTo({ top: 0 }); },
      error: e => {
        this.cargando.set(false);
        this.error.set(e?.error?.message || `No se pudo registrar. Inténtalo de nuevo; si el problema sigue, escríbenos al ${SITE.whatsappVisible} o acércate al stand.`);
      },
    });
  }

  imprimir() {
    window.print();
  }
}
