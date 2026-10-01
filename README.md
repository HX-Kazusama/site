# お菓子万博 — Y校祭2026 1-7

Sitio estático (HTML + CSS + JS, sin dependencias ni build).

## Ver en local

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Luego abrir http://localhost:8080/

## Editar contenido

Casi todo el texto está en **`assets/js/data.js`**:

- `sweets` → los 7 dulces. Cada uno tiene su página en `sweet.html?id=<id>` (p. ej. `sweet.html?id=peru`):
  - `desc` → párrafos del 商品紹介.
  - `allergens` → lista de alérgenos; `notes` → 注意事項 (si está vacío, no se muestra).
  - `photo` → foto del producto (`null` muestra "写真準備中"); `bg` → foto de fondo del país.
- `news` → 更新情報 (lo más nuevo arriba; sale "NEW" durante 7 días).
- `posters` → imágenes de la galería.
- `event` → horarios del contador regresivo.

## Publicar

Subir la carpeta `site/` completa a cualquier hosting estático, por ejemplo:

- **Netlify Drop** (https://app.netlify.com/drop): arrastrar la carpeta y listo.
- **GitHub Pages**: subir el contenido a un repo y activar Pages.
