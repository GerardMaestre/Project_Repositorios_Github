# Implementation Plan — Gerard Maestre Portfolio OS

> **Documento maestro de implementación**  
> Proyecto: evolución completa del portafolio personal de Gerard Maestre  
> Objetivo: transformar el explorador actual de repositorios en una plataforma personal, fluida, optimizada y completamente controlable.

---

## 1. Visión del proyecto

La nueva web no debe ser simplemente **“GitHub con otro diseño”**. Debe convertirse en tu **centro de control profesional**, donde GitHub funciona como una fuente de datos, pero tú decides:

- Qué proyectos aparecen.
- Cómo se presentan.
- Qué información se destaca.
- Qué tecnologías muestra cada proyecto.
- Qué proyectos están terminados, en desarrollo o archivados.
- Qué capturas, vídeos y enlaces se utilizan.
- En qué orden se muestran.
- Qué estadísticas merece la pena enseñar.
- Qué contenido es automático y cuál es editorial.
- Qué experiencia recibe cada visitante.

> **Principio central:** GitHub aporta los datos técnicos; Gerard controla la narrativa, el diseño y la experiencia.

---

## 2. Objetivos del producto

### 2.1 Objetivo principal

Construir un portafolio que funcione simultáneamente como:

1. Carta de presentación profesional.
2. Explorador avanzado de tus proyectos.
3. Panel personal de control editorial.
4. Capa visual mejorada sobre GitHub.
5. Sistema escalable para futuros proyectos, experiencia y contenido.

### 2.2 Objetivos técnicos

- Carga inicial extremadamente rápida.
- Navegación fluida sin recargas innecesarias.
- Buen funcionamiento en móvil, tablet y escritorio.
- Datos de GitHub actualizados automáticamente.
- Posibilidad de sobrescribir cualquier dato procedente de GitHub.
- Contenido administrable sin modificar continuamente el HTML.
- Imágenes optimizadas y carga diferida.
- Diseño accesible.
- SEO completo.
- Código mantenible y correctamente organizado.
- Funcionamiento aceptable incluso si GitHub API falla.
- Despliegue automatizado.

---

## 3. Qué se conserva y qué se transforma

### 3.1 Se conserva

- Integración con la API pública de GitHub.
- Repositorios públicos disponibles.
- Buscador.
- Filtrado.
- Carga progresiva.
- Actualización automática.
- Despliegue mediante GitHub Pages, si se quiere mantener sin coste.
- Identidad oscura y acento verde lima.

### 3.2 Se transforma

- El hero deja de estar centrado en estadísticas.
- Las métricas con valor cero dejan de ocupar espacio principal.
- El listado deja de ser el único contenido central.
- Los proyectos importantes reciben páginas y presentaciones propias.
- GitHub deja de ser la única fuente de verdad visual.
- El glassmorphism pasa a utilizarse de forma más sutil.
- La web adquiere narrativa personal, presentación y contacto.
- El contenido se controla mediante una capa propia de configuración.

---

## 4. Arquitectura funcional

La aplicación tendrá cuatro capas:

```text
┌──────────────────────────────────────────────┐
│               CAPA DE INTERFAZ               │
│ Hero, proyectos, buscador, filtros, contacto │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│          CAPA DE CONTENIDO PERSONAL          │
│ Orden, destacados, textos, capturas, estados │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│         CAPA DE NORMALIZACIÓN DE DATOS       │
│ Combina tus datos propios con los de GitHub  │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│               FUENTES EXTERNAS               │
│ GitHub API, repositorios, demos y contenidos │
└──────────────────────────────────────────────┘
```

### 4.1 Regla de prioridad

Cuando exista un dato personal definido por ti, tendrá prioridad sobre GitHub.

```text
Dato personalizado > Dato de GitHub > Valor alternativo
```

Ejemplo:

```text
Nombre en GitHub:
Project_Repositorios_Github

Nombre mostrado en el portafolio:
Explorador inteligente de proyectos

Descripción personalizada:
Una experiencia interactiva que centraliza mis proyectos
y mejora la forma de descubrir mi trabajo técnico.
```

