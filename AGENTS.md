# AGENTS.md - Memoria de Sesiones

## Estado Actual del Proyecto

### Infraestructura
- **Backend**: Python 3.11-slim, FastAPI, SQLite (`backend/data/cotizaciones.db`)
- **Frontend**: React 18, Nginx, MUI
- **Docker Hub**: `adorh/cotizaciones-backend:latest`, `adorh/cotizaciones-frontend:latest`
- **NAS**: backend puerto 8001:8000, frontend puerto 5003:80
- **NAS compose**: `docker-compose.prod.yml` (container_name, TZ, workers 4, restart:always)
- **Backend workers**: `--workers 4` en producción

### API URL Detection (NO usar build args)
- `frontend/src/api/axios.js` detecta URL en runtime:
  - `localhost` → `http://localhost:8000`
  - `192.168.50.200` → `http://192.168.50.200:8001` (LAN)
  - Default → Cloudflare
- **NO necesita** `ARG REACT_APP_API_URL` en Dockerfile

### Base de Datos
- `CREATE TABLE IF NOT EXISTS` NO agrega columnas nuevas — usar `ALTER TABLE` manual
- Migraciones existentes:
  - `migrate_company_footer.py` — agrega `footer_text`, `footer_thanks` a `company_profiles`
  - `migrate_logo_app.py` — agrega `logo_app_url` a `app_settings`

---

## Funcionalidades Implementadas

### 1. Footer por Cuenta (per-account)
- **Modelo**: `CompanyProfile` (footer_text, footer_thanks) — NO AppSettings
- **Schema**: `CompanyProfileUpdate` con campos Optional + `exclude_unset=True`
- **Frontend**: `Settings.js` — SettingCard de "Pie de Página del PDF" visible para todos (sin adminOnly)
- **PDF**: `backend/main.py` lee footer del company_profile del usuario logueado

### 2. Logo de la App (Global)
- **Modelo**: `AppSettings.logo_app_url` — global para todas las cuentas
- **Endpoint**: `POST /app-settings/upload-logo-app` (upload), `GET /app-settings/` (público)
- **Static mount**: `/logos` → `backend/logos/`
- **Frontend**:
  - `AuthContext.js`: `logo_app_url: null` en default appConfig
  - `App.js` Sidebar: Logo de appConfig con fallback a gradiente
  - `App.js` Mobile header: Logo con fallback
  - `App.js` TopBar: "Cotizador" centrado con position absolute
  - `Login.js`: Logo sobre título
  - `Settings.js`: Card "Logo de la App" (adminOnly) + LogoAppModal

### 3. Sidebar / TopBar Redesign
- Sidebar muestra logo en lugar de texto "Cotizaciones"
- TopBar tiene "Cotizador" centrado, fondo transparente
- Mobile header muestra logo

### 4. Favicon
- Generado desde imagen del usuario (16x16 hasta 512x512)
- Archivos: `frontend/public/favicon.ico`, `favicon-*.png`, `android-chrome-*.png`, `apple-touch-icon.png`
- `manifest.json` actualizado con theme_color `#0a1226`
- **Cache busting**: `?v=2` en index.html + regla nginx `no-cache` para favicons

### 5. Docker / Deploy
- `.dockerignore` en `backend/` y `frontend/` (excluye .env, venv, data, migrate scripts)
- `docker-compose.prod.yml` alineado con patrón Vacaciones
- Imágenes Docker ya construidas y pusheadas

### 6. Responsive Design (Sesión Actual)

#### Priority 1 — Completado
- **overflow-x: auto** en 7 TableContainers: Clients, Products, Quotations, Users, Accounts, CreateQuotation, EditQuotation
- **Headers apilables** en Clients, Products, Quotations: `flexDirection: { xs: 'column', sm: 'row' }`
- **ml: 2 eliminado** del btn eliminar en Quotations.js

#### Priority 2 — Completado
- **Columnas ocultas en mobile**:
  - Clients: Email (`xs: 'none', md: 'table-cell'`), Teléfono (`xs: 'none', sm: 'table-cell'`)
  - Products: Descripción (`xs: 'none', md: 'table-cell'`)
  - Quotations: Fecha (`xs: 'none', sm: 'table-cell'`), Estado (`xs: 'none', md: 'table-cell'`)
- **Settings modales responsive** (`Settings.css`): padding reducido, ancho completo en mobile
- **Tipografía responsive** (`index.css`): h4/h5/h6 más pequeños, buttons/cells/chips reducidos en xs

#### Priority 3 — Completado
- **CreateQuotation**: Columnas Descripción e IVA ocultas en mobile, anchos proporcionales
- **Quotations**: Vista CARD en mobile (`xs`) con Paper, vista TABLA en desktop (`md+`)

#### Archivos Modificados (Responsive)
- `frontend/src/components/Clients.js` — header apilable, columnas ocultas
- `frontend/src/components/Products.js` — header apilable, columnas ocultas
- `frontend/src/components/Quotations.js` — header apilable, vista card mobile, btn ml:2 quitado
- `frontend/src/components/Users.js` — overflow-x auto
- `frontend/src/components/Accounts.js` — overflow-x auto
- `frontend/src/components/CreateQuotation.js` — overflow-x auto, columnas ocultas
- `frontend/src/components/EditQuotation.js` — overflow-x auto
- `frontend/src/components/Settings.css` — media query responsive modales
- `frontend/src/index.css` — media query tipografía, botones, cells responsive
- `frontend/public/index.html` — favicon cache busting `?v=2`
- `frontend/nginx.conf` — regla no-cache para favicons

---

## Notas Importantes

### MUI Breakpoints
- `xs` = 0px, `sm` = 600px, `md` = 900px, `lg` = 1200px
- `md` = 900px se usa para sidebar toggle en App.js

### Auth & Endpoints
- `GET /app-settings/` es público (sin auth) — funciona desde login
- `GET /company-profile/` y `PUT /company-profile/` requieren autenticación
- `GET /quotations/` retorna datos con `q.client.name` (join con Client)

### Producción
- Para apply cambios de frontend: rebuild Docker image → push → pull en NAS
- Para apply cambios de backend: rebuild Docker image → push → pull en NAS
- Para apply cambios de BD: ejecutar scripts de migración manualmente
- Los favicons requieren `?v=2` + regla nginx para evitar caché
- SQLite usa WAL mode para concurrencia con `--workers 4`

### 7. Logo de Empresa en PDF
- **Plantilla**: `backend/quotation_template.html`
- **Antes**: `max-width: 250px; max-height: 120px`
- **Ahora**: `width: 320px; max-height: 150px` (alineado con CAS_2.0)
- **Referencia**: `CAS_2.0/backend/app/templates/dictamen_report.html` usa `width: 320px`

### 8. Client ID Auto-generado
- **Formato**: Secuencial por cuenta, 2 dígitos (01, 02, 03...)
- **Lógica**: `crud.py` → `_get_next_client_id_number()` busca MAX ID de la cuenta + incrementa
- **create_client()**: Auto-asigna `client_id_number` antes de insertar
- **update_client()**: Ignora `client_id_number` del input (no editable)
- **schemas.py**: `client_id_number` eliminado de `ClientBase` y `ClientUpdate`, mantenido en schema `Client` (respuesta)
- **Frontend**: Campo eliminado de formularios en `Clients.js` y `QuickAddClientModal.js`
- **Migración**: `migrate_client_ids.py` — asigna IDs a clientes existentes sin ID
- **Migración ejecutada**: 1 cliente actualizado (El Reatón Vaquero → 01 en cuenta 5)
