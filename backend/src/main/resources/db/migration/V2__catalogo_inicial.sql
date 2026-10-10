-- Catálogo inicial de ejemplo (editar precios y prendas reales)
INSERT INTO productos (nombre, descripcion, categoria, precio, precio_antes, tallas, color, nuevo, stock) VALUES
('Blusa floral manga globo', 'Gasa ligera con estampado de flores y manga globo.', 'blusas', 35, 45, 'S,M,L', '#F4A6C1', TRUE, 12),
('Blusa tropical amarilla', 'Tela fresca con hojas tropicales, ideal para el verano.', 'blusas', 32, NULL, 'S,M,L,XL', '#F6D365', FALSE, 8),
('Polo básico algodón', 'Algodón peinado, corte recto. Varios colores.', 'blusas', 22, NULL, 'S,M,L,XL', '#C9B6E4', FALSE, 30),
('Vestido midi estampado', 'Vestido largo con cinturón, estampado floral multicolor.', 'vestidos', 69, 85, 'S,M,L', '#E8738F', TRUE, 6),
('Vestido camisero', 'Botones al frente y bolsillos. Cómodo para todo el día.', 'vestidos', 59, NULL, 'M,L,XL', '#9CC5A1', FALSE, 9),
('Vestido de fiesta satinado', 'Satén con caída suave y escote en V.', 'vestidos', 89, 110, 'S,M,L', '#B46A9A', TRUE, 4),
('Pantalón palazzo', 'Pierna ancha y pretina elástica. Muy fresco.', 'pantalones', 45, NULL, 'S,M,L,XL', '#E9C46A', FALSE, 15),
('Jean mom fit', 'Tiro alto, denim con algo de stretch.', 'pantalones', 65, 79, '26,28,30,32', '#7FA7D8', FALSE, 10),
('Conjunto lino dos piezas', 'Blusa y short de lino, combinan o se usan por separado.', 'conjuntos', 79, 95, 'S,M,L', '#F2B880', TRUE, 7),
('Conjunto deportivo', 'Polera y jogger de franela suave.', 'conjuntos', 75, NULL, 'S,M,L,XL', '#A3C4BC', FALSE, 11),
('Casaca jean clásica', 'Denim resistente con botones metálicos.', 'casacas', 85, NULL, 'S,M,L', '#5B7DB1', FALSE, 5),
('Cardigan tejido', 'Tejido suave, abierto al frente. Abriga sin pesar.', 'casacas', 55, 65, 'Estándar', '#D9A5B3', TRUE, 14);
