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
      <button class="btn btn-wa" type="submit" [disabled]="!nombre.trim()">Enviar por WhatsApp</button>
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
  `],
})
export class ContactoComponent {
  api = inject(ProductosService);
  opciones = ['Una prenda que vi', 'Ropa para una ocasión', 'Precio por mayor', 'Aún no lo sé'];
  nombre = '';
  telefono = '';
  interes = this.opciones[0];
  mensaje = '';

  enviar() {
    if (!this.nombre.trim()) return;
    const texto = `Hola Luna Ventas, soy ${this.nombre.trim()}. Me interesa: ${this.interes}.${this.mensaje ? ' ' + this.mensaje.trim() : ''}`;
    // se guarda en la base para tener registro, y se abre WhatsApp igual
    this.api.enviarContacto({ nombre: this.nombre.trim(), telefono: this.telefono.trim(), mensaje: texto }).subscribe();
    window.open(linkWhatsapp(texto), '_blank');
  }
}
