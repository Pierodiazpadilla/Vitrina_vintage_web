# Wireframe — Home de Vitrina Vintage

> Baja fidelidad · estructural · mobile-first (360–390 px), con notas para escritorio.
> Sin colores ni código: la identidad visual se aplica después según `CLAUDE.md`.
> Estado: **BORRADOR PARA APROBACIÓN**

---

## 0. Inventario detectado en `public/catalogo/`

Muestra parcial (5 fotos) del catálogo real. Todas llevan el sticker del logo como marca de agua.

| # | Producto | Franquicia / Categoría | Estado visible | Datos que aparecen en la publicación |
|---|---|---|---|---|
| 1 | **Enciclopedia Saint Seiya 40th — "Los Caballeros del Zodiaco: Del Santuario al Oro Eterno"** | Anime | Sellado (film plástico) | Dos formatos (grande y chico), aniversario 40, + caja dorada de Sagitario (caja para figuritas / coleccionable) |
| 2 | **Naruto — Álbum de Stickers** | Anime | Sellado, varias unidades en stock | Viene acompañado de **fajos de figuritas** (combo álbum + stickers) |
| 3 | **Dragon Ball Z — Álbum coleccionable** | Anime | **PREVENTA** | Portada metálica · **2 versiones** · 32 páginas · 305 stickers (36 especiales) · 4 minipósters · 1 caja para figuritas · regalo: minipósters |
| 4 | **Yu Yu Hakusho — Álbum 30 Aniversario** | Anime | **PREVENTA** | Portada metálica · 32 páginas · 266 stickers (36 especiales) · 4 minipósters · 1 caja para figuritas · regalo: minipósters |
| 5 | **Street Fighter II — Album** | Retro / Videojuegos | **PREVENTA** | Portada metálica · 32 páginas · 240 stickers (36 especiales) · 4 minipósters · 1 caja para figuritas |

### Hallazgos
- **Patrón de la ficha de producto:** las 3 preventas comparten la misma ficha técnica (portada, páginas, stickers totales/especiales, minipósters, caja). Esa ficha **es** el contenido de la tarjeta.
- **Tres estados comerciales:** `PREVENTA`, `SELLADO / EN STOCK` y `COMBO` (álbum + figuritas).
- **Faltan en las fotos (hay que definirlos):**
  - **Precio** → no aparece en ninguna publicación. ⚠️ Es obligatorio para vender; necesitamos la lista de precios.
  - **Editorial** → no se ve Panini, Navarrete ni otra. Campo opcional hasta confirmar.
  - **Fecha de llegada de las preventas** y si piden **adelanto/seña**.
- **No incluidos en esta muestra pero sí en el catálogo:** Mundiales de fútbol, sobres sueltos y combos (se contemplan como categorías).

### Modelo de datos de tarjeta (derivado de las fotos)
```
Producto
├─ nombre                 "Dragon Ball Z — Álbum coleccionable"
├─ categoría              Anime | Mundiales | Retro/Videojuegos | Sobres | Combos
├─ estado                 PREVENTA | EN STOCK (sellado) | COMBO | AGOTADO
├─ precio                 [DEFINIR]  (+ precio de reserva si es preventa)
├─ portada                Metálica | Tapa dura | Tapa blanda
├─ versiones              2 (opcional)
├─ páginas                32
├─ stickers               305  (36 especiales)
├─ incluye[]              4 minipósters · caja para figuritas · figuritas completas
├─ regalo                 "Minipósters gratis" (opcional)
├─ edición especial       "40 aniversario" | "30 aniversario" (opcional)
├─ editorial              [opcional, DEFINIR]
├─ stock                  número o "Últimas unidades"
└─ fotos[]                public/catalogo/...
```

---

## 1. Navbar (sticky)

### Móvil
```
┌──────────────────────────────────────┐
│ [≡]   [LOGO VITRINA VINTAGE]   [🛍 2] │  ← menú · logo · lista de pedido (contador)
├──────────────────────────────────────┤
│ [🔍 Buscar álbum, anime, mundial…  ] │  ← buscador siempre visible
├──────────────────────────────────────┤
│ (Preventas)(Anime)(Mundiales)(Retro)(Sobres)(Combos) → │  ← chips con scroll horizontal
└──────────────────────────────────────┘
```

