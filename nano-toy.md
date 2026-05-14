# Robot Bebé "ÑAÑO" en Three.js

## Objetivo
Construir un personaje 3D estilo mascota chibi/Funko Pop usando Three.js, renderizado en navegador, con iluminación profesional, controles de cámara y animación idle sutil. El personaje es un robot bebé llamado "ÑAÑO".

## Stack técnico
- **Three.js** (última versión estable) cargado vía import map desde unpkg/jsdelivr — sin bundler.
- HTML + JS vanilla, sin frameworks.
- `OrbitControls` para rotar/zoom alrededor del personaje.
- Renderer con antialiasing, tone mapping ACES Filmic y physically correct lights.

## Paleta de colores (exacta, usar como constantes)
```js
const COLORS = {
  teal:      0x1A9B8A,  // cuerpo, cabeza, brazos, piernas
  greenDark: 0x2E8B57,  // audífonos, suela zapatos, franja camiseta
  white:     0xFFFFFF,  // camiseta, zapatos, highlights ojos
  yellow:    0xE8A020,  // línea inferior de la franja, detalle zapato
  black:     0x111111,  // ojos
  mouthPink: 0xE89999,  // interior de la boca
};
```

## Anatomía del personaje (desglose por partes)

**Proporciones**: cabeza ≈ 55% del personaje (estilo chibi exagerado). Altura total ≈ 3.5 unidades. Usar un `THREE.Group` raíz `character` y subgrupos por zona para poder animar.

### 1. Cabeza (`headGroup`)
- **Cráneo**: `SphereGeometry` ligeramente achatado en Y (scale Y ≈ 0.85), radio ≈ 1.1, color `teal`, material `MeshStandardMaterial` con `roughness: 0.25`, `metalness: 0.1` (look plástico brillante).
- **"Casco-pelo" frontal**: un segundo `SphereGeometry` un 5% más grande que el cráneo, recortado por la parte trasera y baja (puedes simularlo con una esfera ligeramente desplazada hacia adelante y arriba, mismo color teal, ligeramente más oscuro `0x158578`). Da la sensación de un flequillo curvo tipo casco.
- **Ojos** (×2): `SphereGeometry` radio 0.22, color `black`, `roughness: 0.1`. Posición simétrica en la cara frontal. Añadir a cada ojo un pequeño `SphereGeometry` blanco radio 0.07 desplazado arriba-izquierda como highlight (emissive blanco bajo).
- **Boca**: pequeña forma tipo "D" sonriente — usar `TorusGeometry` o una `SphereGeometry` recortada. Interior color `mouthPink`. Sugerencia simple: una `SphereGeometry` achatada en Z, color rosa, y un pequeño rectángulo blanco encima simulando dientes.
- **Antena**: cilindro vertical delgado (`CylinderGeometry` radio 0.04, alto 0.6) saliendo del lado superior izquierdo de la cabeza, color `teal`. Encima una esfera (radio 0.12) del mismo color.
- **Audífonos** (×2): a cada lado de la cabeza, un disco grande `CylinderGeometry` (radio 0.35, alto 0.18) color `greenDark`, con un hueco interno más oscuro al frente (otro cilindro más pequeño negro/verde muy oscuro).

### 2. Torso (`torsoGroup`)
- **Cuerpo base** (debajo de la camiseta): `CapsuleGeometry` o `CylinderGeometry` ligeramente cónico, color `teal`.
- **Camiseta**: `CylinderGeometry` ligeramente más ancho que el torso, alto ≈ 1.0, abierto arriba y abajo. Color `white`. Aplicar una `CanvasTexture` generada dinámicamente que contenga:
  - Fondo blanco.
  - Una franja horizontal verde (`greenDark`) en el medio.
  - Texto "ÑAÑO" centrado en blanco sobre la franja, fuente bold sans-serif.
  - Una línea amarilla (`yellow`) justo debajo de la franja.
  - Un pequeño escudo/cuadrado verde en la zona superior derecha (simplificado).
  
  Generar la textura con un `<canvas>` 1024×512, dibujar con Canvas 2D API y pasarla como `map` del material.

### 3. Brazos (×2, `armLeftGroup` / `armRightGroup`)
Construir cada brazo como cadena de cilindros + esferas para simular articulaciones:
- **Hombro**: esfera teal radio 0.22.
- **Brazo superior**: cilindro teal, radio 0.18, alto 0.5.
- **Codo**: esfera teal radio 0.20.
- **Antebrazo**: cilindro teal, radio 0.17, alto 0.5.
- **Muñeca**: esfera teal radio 0.18.
- **Mano**: esfera ligeramente achatada radio 0.22, teal.

Anclar el grupo entero al lateral del torso. Inclinar ligeramente hacia afuera (~10°).

