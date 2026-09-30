LEN MODA V4 PREMIUM

 

INCLUYE

- Logo proporcionado por LEN MODA, optimizado como logo-len-moda.webp.

- Hero con fotografía real de moda y posibilidad de reemplazarla desde Google Sheets.

- Carrusel de favoritos y carrusel de nuevos ingresos.

- Categorías visuales con iconos SVG.

- Tarjetas premium con segunda foto al pasar el mouse.

- Galería por color con múltiples fotos.

- Animaciones suaves al hacer scroll.

- Sección Instagram basada en las fotos del catálogo y enlace al perfil.

- WhatsApp automático por producto y color.

 

HOJAS OBLIGATORIAS

PRODUCTOS

ID_PRODUCTO | NOMBRE | GENERO | CATEGORIA | DESCRIPCION | DESTACADO | NUEVO | VISIBLE

 

VARIANTES

ID_VARIANTE | ID_PRODUCTO | COLOR | HEX_COLOR | PRECIO | TALLES | FOTOS_URL | STOCK | VISIBLE

 

CONFIGURACION

CAMPO | VALOR

 

FILAS RECOMENDADAS EN CONFIGURACION

NOMBRE_NEGOCIO | LEN MODA

WHATSAPP | 5491150395940

INSTAGRAM | lenmoda

INSTAGRAM_URL | pegar URL completa del Instagram real

FACEBOOK_URL | pegar URL completa del Facebook real

HERO_URL | pegar URL pública de la imagen principal, o dejar vacío para usar la imagen incluida en el código

 

VARIAS FOTOS

En VARIANTES.FOTOS_URL:

URL_1|URL_2|URL_3

La primera es la principal y la segunda aparece al pasar el mouse sobre la tarjeta.

 

PRUEBA Y PUBLICACION

Usar Live Server o Vercel. No abrir index.html mediante file://.

La hoja debe estar accesible por enlace y los enlaces de imagen deben ser URLs completas, no chips de Drive.

 

FOTO HERO DE RESPALDO

La versión usa una fotografía de moda alojada en Unsplash. Podés reemplazarla sin tocar código cargando HERO_URL en CONFIGURACION.