No será necesario cambiar el nombre real del repositorio para presentarlo con un título más profesional.

---

## 5. Sistema de control personal

### 5.1 Primera versión: configuración mediante archivos

Para evitar construir desde el primer día un backend complejo, el contenido se controlará mediante archivos estructurados dentro del proyecto.

```text
src/
└── content/
    ├── profile.json
    ├── projects.json
    ├── experience.json
    ├── skills.json
    ├── social.json
    └── settings.json
```

### 5.2 `profile.json`

Controlará:

- Nombre.
- Titular profesional.
- Descripción.
- Ubicación.
- Disponibilidad.
- Fotografía.
- Currículum.
- Correo.
- Llamadas a la acción.
- Texto de “Sobre mí”.

### 5.3 `projects.json`

Permitirá complementar o reemplazar datos de GitHub:

```json
{
  "IMAGINEM": {
    "visible": true,
    "featured": true,
    "priority": 1,
    "displayName": "IMAGINEM",
    "tagline": "Una experiencia fintech pensada para la Generación Z",
    "summary": "Concepto de producto digital que combina finanzas, tecnología y gamificación.",
    "cover": "/projects/imaginem/cover.webp",
    "gallery": [
      "/projects/imaginem/screen-01.webp",
      "/projects/imaginem/screen-02.webp"
    ],
    "status": "completed",
    "category": "product",
    "role": "Diseño y desarrollo",
    "technologies": ["HTML", "CSS", "JavaScript"],
    "demoUrl": "",
    "caseStudyUrl": "/projects/imaginem",
    "year": 2026,
    "hiddenGitHubFields": ["stars", "forks"],
    "accentColor": "#8BFF5D"
  }
}
```

### 5.4 `settings.json`

Desde aquí se podrá cambiar:

- Tema.
- Idioma.
- Número de proyectos iniciales.
- Secciones visibles.
- Filtros disponibles.
- Orden predeterminado.
- Animaciones.
- Información de disponibilidad.
- Comportamiento de la caché.
- Métricas visibles.
- Repositorios excluidos.

```json
{
  "theme": "dark",
  "accent": "#8BFF5D",
  "defaultProjectSort": "priority",
  "projectsPerPage": 9,
  "showGitHubStats": false,
  "showLastUpdated": true,
  "animations": true,
  "repositoryVisibility": "selected",
  "availability": {
    "enabled": true,
    "label": "Disponible para nuevas oportunidades"
  }
}
```

### 5.5 Evolución futura: panel de administración

Cuando la web principal esté estable, se podrá añadir `/admin`.

El panel permitirá:

- Iniciar sesión.
- Destacar u ocultar proyectos.
- Cambiar el orden mediante drag and drop.
- Editar títulos y descripciones.
- Subir portadas.
- Modificar etiquetas.
- Cambiar estados.
- Revisar proyectos con información incompleta.
- Regenerar los datos.
- Previsualizar los cambios.
- Publicar.

No se recomienda empezar por el panel. Primero se construirá el sistema de contenido y después se añadirá una interfaz sobre él.

---

## 6. Modelo de datos de cada proyecto

Cada proyecto tendrá tres grupos de información.

### 6.1 Datos obtenidos de GitHub

- Nombre del repositorio.
- Descripción.
- URL.
- Lenguajes.
- Topics.
- Fecha de creación.
- Última actualización.
- Homepage.
- Licencia.
- Estrellas.
- Forks.
- Estado de archivado.
- Visibilidad.

### 6.2 Datos controlados personalmente

- Nombre comercial.
- Descripción profesional.
- Portada.
- Galería.
- Vídeo.
- Prioridad.
- Destacado.
- Estado real.
- Categoría.
- Responsabilidades.
- Problema.
- Solución.
- Aprendizajes.
- Tecnologías visibles.
- Demo.
- Caso de estudio.
- Color.
- Repositorio oculto o visible.
- Métricas que deben mostrarse.

### 6.3 Datos calculados por el sistema