### Escritorio (≥ 1024 px)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [LOGO]   Preventas  Anime  Mundiales  Retro  Sobres  Combos               │
│          [🔍 Buscar álbum, anime, mundial…              ]  [WhatsApp] [🛍 2]│
└──────────────────────────────────────────────────────────────────────────┘
```

**Especificaciones**
- Altura móvil compacta (logo + buscador + chips ≈ 140 px); al hacer scroll se oculta la fila de chips y queda solo logo + buscador.
- "Preventas" es el primer chip: hoy es el producto estrella.
- El buscador sugiere títulos mientras se escribe ("dra…" → Dragon Ball Z).
- `🛍` = **Lista de pedido**, no un carrito con pasarela de pago (ver sección 4).

---

## 2. Hero vitrina — productos estrella

Las tres preventas metálicas + la Enciclopedia Saint Seiya son lo más llamativo del inventario.

### Móvil
```
┌──────────────────────────────────────┐
│  ▬▬▬ NUEVAS PREVENTAS ▬▬▬            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ [PREVENTA]          [2 VERSIONES]│ │
│  │                                │  │
│  │      FOTO PORTADA DBZ          │  │  ← carrusel deslizable (swipe)
│  │      (álbum metálico)          │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│   Dragon Ball Z — Álbum coleccionable │
│   305 stickers · 4 minipósters · caja │
│   S/ ---- [DEFINIR]                   │
│   ┌──────────────────────────────┐   │
│   │   RESERVAR POR WHATSAPP      │   │  ← CTA primario
│   └──────────────────────────────┘   │
│            ● ○ ○ ○                    │  ← DBZ · Yu Yu Hakusho · Street Fighter II · Saint Seiya
├──────────────────────────────────────┤
│ 🎁 Minipósters de regalo con tu reserva│ ← franja promocional
└──────────────────────────────────────┘
```

### Escritorio
```
┌──────────────────────────────────────────────────────────────────────────┐
│  NUEVAS PREVENTAS                       │ ┌────────┐ ┌────────┐ ┌────────┐ │
│  Álbumes metálicos de                   │ │  DBZ   │ │ YU YU  │ │ STREET │ │
│  Dragon Ball Z, Yu Yu Hakusho           │ │ [PREV] │ │ HAKUSHO│ │FIGHTER │ │
│  y Street Fighter II.                   │ │        │ │ [PREV] │ │ [PREV] │ │
│  Incluyen caja + 4 minipósters.         │ └────────┘ └────────┘ └────────┘ │
│  [RESERVAR POR WHATSAPP] [Ver catálogo] │  ┌───────────────────────────┐   │
│                                         │  │ ENCICLOPEDIA SAINT SEIYA  │   │
│                                         │  │ 40 ANIVERSARIO [SELLADO]  │   │
│                                         │  └───────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Especificaciones**
- Fotos: usar las imágenes reales de `public/catalogo/` (recortadas al álbum, sin la ilustración lateral para que se lea en móvil).
- Cada slide tiene CTA propio con mensaje de WhatsApp precargado para ese producto.
- Saint Seiya entra como "Edición aniversario" (no es preventa, es stock sellado) → etiqueta distinta.
- Carrusel con avance manual (sin autoplay rápido); máximo 4 slides.

---

## 3. Catálogo filtrable

### 3a. Barra de filtros (móvil)
```
┌──────────────────────────────────────┐
│ CATÁLOGO                    24 álbumes│
│ [Filtros ⚙ (2)]   [Ordenar: Nuevos ▾]│  ← abre panel inferior (bottom sheet)
│ (Anime ✕)(Preventa ✕)  Limpiar       │  ← filtros activos como chips
└──────────────────────────────────────┘

Panel de filtros (bottom sheet):
┌──────────────────────────────────────┐
│ FILTROS                           [✕]│
│ Categoría   □ Anime  □ Mundiales     │
│             □ Retro  □ Sobres □ Combos│
│ Estado      □ Preventa  □ En stock   │
│             □ Combo                  │
│ Portada     □ Metálica □ Tapa dura   │
│ Incluye     □ Caja  □ Minipósters    │
│             □ Figuritas completas    │
│ Precio      [ min ]──────[ max ]     │
│ ┌──────────────────────────────────┐ │
│ │        VER 12 RESULTADOS         │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```
- Escritorio: los filtros pasan a una columna lateral fija a la izquierda.
- Orden: Nuevos · Preventas primero · Precio ↑ · Precio ↓ · Más stickers.

