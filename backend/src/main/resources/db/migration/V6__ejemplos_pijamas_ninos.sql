-- Ejemplos para las nuevas categorías (reemplazar por prendas reales desde el panel)
INSERT INTO productos (nombre, descripcion, categoria, precio, precio_antes, tallas, color, nuevo, stock) VALUES
('Pijama polar estampada', 'Polar suave de dos piezas, ideal para el invierno.', 'pijamas', 39, NULL, 'S,M,L,XL', '#B9A3D9', TRUE, 10),
('Pijama short y polo', 'Algodón fresco con diseño, para noches de verano.', 'pijamas', 29, 35, 'S,M,L', '#F7B2C4', FALSE, 12),
('Casaca niño invierno', 'Ropa americana para niño, abrigadora y resistente.', 'ninos', 35, NULL, '4,6,8,10,12', '#7FB3D5', TRUE, 8),
('Conjunto niña algodón', 'Polo y pantalón de algodón, cómodo para todo el día.', 'ninos', 32, NULL, '2,4,6,8', '#F5B971', FALSE, 9);
