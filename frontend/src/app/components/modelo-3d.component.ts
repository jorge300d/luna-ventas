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
    // solo la parte bien opaca: el borde suave de la foto se estiraría al girar
    for (let k = 0; k < n; k++) dentro[k] = alfa[k * 4 + 3] > 170 ? 1 : 0;
    // contorno: puntos de la prenda que tocan el fondo; ahí se cierra el volumen (grosor 0)
    const borde = new Uint8Array(n);
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i;
        if (!dentro[k]) continue;
        if (i === 0 || j === 0 || i === gw - 1 || j === gh - 1 ||
          !dentro[k - 1] || !dentro[k + 1] || !dentro[k - gw] || !dentro[k + gw]) borde[k] = 1;
      }
    }

    // grosor: cada tramo de cada fila es una sección con forma de lente (torso, brazos, falda...).
    // El borde no llega vertical, así de costado se ve la tela de verdad y no el último píxel estirado
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
          z[j * gw + x] = PROFUNDIDAD * medio * Math.max(0, 1 - (dx / medio) * (dx / medio));
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
    for (let k = 0; k < n; k++) if (borde[k]) z[k] = 0;

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
        if (!(dentro[a] && dentro[b] && dentro[cc] && dentro[d])) continue; // solo celdas dentro de la prenda
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
    const texEspalda = new T.CanvasTexture(this.espalda(img));
    texEspalda.anisotropy = tex.anisotropy;
    const materiales = [
      new T.MeshLambertMaterial({ map: tex, alphaTest: 0.5 }),
      new T.MeshLambertMaterial({ map: texEspalda, alphaTest: 0.5, color: 0xece6e9 }),
    ];

    // ancho de la prenda abajo, para la sombra
    let iz = gw, de = 0;
    for (let i = 0; i < gw; i++) if (dentro[ultimaFila * gw + i]) { iz = Math.min(iz, i); de = Math.max(de, i); }
    const base = Math.max(0.3, (de - iz) * paso);
    const piso = ALTO - (ultimaFila * ALTO) / (gh - 1);

    return { malla: new T.Mesh(geo, materiales), ancho, grosor, piso, base };
  }

  // inventa la espalda a partir del frente: tapa el escote con la misma tela (la espalda suele ser más alta),
  // deja la nuca del maniquí y agrega una costura central con cierre para que se entienda que es la espalda
  private espalda(img: HTMLImageElement): HTMLCanvasElement {
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    const im = g.getImageData(0, 0, w, h);
    const d = im.data;

    // 0 fondo, 1 maniquí (negro o gris sin color), 2 tela
    const tipo = new Uint8Array(w * h);
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    for (let k = 0, p = 0; k < w * h; k++, p += 4) {
      if (d[p + 3] < 170) continue;
      const r = d[p], v = d[p + 1], b = d[p + 2];
      const lum = 0.299 * r + 0.587 * v + 0.114 * b;
      tipo[k] = lum < 75 && Math.max(r, v, b) - Math.min(r, v, b) < 30 ? 1 : 2;
      const x = k % w, y = (k / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const bw = x1 - x0, bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return c;

    // hombros: primera fila con bastante tela
    let yTela = -1;
    for (let y = y0; y <= y1 && yTela < 0; y++) {
      let cuenta = 0;
      for (let x = x0; x <= x1; x++) if (tipo[y * w + x] === 2) cuenta++;
      if (cuenta > bw * 0.08) yTela = y;
    }
    if (yTela < 0) return c;

    // cuello del maniquí justo encima de los hombros: de ahí sale el centro de la espalda
    const yCuello = Math.max(y0, yTela - Math.round(bh * 0.015));
    let suma = 0, cuenta = 0, iz = w, de = 0;
    for (let x = x0; x <= x1; x++) {
      if (tipo[yCuello * w + x] !== 1) continue;
      suma += x; cuenta++;
      if (x < iz) iz = x;
      if (x > de) de = x;
    }
    const xc = cuenta ? Math.round(suma / cuenta) : Math.round((x0 + x1) / 2);
    const medioCuello = Math.min(bw * 0.12, Math.max(bw * 0.05, (de - iz) / 2));

    // escote de la espalda: cubre el escote del frente con la tela de más abajo, reflejada para que el estampado siga
    const yFin = Math.min(y1, yTela + Math.round(bh * 0.3));
    const limite = Math.round(bw * 0.3);
    for (let y = yTela; y <= yFin; y++) {
      let xl = -1, xr = -1;
      for (let x = xc; x >= Math.max(x0, xc - limite); x--) if (tipo[y * w + x] === 2) { xl = x; break; }
      for (let x = xc; x <= Math.min(x1, xc + limite); x++) if (tipo[y * w + x] === 2) { xr = x; break; }
      if (xl < 0 || xr < 0 || xr - xl < 2) continue;
      for (let x = xl + 1; x < xr; x++) {
        const k = y * w + x;
        if (tipo[k] !== 1) continue;
        const t = (x - xc) / medioCuello;
        if (y < yTela + bh * (0.012 + 0.02 * Math.max(0, 1 - t * t))) continue; // nuca del maniquí
        let ys = y + 1;
        while (ys <= y1 && tipo[ys * w + x] !== 2) ys++;
        let fuente = ys <= y1 ? Math.min(y1, ys + (ys - y)) : -1;
        if (fuente >= 0 && tipo[fuente * w + x] !== 2) fuente = ys;
        const q = fuente >= 0 ? (fuente * w + x) * 4 : (y * w + xl) * 4;
        const p = k * 4;
        d[p] = d[q]; d[p + 1] = d[q + 1]; d[p + 2] = d[q + 2]; d[p + 3] = 255;
        tipo[k] = 2;
      }
    }

    // costura central con cierre invisible: un canal oscuro con un brillo a cada lado
    const s = Math.max(1, Math.round(w / 450));
    const yIni = Math.round(yTela + bh * 0.03);
    const yZip = Math.min(y1, Math.round(yTela + bh * 0.42));
    for (let y = yIni; y <= yZip; y++) {
      for (let dx = -2 * s; dx <= 2 * s; dx++) {
        const k = y * w + xc + dx;
        if (tipo[k] !== 2) continue;
        const a = Math.abs(dx) / s;
        const f = a < 0.6 ? 0.5 : a < 1.4 ? 0.75 : 1.12;
        const p = k * 4;
        d[p] = Math.min(255, d[p] * f); d[p + 1] = Math.min(255, d[p + 1] * f); d[p + 2] = Math.min(255, d[p + 2] * f);
      }
    }
    // pinzas suaves a los lados de la cintura
    for (const lado of [-1, 1]) {
      const xp = xc + lado * Math.round(bw * 0.11);
      const yA = Math.round(yTela + bh * 0.2), yB = Math.round(yTela + bh * 0.36);
      for (let y = yA; y <= yB; y++) {
        const k = y * w + xp;
        if (tipo[k] !== 2) continue;
        const p = k * 4;
        d[p] *= 0.8; d[p + 1] *= 0.8; d[p + 2] *= 0.8;
      }
    }
    g.putImageData(im, 0, 0);

    // jalador del cierre arriba
    if (tipo[yIni * w + xc] === 2) {
      g.fillStyle = '#d6cfd3';
      g.strokeStyle = 'rgba(40,28,40,.55)';
      g.lineWidth = s;
      g.beginPath();
      g.rect(xc - 2 * s, yIni, 4 * s, 11 * s);
      g.fill();
      g.stroke();
    }
    return c;
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
