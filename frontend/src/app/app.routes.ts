import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Luna Ventas · Tienda de ropa en Lince' },
  // el panel se carga aparte para que la tienda no pese más
  { path: 'panel', loadComponent: () => import('./pages/panel/panel.component').then(m => m.PanelComponent), title: 'Panel · Luna Ventas' },
  { path: '**', redirectTo: '' },
];