- Nivel de completitud.
- Proyecto reciente.
- Tiempo desde última actualización.
- Filtros disponibles.
- Tecnologías globales.
- Proyectos relacionados.
- Imagen alternativa.
- Orden final.
- URL interna.
- Estado de sincronización.

---

## 7. Arquitectura de páginas

### 7.1 Inicio `/`

El inicio funcionará como presentación personal.

Secciones:

1. Navegación.
2. Hero.
3. Tecnologías principales.
4. Proyectos destacados.
5. Filosofía o forma de trabajar.
6. Explorador de proyectos.
7. Sobre mí.
8. Contacto.
9. Footer.

### 7.2 Proyectos `/projects`

Explorador completo con:

- Buscador.
- Filtros.
- Ordenación.
- Vista en rejilla.
- Cantidad de resultados.
- Filtros activos.
- URL compartible.
- Carga progresiva.
- Estados vacíos.
- Actualización de GitHub en segundo plano.

### 7.3 Detalle `/projects/:slug`

Cada proyecto importante tendrá su propia página.

```text
Nombre + resumen
Portada principal
Contexto del proyecto
Problema
Objetivos
Mi participación
Proceso
Tecnologías
Capturas
Decisiones técnicas
Dificultades
Resultados y aprendizajes
Enlaces a demo y código
Proyectos relacionados
```

### 7.4 Sobre mí `/about`

- Presentación.
- Trayectoria.
- Estudios.
- Intereses.
- Herramientas.
- Forma de trabajar.
- Objetivos actuales.
- Currículum.
- Contacto.

### 7.5 Contacto `/contact`

- Correo.
- LinkedIn.
- GitHub.
- Formulario.
- Disponibilidad.
- Respuesta de envío.
- Protección básica contra spam.

### 7.6 Página 404

Debe conservar la identidad del proyecto y ofrecer:

- Volver al inicio.
- Explorar proyectos.
- Buscar.
- Acceder a GitHub.

---

## 8. Diseño visual

### 8.1 Dirección

**Dark editorial tecnológico con glassmorphism restringido.**

El diseño debe sentirse:

- Personal.
- Preciso.
- Elegante.
- Tecnológico.
- Rápido.
- Moderno.
- Profesional.

### 8.2 Sistema cromático

```css
:root {
  --color-background: #080b10;
  --color-background-soft: #0c1118;
  --color-surface: #10151d;
  --color-surface-hover: #151c26;

  --color-text: #f5f7fa;
  --color-text-secondary: #a8b0bd;
  --color-text-muted: #727c8c;

  --color-border: rgba(255, 255, 255, 0.09);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  --color-accent: #8bff5d;
  --color-accent-hover: #a4ff80;
  --color-accent-soft: rgba(139, 255, 93, 0.12);

  --color-success: #69db9c;
  --color-warning: #ffd166;
  --color-error: #ff6b6b;
}
```

