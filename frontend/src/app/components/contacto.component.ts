import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../services/productos.service';
import { linkWhatsapp } from '../site.config';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="form" (ngSubmit)="enviar()">
      <label>Tu nombre
        <input name="nombre" [(ngModel)]="nombre" required placeholder="¿Cómo te llamas?" />
      </label>
      <label>Celular (opcional)
        <input name="telefono" [(ngModel)]="telefono" inputmode="tel" placeholder="9XX XXX XXX" />
      </label>
      <fieldset>
        <legend>¿Qué buscas?</legend>
        <div class="ops">
          @for (o of opciones; track o) {
            <button type="button" class="op" [class.on]="interes === o" (click)="interes = o">{{ o }}</button>
          }
        </div>
      </fieldset>
      <label>Cuéntanos un poco más (opcional)
        <textarea name="mensaje" rows="3" [(ngModel)]="mensaje" placeholder="Talla, color, ocasión…"></textarea>
      </label>
      <label class="acepto">
        <input type="checkbox" name="politica" [(ngModel)]="aceptaPolitica" />
        <span>He leído y acepto la <a href="privacidad" target="_blank" rel="noopener">Política de Privacidad</a> y los <a href="terminos" target="_blank" rel="noopener">Términos y Condiciones</a>, incluido el envío de mis datos a los proveedores tecnológicos indicados. *</span>
      </label>
      <label class="acepto">
        <input type="checkbox" name="ofertas" [(ngModel)]="aceptaOfertas" />
        <span>Opcional: quiero recibir ofertas y novedades de Luna Ventas por WhatsApp. No es necesario para comprar y puedo darme de baja respondiendo BAJA.</span>
      </label>
      <button class="btn btn-wa" type="submit" [disabled]="!nombre.trim() || !aceptaPolitica"><svg class="wa-ico" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>Enviar por WhatsApp</button>
    </form>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 14px; background: var(--blanco); border: 1px solid var(--linea); border-radius: 26px; padding: 26px; box-shadow: 0 30px 60px -40px rgba(59,42,63,.4); }
    label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 500; }
    input, textarea { padding: 12px 14px; border-radius: 14px; border: 1px solid var(--linea); font: 15px var(--sans); background: var(--crema); resize: vertical; }
    input:focus, textarea:focus { outline: 2px solid var(--rosa-fuerte); outline-offset: 1px; }
    fieldset { border: 0; padding: 0; margin: 0; }
    legend { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
    .ops { display: flex; flex-wrap: wrap; gap: 8px; }
    .op { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--linea); background: #fff; cursor: pointer; font: 14px var(--sans); }
    .op.on { background: var(--tinta); color: #fff; border-color: var(--tinta); }
    .btn { justify-content: center; }
    .acepto { flex-direction: row; align-items: flex-start; gap: 8px; font-weight: 400; font-size: 13px; color: var(--suave); line-height: 1.4; }
    .acepto a { color: var(--tinta); }
    .acepto input { margin-top: 2px; accent-color: var(--rosa-fuerte); width: 16px; height: 16px; flex: none; }
  `],
})
export class ContactoComponent {
  api = inject(ProductosService);
  opciones = ['Una prenda que vi', 'Ropa para una ocasión', 'Precio por mayor', 'Aún no lo sé'];
  nombre = '';
  telefono = '';
  interes = this.opciones[0];
  mensaje = '';
  aceptaOfertas = false;
  aceptaPolitica = false;

  enviar() {
    if (!this.nombre.trim() || !this.aceptaPolitica) return;
    const texto = `Hola Luna Ventas, soy ${this.nombre.trim()}. Me interesa: ${this.interes}.${this.mensaje ? ' ' + this.mensaje.trim() : ''}`;
    // se guarda en la base para tener registro, y se abre WhatsApp igual
    this.api.enviarContacto({ nombre: this.nombre.trim(), telefono: this.telefono.trim(), mensaje: texto, aceptaOfertas: this.aceptaOfertas && !!this.telefono.trim(), aceptaPolitica: true }).subscribe();
    window.open(linkWhatsapp(texto), '_blank');
  }
}
