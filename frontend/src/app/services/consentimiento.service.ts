import { Injectable, signal } from '@angular/core';

const CLAVE = 'luna-cookies';
type Decision = 'aceptado' | 'rechazado';

// guarda si la persona aceptó o rechazó las cookies
@Injectable({ providedIn: 'root' })
export class ConsentimientoService {
  decision = signal<Decision | null>(this.leer());

  aceptar() {
    this.guardar('aceptado');
  }

  rechazar() {
    this.guardar('rechazado');
    // si rechaza, no se deja nada guardado del pedido
    try { localStorage.removeItem('luna-carrito'); } catch {}
  }

  permitido() {
    return this.decision() === 'aceptado';
  }

  private guardar(d: Decision) {
    this.decision.set(d);
    try { localStorage.setItem(CLAVE, d); } catch {}
  }

  private leer(): Decision | null {
    try {
      const v = localStorage.getItem(CLAVE);
      return v === 'aceptado' || v === 'rechazado' ? v : null;
    } catch {
      return null;
    }
  }
}