### 8.3 Espaciado

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
```

### 8.4 Bordes

- Tarjetas principales: 20–24 px.
- Botones: 10–14 px.
- Etiquetas: completamente redondeadas.
- Contenedores secundarios: 14–18 px.

### 8.5 Tipografía

- Interfaz: Geist, Inter o Manrope.
- Títulos editoriales opcionales: Instrument Serif.
- Máximo dos familias.
- Pesos limitados para mejorar el rendimiento.

---

## 9. Componentes que deben construirse

### 9.1 Base

- `AppLayout`
- `Container`
- `Section`
- `Stack`
- `Grid`
- `Divider`
- `VisuallyHidden`

### 9.2 Navegación

- `Header`
- `DesktopNavigation`
- `MobileNavigation`
- `AvailabilityBadge`
- `ThemeToggle`
- `LanguageSelector`

### 9.3 Proyectos

- `FeaturedProject`
- `ProjectCard`
- `ProjectGrid`
- `ProjectFilters`
- `ProjectSearch`
- `ProjectSort`
- `ProjectStatus`
- `TechnologyTag`
- `ProjectGallery`
- `ProjectLinks`
- `RelatedProjects`
- `ProjectEmptyState`
- `ProjectSkeleton`

### 9.4 Contenido personal

- `Hero`
- `SocialLinks`
- `SkillsMarquee`
- `AboutPreview`
- `Timeline`
- `WorkPrinciples`
- `ContactCTA`
- `Footer`

### 9.5 Sistema

- `ErrorBoundary`
- `OfflineNotice`
- `GitHubStatus`
- `Toast`
- `Modal`
- `CommandPalette`
- `BackToTop`
- `SkipLink`

---

## 10. Funcionalidades propias que superarán a GitHub

### 10.1 Búsqueda avanzada

La búsqueda comprobará:

- Nombre.
- Título personalizado.
- Descripción.
- Tecnologías.
- Categoría.
- Etiquetas.
- Año.
- Estado.

Ejemplos:

```text
javascript
fintech
proyectos terminados
kotlin 2026
web interactiva
```

### 10.2 Filtros combinables

- Tecnología.
- Categoría.
- Estado.
- Año.
- Destacados.
- Con demo.
- Con caso de estudio.
- Académicos o personales.

### 10.3 Ordenación

- Relevancia personal.
- Más recientes.
- Última actualización.
- Alfabético.
- Tecnología.
- Destacados primero.

La opción predeterminada será **relevancia personal**, no la fecha de GitHub.

### 10.4 URL persistente

```text
/projects?technology=javascript&status=completed&sort=recent
```

Esto permitirá compartir búsquedas concretas y conservar su estado al volver atrás.

### 10.5 Paleta de comandos

Atajo:

```text
Ctrl + K
```

Acciones:

- Buscar proyectos.
- Ir al contacto.
- Abrir GitHub.
- Descargar CV.
- Cambiar tema.
- Ir a un proyecto.
- Limpiar filtros.

### 10.6 Colecciones personales

- Mis mejores proyectos.
- Desarrollo web.
- JavaScript.
- Aplicaciones académicas.
- Diseño de producto.
- En construcción.

### 10.7 Comparador de proyectos

Funcionalidad opcional para una fase posterior:

```text
Seleccionar dos proyectos → Comparar
```

Podrá mostrar:

- Tecnologías.
- Año.
- Objetivos.
- Complejidad.
- Estado.
- Aprendizajes.

### 10.8 Proyectos relacionados

Se sugerirán mediante:

- Tecnologías compartidas.
- Categoría.
- Etiquetas.
- Proximidad temporal.
- Prioridad configurada.

### 10.9 Historial de actualizaciones

```text
Últimas mejoras
— Nueva interfaz móvil
— Mejora de accesibilidad
— Optimización de imágenes
```

### 10.10 Indicador de calidad del contenido

Solo visible para Gerard:

```text
IMAGINEM — 90% completo
Falta: vídeo de demostración
```

El sistema evaluará si el proyecto tiene:

- Portada.
- Descripción.
- Tecnologías.
- Demo.
- Galería.
- Participación.
- Resultados.
- Caso de estudio.

---

## 11. Integración con GitHub

### 11.1 Flujo de sincronización

```text
1. Obtener datos de GitHub.
2. Validar la respuesta.
3. Normalizar repositorios.
4. Combinar con projects.json.
5. Excluir repositorios ocultos.
6. Calcular filtros y categorías.
7. Ordenar según prioridad personal.
8. Guardar una copia en caché.
9. Renderizar.
10. Actualizar silenciosamente en segundo plano.
```

### 11.2 Estrategia ante errores

Si GitHub no responde:

1. Usar la copia local más reciente.
2. Mantener visible el contenido editorial.
3. No bloquear toda la web.
4. Mostrar un aviso discreto.
5. Permitir reintentar.
6. Registrar el fallo sin enseñar errores técnicos al visitante.

### 11.3 Límites y seguridad

- No incluir tokens privados en el frontend.
- Usar únicamente información pública en cliente.
- Si se necesita autenticación, utilizar una función de servidor.
- Validar todas las URLs externas.
- Escapar contenido dinámico.
- Aplicar tiempos máximos y recuperación ante errores.

---

## 12. Rendimiento y fluidez

### 12.1 Objetivos

- Contenido principal visible en menos de 1,5 segundos en una conexión razonable.
- Interacción inicial sin bloqueos.
- Cambios de filtros perceptiblemente instantáneos.
- Sin saltos de diseño al cargar imágenes.
- Animaciones estables.
- JavaScript inicial reducido.
- Puntuaciones altas de rendimiento y accesibilidad.

### 12.2 Imágenes

- Utilizar WebP o AVIF.
- Generar varios tamaños.
- Definir `width` y `height`.
- Cargar la imagen principal con prioridad.
- Aplicar lazy loading al resto.
- Utilizar placeholders de baja resolución.
- Comprimir capturas antes de publicarlas.

### 12.3 JavaScript

- División de código por rutas.
- Carga diferida de galerías y componentes pesados.
- Evitar librerías innecesarias.
- No cargar animaciones complejas en móvil.
- Debounce de búsqueda.
- Memoización únicamente donde tenga sentido.
- Cancelación de peticiones antiguas.

### 12.4 CSS

- Variables globales.
- Sistema de diseño único.
- Evitar reglas duplicadas.
- No abusar de `backdrop-filter`.
- Reducir desenfoques en dispositivos menos potentes.
- Animar preferentemente `transform` y `opacity`.

### 12.5 Fuentes

- Una fuente variable si es posible.
- Subconjuntos de caracteres.
- Precarga de la fuente principal.
- `font-display: swap`.
- Tipografía de sistema como alternativa.

### 12.6 Animación

```css
.project-card {
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    background-color 220ms ease;
}

