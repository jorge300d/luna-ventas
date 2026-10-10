import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../components/logo.component';
import { PieLegalComponent } from '../../components/pie-legal.component';

// marco común de las páginas legales: cabecera simple, contenido legible y pie con los datos del proveedor
@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [RouterLink, LogoComponent, PieLegalComponent],
  template: `
    <header class="cab">
      <a routerLink="/" class="marca"><app-logo [size]="40" /><span>Luna Ventas</span></a>
      <a routerLink="/" class="volver">← Volver a la tienda</a>
    </header>
    <main class="doc">
      <p class="pre">{{ etiqueta() }}</p>
      <h1>{{ titulo() }}</h1>
      @if (subtitulo()) { <p class="sub">{{ subtitulo() }}</p> }
      <ng-content />
    </main>
    <app-pie-legal />
  `,
  styleUrl: './legal.css',
})
export class LegalLayoutComponent {
  etiqueta = input('Información legal');
  titulo = input.required<string>();
  subtitulo = input('');
}
