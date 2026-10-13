-- Catálogo real (fotos del primer catálogo). Se ocultan las prendas de ejemplo.
ALTER TABLE productos ADD COLUMN largo VARCHAR(10);
UPDATE productos SET activo = FALSE;
INSERT INTO productos (nombre, descripcion, categoria, precio, precio_antes, tallas, color, imagen_url, nuevo, stock, largo) VALUES
('Vestido midi floral naranja', 'Estampado de flores en tonos naranja, rosa y morado. Manga corta y escote en V.', 'vestidos', 30, NULL, 'M', '#E8894B', '/catalogo/vestido-01.webp', FALSE, 1, 'midi'),
('Vestido rojo con smock', 'Rojo intenso con escote cuadrado, cuerpo fruncido, mangas abullonadas y falda con vuelo.', 'vestidos', 30, NULL, 'M', '#D9452B', '/catalogo/vestido-02.webp', FALSE, 1, 'midi'),
('Vestido corto estampado étnico', 'Estampado geométrico en negro, rosa y blanco. Manga corta y falda con vuelo.', 'vestidos', 25, NULL, 'S', '#9C4A5A', '/catalogo/vestido-03.webp', FALSE, 1, 'corto'),
('Vestido ceñido a rayas', 'Rayas en gris y negro, manga 3/4 y corte ajustado al cuerpo.', 'vestidos', 28, NULL, 'S', '#6B6B70', '/catalogo/vestido-04.webp', FALSE, 1, 'midi'),
('Vestido lila floral', 'Florecitas sobre fondo lila, cuello en V, manga amplia 3/4 y cintura con cordón.', 'vestidos', 30, NULL, 'M', '#8D78C9', '/catalogo/vestido-05.webp', FALSE, 1, 'midi'),
('Vestido maxi patchwork rojo', 'Estampado patchwork en rojos y rosas, lazo al cuello y mangas acampanadas.', 'vestidos', 35, NULL, 'S', '#C8473F', '/catalogo/vestido-06.webp', FALSE, 1, 'maxi'),
('Vestido verde salvia', 'Verde suave con cuerpo fruncido, escote cuadrado y mangas abullonadas.', 'vestidos', 30, NULL, 'M/L', '#9DB08F', '/catalogo/vestido-07.webp', FALSE, 1, 'midi'),
('Vestido negro con flores', 'Flores rojas y rosas sobre fondo negro, manga larga y largo corto.', 'vestidos', 25, NULL, 'M/L', '#2E2A2D', '/catalogo/vestido-08.webp', FALSE, 1, 'corto'),
('Vestido crema floral', 'Flores rojas sobre fondo crema, corte recto y mangas acampanadas.', 'vestidos', 25, NULL, 'L', '#E9C9A8', '/catalogo/vestido-09.webp', FALSE, 1, 'corto'),
('Vestido maxi floral beige', 'Estampado floral en tonos tierra, manga larga y botones al frente.', 'vestidos', 35, NULL, 'M', '#B9A58E', '/catalogo/vestido-10.webp', FALSE, 1, 'maxi'),
('Vestido azul con tiras cruzadas', 'Azul eléctrico, sin mangas, con tiras cruzadas en el escote.', 'vestidos', 20, NULL, 'S', '#2554C7', '/catalogo/vestido-11.webp', FALSE, 1, 'corto');
