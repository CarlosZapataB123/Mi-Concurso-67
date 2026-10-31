# Mi Concurso 67

Página de estudio diario para la **Convocatoria 67-2026 de la Procuraduría General de la Nación** (Asesor 1AS-19, Oficina de Selección y Carrera). Está pensada para usarse en el celular, en ratos cortos entre semana y sesiones más largas el fin de semana.

## Qué incluye

- **Hoy**: el plan del día. Entre semana, un resumen en audio (≈10 min) y 7 preguntas; el fin de semana, 20 preguntas; los domingos, un simulacro.
- **Practicar**: 636 preguntas tipo caso de los Días 1 a 20 y de los bancos de Gestión Pública, por tema o por unidad. Cada respuesta muestra la justificación, la norma y por qué fallan las otras opciones.
- **Repaso espaciado**: las preguntas falladas vuelven a salir al día siguiente y luego a los 3, 7, 14 y 30 días, hasta dominarlas.
- **Escuchar**: resúmenes por unidad y preguntas narradas (pregunta, pausa para pensar, respuesta) con la voz del propio celular.
- **Simulacro**: 20 o 40 preguntas mezcladas de todos los ejes, con tiempo y mínimo aprobatorio de 65/100.
- **Mapas**: ideas clave por tema (164 reglas esenciales por eje, para leer o escuchar), organigrama de la PGN, el concurso paso a paso con plazos, quién hace qué, comparación de las comisiones de Carrera y de Personal, y calculadora de puntaje de la prueba. Cada mapa se puede escuchar.
- **Progreso**: avance y porcentaje de acierto por eje, racha de días, historial de simulacros y copia de seguridad del progreso.

## Cómo se usa

Abre la página en Chrome desde el celular y, en el menú del navegador, elige **Agregar a la pantalla principal**. Funciona sin conexión después de la primera carga.

El progreso se guarda solo en el navegador del celular. Usa **Progreso → Descargar copia** de vez en cuando para no perderlo.

## Estructura

```
index.html              página principal
css/app.css             estilos
js/app.js               lógica (plan, práctica, voz, simulacros, progreso)
js/mapas.js             mapas visuales y calculadora
data/preguntas.json     banco de preguntas extraído del material de estudio
data/ideas.json         ideas clave por tema
sw.js                   caché para uso sin conexión
manifest.webmanifest    instalación como app
icons/                  íconos
```

Es una página estática: no necesita servidor ni compilación. Para publicarla se usa GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

## Aviso

Material de entrenamiento elaborado para la preparación del aspirante. No es una prueba oficial de la entidad y no sustituye la consulta de las normas vigentes.
