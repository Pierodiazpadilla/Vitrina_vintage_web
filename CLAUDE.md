# Proyecto: Vitrina Vintage — Coleccionistas como tú

Tienda online de **álbumes de figuritas de colección** (Anime, Mundiales de Fútbol, Cultura Pop / Retro).
Objetivo principal: **vender**. Cada pantalla debe acercar al cliente a consultar o comprar (WhatsApp / carrito).

## Recursos
- Logo: `public/images/logo_vitrina_vintage.jpeg`
- Fotos de catálogo: `public/catalogo/` (fotos reales de producto; no reemplazar por placeholders genéricos)

## Análisis del logo (de dónde sale la identidad)
- **Ícono:** consola portátil tipo handheld 8-bit en cian, con pantalla blanca, "carita" `^ ^` (ojos felices pixelados), cruceta y botón en azul marino. Esquinas redondeadas pero contorno sólido.
- **Wordmark:** "VITRINA" / "VINTAGE" en tipografía pixel/bitmap bold, mayúsculas, color cian `#1798B7`.
- **Barra divisoria:** línea horizontal gruesa en azul marino que separa ambas palabras → recurso gráfico de la marca.
- **Tagline:** "COLECCIONISTAS COMO TÚ" en azul marino `#1D2B58`, mayúsculas, peso pesado y algo condensado.
- **Sensación:** nostalgia 90s–2000s, limpia, amigable, sin ruido. Dos tintas planas, sin gradientes.

## Estética
Retro-moderno: una **vitrina física de coleccionista** combinada con detalles sutiles de consola portátil 8/16-bit.
Prohibido el look genérico de IA: nada de gradientes morados, glassmorphism, blobs difusos, ni grillas de tarjetas idénticas sin personalidad.

## Paleta de colores (variables CSS obligatorias)
Nunca escribir colores hex sueltos en componentes; usar siempre estas variables.

```css
:root {
  /* Marca */
  --color-primary: #1798B7;      /* Cian retro del logo: botones principales, links, badges, íconos */
  --color-primary-dark: #127A93; /* Hover/active del primario */
  --color-navy: #1D2B58;         /* Azul marino: texto principal, bordes duros, sombras, divisores */
  --color-surface: #F7F9FC;      /* Fondo "vitrina iluminada" de toda la página */
  --color-card: #FFFFFF;         /* Fondo de tarjetas */
  --color-accent-warm: #F59E0B;  /* Ámbar: SOLO "Edición Limitada", "Raro", "Completo", "Últimas unidades" */

  /* Derivados */
  --color-text: var(--color-navy);
  --color-text-muted: #4A5578;
  --border-hard: 2px solid var(--color-navy);
  --shadow-hard: 4px 4px 0 var(--color-navy);
  --shadow-hard-sm: 2px 2px 0 var(--color-navy);
  --radius: 6px;                 /* Esquinas suaves como la consola del logo; nunca píldoras gigantes */
}
```

Reglas de uso:
- El cian es el color de acción (CTA). El azul marino es estructura (texto, bordes, sombras).
- El ámbar es escaso a propósito: si aparece en todas partes deja de comunicar "exclusivo".
- Texto sobre cian: blanco o azul marino, verificando contraste AA.

## Tipografía
Prohibido usar `Inter`, `Roboto` o `Arial` (ni como fallback explícito; usar `system-ui, sans-serif`).

| Rol | Fuente | Uso |
|---|---|---|
| Display / logo-like | `Silkscreen` (Google Fonts) | Títulos de sección, hero, etiquetas cortas tipo sticker. Siempre MAYÚSCULAS, textos breves. |
| Títulos secundarios | `Chakra Petch` 600–700 | Nombres de álbum, encabezados de tarjeta. |
| Cuerpo / UI | `DM Sans` | Descripciones, botones, formularios. |
| Datos técnicos | `JetBrains Mono` | Precios, año, editorial, código de álbum, stock. |

- La fuente pixel no se usa para párrafos (legibilidad en móvil).
- Precios en mono, grandes y en azul marino; el precio debe ser lo segundo que se ve tras la foto.

## Tarjetas de producto (componente clave)
- Fondo `var(--color-card)`, borde `var(--border-hard)`, sombra `var(--shadow-hard)`, radio `var(--radius)`.
- **Hover/active con sensación táctil de botón:** `transform: translate(2px, 2px)` + sombra a `var(--shadow-hard-sm)`; transición rápida (≤120 ms).
- Estructura: foto real → nombre → estado → precio → CTA.
- **Estado del álbum siempre visible** como etiqueta tipo sticker: Nuevo/Sellado, Completo, Para pegar, Tapa dura, + Año y Editorial (Panini, Navarrete, etc.).
- Variar tarjetas destacadas (ej. "Edición Limitada" con cinta ámbar o tamaño doble) para evitar la grilla monótona.

## Micro-detalles de marca
- Divisores horizontales gruesos (`4px` sólido azul marino), eco de la barra central del logo.
- Etiquetas tipo sticker: borde duro, ligera rotación (−2° a 2°), fondo cian o ámbar.
- Guiño a la consola: la carita `^ ^` del logo para estados vacíos, carga o "gracias por tu compra".
- Animaciones cortas y "mecánicas"; respetar `prefers-reduced-motion`.

## Enfoque comercial y mobile-first
- La mayoría del tráfico llega desde Instagram / TikTok / Facebook **en el celular**: diseñar primero a 360–390 px y escalar hacia arriba.
- CTA principal visible sin scroll y botón de WhatsApp accesible (flotante o fijo abajo) en móvil.
- Áreas táctiles mínimas de 44×44 px; nada de interacciones que dependan solo del hover.
- Imágenes optimizadas (`loading="lazy"`, tamaños responsivos): la tienda debe cargar rápido con datos móviles.
- Filtros simples por categoría (Anime / Mundiales / Retro) y por estado, usables con el pulgar.