.project-card:hover {
  transform: translateY(-4px);
}
```

Nada debe moverse constantemente sin aportar información.

---

## 13. Responsive

### 13.1 Breakpoints orientativos

```text
Mobile:   320–767 px
Tablet:   768–1023 px
Desktop:  1024–1439 px
Wide:     1440 px o más
```

### 13.2 Mobile first

En móvil:

- Hero más corto.
- Navegación mediante menú.
- CTA apilados.
- Una columna de proyectos.
- Filtros en panel inferior.
- Imágenes optimizadas.
- Animaciones reducidas.
- Acciones principales accesibles con el pulgar.
- Textos sin líneas excesivamente largas.

### 13.3 Reglas esenciales

- No habrá scroll horizontal accidental.
- Ningún botón tendrá un área inferior a 44 × 44 px.
- Los filtros se podrán cerrar fácilmente.
- La galería será táctil.
- El título se adaptará mediante `clamp()`.
- El proyecto seguirá siendo comprensible sin efectos hover.

---

## 14. Accesibilidad

### 14.1 Requisitos mínimos

- HTML semántico.
- Un único `h1` por página.
- Jerarquía correcta de encabezados.
- Navegación por teclado.
- Foco visible.
- Contraste AA.
- Etiquetas en formularios.
- Mensajes de error comprensibles.
- Alternativas de texto.
- Enlace “Saltar al contenido”.
- Respeto por `prefers-reduced-motion`.
- Estados activos no dependientes solo del color.
- Anuncios accesibles en cambios de resultados.

Ejemplo para lectores de pantalla:

```text
Se muestran 6 proyectos de JavaScript.
```

---

## 15. SEO y compartición

Cada página tendrá:

- Título único.
- Descripción única.
- URL canónica.
- Open Graph.
- Imagen social.
- Twitter/X cards.
- Favicon.
- Sitemap.
- Robots.
- Datos estructurados.
- Idioma declarado.
- Metadatos de autor.

Ejemplo de título:

```text
IMAGINEM — Proyecto fintech | Gerard Maestre
```

Ejemplo de descripción:

```text
Caso de estudio de IMAGINEM, un concepto fintech desarrollado
por Gerard Maestre para explorar nuevas experiencias financieras.
```

Cada proyecto destacado tendrá una imagen social específica para LinkedIn, WhatsApp y otras plataformas.

---

## 16. Analítica respetuosa

Se medirán únicamente acciones útiles:

- Visita a un proyecto.
- Clic en demo.
- Clic en GitHub.
- Descarga de CV.
- Envío de contacto.
- Uso de filtros.
- Tecnologías más consultadas.
- Búsquedas sin resultados.

Esto deberá permitir responder:

- ¿Qué proyecto atrae más interés?
- ¿Qué tecnología buscan los visitantes?
- ¿Llegan hasta el contacto?
- ¿Qué búsquedas no encuentran resultados?
- ¿Se consulta más desde móvil o escritorio?

---

## 17. Calidad y pruebas

### 17.1 Pruebas funcionales

- Carga de repositorios.
- Fusión con datos personalizados.
- Proyectos ocultos.
- Orden personalizado.
- Búsqueda.
- Filtrado combinado.
- Limpieza de filtros.
- Navegación.
- Enlaces externos.
- Formulario.
- Estados de error.
- Funcionamiento sin GitHub.
- Caché.

### 17.2 Pruebas visuales

- Móvil pequeño.
- Móvil grande.
- Tablet.
- Portátil.
- Monitor grande.
- Zoom al 200 %.
- Tema oscuro.
- Textos largos.
- Proyecto sin imagen.
- Proyecto sin descripción.

### 17.3 Navegadores

- Edge.
- Chrome.
- Firefox.
- Safari.
- Navegadores móviles principales.

### 17.4 Criterio de finalización

```text
Funciona + es responsive + es accesible + tiene estado de error
+ tiene estado de carga + está optimizada + está documentada.
```

---

## 18. Plan de ejecución completo

### Fase 0 — Auditoría y preparación

#### Tareas

- Inventariar los archivos actuales.
- Identificar dependencias.
- Documentar la integración con GitHub.
- Revisar todos los repositorios.
- Clasificar proyectos.
- Detectar código reutilizable.
- Capturar la versión visual actual.
- Medir rendimiento inicial.
- Crear una rama de rediseño.
- Definir sistema de nombres y estructura.

#### Entregables

```text
/docs/audit.md
/docs/project-inventory.md
/docs/current-performance.md
```

#### Criterio de salida

Debe estar claro qué se conserva, qué se sustituye y qué contenido falta.

---

### Fase 1 — Fundamentos del producto

#### Tareas

- Definir propuesta de valor.
- Redactar el hero.
- Redactar “Sobre mí”.
- Seleccionar tres proyectos destacados.
- Definir categorías.
- Definir estados.
- Definir tecnologías.
- Preparar la arquitectura de páginas.
- Preparar wireframes.
- Aprobar la jerarquía visual.

#### Entregables

- Mapa del sitio.
- Wireframes.
- Inventario de contenido.
- Modelo de proyecto.

#### Criterio de salida

Toda la web debe poder explicarse antes de diseñar sus detalles.

---

### Fase 2 — Sistema de diseño

#### Tareas

- Crear tokens de color.
- Crear escala tipográfica.
- Establecer espaciado.
- Diseñar botones.
- Diseñar campos.
- Diseñar etiquetas.
- Diseñar tarjetas.
- Diseñar navegación.
- Diseñar estados de carga y error.
- Definir sombras y transparencias.
- Diseñar la versión móvil.

#### Entregables

```text
src/styles/tokens.css
src/styles/global.css
src/components/ui/
```

#### Criterio de salida

No deben existir estilos improvisados por cada sección.

---

### Fase 3 — Capa personal de contenido

#### Tareas

- Crear archivos de contenido.
- Definir esquema de validación.
- Introducir perfil.
- Añadir datos personalizados de proyectos.
- Definir prioridades.
- Ocultar repositorios irrelevantes.
- Crear categorías y colecciones.
- Añadir estados.
- Configurar valores alternativos.
- Documentar cómo editar el contenido.

#### Entregables

```text
src/content/
docs/content-management.md
```

#### Criterio de salida

Debe ser posible cambiar orden, textos, imágenes y visibilidad sin tocar los componentes.

---

### Fase 4 — Motor de GitHub

#### Tareas

- Crear cliente de GitHub.
- Normalizar respuestas.
- Gestionar errores.
- Implementar caché.
- Crear datos alternativos.
- Fusionar GitHub con contenido personal.
- Calcular tecnologías.
- Calcular categorías.
- Excluir repositorios.
- Implementar actualización silenciosa.

#### Entregables

```text
src/services/github/
src/services/projects/
src/cache/
```

#### Criterio de salida

La desconexión de GitHub no debe inutilizar el portafolio.

---

### Fase 5 — Home profesional

#### Tareas

- Navegación.
- Hero.
- Presentación.
- Tecnologías principales.
- Proyectos destacados.
- Forma de trabajar.
- Vista previa del explorador.
- Sobre mí.
- CTA de contacto.
- Footer.

#### Criterio de salida

Una persona debe entender quién eres y qué haces sin entrar en ningún repositorio.

---

### Fase 6 — Explorador avanzado

#### Tareas

- Buscador.
- Debounce.
- Filtros.
- Ordenación.
- Contador.
- URL persistente.
- Carga progresiva.
- Estados vacíos.
- Skeletons.
- Botón para limpiar.
- Vista responsive.
- Paleta de comandos.

#### Criterio de salida

Encontrar cualquier proyecto debe requerir pocos segundos y pocos clics.

---

### Fase 7 — Casos de estudio

#### Tareas

- Crear plantilla.
- Preparar portada.
- Añadir galería.
- Redactar contexto.
- Explicar el problema.
- Explicar la solución.
- Definir la participación.
- Mostrar tecnologías.
- Explicar aprendizajes.
- Añadir demo.
- Añadir repositorio.
- Añadir proyectos relacionados.

#### Primeros casos recomendados

1. IMAGINEM.
2. Night Access Barcelona.
3. Portfolio-DAM o el proyecto con mayor profundidad técnica.

#### Criterio de salida

Cada proyecto destacado debe demostrar criterio, proceso y capacidad, no solo existencia.

---

### Fase 8 — Motion y microinteracciones

#### Tareas

- Entrada del hero.
- Revelado de secciones.
- Hover de tarjetas.
- Transición entre páginas.
- Feedback de filtros.
- Animación del menú móvil.
- Aparición de mensajes.
- Reducción de movimiento.
- Validación del rendimiento.

#### Criterio de salida

Toda animación debe tener una razón funcional o jerárquica.

---

### Fase 9 — Accesibilidad, SEO y rendimiento

#### Tareas

- Auditoría de contraste.
- Prueba de teclado.
- Pruebas con lectores de pantalla.
- Metadatos.
- Sitemap.
- Open Graph.
- Optimización de imágenes.
- Optimización de fuentes.
- División de código.
- Eliminación de dependencias innecesarias.
- Medición final.
- Corrección de saltos visuales.

#### Criterio de salida

La web debe ser rápida y usable antes de considerarse terminada.

---

### Fase 10 — Despliegue y automatización

#### Tareas

- Configurar workflow.
- Ejecutar validaciones en cada cambio.
- Compilar.
- Generar datos estáticos.
- Desplegar.
- Añadir dominio personalizado si se desea.
- Configurar HTTPS.
- Añadir monitorización.
- Definir rollback.
- Crear copias de datos.

#### Flujo

```text
Cambio → Validación → Pruebas → Build → Preview → Producción
```

#### Criterio de salida

Publicar una mejora debe ser seguro, repetible y sencillo.

---

### Fase 11 — Panel privado

Esta fase se ejecutará después de estabilizar el producto.

#### Módulos

- Autenticación.
- Dashboard.
- Proyectos.
- Perfil.
- Habilidades.
- Experiencia.
- Imágenes.
- SEO.
- Vista previa.
- Publicación.
- Historial de cambios.

#### Vista conceptual

```text
Dashboard
├── Estado del portafolio
├── Proyectos incompletos
├── Última sincronización
├── Enlaces rotos
├── Imágenes pendientes
└── Publicar cambios
```

---

## 19. Backlog priorizado

### P0 — Imprescindible

- Arquitectura nueva.
- Configuración personal.
- Integración estable con GitHub.
- Hero profesional.
- Proyectos destacados.
- Explorador.
- Responsive.
- Accesibilidad básica.
- Gestión de errores.
- Optimización de imágenes.
- Contacto.
- SEO.

### P1 — Muy importante

- Casos de estudio.
- URL de filtros.
- Paleta de comandos.
- Caché avanzada.
- Analítica.
- Colecciones.
- Proyectos relacionados.
- Galerías.
- Transiciones.
- CV.

### P2 — Evolución

- Panel privado.
- Autenticación.
- Comparador.
- Historial de actualizaciones.
- Múltiples idiomas.
- Modo claro.
- Artículos.
- Sistema de notas.
- Importación automática de README.
- Recomendaciones personalizadas.

---

## 20. Estructura recomendada del repositorio

```text
/
├── public/
│   ├── images/
│   ├── projects/
│   ├── icons/
│   ├── fonts/
│   ├── resume/
│   └── social/
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── projects/
│   │   ├── profile/
│   │   ├── contact/
│   │   ├── feedback/
│   │   └── ui/
│   │
│   ├── content/
│   │   ├── profile.json
│   │   ├── projects.json
│   │   ├── experience.json
│   │   ├── skills.json
│   │   └── settings.json
│   │
│   ├── pages/
│   │   ├── home/
│   │   ├── projects/
│   │   ├── project-detail/
│   │   ├── about/
│   │   ├── contact/
│   │   └── not-found/
│   │
│   ├── services/
│   │   ├── github/
│   │   ├── projects/
│   │   ├── analytics/
│   │   └── cache/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── styles/
│   └── tests/
│
├── docs/
│   ├── architecture.md
│   ├── content-management.md
│   ├── design-system.md
│   ├── deployment.md
│   └── testing.md
│
└── .github/
    └── workflows/
