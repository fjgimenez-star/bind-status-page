# Página de estado en Vercel

Esta carpeta es la página pública de estado lista para subir a Vercel. **No se conecta a la VM.** Es al revés: después de cada verificación (cada 5 minutos), el monitor de la VM le **envía** el estado.

```
VM (red interna)  ──POST cada 5 min──►  Vercel /api/ingest  ──►  Vercel Blob
                                                     clientes ──►  /  y  /api/estado
```

Lo que se envía es solo la vista pública: estados, tiempos y disponibilidad. Nunca salen de la VM los mensajes de error, las respuestas, los tokens ni los datos de clientes. Además, `/api/ingest` vuelve a filtrar campo por campo y descarta cualquier dato que no esté previsto.

## Subirla (todo desde el navegador, sin instalar nada)

1. Creá un repositorio en GitHub, por ejemplo `bind-status-page`, y subí el contenido de esta carpeta con "Add file → Upload files". No subas `node_modules`.
2. En vercel.com: **Add New → Project → Import** ese repositorio. Framework: *Other*. Dejá todo por defecto y tocá **Deploy**.
3. En el proyecto: **Storage → Create → Blob** y conectalo al proyecto. Esto crea solo la variable `BLOB_READ_WRITE_TOKEN`.
4. En **Settings → Environment Variables** agregá:
   - `INGEST_TOKEN`: un texto al azar de 32 caracteres o más. Es la "clave" con la que la VM publica.
   - `CORS_ORIGENES`: `https://psp.bind.com.ar` (opcional; deja que el widget funcione en la documentación).
5. **Redeploy** para que tome las variables.

## Conectar la VM

En el `.env` del monitor, en la VM, agregá estas líneas y reiniciá `3-iniciar`:

```
MON_PUBLICAR_URL=https://<tu-proyecto>.vercel.app/api/ingest
MON_PUBLICAR_TOKEN=<el mismo INGEST_TOKEN>
```

Para probarlo, corré `2-probar`. Al final tiene que decir "Estado publicado en …". Si dice que no pudo conectar, la VM no tiene salida a internet hacia vercel.app y hay que pedir que la habiliten. Si sale por un proxy, agregá `HTTPS_PROXY=http://proxy:puerto` en el `.env`.

## Usarla

- **Página completa:** `https://<tu-proyecto>.vercel.app/` (acepta `?producto=wallet`, `?embed=1` y `?tema=claro`).
- **Widget para psp.bind.com.ar/developers:**
  ```html
  <div id="bind-status"></div>
  <script src="https://<tu-proyecto>.vercel.app/widget.js" async></script>
  ```
- **Si el monitor deja de enviar datos** durante más de 20 minutos (`MINUTOS_SIN_DATOS`), la página muestra "Sin datos recientes del monitor" en lugar de un estado viejo.
