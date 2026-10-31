import { Component, ElementRef, effect, input, signal, viewChild } from '@angular/core';

// 360° simulado a partir de UNA sola foto (fondo transparente):
// la prenda se redibuja columna por columna como una pieza plana que gira con perspectiva.
// Al pasar de los 90° se ve la parte de atrás, que es la misma foto más oscura (es una aproximación).
@Component({
  selector: 'app-giro-falso',
  standalone: true,
  template: `<canvas #lienzo role="img" [attr.aria-label]="alt()"></canvas>`,
  styles: [':host{display:block;width:100%;height:100%} canvas{width:100%;height:100%;object-fit:contain;object-position:50% 100%;display:block;filter:drop-shadow(0 18px 22px rgba(59,42,63,.16));pointer-events:none}'],
})
export class GiroFalsoComponent {
  src = input.required<string>();
  alt = input('');
  angulo = input(0); // grados

  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private listo = signal(false);
  private img = new Image();
  private x0 = 0;       // borde izquierdo de la prenda en la foto
  private x1 = 0;       // borde derecho
  private escala = 1;   // foto -> lienzo

  constructor() {
    effect(() => {
      const url = this.src();
      this.listo.set(false);
      const img = new Image();
      img.onload = () => {
        this.img = img;
        this.medir();
        this.listo.set(true);
      };
      img.src = url;
    });

    effect(() => {
      const a = this.angulo();
      if (this.listo()) this.dibujar(a);
    });
  }

  // busca el ancho real de la prenda para que el cilindro la abrace justa
  private medir() {
    const { naturalWidth: w, naturalHeight: h } = this.img;
    this.escala = Math.min(1, 960 / h);
    this.x0 = 0;
    this.x1 = w;
    try {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d')!;
      g.drawImage(this.img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let min = w, max = 0;
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 2) {
          if (d[(y * w + x) * 4 + 3] > 24) { if (x < min) min = x; if (x > max) max = x; }
        }
      }
      if (max > min) { this.x0 = min; this.x1 = max; }
    } catch { /* foto de otro dominio: usa todo el ancho */ }
  }

  private dibujar(grados: number) {
    const cv = this.lienzo().nativeElement;
    const { naturalWidth: w, naturalHeight: h } = this.img;
    const W = Math.round(w * this.escala), H = Math.round(h * this.escala);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const g = cv.getContext('2d')!;
    g.clearRect(0, 0, W, H);

    // la prenda gira como una pieza plana con perspectiva: el lado que se acerca se ve más alto
    // pasados los 90° se ve el revés (la misma foto espejada y más oscura)
    const a = (grados * Math.PI) / 180;
    const cx = (this.x0 + this.x1) / 2;
    const R = Math.max(1, (this.x1 - this.x0) / 2);
    const sa = Math.sin(a), ca = Math.cos(a);
    const c = (ca < 0 ? -1 : 1) * Math.max(0.3, Math.abs(ca)); // nunca se aplasta del todo
    const detras = ca < 0;
    const ancho = Math.ceil(this.escala) + 0.5;

    for (let dx = Math.floor(-R * Math.abs(c)); dx <= Math.ceil(R * Math.abs(c)); dx++) {
      const sx = cx + dx / c;                 // columna de la foto que cae aquí (espejada si c < 0)
      const lado = (dx / (R * Math.abs(c))) * Math.sign(sa || 1); // -1..1: el extremo que se acerca es +1
      const k = 1 + 0.09 * Math.abs(sa) * lado;
      const X = Math.round(cx) + dx;
      g.drawImage(this.img, sx, 0, 1, h, X * this.escala, H - H * k, ancho, H * k);

      const sombra = Math.min(0.7, 0.32 * Math.abs(sa) * (0.6 - 0.4 * lado) + (detras ? 0.26 : 0));
      if (sombra > 0.01) {
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = `rgba(48,28,52,${sombra})`;
        g.fillRect(X * this.escala, 0, ancho, H);
        g.globalCompositeOperation = 'source-over';
      }
    }
  }
}
