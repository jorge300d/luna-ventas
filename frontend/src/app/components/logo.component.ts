import { Component, input } from '@angular/core';

// Logo redibujado en SVG: círculo amarillo-rosa con ramita dorada
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 120 120" role="img" aria-label="Luna Ventas">
      <defs>
        <linearGradient [attr.id]="'g' + uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FBE9A6" />
          <stop offset="1" stop-color="#F6B3D6" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" [attr.fill]="'url(#g' + uid + ')'" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#B08A4E" stroke-width="1.2" opacity=".7" />
      <g fill="none" stroke="#9A7440" stroke-width="1.4" stroke-linecap="round">
        <path d="M40 92 C 62 82, 80 66, 92 40" />
      </g>
      <g fill="#B08A4E" opacity=".9">
        <ellipse cx="54" cy="84" rx="6" ry="2.6" transform="rotate(-50 54 84)" />
        <ellipse cx="60" cy="80" rx="6" ry="2.6" transform="rotate(30 60 80)" />
        <ellipse cx="68" cy="73" rx="6" ry="2.6" transform="rotate(-55 68 73)" />
        <ellipse cx="74" cy="68" rx="6" ry="2.6" transform="rotate(25 74 68)" />
        <ellipse cx="81" cy="59" rx="6" ry="2.6" transform="rotate(-60 81 59)" />
        <ellipse cx="86" cy="52" rx="6" ry="2.6" transform="rotate(20 86 52)" />
      </g>
      <text x="58" y="58" text-anchor="middle" font-family="Parisienne, cursive" font-size="21" fill="#7A5A34">Luna ventas</text>
      <text x="60" y="70" text-anchor="middle" font-family="Outfit, sans-serif" font-size="5.5" letter-spacing="2" fill="#7A5A34">BOUTIQUE</text>
    </svg>
  `,
})
export class LogoComponent {
  size = input(48);
  uid = Math.random().toString(36).slice(2, 7);
}
