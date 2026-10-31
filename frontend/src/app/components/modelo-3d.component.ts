import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { Producto } from '../models/producto';

// Modelo 3D de una chica con el vestido puesto, que gira de verdad 360°.
// El cuerpo cambia según la talla, el largo según corto/midi/maxi y el estampado se toma de la foto real.
// three.js se carga una sola vez desde cdnjs; si no carga, avisa para volver a la foto.
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let promesaThree: Promise<any> | null = null;
const cargarThree = (): Promise<any> => {
  const w = window as any;
  if (w.THREE) return Promise.resolve(w.THREE);
  promesaThree ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.onload = () => (w.THREE ? ok(w.THREE) : mal(new Error('sin THREE')));
    s.onerror = () => { promesaThree = null; mal(new Error('no cargó three.js')); };
    document.head.appendChild(s);
  });
  return promesaThree;
};

@Component({
  selector: 'app-modelo-3d',
  standalone: true,
  template: `<div #caja class="caja" role="img" [attr.aria-label]="'Modelo 3D con ' + producto().nombre"></div>`,
  styles: [':host{display:block;width:100%;height:100%} .caja{width:100%;height:100%;pointer-events:none} :host ::ng-deep canvas{width:100%!important;height:100%!important;display:block}'],
})
export class Modelo3dComponent {
  producto = input.required<Producto>();
  angulo = input(0); // grados
  falla = output<void>();

