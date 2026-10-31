import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { Producto } from '../models/producto';

// La prenda en 3D a partir de su foto real: la silueta de la foto se "infla" en volumen
// (cada fila es un óvalo, como un cuerpo) y la foto se pega encima, así de frente se ve el diseño exacto
// y al girar tiene grosor de verdad. Atrás se ve la misma tela un poco más oscura (solo hay foto del frente).
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

const cargarImagen = (url: string) => new Promise<HTMLImageElement | null>(ok => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => ok(null);
  img.src = url;
});

const COLUMNAS = 150;     // resolución de la malla
const PROFUNDIDAD = 0.78; // grosor del cuerpo respecto a su ancho
const ALTO = 2;           // alto de la foto en unidades 3D
const FOV = 18;           // lente cerrada: casi sin deformar la foto de frente

@Component({
  selector: 'app-modelo-3d',
  standalone: true,
  template: `<div #caja class="caja" role="img" [attr.aria-label]="producto().nombre + ' en 3D'"></div>`,
  styles: [':host{display:block;width:100%;height:100%} .caja{width:100%;height:100%;pointer-events:none} :host ::ng-deep canvas{width:100%!important;height:100%!important;display:block}'],
})
export class Modelo3dComponent {
  producto = input.required<Producto>();
  angulo = input(0); // grados
  falla = output<void>();

