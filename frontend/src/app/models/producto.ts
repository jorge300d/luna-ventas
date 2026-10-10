export type Categoria = 'blusas' | 'vestidos' | 'pantalones' | 'conjuntos' | 'casacas';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  precio: number;
  precioAntes?: number | null;
  tallas: string[];
  color: string;       // color base para la tarjeta cuando no hay foto
  imagenUrl?: string | null;
  nuevo: boolean;
  stock: number;
  activo?: boolean;
}

export interface ItemCarrito {
  producto: Producto;
  talla: string;
  cantidad: number;
}

export interface PedidoRequest {
  cliente: string;
  telefono: string;
  distrito: string;
  entrega: 'tienda' | 'delivery';
  aceptaOfertas: boolean;
  items: { productoId: number; talla: string; cantidad: number }[];
}

export const CATEGORIAS: { id: Categoria; nombre: string; detalle: string }[] = [
  { id: 'blusas', nombre: 'Blusas y polos', detalle: 'Estampados, lisos y de temporada' },
  { id: 'vestidos', nombre: 'Vestidos', detalle: 'Casuales, frescos y de fiesta' },
  { id: 'pantalones', nombre: 'Pantalones', detalle: 'Palazzo, jeans y licras' },
  { id: 'conjuntos', nombre: 'Conjuntos', detalle: 'Listos para combinar' },
  { id: 'casacas', nombre: 'Casacas', detalle: 'Para las tardes frías de Lima' },
];