  private caja = viewChild.required<ElementRef<HTMLDivElement>>('caja');
  private lista = signal(false);   // three.js y la escena ya están armados
  private refresco = signal(0);     // sube cuando hay que volver a dibujar
  private T: any;
  private renderer: any;
  private escena: any;
  private camara: any;
  private figura: any = null;
  private sombra: any = null;
  private token = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.renderer?.dispose(); this.renderer?.domElement.remove(); });

    // arma la escena la primera vez
    cargarThree().then(T => {
      this.T = T;
      const cont = this.caja().nativeElement;
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      cont.appendChild(this.renderer.domElement);
      this.escena = new T.Scene();
      this.camara = new T.PerspectiveCamera(30, 1, 0.1, 50);
      this.camara.position.set(0, 0.95, 4.3);
      this.camara.lookAt(0, 0.86, 0);
      this.escena.add(new T.HemisphereLight(0xffffff, 0xe8c9d4, 0.85));
      const sol = new T.DirectionalLight(0xffffff, 0.8);
      sol.position.set(2, 3, 4);
      this.escena.add(sol);
      new ResizeObserver(() => this.ajustar()).observe(cont);
      this.ajustar();
      this.lista.set(true);
    }).catch(() => this.falla.emit());

    // cada vez que cambia la prenda, se viste otra vez a la modelo
    effect(() => {
      const p = this.producto();
      if (!this.lista()) return;
      this.vestir(p);
    });

    effect(() => {
      const a = this.angulo();
      this.lista();
      this.refresco();
      if (this.figura) this.figura.rotation.y = (a * Math.PI) / 180;
      this.dibujar();
    });
  }

  private ajustar() {
    if (!this.renderer) return;
    const c = this.caja().nativeElement;
    const w = Math.max(1, c.clientWidth), h = Math.max(1, c.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    this.dibujar();
  }

  private dibujar() {
    if (this.renderer && this.escena) this.renderer.render(this.escena, this.camara);
  }

  // talla -> ancho del cuerpo
  private factorTalla(tallas: string[]) {
    const t = (tallas[0] ?? 'M').toUpperCase();
    if (t.includes('XL')) return 1.16;
    if (t.includes('M/L')) return 1.04;
    if (t.startsWith('L')) return 1.09;
    if (t.includes('XS')) return 0.88;
    if (t.startsWith('S')) return 0.94;
    return 1;
  }

  // recorta de la foto un trozo de tela (centro del vestido, sin brazos del maniquí)
  private textura(p: Producto): Promise<any> {
    return new Promise(ok => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth, h = img.naturalHeight;
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const g = c.getContext('2d')!;
          g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, w, h).data;
          let x0 = w, x1 = 0, y0 = h, y1 = 0;
          for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 2) {
            if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          }
          const bw = x1 - x0, bh = y1 - y0, cx = (x0 + x1) / 2;
          const sx = Math.round(cx - bw * 0.14), sw = Math.round(bw * 0.28);
          const sy = Math.round(y0 + bh * 0.42), sh = Math.round(bh * 0.54);
          const parche = document.createElement('canvas');
          parche.width = 256; parche.height = 512;
          parche.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, 256, 512);
          const tex = new this.T.CanvasTexture(parche);
          tex.wrapS = this.T.MirroredRepeatWrapping;
          tex.wrapT = this.T.ClampToEdgeWrapping;
          tex.repeat.set(3, 1);
          ok(tex);
        } catch { ok(null); } // foto de otro dominio: usa el color de la prenda
      };
      img.onerror = () => ok(null);
      img.src = p.imagenUrl ?? '';
    });
  }

  private async vestir(p: Producto) {
    const mi = ++this.token;
    const tex = await this.textura(p);
    if (mi !== this.token) return;
    const T = this.T;
    if (this.figura) {
      this.escena.remove(this.figura);
      this.figura.traverse((o: any) => { o.geometry?.dispose(); });
    }

    const k = this.factorTalla(p.tallas);
    const piel = new T.MeshStandardMaterial({ color: 0xe9c7b4, roughness: 0.8 });
    const pelo = new T.MeshStandardMaterial({ color: 0x3a2622, roughness: 0.7 });
    const tela = new T.MeshStandardMaterial({ color: tex ? 0xffffff : new T.Color(p.color), map: tex, roughness: 0.85, side: T.DoubleSide });
    const zapato = new T.MeshStandardMaterial({ color: 0x2e2a2d, roughness: 0.6 });

    const f = new T.Group();
    const poner = (geo: any, mat: any, x = 0, y = 0, z = 0, rz = 0) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.z = rz;
      f.add(m);
      return m;
    };
    const lathe = (pts: number[][], esc = k) =>
      new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r * esc, y)), 56);

    // cabeza, pelo y cuello
    const cabeza = poner(new T.SphereGeometry(0.105, 32, 24), piel, 0, 1.6, 0);
    cabeza.scale.set(0.92, 1.12, 1);
    const cabello = poner(new T.SphereGeometry(0.113, 32, 24), pelo, 0, 1.615, -0.026);
    cabello.scale.set(0.98, 1.1, 1);
    poner(new T.SphereGeometry(0.05, 20, 16), pelo, 0, 1.72, -0.07);
    poner(new T.CylinderGeometry(0.038, 0.044, 0.1, 20), piel, 0, 1.49, 0);

    // torso (debajo del vestido)
    poner(lathe([[0, 1.47], [0.06, 1.46], [0.14, 1.42], [0.165, 1.33], [0.15, 1.22], [0.125, 1.12], [0.15, 1.0], [0.16, 0.88]]), piel);

    // vestido: corpiño ceñido y falda con vuelo según el largo
    const hem = { corto: [0.62, 0.3], midi: [0.42, 0.34], maxi: [0.1, 0.37] }[p.largo ?? 'midi'] ?? [0.42, 0.34];
    const perfil: number[][] = [[0.152, 1.4], [0.177, 1.33], [0.162, 1.22], [0.137, 1.12], [0.162, 1.0]];
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      perfil.push([0.162 + (hem[1] - 0.162) * Math.pow(t, 0.8), 1.0 + (hem[0] - 1.0) * t]);
    }
    poner(lathe(perfil), tela);

    // mangas cortas, hombros y brazos
    for (const s of [-1, 1]) {
      poner(new T.SphereGeometry(0.05, 20, 16), piel, s * 0.19, 1.385, 0);
      const manga = poner(new T.CylinderGeometry(0.052, 0.06, 0.13, 20, 1, true), tela, s * 0.215, 1.335, 0, s * 0.28);
      manga.scale.set(1, 1, 1);
      poner(new T.CylinderGeometry(0.034, 0.027, 0.5, 16), piel, s * 0.245, 1.07, 0, s * 0.06);
      poner(new T.SphereGeometry(0.034, 16, 12), piel, s * 0.262, 0.8, 0);
    }

    // piernas y zapatos
    for (const s of [-1, 1]) {
      poner(new T.CylinderGeometry(0.058, 0.04, 0.88, 20), piel, s * 0.075, 0.45, 0);
      const z = poner(new T.SphereGeometry(0.05, 20, 14), zapato, s * 0.075, 0.03, 0.035);
      z.scale.set(0.9, 0.55, 1.7);
    }

    // sombra suave en el piso
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(59,42,63,.35)');
    gr.addColorStop(1, 'rgba(59,42,63,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const sombra = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.002;

    f.rotation.y = (this.angulo() * Math.PI) / 180;
    if (this.sombra) this.escena.remove(this.sombra);
    this.sombra = sombra;
    this.figura = f;
    this.escena.add(f);
    this.escena.add(sombra);
    this.refresco.update(n => n + 1);
  }
}
