import { Component, HostListener, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LogoComponent } from '../../components/logo.component';
import { PrendaComponent } from '../../components/prenda.component';
import { CatalogoComponent } from '../../components/catalogo.component';
import { CarritoComponent } from '../../components/carrito.component';
import { ContactoComponent } from '../../components/contacto.component';
import { CarritoService } from '../../services/carrito.service';
import { CATEGORIAS, Categoria } from '../../models/producto';
import { SITE, linkWhatsapp } from '../../site.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LogoComponent, PrendaComponent, CatalogoComponent, CarritoComponent, ContactoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  carrito = inject(CarritoService);
  site = SITE;
  categorias = CATEGORIAS;
  catalogo = viewChild(CatalogoComponent);
  mapa = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE.mapa);

  waGeneral = linkWhatsapp('Hola Luna Ventas, vi su página web y quisiera información sobre sus prendas.');
  telLink = 'tel:+51' + SITE.telefono.replace(/ /g, '');
  menu = signal(false);
  scrolled = signal(false);
  anio = new Date().getFullYear();

  palabras = ['linda', 'cómoda', 'segura', 'tú misma'];
  palabra = signal(0);
  private timer = setInterval(() => this.palabra.update(i => (i + 1) % this.palabras.length), 2200);

  pasos = [
    { quien: 'Tú', titulo: 'Eliges tus prendas', texto: 'Mira el catálogo, escoge talla y agrégalas a tu pedido.' },
    { quien: 'Tú', titulo: 'Nos escribes', texto: 'El pedido llega armado a nuestro WhatsApp, sin escribir de más.' },
    { quien: 'Luna', titulo: 'Confirmamos y pagas', texto: 'Te confirmamos stock y pagas por Yape, Plin o transferencia.' },
    { quien: 'Luna', titulo: 'Recoges o te llega', texto: 'Recojo en nuestro stand en Lince o delivery a tu distrito.' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 12);
  }

  verCategoria(c: Categoria) {
    this.catalogo()?.filtro.set(c);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  }

  colorCategoria(i: number) {
    return ['#F4A6C1', '#E8738F', '#E9C46A', '#F2B880', '#7FA7D8'][i % 5];
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
