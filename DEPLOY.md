# Despliegue (GitHub + cPanel Git Version Control)

Igual que las otras apps de intranet. Como cPanel **no compila** (no hay Node en el
servidor), el repositorio versiona la carpeta **`dist/`** ya construida, y `.cpanel.yml`
la copia al subdominio.

Flujo resumido: `npm run build` → `git commit` (incluyendo `dist/`) → `git push` →
en cPanel: **Deploy HEAD Commit** → el sitio queda actualizado.

---

## 1. Crear el repositorio en GitHub

1. Crea un repo **privado** en GitHub (p. ej. `app-inventario` u `almacenes-web`).
2. En la carpeta del proyecto (en tu Windows), inicializa git y sube el primer commit:

   ```bash
   git init
   git add -A
   git commit -m "Version inicial"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario-o-org>/<repo>.git
   git push -u origin main
   ```

   > Nota: corre estos comandos en tu equipo (PowerShell/CMD/Git Bash), no desde el
   > asistente. Antes, borra la carpeta `_to_delete/` (contiene respaldos y un `.git`
   > temporal que no sirve).

## 2. Conectar cPanel (Git Version Control)

1. En cPanel → **Git™ Version Control** → **Create**.
2. Marca **Clone a Repository** y pega la URL del repo (usa un token/clave de despliegue
   de GitHub para repos privados).
3. **Repository Path**: una ruta dentro de tu home, por ejemplo
   `/home/carnesbacalcom/repositories/app-inventario` (NO el public_html).
4. Crea la carpeta de publicación en el subdominio (si no existe):
   `intranet.carnesbacal.com.mx/Inventario/`
5. Verifica que en `.cpanel.yml` el `DEPLOYPATH` apunte a esa carpeta. Si usas otro
   nombre de subcarpeta, cambia **solo esa línea**.

## 3. Publicar / actualizar

Cada vez que cambies el código:

```bash
npm run build            # genera dist/ (con la API y el .htaccess dentro)
git add -A
git commit -m "Actualiza build"
git push
```

Luego en cPanel → Git Version Control → **Manage** → pestaña **Pull or Deploy** →
**Update from Remote** y después **Deploy HEAD Commit**. Eso ejecuta `.cpanel.yml` y
copia `dist/` a la subcarpeta.

> Puedes activar **auto-deploy** en cPanel (webhook de GitHub) para que despliegue solo
> en cada push. Aun así recuerda **compilar antes de commitear** (el deploy usa el `dist/`
> que subiste, no compila en el servidor).

## Notas

- **HTTPS**: lo da el subdominio de intranet (necesario para la cámara).
- **Rutas relativas + HashRouter**: la app funciona en cualquier subcarpeta sin recompilar.
- **`.htaccess`**: va incluido dentro de `dist/` (fuerza HTTPS, MIME del `.wasm`, cache).
- **`.env`** no se versiona; la URL de la API queda "horneada" en `dist/` al compilar.
- Si cambias `VITE_API_BASE`, hay que **recompilar** para que el cambio llegue al deploy.
