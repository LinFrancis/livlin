# Livlin — GitHub Pages (estático y simple)

## Publicar en GitHub Pages (3 pasos)
1. Crea un repositorio en GitHub (p. ej. `livlin-pages`).
2. Sube todos los archivos de esta carpeta al repo (raíz).
3. En GitHub: **Settings → Pages → Build and deployment** → *Deploy from branch* → `main` / `/ (root)`.

Tu sitio quedará en: `https://<tu-usuario>.github.io/livlin-pages/`  
(Con dominio propio: crea archivo `CNAME` con `livlin.org` y apunta el DNS del dominio a GitHub Pages).

## Editar contenido
- **Key Messages**: `assets/data/keymessages.json`
- **Dictionary**: `assets/data/dictionary.json`
- **Texto de secciones**: `index.html`

## Contacto
Para lo más simple, usamos `mailto:`. Si quieres un formulario que envíe sin abrir el cliente de correo, integra Formspree o Netlify Forms.
