import { Component, input } from '@angular/core';
import { Categoria } from '../models/producto';

// Silueta de la prenda para cuando el producto todavía no tiene foto
@Component({
  selector: 'app-prenda',
  standalone: true,
  template: `
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      @switch (categoria()) {
        @case ('blusas') {
          <path d="M30 22 L42 16 Q50 24 58 16 L70 22 L84 36 L74 46 L68 40 L68 84 L32 84 L32 40 L26 46 L16 36 Z" [attr.fill]="color()" />
        }
        @case ('vestidos') {
          <path d="M40 12 L44 12 Q50 20 56 12 L60 12 L62 34 L80 88 L20 88 L38 34 Z" [attr.fill]="color()" />
          <rect x="37" y="34" width="26" height="4" rx="2" fill="rgba(255,255,255,.55)" />
        }
        @case ('pantalones') {
          <path d="M32 12 L68 12 L74 90 L56 90 L50 38 L44 90 L26 90 Z" [attr.fill]="color()" />
          <rect x="32" y="12" width="36" height="6" fill="rgba(255,255,255,.45)" />
        }
        @case ('conjuntos') {
          <path d="M32 12 L42 8 Q50 14 58 8 L68 12 L78 24 L70 30 L66 26 L66 50 L34 50 L34 26 L30 30 L22 24 Z" [attr.fill]="color()" />
          <path d="M34 56 L66 56 L70 90 L54 90 L50 70 L46 90 L30 90 Z" [attr.fill]="color()" opacity=".8" />
        }
        @case ('pijamas') {
          <path d="M30 14 L42 10 Q50 16 58 10 L70 14 L80 26 L72 32 L68 28 L68 52 L32 52 L32 28 L28 32 L20 26 Z" [attr.fill]="color()" />
          <path d="M33 56 L67 56 L70 90 L54 90 L50 66 L46 90 L30 90 Z" [attr.fill]="color()" opacity=".85" />
          <g fill="rgba(255,255,255,.75)"><circle cx="50" cy="22" r="1.8"/><circle cx="50" cy="32" r="1.8"/><circle cx="50" cy="42" r="1.8"/></g>
          <path d="M50 12 L50 52" stroke="rgba(255,255,255,.5)" stroke-width="1.5" />
          <g fill="rgba(255,255,255,.55)"><circle cx="39" cy="68" r="2.2"/><circle cx="61" cy="74" r="2.2"/><circle cx="42" cy="82" r="2.2"/><circle cx="58" cy="62" r="2.2"/></g>
        }
        @case ('ninos') {
          <path d="M36 24 L44 20 Q50 25 56 20 L64 24 L74 34 L67 40 L63 36 L63 60 L37 60 L37 36 L33 40 L26 34 Z" [attr.fill]="color()" />
          <path d="M38 63 L62 63 L64 82 L53 82 L50 72 L47 82 L36 82 Z" [attr.fill]="color()" opacity=".8" />
          <path d="M44 42 l3 -4 l3 4 l3 -4 l3 4" stroke="rgba(255,255,255,.75)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        }
        @default {
          <path d="M30 18 L42 12 L50 30 L58 12 L70 18 L86 40 L76 48 L70 40 L70 88 L30 88 L30 40 L24 48 L14 40 Z" [attr.fill]="color()" />
          <path d="M50 30 L50 88" stroke="rgba(255,255,255,.6)" stroke-width="2" />
        }
      }
    </svg>
  `,
  styles: [':host{display:block;width:100%;height:100%}'],
})
export class PrendaComponent {
  categoria = input.required<Categoria>();
  color = input('#E8738F');
}