### 4. Piernas (×2, `legLeftGroup` / `legRightGroup`)
- **Pantalón corto**: cilindro corto teal radio 0.28, alto 0.4.
- **Pierna**: cilindro teal radio 0.22, alto 0.3.
- **Zapatilla**: forma compuesta:
  - Suela: `BoxGeometry` 0.55 × 0.15 × 0.7, color `greenDark`, bordes redondeados con `RoundedBoxGeometry` si está disponible.
  - Empeine: `BoxGeometry` o esfera achatada blanca encima de la suela.
  - Detalle amarillo: un pequeño plano o forma triangular `yellow` en el lateral exterior simulando un logo/hoja.

## Escena y renderizado

- **Renderer**: `WebGLRenderer({ antialias: true, alpha: true })`, `setPixelRatio(devicePixelRatio)`, `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.1`.
- **Fondo**: degradado suave teal claro a blanco. Usar `scene.background` con un `Color` o un canvas-texture degradado.
- **Cámara**: `PerspectiveCamera` fov 35, posición inicial `(0, 1.6, 6)`, mirando al centro del personaje (altura ~1.4).
- **Luces**:
  - `AmbientLight` blanco intensidad 0.4.
  - `DirectionalLight` blanco intensidad 1.0 desde arriba-frente-derecha, con sombras (`castShadow = true`, shadow map 2048×2048).
  - `DirectionalLight` (fill) azulado tenue desde la izquierda intensidad 0.3.
  - `HemisphereLight` cielo blanco / suelo teal claro intensidad 0.3.
- **Suelo**: `CircleGeometry` radio 4, `MeshStandardMaterial` blanco roughness 0.9, `receiveShadow = true`. Solo para recoger la sombra del personaje.

## Interacción
- `OrbitControls` con `enableDamping = true`, `dampingFactor = 0.08`.
- Limitar `minDistance = 3`, `maxDistance = 10`, `minPolarAngle` y `maxPolarAngle` para que no se vea desde abajo del suelo.
- `target` apuntando al centro del torso (y ≈ 1.4).

## Animación idle
En el loop de render, animar suavemente:
- **Respiración**: escalar el torso en Y con `1 + Math.sin(t * 1.5) * 0.02`.
- **Cabeceo**: rotar la cabeza en X con `Math.sin(t * 0.8) * 0.05`.
- **Antena**: oscilación lateral de la antena (rotación Z) con `Math.sin(t * 2.5) * 0.15`.
- **Brazos**: oscilación muy sutil en Z de los brazos con `Math.sin(t * 1.2) * 0.04`.

## Responsive
- Listener `resize` que actualice `renderer.setSize`, `camera.aspect` y `camera.updateProjectionMatrix`.
- Canvas a pantalla completa (`position: fixed; inset: 0`).

## Criterios de calidad
1. El personaje se reconoce claramente como el de la imagen de referencia: proporciones chibi, paleta teal+verde+amarillo+blanco, texto "ÑAÑO" visible en la camiseta.
2. El acabado es claramente plástico brillante, no mate.
3. La iluminación produce highlights suaves en las superficies curvas.
4. La sombra del personaje se proyecta sobre el suelo.
5. Al girar la cámara con el mouse, el personaje se ve coherente desde todos los ángulos.
6. La animación idle se nota pero no es exagerada.
7. Funciona abriendo `index.html` directamente en el navegador (sin build step).

## Qué evitar
- No usar GLTF, FBX ni modelos externos: todo debe construirse con primitivas de Three.js.
- No usar Three.js viejo (r100). Usar la API moderna (r150+): `outputColorSpace`, no `outputEncoding`; `SRGBColorSpace`, no `sRGBEncoding`.
- No usar `MeshBasicMaterial` para las partes del cuerpo — pierde el look 3D. Solo permitido para los highlights de los ojos.
- No usar `THREE.CapsuleGeometry` si la versión cargada no la soporta — fallback a esfera + cilindro.
- No dejar la escena oscura: si se ve plana, subir la `toneMappingExposure` o la intensidad de la directional.
- No olvidar `castShadow` / `receiveShadow` en las mallas correspondientes.

## Verificación final

- [ ] Se ve el texto "ÑAÑO" legible en la camiseta
- [ ] La antena está claramente a un lado, no centrada
- [ ] No tiene audífonos sobresalen visiblemente a los lados de la cabeza
- [ ] La cabeza es notablemente más grande que el torso (estilo chibi)
- [ ] Las zapatillas tienen suela blanca claramente diferenciada

## Entrega
Devuelve los 3 archivos completos (`index.html`, `main.js`, `styles.css`), listos para abrir directamente en el navegador. No expliques el código línea por línea — añade solo comentarios cortos en zonas no obvias del JS.
