# Luna Ventas

Página web de Luna Ventas, tienda de ropa en Lince (Stand 1). Catálogo con carrito que arma el pedido y lo envía por WhatsApp, y una API que guarda productos, pedidos y mensajes en PostgreSQL.

```
luna-ventas/
├── frontend/      Angular 19 (HTML, CSS, TypeScript)
├── backend/       Spring Boot 3.5 + JPA + Flyway (Java 21)
├── database/      luna_ventas.sql (esquema + catálogo inicial)
├── .github/       despliegue a GitHub Pages y pruebas del backend
├── docker-compose.yml
└── render.yaml
```

La web funciona sola aunque el backend esté apagado: si la API no responde, el catálogo se carga desde `frontend/public/data/productos.json` y los pedidos igual salen por WhatsApp.

## Correr en local

Base de datos y API:

```bash
docker compose up --build        # PostgreSQL en 5432 y API en 8080
```

Sin Docker: crea la base `lunaventas` (usuario `luna` / `luna123`) y corre `cd backend && mvn spring-boot:run`. Flyway crea las tablas y carga el catálogo solo.

Frontend:

```bash
cd frontend
npm install
npm start                        # http://localhost:4200
```

## Desplegar

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Luna Ventas: web, API y base de datos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/luna-ventas.git
git push -u origin main
```

En el repositorio: **Settings → Pages → Source: GitHub Actions**. Cada push a `main` publica la web en `https://TU_USUARIO.github.io/luna-ventas/`.

### 2. Base de datos en Neon (gratis)

1. Crea un proyecto en neon.tech con PostgreSQL 16.
2. Copia los datos de conexión. La URL para Java queda así:
   `jdbc:postgresql://HOST.neon.tech/neondb?sslmode=require`

No hace falta correr el `.sql`; el backend crea las tablas al arrancar.

### 3. Backend en Render (gratis)

1. En render.com: **New → Blueprint** y elige este repositorio (usa `render.yaml`).
2. Completa las variables:
   - `DB_URL`, `DB_USER`, `DB_PASSWORD`: los de Neon
   - `CORS_ORIGINS`: `https://TU_USUARIO.github.io`
   - `ADMIN_KEY`: se genera sola; cópiala desde el panel
3. Copia la URL que te da Render (por ejemplo `https://luna-ventas-api.onrender.com`) y ponla en `frontend/src/environments/environment.prod.ts`. Haz push y la web se vuelve a publicar.

El plan gratis de Render se duerme tras 15 minutos sin visitas; la primera carga tarda unos segundos y, mientras tanto, la web usa el catálogo local.

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/productos?categoria=vestidos` | Catálogo público |
| GET | `/api/productos/{id}` | Detalle |
| POST | `/api/pedidos` | Registra un pedido (el total se calcula con los precios de la base) |
| POST | `/api/contactos` | Guarda un mensaje del formulario |
| POST / PUT / DELETE | `/api/productos` | Administrar prendas (header `X-Admin-Key`) |
| GET | `/api/pedidos` | Últimos 100 pedidos (header `X-Admin-Key`) |
| PATCH | `/api/pedidos/{id}/estado` | `pendiente`, `confirmado`, `entregado`, `cancelado` |
| GET | `/api/contactos` | Mensajes recibidos (header `X-Admin-Key`) |

Agregar una prenda:

```bash
curl -X POST https://TU-API.onrender.com/api/productos \
  -H "Content-Type: application/json" -H "X-Admin-Key: TU_CLAVE" \
  -d '{"nombre":"Blusa lino","descripcion":"Fresca","categoria":"blusas","precio":39,
       "tallas":["S","M","L"],"color":"#F4A6C1","imagenUrl":"https://...","nuevo":true,"stock":10}'
```

Si una prenda tiene `imagenUrl`, la tarjeta muestra la foto; si no, muestra la silueta de la categoría en su color.

## Para editar

- Teléfono, WhatsApp, redes, stand: `frontend/src/app/site.config.ts`
- Colores y tipografías: variables al inicio de `frontend/src/styles.css`
- Catálogo de respaldo: `frontend/public/data/productos.json`
- Los precios del catálogo inicial son de ejemplo; reemplázalos por los reales.

## Clientes y ofertas

- Web: https://lunaventas.vercel.app · Panel: https://lunaventas.vercel.app/panel
- API: https://luna-ventas-api.onrender.com · Base de datos: Neon (proyecto `luna-ventas`)
- La clave del panel es la variable `ADMIN_KEY` del servicio en Render (Environment → ver valor).

Los clientes se guardan al comprar o escribir desde la web. Solo reciben ofertas quienes marcan la casilla de consentimiento, quienes responden OFERTAS por WhatsApp o quienes la dueña agrega a mano con su permiso. Responder BAJA los saca de la lista.

Sin WhatsApp conectado, cada oferta se envía con un botón por cliente que abre WhatsApp con el mensaje listo (gratis). Las prendas nuevas marcadas como novedad generan una oferta automática para quienes compran esa categoría.

### Activar el envío automático (WhatsApp Cloud API de Meta)

1. Crear una app en developers.facebook.com con el producto WhatsApp y verificar el negocio.
2. Agregar el número y un método de pago (Meta cobra por mensaje de marketing).
3. Crear la plantilla `oferta_luna` (categoría Marketing, idioma español) con este cuerpo:
   `Hola {{1}}, {{2}}` y como pie: `Responde BAJA si no deseas recibir más ofertas.`
4. En Render agregar: `WA_TOKEN` (token permanente de usuario del sistema), `WA_PHONE_ID`, `WA_VERIFY_TOKEN` (cualquier texto) y `WA_APP_SECRET`.
5. En Meta, configurar el webhook con la URL `https://luna-ventas-api.onrender.com/api/whatsapp/webhook`, el mismo `WA_VERIFY_TOKEN`, y suscribirse a `messages`.

Desde ese momento las ofertas programadas salen solas, quien escribe al WhatsApp queda registrado y las palabras OFERTAS y BAJA funcionan automáticamente.