### 3b. Tarjeta de producto (grilla de 2 columnas en móvil, 4 en escritorio)
```
┌─────────────────┐
│[PREVENTA]  [🎁] │  ← estado (arriba izq.) · regalo incluido (arriba der.)
│                 │
│   FOTO ÁLBUM    │  ← proporción 4:5, foto real
│                 │
│[PORTADA METÁLICA]│ ← sticker de característica principal
├─────────────────┤
│ Dragon Ball Z   │  ← nombre (máx. 2 líneas)
│ Álbum colecc.   │
│ ─────────────── │
│ 305 stickers    │
│ ★ 36 especiales │  ← ficha técnica compacta (máx. 3 líneas)
│ 32 págs · caja  │
│ ─────────────── │
│ S/ ---          │  ← precio grande
│ Llega: [FECHA]  │  ← solo preventas
│ ┌─────────────┐ │
│ │ RESERVAR    │ │  ← CTA: "Reservar" (preventa) / "Pedir" (stock)
│ └─────────────┘ │
│ [+ a mi lista]  │  ← acción secundaria
└─────────────────┘
```

**Variantes según estado (mismos bloques, cambia contenido)**

| Estado | Etiqueta | Línea extra | CTA primario |
|---|---|---|---|
| Preventa | `PREVENTA` | "Llega: [fecha]" + "Reserva con S/ [adelanto]" | Reservar por WhatsApp |
| En stock sellado | `SELLADO` | "Quedan 3" / "Últimas unidades" | Pedir por WhatsApp |
| Combo | `COMBO` | "Álbum + figuritas completas" (ej. Naruto) | Pedir combo |
| Edición especial | `40 ANIVERSARIO` | Formato (grande / chico) | Pedir por WhatsApp |
| Agotado | `AGOTADO` | — | Avisarme cuando vuelva |

**Tarjeta destacada:** cada 6–8 tarjetas, una ocupa 2 columnas (ej. Saint Seiya 40th con sus dos formatos + caja dorada) para romper la grilla monótona.

### 3c. Detalle de producto (al tocar la tarjeta)
```
┌──────────────────────────────────────┐
│ ← Volver                        [🛍] │
│ ┌──────────────────────────────────┐ │
│ │      GALERÍA DE FOTOS (swipe)    │ │
│ └──────────────────────────────────┘ │
│ [PREVENTA] [PORTADA METÁLICA]        │
│ Dragon Ball Z — Álbum coleccionable  │
│ S/ ----        Llega: [FECHA]        │
│                                      │
│ Versión:  ( Versión A ) ( Versión B )│  ← solo si tiene versiones
│                                      │
│ INCLUYE                              │
│ ✓ Álbum 32 páginas, portada metálica │
│ ✓ 305 stickers (36 especiales)       │
│ ✓ 4 minipósters                      │
│ ✓ 1 caja para figuritas              │
│ 🎁 Minipósters de regalo             │
│                                      │
│ Editorial: [DEFINIR]                 │
├──────────────────────────────────────┤
│ [ + a mi lista ] [RESERVAR WHATSAPP] │  ← barra fija inferior
└──────────────────────────────────────┘
```

---

## 4. Flujo de compra / reserva por WhatsApp

Recomendación: **WhatsApp como canal de cierre** + una **"Lista de pedido"** liviana (no un carrito con pago online). Así el cliente puede juntar varios álbumes y enviarlos en un solo mensaje.

### 4a. Flujos
```
A) COMPRA DIRECTA (1 producto)
   Tarjeta ──► [Reservar / Pedir por WhatsApp]
            └─► abre WhatsApp con mensaje precargado:
                "Hola Vitrina Vintage 👋 Quiero reservar:
                 • Dragon Ball Z — Álbum coleccionable (Versión A) — S/ ---
                 ¿Cómo hago el pago?"

B) VARIOS PRODUCTOS
   Tarjeta ──► [+ a mi lista] ──► contador 🛍 en navbar
   🛍 ──► Panel "Mi lista"
           ├─ ítems (foto mini · nombre · estado · precio · cantidad ±)
           ├─ subtotal
           ├─ ¿Envío o recojo?  ( Envío ) ( Recojo )
           ├─ Ciudad/distrito  [_______]
           └─ [ENVIAR PEDIDO POR WHATSAPP] → un solo mensaje con todo el detalle

C) AGOTADO
   [Avisarme] ──► WhatsApp: "Avísenme cuando llegue <producto>"
```

