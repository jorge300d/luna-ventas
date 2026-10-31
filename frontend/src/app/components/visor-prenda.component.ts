import { Component, computed, effect, input, output, signal } from '@angular/core';
import { Producto } from '../models/producto';
import { GiroFalsoComponent } from './giro-falso.component';
import { linkWhatsapp } from '../site.config';

// visor de la prenda: se inclina con el mouse, gira al arrastrar y se puede voltear
// al dar la vuelta muestra la foto de la espalda si existe, si no la ficha de la prenda
@Component({
  selector: 'app-visor-prenda',
  standalone: true,
  imports: [GiroFalsoComponent],
  template: `
    @if (producto(); as p) {
      <div class="escena estudio"
        [class.arrastrando]="arrastrando()"
        tabindex="0" role="img" [attr.aria-label]="p.nombre + '. Arrastra para girar la prenda.'"
        (pointerdown)="bajar($event)" (pointermove)="mover($event)" (pointerup)="subir($event)" (pointercancel)="subir($event)"
        (pointerleave)="salir()" (keydown)="tecla($event)">

        <div class="sombra" [style.transform]="'translateX(-50%) scaleX(' + escalaSombra() + ')'"></div>

        @if (girable()) {
          <div class="cara frente">
            @if (es360()) {
              <img [src]="fotoActual(p)" [alt]="p.nombre + ', vista ' + (fotoIndice() + 1) + ' de ' + p.fotos360!.length" draggable="false" />
            } @else {
              <app-giro-falso [src]="p.imagenUrl!" [alt]="p.nombre" [angulo]="angulo()" />
            }
          </div>
          <span class="sello360" aria-hidden="true">360°</span>
        } @else {
        <div class="giro" [class.presenta]="presenta()" [style.transform]="transformacion()">
          <div class="cara frente">
            <img [src]="p.imagenUrl" [alt]="p.nombre" draggable="false" />
            <span class="luz" [style.opacity]="luz()"></span>
          </div>
          <div class="cara espalda">
            @if (p.imagenEspaldaUrl) {
              <img [src]="p.imagenEspaldaUrl" [alt]="p.nombre + ', espalda'" draggable="false" />
              <span class="luz" [style.opacity]="luz()"></span>
            } @else {
              <div class="ficha-atras">
                <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true"><path d="M17 6c1.5 3 4 4.5 7 4.5S29.5 9 31 6l7 4-3 8-3-1.5V42H16V16.5L13 18l-3-8 7-4Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
                <strong>{{ p.nombre }}</strong>
                <ul>
                  <li><span>Talla</span><b>{{ p.tallas.join(' · ') }}</b></li>
                  @if (p.largo) { <li><span>Largo</span><b class="cap">{{ p.largo }}</b></li> }
                  <li><span>Estado</span><b>Seleccionada y revisada</b></li>
                  <li><span>Disponibles</span><b>{{ p.stock === 1 ? 'Pieza única' : p.stock }}</b></li>
                </ul>
                <a class="pedir" [href]="pedirEspalda(p)" target="_blank" rel="noopener" (pointerdown)="$event.stopPropagation()">Pedir foto de la espalda</a>
              </div>
            }
          </div>
        </div>
        }

        @if (pista()) {
          <span class="pista" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Arrastra para girar
          </span>
        }
      </div>

      <div class="controles">
        @if (girable()) {
          <button type="button" (click)="alternarGiro()" [attr.aria-pressed]="girando()">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2M18.5 2v4h-4M5.5 22v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ girando() ? 'Pausar' : 'Girar 360°' }}
          </button>
        } @else {
        <button type="button" (click)="voltear()" [attr.aria-pressed]="deEspaldas()">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2M18.5 2v4h-4M5.5 22v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ deEspaldas() ? 'Ver frente' : 'Voltear' }}
        </button>
        }
        <button type="button" (click)="ampliar.emit(fotoActual(p)!)" [disabled]="!fotoActual(p)">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4M8 11h6M11 8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Zoom
        </button>
      </div>

    }
  `,
  styleUrl: './visor-prenda.component.css',
})
export class VisorPrendaComponent {
  producto = input<Producto | null>(null);

  angulo = signal(0);          // giro acumulado en grados
  ladeoY = signal(0);          // inclinación suave al pasar el mouse
  ladeoX = signal(0);
  arrastrando = signal(false);
  ampliar = output<string>();
  pista = signal(true);
  presenta = signal(true);

  private inicioX = 0;
  private inicioAngulo = 0;
  private movido = 0;

  deEspaldas = computed(() => {
    const a = ((this.angulo() % 360) + 360) % 360;
    return a > 90 && a < 270;
  });

