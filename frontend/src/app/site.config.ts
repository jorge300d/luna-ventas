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
  mapaLink: 'https://www.google.com/maps/search/?api=1&query=Lince,+Lima,+Peru',
};

// Datos legales del proveedor (Código del Consumidor y Ley 29733).
// Lo que esté vacío no se muestra; hay que completarlo con los datos reales del negocio.
export const LEGAL = {
  titular: '',                 // nombre completo de la dueña o razón social de la empresa
  ruc: '',
  domicilio: '',               // dirección completa del stand (galería, número, Lince)
  correo: '',                  // correo para reclamos y derechos ARCO
  preciosIncluyenIgv: true,    // false si el negocio está en el Nuevo RUS
  diasCambio: 7,               // días calendario para cambios de talla o modelo
  registroBancoDatos: '',      // código de inscripción del banco de datos "Clientes" en la ANPD
  politicaVersion: '2026-10',
  politicaVigencia: '10 de octubre de 2026',
};

export function linkWhatsapp(mensaje: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