  private caja = viewChild.required<ElementRef<HTMLDivElement>>('caja');
  private lista = signal(false);   // three.js y la escena ya están armados
  private refresco = signal(0);    // sube cuando hay que volver a dibujar
  private T: any;
  private renderer: any;
  private escena: any;
  private camara: any;
  private figura: any = null;
  private sombra: any = null;
  private ancho = 1.5;
  private grosor = 0.3;
  private token = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.limpiar(); this.renderer?.dispose(); this.renderer?.domElement.remove(); });

    cargarThree().then(T => {
      this.T = T;
      const cont = this.caja().nativeElement;
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      cont.appendChild(this.renderer.domElement);
      this.escena = new T.Scene();
      this.camara = new T.PerspectiveCamera(FOV, 1, 0.1, 100);
      // luz pareja de frente (la foto ya trae su propia luz) y un poco de lado para que se note el volumen al girar
      this.escena.add(new T.AmbientLight(0xffffff, 0.6));
      const sol = new T.DirectionalLight(0xffffff, 0.45);
      sol.position.set(1, 1.5, 4);
      this.escena.add(sol);
      new ResizeObserver(() => this.ajustar()).observe(cont);
      this.ajustar();
      this.lista.set(true);
    }).catch(() => this.falla.emit());

    // cada vez que cambia la prenda se arma su volumen
    effect(() => {
      const p = this.producto();
      if (!this.lista()) return;
      this.armar(p);
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
    const asp = w / h;
    const t = Math.tan(((FOV / 2) * Math.PI) / 180);
    // encaja la foto completa como un object-fit: contain, con margen para el grosor
    const dist = Math.max(ALTO / 2 / t, this.ancho / 2 / (t * asp)) * 1.03 + this.grosor;
    this.camara.aspect = asp;
    this.camara.position.set(0, ALTO / 2, dist);
    this.camara.lookAt(0, ALTO / 2, 0);
    this.camara.updateProjectionMatrix();
    this.dibujar();
  }

  private dibujar() {
    if (this.renderer && this.escena) this.renderer.render(this.escena, this.camara);
  }

  private async armar(p: Producto) {
    const mi = ++this.token;
    const img = p.imagenUrl ? await cargarImagen(p.imagenUrl) : null;
    if (mi !== this.token) return;
    if (!img) { this.falla.emit(); return; }
    let hecho: { malla: any; ancho: number; grosor: number; piso: number; base: number };
    try {
      hecho = this.volumen(img);
    } catch {
      this.falla.emit(); // foto de otro dominio: no se puede leer su silueta
      return;
    }
    this.limpiar();
    this.figura = hecho.malla;
    this.figura.rotation.y = (this.angulo() * Math.PI) / 180;
    this.escena.add(this.figura);
    this.sombra = this.sombraPiso(hecho.base, hecho.piso);
    this.escena.add(this.sombra);
    this.ancho = hecho.ancho;
    this.grosor = hecho.grosor;
    this.ajustar();
    this.refresco.update(n => n + 1);
  }

  // convierte la silueta de la foto en una malla con volumen y la foto pegada encima
  private volumen(img: HTMLImageElement) {
    const T = this.T;
    const gw = COLUMNAS, gh = Math.round((COLUMNAS * img.naturalHeight) / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = gw; c.height = gh;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0, gw, gh);
    const alfa = g.getImageData(0, 0, gw, gh).data;
    const n = gw * gh;
    const dentro = new Uint8Array(n);
    for (let k = 0; k < n; k++) dentro[k] = alfa[k * 4 + 3] > 110 ? 1 : 0;

    // grosor: cada tramo de cada fila es un óvalo (torso, brazos, falda...)
    const z = new Float32Array(n);
    const radio = new Float32Array(n);
    let sumaX = 0, cuenta = 0, ultimaFila = 0;
    for (let j = 0; j < gh; j++) {
      let i = 0;
      while (i < gw) {
        if (!dentro[j * gw + i]) { i++; continue; }
        let f = i;
        while (f + 1 < gw && dentro[j * gw + f + 1]) f++;
        const medio = (f - i + 1) / 2, centro = (i + f) / 2;
        for (let x = i; x <= f; x++) {
          const dx = x - centro;
          z[j * gw + x] = PROFUNDIDAD * Math.sqrt(Math.max(0, medio * medio - dx * dx));
          radio[j * gw + x] = medio;
          sumaX += x; cuenta++;
        }
        ultimaFila = j;
        i = f + 1;
      }
    }

    // redondea los bordes de arriba y abajo (cabeza, hombros, manos, ruedo) para que no queden cortes planos
    const arriba = new Float32Array(gh);
    for (let i = 0; i < gw; i++) {
      let d = 0;
      for (let j = 0; j < gh; j++) { d = dentro[j * gw + i] ? d + 1 : 0; arriba[j] = d; }
      d = 0;
      for (let j = gh - 1; j >= 0; j--) {
        const k = j * gw + i;
        d = dentro[k] ? d + 1 : 0;
        const rv = Math.min(8, radio[k]);
        const dv = Math.min(arriba[j], d);
        if (dv > 0 && dv < rv) {
          const t = 1 - dv / rv;
          z[k] *= Math.sqrt(1 - t * t);
        }
      }
    }

    // suaviza para que no se noten escalones entre filas
    for (let pasada = 0; pasada < 3; pasada++) {
      const b = z.slice();
      for (let j = 1; j < gh - 1; j++) {
        for (let i = 1; i < gw - 1; i++) {
          const k = j * gw + i;
          if (!dentro[k]) continue;
          let s = 0, m = 0;
          for (let dj = -1; dj <= 1; dj++) {
            for (let di = -1; di <= 1; di++) {
              const q = k + dj * gw + di;
              if (dentro[q]) { s += b[q]; m++; }
            }
          }
          z[k] = s / m;
        }
      }
    }

    // malla: cara de adelante con la foto y cara de atrás con la misma tela
    const ancho = (ALTO * img.naturalWidth) / img.naturalHeight;
    const paso = ancho / (gw - 1);
    const eje = (cuenta ? sumaX / cuenta : gw / 2) * paso; // gira sobre el centro de la prenda, no de la foto
    const pos = new Float32Array(n * 2 * 3);
    const uv = new Float32Array(n * 2 * 2);
    let grosor = 0;
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i;
        const x = i * paso - eje, y = ALTO - (j * ALTO) / (gh - 1), zz = z[k] * paso;
        if (zz > grosor) grosor = zz;
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = zz;
        pos[(n + k) * 3] = x; pos[(n + k) * 3 + 1] = y; pos[(n + k) * 3 + 2] = -zz;
        const u = i / (gw - 1), v = 1 - j / (gh - 1);
        uv[k * 2] = u; uv[k * 2 + 1] = v;
        uv[(n + k) * 2] = u; uv[(n + k) * 2 + 1] = v;
      }
    }
    const frente: number[] = [], atras: number[] = [];
    for (let j = 0; j < gh - 1; j++) {
      for (let i = 0; i < gw - 1; i++) {
        const a = j * gw + i, b = a + 1, cc = a + gw, d = cc + 1;
        if (!(dentro[a] || dentro[b] || dentro[cc] || dentro[d])) continue;
        frente.push(a, cc, b, b, cc, d);
        atras.push(n + a, n + b, n + cc, n + b, n + d, n + cc);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    geo.setIndex(frente.concat(atras));
    geo.addGroup(0, frente.length, 0);
    geo.addGroup(frente.length, atras.length, 1);
    geo.computeVertexNormals();

    const tex = new T.Texture(img);
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
    const materiales = [
      new T.MeshLambertMaterial({ map: tex, alphaTest: 0.5 }),
      new T.MeshLambertMaterial({ map: tex, alphaTest: 0.5, color: 0xe4dde1 }),
    ];

    // ancho de la prenda abajo, para la sombra
    let iz = gw, de = 0;
    for (let i = 0; i < gw; i++) if (dentro[ultimaFila * gw + i]) { iz = Math.min(iz, i); de = Math.max(de, i); }
    const base = Math.max(0.3, (de - iz) * paso);
    const piso = ALTO - (ultimaFila * ALTO) / (gh - 1);

    return { malla: new T.Mesh(geo, materiales), ancho, grosor, piso, base };
  }

  // sombra suave en el piso, debajo del ruedo
  private sombraPiso(base: number, piso: number) {
    const T = this.T;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(59,42,63,.32)');
    gr.addColorStop(1, 'rgba(59,42,63,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const s = new T.Mesh(new T.PlaneGeometry(base * 1.5, base * 1.5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2;
    s.position.y = piso - 0.01;
    return s;
  }

  private limpiar() {
    for (const o of [this.figura, this.sombra]) {
      if (!o) continue;
      this.escena?.remove(o);
      o.geometry?.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) { m.map?.dispose(); m.dispose(); }
    }
    this.figura = null;
    this.sombra = null;
  }
}
