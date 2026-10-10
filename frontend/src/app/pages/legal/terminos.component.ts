import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalLayoutComponent } from './legal-layout.component';
import { LEGAL, SITE } from '../../site.config';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [LegalLayoutComponent, RouterLink],
  template: `
    <app-legal-layout etiqueta="Ley N° 29571, Código de Protección y Defensa del Consumidor" titulo="Términos y Condiciones"
      [subtitulo]="'Versión ' + legal.politicaVersion + ' · vigentes desde el ' + legal.politicaVigencia">

      <p>Estos términos regulan el uso de esta web y las compras que hagas a {{ site.nombre }}. Al enviar un pedido declaras haberlos leído y aceptado.</p>

      <h2>1. Quiénes somos</h2>
      <ul>
        <li><strong>Proveedor:</strong> {{ legal.titular || site.nombre }}@if (legal.ruc) {, RUC {{ legal.ruc }}}</li>
        <li><strong>Nombre comercial:</strong> {{ site.nombre }}</li>
        <li><strong>Dirección:</strong> {{ legal.domicilio || (site.stand + ', ' + site.distrito) }}</li>
        <li><strong>Atención:</strong> WhatsApp {{ site.whatsappVisible }}@if (legal.correo) { · {{ legal.correo }}}</li>
      </ul>

      <h2>2. Cómo se hace una compra</h2>
      <ol>
        <li>Eliges prendas y tallas en el catálogo y envías tu pedido. El pedido llega a nuestro WhatsApp.</li>
        <li>Te confirmamos stock, precio total (con el costo de envío, si aplica) y forma de entrega.</li>
        <li>La compra queda cerrada cuando confirmas y realizas el pago. Antes de eso puedes cancelar el pedido sin costo.</li>
      </ol>
      <p>El catálogo de la web es referencial. Si una prenda se agotó, te avisaremos antes de cobrarte y podrás elegir otra o no comprar.</p>

      <h2>3. Precios</h2>
      <ul>
        <li>Los precios están en soles (S/)@if (legal.preciosIncluyenIgv) { e incluyen el IGV}. El precio que se cobra es el que te confirmamos por WhatsApp, que nunca será mayor al publicado en la web en ese momento.</li>
        <li>El costo de delivery no está incluido en el precio de la prenda; te lo informamos antes de que pagues.</li>
        <li>Cuando mostramos un precio tachado («antes»), es el precio al que efectivamente vendimos esa prenda antes de la rebaja.</li>
        <li>Si por un error evidente se publica un precio irreal, te avisaremos antes de cobrar y podrás comprar al precio correcto o no comprar.</li>
      </ul>

      <h2>4. Promociones y ofertas</h2>
      <p>Toda promoción indica su vigencia (fecha de inicio y fin) y, si aplica, el stock disponible o la frase «hasta agotar stock». No se acumulan con otras promociones salvo que se indique.</p>

      <h2>5. Pagos</h2>
      <p>Aceptamos Yape, Plin y transferencia bancaria. Nunca te pediremos datos de tu tarjeta, claves ni códigos de verificación por la web ni por WhatsApp. Te entregamos el comprobante de pago que corresponda.</p>

      <h2>6. Entrega</h2>
      <ul>
        <li><strong>Recojo:</strong> en nuestro {{ site.stand }}, {{ site.distrito }}, previa coordinación.</li>
        <li><strong>Delivery:</strong> en Lima, con el costo y el plazo que te confirmamos antes de pagar. Si el plazo no se cumple por causa nuestra, puedes cancelar y te devolvemos lo pagado.</li>
        <li>Revisa tu pedido al recibirlo. Si algo no corresponde, avísanos lo antes posible.</li>
      </ul>

      <h2>7. Cambios y devoluciones</h2>
      <h3>Cambio de talla o modelo</h3>
      <p>Puedes cambiar una prenda por otra talla o modelo dentro de los <strong>{{ legal.diasCambio }} días calendario</strong> siguientes a la entrega, siempre que esté sin usar, sin lavar, con sus etiquetas y con el comprobante. Si el nuevo producto cuesta más, pagas la diferencia. Por higiene, la ropa interior y los trajes de baño no tienen cambio, salvo que tengan un defecto.</p>
      <h3>Prendas con defecto (garantía legal)</h3>
      <p>Si una prenda tiene un defecto de fábrica o no corresponde a lo que compraste, tienes derecho, a tu elección, a la reparación, la reposición por otra igual o la devolución de lo que pagaste, conforme a los artículos 19 y 97 del Código de Protección y Defensa del Consumidor. Este derecho no tiene costo para ti y no se limita por esta política de cambios.</p>

      <h2>8. Reclamos y quejas</h2>
      <p>Contamos con un <a routerLink="/libro-de-reclamaciones">Libro de Reclamaciones virtual</a>, además del físico en nuestro stand. Responderemos en un plazo máximo de 15 días hábiles. Presentar un reclamo no te impide acudir a otras vías ni denunciar ante el INDECOPI.</p>

      <h2>9. Comunicaciones comerciales</h2>
      <p>Solo te enviamos ofertas si nos diste tu consentimiento expreso, y puedes retirarlo respondiendo BAJA. No enviamos publicidad a quienes no la aceptaron, conforme al artículo 58 del Código y a la <a routerLink="/privacidad">Política de Privacidad</a>.</p>

      <h2>10. Propiedad intelectual</h2>
      <p>Los textos, fotos, logotipo y diseño de esta web pertenecen a {{ site.nombre }} o se usan con autorización. No pueden copiarse para fines comerciales sin permiso.</p>

      <h2>11. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes del Perú. Nada en ellos limita los derechos que te reconoce el Código de Protección y Defensa del Consumidor.</p>
    </app-legal-layout>
  `,
})
export class TerminosComponent {
  site = SITE;
  legal = LEGAL;
}