### 4b. Panel "Mi lista" (móvil)
```
┌──────────────────────────────────────┐
│ MI LISTA (2)                      [✕]│
│ ┌────┐ Dragon Ball Z      [PREVENTA] │
│ │img │ S/ ---          [-] 1 [+]  🗑 │
│ └────┘                               │
│ ┌────┐ Naruto + figuritas   [COMBO]  │
│ │img │ S/ ---          [-] 1 [+]  🗑 │
│ └────┘                               │
│ ──────────────────────────────────── │
│ Subtotal                     S/ ---  │
│ Entrega   ( Envío ) ( Recojo )       │
│ Ciudad    [_____________________]    │
│ ┌──────────────────────────────────┐ │
│ │   ENVIAR PEDIDO POR WHATSAPP     │ │
│ └──────────────────────────────────┘ │
│ Te respondemos con el total + envío. │
└──────────────────────────────────────┘
```

### 4c. Botón flotante
```
                              ┌──────┐
                              │  WA  │  ← fijo abajo a la derecha en toda la web
                              └──────┘     (se oculta cuando la barra fija del detalle está visible)
```

**Especificaciones**
- Mensajes precargados siempre incluyen: nombre, versión, estado, precio y cantidad (el vendedor no tiene que preguntar "¿cuál?").
- La lista se guarda en el navegador del cliente (sobrevive si cierra y vuelve desde Instagram).
- No se pide registro ni cuenta.

---

## 5. Sección de confianza

```
┌──────────────────────────────────────┐
│ ▬▬▬ COMPRA SEGURA ▬▬▬                │
│ ┌──────────────┐ ┌──────────────┐    │
│ │ 📦 ENVÍOS     │ │ ✔ ORIGINALES │    │
│ │ A todo [PAÍS]│ │ Productos    │    │
│ │ [DEFINIR     │ │ sellados de  │    │
│ │  courier]    │ │ fábrica      │    │
│ └──────────────┘ └──────────────┘    │
│ ┌──────────────┐ ┌──────────────┐    │
│ │ ⏳ PREVENTAS  │ │ 💳 PAGOS      │    │
│ │ Cómo funciona│ │ [Yape/Plin/  │    │
│ │ la reserva   │ │ transf.]     │    │
│ │ [DEFINIR]    │ │ [DEFINIR]    │    │
│ └──────────────┘ └──────────────┘    │
├──────────────────────────────────────┤
│ FOTOS REALES DE NUESTRA VITRINA      │
│ [foto][foto][foto] →                 │  ← fotos reales con el sticker del logo
│ "Cada foto es del producto que       │     (refuerzan autenticidad)
│  recibes, sellado."                  │
├──────────────────────────────────────┤
│ PREGUNTAS FRECUENTES (acordeón)      │
│ ▸ ¿Cuándo llegan las preventas?      │
│ ▸ ¿Cuánto debo adelantar?            │
│ ▸ ¿Las figuritas vienen completas?   │
│ ▸ ¿Hacen envíos a provincia?         │
├──────────────────────────────────────┤
│ Síguenos  [IG] [TikTok] [FB]         │
│ ┌──────────────────────────────────┐ │
│ │     ESCRÍBENOS POR WHATSAPP      │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Especificaciones**
- El sticker del logo que ya aparece en todas las fotos es una prueba de autenticidad: se menciona explícitamente.
- Las preguntas frecuentes responden las dudas que hoy probablemente llegan por WhatsApp (reduce mensajes repetidos).

---

## 6. Orden final de la home (móvil, de arriba a abajo)

```
1. Navbar (logo · buscador · chips de categorías)
2. Hero vitrina — Nuevas preventas (carrusel)
3. Franja de regalo "Minipósters gratis con tu reserva"
4. Accesos por categoría (Anime · Mundiales · Retro · Sobres · Combos) — tiles con foto
5. Catálogo filtrable (grilla 2 col + tarjeta destacada)
6. Combos destacados (ej. Naruto álbum + figuritas)
7. Compra segura + fotos reales + FAQ
8. Footer (redes · WhatsApp · horario)
+  Botón flotante de WhatsApp en todo momento
```

---

## Pendientes antes del diseño visual
1. **Lista de precios** de cada producto (y precio de reserva para preventas).
2. **Fechas estimadas** de llegada de DBZ, Yu Yu Hakusho y Street Fighter II.
3. **Editorial** de cada álbum (si quieren mostrarla).
4. Diferencia entre las **2 versiones** de DBZ y entre los **dos formatos** de Saint Seiya.
5. **País/moneda, couriers y medios de pago** (asumí soles "S/" solo como marcador).
6. Número de **WhatsApp** de ventas.
7. Fotos de **Mundiales, sobres y combos** para completar categorías.
