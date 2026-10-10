import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Luna Ventas · Tienda de ropa en Lince' },
  // el panel se carga aparte para que la tienda no pese más
  { path: 'panel', loadComponent: () => import('./pages/panel/panel.component').then(m => m.PanelComponent), title: 'Panel · Luna Ventas' },
  { path: 'privacidad', loadComponent: () => import('./pages/legal/privacidad.component').then(m => m.PrivacidadComponent), title: 'Política de Privacidad · Luna Ventas' },
  { path: 'terminos', loadComponent: () => import('./pages/legal/terminos.component').then(m => m.TerminosComponent), title: 'Términos y Condiciones · Luna Ventas' },
  { path: 'libro-de-reclamaciones', loadComponent: () => import('./pages/legal/libro.component').then(m => m.LibroComponent), title: 'Libro de Reclamaciones · Luna Ventas' },
  { path: '**', redirectTo: '' },
];