```

---

## 21. Definition of Done

La versión principal estará completa cuando:

- Gerard pueda controlar qué proyectos aparecen.
- Se pueda modificar el orden sin tocar la lógica.
- Se puedan sobrescribir nombres y descripciones de GitHub.
- Los proyectos importantes tengan capturas.
- Existan al menos tres casos destacados.
- La web funcione aunque falle GitHub.
- Los filtros sean rápidos.
- El estado se conserve en la URL.
- La versión móvil esté completamente resuelta.
- La navegación con teclado funcione.
- Las imágenes estén optimizadas.
- No existan enlaces rotos.
- Los metadatos sean correctos.
- El contacto sea evidente.
- El despliegue sea automático.
- La documentación explique cómo mantener todo.
- La página represente a Gerard y no parezca una plantilla genérica.

---

## 22. Orden exacto recomendado

```text
1. Congelar y documentar la versión actual.
2. Crear una rama de reconstrucción.
3. Definir el modelo de contenido personal.
4. Clasificar todos los repositorios.
5. Elegir tres proyectos destacados.
6. Crear el sistema visual.
7. Construir la nueva arquitectura.
8. Implementar el motor de sincronización.
9. Construir el home.
10. Construir el explorador.
11. Crear los casos de estudio.
12. Añadir movimiento.
13. Optimizar móvil.
14. Auditar accesibilidad.
15. Optimizar rendimiento.
16. Completar SEO.
17. Automatizar el despliegue.
18. Publicar.
19. Medir el uso real.
20. Construir el panel privado.
```

---

## 23. Resultado final esperado

El portafolio dejará de ser una interfaz que únicamente **enseña repositorios** y se convertirá en un **sistema personal para gestionar y presentar el trabajo de Gerard**.

GitHub seguirá actualizando la parte técnica, pero Gerard tendrá control sobre:

```text
Identidad
Narrativa
Selección
Orden
Diseño
Imágenes
Categorías
Estados
Casos de estudio
Visibilidad
Métricas
SEO
Experiencia de usuario
```

La idea no es competir con GitHub copiándolo. Es crear la capa que GitHub no puede proporcionar: **contexto, personalidad, selección, presentación y control editorial completo**.