  transformacion = computed(() => {
    const y = this.angulo() + this.ladeoY();
    // al girar se aleja un poquito para que se sienta el volumen
    const lejos = Math.abs(Math.sin((y * Math.PI) / 180)) * 60;
    return `translateZ(${-lejos}px) rotateX(${this.ladeoX()}deg) rotateY(${y}deg)`;
  });

  // visor 360°: si la prenda trae una secuencia de fotos, el ángulo elige la foto
  girando = signal(false);
  es360 = computed(() => (this.producto()?.fotos360?.length ?? 0) >= 8);
  falso = computed(() => !this.es360() && !!this.producto()?.imagenUrl && !this.producto()?.imagenEspaldaUrl); // un 360° simulado desde una sola foto
  girable = computed(() => this.es360() || this.falso());
  fotoIndice = computed(() => {
    const n = this.producto()?.fotos360?.length ?? 1;
    const a = ((this.angulo() % 360) + 360) % 360;
    return Math.floor((a / 360) * n) % n;
  });

  luz = computed(() => Math.abs(Math.sin(((this.angulo() + this.ladeoY()) * Math.PI) / 180)) * 0.55);
  escalaSombra = computed(() => 0.45 + 0.55 * Math.abs(Math.cos(((this.angulo() + this.ladeoY()) * Math.PI) / 180)));

  constructor() {
    // cada vez que se abre otra prenda, vuelve al frente y hace un pequeño giro de presentación
    effect(() => {
      this.producto();
      this.angulo.set(0);
      this.pista.set(true);
      this.presenta.set(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.girando.set(this.girable() && !matchMedia('(prefers-reduced-motion: reduce)').matches);
      // precarga la secuencia para que el giro no parpadee
      this.producto()?.fotos360?.forEach(f => { new Image().src = f; });
    });

    // giro lento automático hasta que el cliente lo toma con el dedo o el mouse
    effect(onCleanup => {
      if (!this.girando()) return;
      const t = setInterval(() => { if (!this.arrastrando()) this.angulo.update(a => a + 2.5); }, 50);
      onCleanup(() => clearInterval(t));
    });
  }

  alternarGiro() {
    this.pista.set(false);
    this.girando.update(g => !g);
  }

  bajar(e: PointerEvent) {
    if (e.button !== 0) return;
    this.presenta.set(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.arrastrando.set(true);
    this.inicioX = e.clientX;
    this.inicioAngulo = this.angulo();
    this.movido = 0;
    this.ladeoX.set(0);
    this.ladeoY.set(0);
  }

  mover(e: PointerEvent) {
    if (this.arrastrando()) {
      const dx = e.clientX - this.inicioX;
      this.movido = Math.max(this.movido, Math.abs(dx));
      this.angulo.set(this.inicioAngulo + dx * (this.girable() ? 0.8 : 0.6));
      if (this.girable()) this.girando.set(false);
      if (this.movido > 8) this.pista.set(false);
      return;
    }
    if (e.pointerType !== 'mouse' || this.girable()) return;
    // inclinación como si la prenda colgara frente a ti
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    this.ladeoY.set(x * 18);
    this.ladeoX.set(-y * 8);
  }

  subir(e: PointerEvent) {
    if (!this.arrastrando()) return;
    this.arrastrando.set(false);
    if (this.movido < 6) {
      // fue un toque, no un arrastre: abre el zoom
      const f = this.fotoActual(this.producto()!);
      if (f) this.ampliar.emit(f);
      return;
    }
    // termina mirando de frente o de espaldas, lo que quede más cerca
    if (!this.girable()) this.angulo.set(Math.round(this.angulo() / 180) * 180);
  }

  salir() {
    if (this.arrastrando()) return;
    this.ladeoX.set(0);
    this.ladeoY.set(0);
  }

  voltear() {
    this.presenta.set(false);
    this.pista.set(false);
    this.angulo.set(Math.round(this.angulo() / 180) * 180 + 180);
  }

  fotoActual(p: Producto) {
    if (this.es360()) return p.fotos360![this.fotoIndice()];
    if (this.falso()) return p.imagenUrl;
    return this.deEspaldas() ? p.imagenEspaldaUrl : p.imagenUrl;
  }

  tecla(e: KeyboardEvent) {
    if (this.girable() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      this.girando.set(false);
      this.angulo.update(a => a + (e.key === 'ArrowRight' ? 15 : -15));
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.voltear();
    }
  }

  pedirEspalda(p: Producto) {
    return linkWhatsapp(`Hola Luna Ventas, ¿me envían una foto de la espalda del ${p.nombre}?`);
  }
}
