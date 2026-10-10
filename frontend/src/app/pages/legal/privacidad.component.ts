import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LegalLayoutComponent } from './legal-layout.component';
import { LegalService } from '../../services/legal.service';
import { LEGAL, SITE } from '../../site.config';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [LegalLayoutComponent, FormsModule, RouterLink],
  template: `
    <app-legal-layout etiqueta="Ley N° 29733 y su Reglamento" titulo="Política de Privacidad"
      [subtitulo]="'Versión ' + legal.politicaVersion + ' · vigente desde el ' + legal.politicaVigencia">

      <p>En {{ site.nombre }} cuidamos los datos personales de nuestros clientes. Esta política explica qué datos recogemos, para qué los usamos, con quién los compartimos, cuánto tiempo los guardamos y cómo puedes ejercer tus derechos, conforme a la Ley N° 29733, Ley de Protección de Datos Personales, y su Reglamento aprobado por Decreto Supremo N° 016-2024-JUS.</p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Titular del banco de datos:</strong> {{ legal.titular || site.nombre }}@if (legal.ruc) {, RUC {{ legal.ruc }}}</li>
        <li><strong>Nombre comercial:</strong> {{ site.nombre }}</li>
        <li><strong>Domicilio:</strong> {{ legal.domicilio || (site.stand + ', ' + site.distrito) }}</li>
        <li><strong>Contacto:</strong> WhatsApp {{ site.whatsappVisible }}@if (legal.correo) { · correo {{ legal.correo }}}</li>
        <li><strong>Banco de datos:</strong> «Clientes»@if (legal.registroBancoDatos) {, inscrito en el Registro Nacional de Protección de Datos Personales con código {{ legal.registroBancoDatos }}}.</li>
      </ul>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li><strong>Identificación y contacto:</strong> nombre, número de celular y distrito o dirección de entrega.</li>
        <li><strong>Datos de tus pedidos:</strong> prendas, tallas, cantidades, montos, fechas y forma de entrega.</li>
        <li><strong>Mensajes:</strong> lo que nos escribes por el formulario de la web o por WhatsApp.</li>
        <li><strong>Preferencias:</strong> las categorías de prendas que compras, para enviarte ofertas que te interesen (solo si aceptas recibirlas).</li>
        <li><strong>Registro de tus consentimientos:</strong> qué aceptaste, qué versión de esta política y en qué fecha.</li>
        <li><strong>Libro de Reclamaciones:</strong> además, tipo y número de documento, domicilio y correo, y si eres menor de edad, el nombre de tu padre, madre o apoderado, porque la norma lo exige.</li>
      </ul>
      <p>No recogemos datos sensibles ni datos de tarjetas o cuentas bancarias. Los pagos se hacen fuera de la web, por Yape, Plin o transferencia.</p>

      <h2>3. Para qué usamos tus datos</h2>
      <h3>a) Finalidades necesarias</h3>
      <p>Para atender tu pedido o consulta: confirmar stock, coordinar el pago y la entrega, emitir el comprobante de pago, atender cambios, garantías, reclamos y quejas, y cumplir obligaciones legales. Estos tratamientos son necesarios para la relación que inicias con nosotros; si no nos das estos datos, no podemos atenderte.</p>
      <h3>b) Finalidad opcional: ofertas y novedades</h3>
      <p>Solo si marcas la casilla correspondiente o respondes OFERTAS por WhatsApp, te enviaremos ofertas, promociones y novedades por WhatsApp, elegidas según las prendas que compras. Este consentimiento es <strong>libre, separado y no es condición para comprar</strong>. Puedes retirarlo cuando quieras respondiendo <strong>BAJA</strong> a cualquiera de nuestros mensajes o escribiéndonos.</p>
      <p>No tomamos decisiones automatizadas que produzcan efectos jurídicos sobre ti.</p>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>No vendemos ni cedemos tus datos a terceros para sus propios fines. Usamos estos proveedores tecnológicos, que tratan los datos solo por encargo nuestro y con medidas de seguridad:</p>
      <div class="tabla">
        <table>
          <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicación de los servidores</th></tr></thead>
          <tbody>
            <tr><td>Vercel Inc.</td><td>Alojamiento de la página web</td><td>Estados Unidos y red global</td></tr>
            <tr><td>Render Services, Inc.</td><td>Servidor de la aplicación</td><td>Estados Unidos</td></tr>
            <tr><td>Neon (Databricks, Inc.)</td><td>Base de datos</td><td>Estados Unidos (AWS, Virginia)</td></tr>
            <tr><td>Meta Platforms (WhatsApp)</td><td>Mensajería con clientes</td><td>Según WhatsApp</td></tr>
            <tr><td>Proveedor de correo electrónico</td><td>Envío de constancias del Libro de Reclamaciones</td><td>Según el proveedor</td></tr>
          </tbody>
        </table>
      </div>
      <p>Como estos servidores están fuera del Perú, existe un <strong>flujo transfronterizo de datos personales</strong>. Al aceptar esta política autorizas expresamente esa transferencia, que se realiza a proveedores que ofrecen niveles de seguridad y confidencialidad adecuados. También podemos entregar datos a autoridades (por ejemplo, INDECOPI, SUNAT o el Poder Judicial) cuando la ley lo exija.</p>

      <h2>5. Cuánto tiempo guardamos tus datos</h2>
      <ul>
        <li>Datos de contacto y preferencias: mientras seas cliente y hasta 2 años desde tu último contacto; luego se eliminan o anonimizan.</li>
        <li>Datos de pedidos y comprobantes: durante el plazo que exigen las normas tributarias.</li>
        <li>Hojas del Libro de Reclamaciones: al menos 2 años desde su registro, como exige su reglamento.</li>
        <li>Consentimiento para ofertas: hasta que lo retires. Guardamos el registro del retiro como prueba.</li>
      </ul>

      <h2>6. Seguridad</h2>
      <p>La web usa conexión cifrada (HTTPS). La base de datos tiene acceso restringido y el panel de administración está protegido con clave. Si ocurriera un incidente de seguridad que te afecte, te lo informaremos y lo comunicaremos a la Autoridad Nacional de Protección de Datos Personales en los plazos de ley.</p>

      <h2>7. Menores de edad</h2>
      <p>Nuestra tienda está dirigida a personas mayores de edad. Si eres menor de 18 años, necesitas la autorización de tu padre, madre o apoderado para comprar o enviarnos tus datos.</p>

      <h2>8. Cookies y almacenamiento en tu navegador</h2>
      <p>No usamos cookies de publicidad ni de analítica. La web solo guarda tu carrito en tu propio navegador (almacenamiento local) para que no lo pierdas al recargar. Las fuentes tipográficas se sirven desde nuestro sitio. El mapa de Google solo se carga si tocas el botón para verlo; en ese momento se aplica la política de privacidad de Google.</p>

      <h2 id="derechos">9. Tus derechos y cómo ejercerlos</h2>
      <p>Puedes ejercer en cualquier momento, de forma gratuita, tus derechos de <strong>información, acceso, rectificación, cancelación (supresión), oposición y portabilidad</strong>, así como <strong>revocar tu consentimiento</strong>. Puedes hacerlo con el formulario de abajo, por WhatsApp al {{ site.whatsappVisible }}@if (legal.correo) { o al correo {{ legal.correo }}}. Para proteger tus datos, podemos pedirte que acredites tu identidad.</p>
      <p>Responderemos dentro de los plazos máximos que establece el Reglamento de la Ley N° 29733. Si consideras que no atendimos tu solicitud, puedes presentar una reclamación ante la <strong>Autoridad Nacional de Protección de Datos Personales</strong> del Ministerio de Justicia y Derechos Humanos.</p>

      <div class="caja">
        @if (enviada()) {
          <h3>Solicitud registrada</h3>
          <p>Recibimos tu solicitud N° {{ enviada()!.id }} el {{ enviada()!.fecha }}. Te responderemos por el medio que nos indicaste.</p>
        } @else {
          <h3>Solicitud sobre tus datos personales</h3>
          <form class="f" (ngSubmit)="enviar()">
            <label for="d-tipo">¿Qué deseas hacer?</label>
            <select id="d-tipo" name="tipo" [(ngModel)]="form.tipo">
              <option value="acceso">Saber qué datos tienen de mí (acceso)</option>
              <option value="rectificacion">Corregir mis datos (rectificación)</option>
              <option value="cancelacion">Que eliminen mis datos (cancelación)</option>
              <option value="oposicion">Que dejen de usar mis datos para algo (oposición)</option>
              <option value="portabilidad">Recibir mis datos en un archivo (portabilidad)</option>
              <option value="revocacion">Dejar de recibir ofertas (revocación)</option>
            </select>
            <label for="d-nombre">Nombre completo</label>
            <input id="d-nombre" name="nombre" [(ngModel)]="form.nombre" required />
            <label for="d-doc">N° de DNI o carné de extranjería</label>
            <input id="d-doc" name="doc" [(ngModel)]="form.numeroDocumento" required />
            <label for="d-tel">Celular</label>
            <input id="d-tel" name="tel" inputmode="tel" [(ngModel)]="form.telefono" />
            <label for="d-correo">Correo (opcional)</label>
            <input id="d-correo" name="correo" type="email" [(ngModel)]="form.correo" />
            <label for="d-det">Detalle de tu solicitud</label>
            <textarea id="d-det" name="det" rows="3" [(ngModel)]="form.detalle" required></textarea>
            @if (error()) { <p class="err">{{ error() }}</p> }
            <button class="btn btn-dark" type="submit" [disabled]="cargando()">{{ cargando() ? 'Enviando…' : 'Enviar solicitud' }}</button>
          </form>
        }
      </div>

      <h2>10. Cambios a esta política</h2>
      <p>Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha. Si el cambio afecta finalidades que requieren tu consentimiento, te lo pediremos de nuevo.</p>
      <p>Revisa también nuestros <a routerLink="/terminos">Términos y Condiciones</a>.</p>
    </app-legal-layout>
  `,
  styles: [`
    .f { display: flex; flex-direction: column; gap: 6px; }
    .f label { font-size: 13px; font-weight: 600; margin-top: 6px; }
    .f input, .f select, .f textarea { padding: 11px 12px; border-radius: 12px; border: 1px solid var(--linea); font: 15px var(--sans); background: #fff; color: var(--tinta); }
    .f .btn { align-self: flex-start; margin-top: 10px; }
    .err { color: #A3123F; font-size: 14px; margin: 6px 0 0; }
  `],
})
export class PrivacidadComponent {
  site = SITE;
  legal = LEGAL;
  api = inject(LegalService);
  form = { tipo: 'acceso', nombre: '', numeroDocumento: '', telefono: '', correo: '', detalle: '' };
  cargando = signal(false);
  error = signal('');
  enviada = signal<{ id: number; fecha: string } | null>(null);

  enviar() {
    const f = this.form;
    if (!f.nombre.trim() || !f.numeroDocumento.trim() || !f.detalle.trim()) {
      this.error.set('Completa tu nombre, documento y el detalle.');
      return;
    }
    if (!f.telefono.trim() && !f.correo.trim()) {
      this.error.set('Indica un celular o un correo para responderte.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.api.solicitarDerecho({ ...f, correo: f.correo.trim() || null }).subscribe({
      next: r => { this.cargando.set(false); this.enviada.set(r); },
      error: () => {
        this.cargando.set(false);
        this.error.set(`No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp al ${SITE.whatsappVisible}.`);
      },
    });
  }
}
