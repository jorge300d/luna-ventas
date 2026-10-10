// Datos del negocio. Si algo cambia (teléfono, horario, redes) se edita solo aquí.
export const SITE = {
  nombre: 'Luna Ventas',
  rubro: 'Tienda de ropa',
  lema: 'Full moda, bajos precios del mercado',
  whatsapp: '51961432705',
  whatsappVisible: '961 432 705',
  telefono: '961 432 705',
  distrito: 'Lince, Lima',
  stand: 'Stand 1',
  facebook: 'https://www.facebook.com/marylunaventas',
  tiktok: 'https://www.tiktok.com/@lunaventastienda',
  tiktokUsuario: '@Lunaventastienda',
  seguidores: '4,9 mil',
  mapa: 'https://www.google.com/maps?q=Lince,+Lima,+Peru&output=embed',
};

export function linkWhatsapp(mensaje: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
