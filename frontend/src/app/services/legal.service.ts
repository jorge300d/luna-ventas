import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HojaReclamo {
  numero: string;
  fecha: string;
  correoEnviado: boolean;
  hoja: string;
}

@Injectable({ providedIn: 'root' })
export class LegalService {
  private http = inject(HttpClient);

  // el servidor gratis puede tardar en despertar, por eso el tiempo de espera es largo
  registrarReclamo(datos: Record<string, unknown>) {
    return this.http.post<HojaReclamo>(`${environment.apiUrl}/reclamos`, datos).pipe(timeout(70000));
  }

  solicitarDerecho(datos: Record<string, unknown>) {
    return this.http.post<{ id: number; fecha: string }>(`${environment.apiUrl}/derechos`, datos).pipe(timeout(70000));
  }
}
