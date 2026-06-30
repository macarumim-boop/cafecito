# ☕ Cafecito - Aplicación de Encuestas

Una aplicación web moderna para crear, compartir y analizar encuestas tipo Typeform. Construida con Next.js, React y Tailwind CSS.

## 🎯 Características

### 1. **Autenticación Segura**
- Login con usuario y contraseña
- Sesión persistente con localStorage
- Logout seguro

**Credenciales de demostración:**
- Usuario: `admin`
- Contraseña: `cafecito123`

### 2. **Dashboard Principal**
- Vista de todas tus encuestas creadas
- Estadísticas rápidas (cantidad de respuestas, preguntas, etc.)
- Acciones por encuesta:
  - **Ver**: Abre la encuesta en una nueva pestaña para responderla
  - **Compartir**: Copia el link de la encuesta al portapapeles
  - **Resultados**: Muestra estadísticas y respuestas detalladas
  - **Eliminar**: Borra la encuesta y todas sus respuestas

### 3. **Crear Encuestas**
Página completa para diseñar encuestas con múltiples tipos de preguntas:

#### Tipos de Preguntas:
- **Respuesta Larga**: Textarea para respuestas extendidas
- **Respuesta Corta**: Input de texto simple
- **Opción Múltiple**: Checkboxes con múltiples opciones
- **Calificación**: Rating de 1-5 estrellas

#### Características:
- Título y descripción para la encuesta
- Agregar/eliminar preguntas dinámicamente
- Configurar preguntas como obligatorias o opcionales
- Para opción múltiple: agregar/eliminar opciones
- Link compartible único para cada encuesta

### 4. **Responder Encuestas**
Página pública donde usuarios pueden responder:

- Acceso sin autenticación requerida
- Link compartible único por encuesta
- Interfaz intuitiva y amigable
- Validación de campos obligatorios
- Confirmación visual al enviar
- Posibilidad de responder múltiples veces

### 5. **Análisis y Resultados**
Dashboard de estadísticas con:

#### Estadísticas Generales:
- Total de respuestas recibidas
- Cantidad de preguntas
- Tasa de respuesta

#### Por Tipo de Pregunta:
- **Opción Múltiple**: Gráfico de barras horizontal con porcentajes
- **Calificación**: Promedio de estrellas y análisis visual
- **Preguntas Abiertas**: Lista de todas las respuestas

#### Tabla de Respuestas:
- Todas las respuestas en formato tabla
- Ordenadas por fecha
- Fácil de leer y analizar

#### Exportar Datos:
- Descarga de resultados en formato CSV
- Compatible con Excel y Google Sheets

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + Next.js (App Router)
- **Estilos**: Tailwind CSS 3
- **Íconos**: Lucide React
- **Almacenamiento**: LocalStorage (datos del navegador)
- **TypeScript**: Type safety completo

## 📁 Estructura del Proyecto

```
cafecito/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout con AuthProvider
│   │   ├── page.tsx             # Dashboard principal
│   │   ├── login/
│   │   │   └── page.tsx         # Página de login
│   │   ├── create/
│   │   │   └── page.tsx         # Crear nuevas encuestas
│   │   ├── survey/
│   │   │   └── [shareLink]/
│   │   │       └── page.tsx     # Responder encuesta
│   │   └── results/
│   │       └── [surveyId]/
│   │           └── page.tsx     # Ver resultados
│   ├── components/
│   │   ├── dashboard.tsx        # Dashboard principal
│   │   └── protected-route.tsx  # Wrapper de autenticación
│   └── lib/
│       ├── auth-context.tsx     # Context y hooks de auth
│       └── surveys-storage.ts   # Funciones de storage
└── package.json
```

## 🚀 Cómo Usar

### Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
open http://localhost:3000
```

### Flujo de Uso

1. **Login**: Ingresa con las credenciales de demostración
2. **Crear Encuesta**: Haz clic en "Crear Nueva Encuesta"
3. **Diseñar**: Agrega preguntas de diferentes tipos
4. **Compartir**: Copia el link y envía a tus usuarios
5. **Recopilar**: Los usuarios responden desde el link
6. **Analizar**: Ve resultados en tiempo real en el dashboard

## 💾 Almacenamiento de Datos

Los datos se guardan en **localStorage** del navegador:
- `cafecito_auth`: Información de sesión del usuario
- `cafecito_surveys`: Todas las encuestas creadas
- `cafecito_responses`: Todas las respuestas recibidas

**Nota**: Los datos persisten mientras no limpies el almacenamiento del navegador.

## 🎨 Diseño y UX

- Interfaz moderna y limpia con Tailwind CSS
- Gradientes azul-púrpura para elementos principales
- Animaciones y transiciones suaves
- Colores intuitivos para estados (rojo para destructivos, verde para éxito)
- Responsive design para móvil y desktop
- Iconografía clara con Lucide React

## 📊 Ejemplo de Tipos de Preguntas

### Calificación (Rating)
```
¿Qué tan satisfecho estás? ⭐⭐⭐⭐⭐
```
Muestra promedio y distribución de calificaciones

### Opción Múltiple
```
¿Cuáles te gustaron más?
✓ Opción 1 (50%)
✓ Opción 2 (75%)
  Opción 3 (25%)
```
Gráfico de barras con porcentajes

### Respuestas Abiertas
```
Muestra todas las respuestas en una lista scrollable
Máximo 3 líneas por respuesta
```

## 🔒 Seguridad

- Autenticación simple con localStorage
- Link único por encuesta (no predecible)
- Las respuestas se guardan localmente
- Sin comunicación a servidores externos

## 📈 Estadísticas Disponibles

- **Por pregunta**: Respuestas totales, promedio, distribución
- **Globales**: Total de respuestas, tasa de finalización
- **Temporales**: Fechas de respuesta

## 🎯 Casos de Uso

- 📋 Encuestas de satisfacción del cliente
- 🎓 Cuestionarios educativos
- 📝 Feedback de eventos
- 🤝 Investigación de mercado
- 👥 Sondeos rápidos
- 💼 Evaluaciones de RH

## 🚀 Próximas Mejoras Sugeridas

- [ ] Backend con base de datos persistente
- [ ] Autenticación con OAuth (Google, GitHub)
- [ ] Más tipos de preguntas (slider, matriz, etc.)
- [ ] Personalización de temas y colores
- [ ] Envío automático de emails con el link
- [ ] Más opciones de exportación (PDF, Excel)
- [ ] Análisis avanzados (filtros, segmentación)
- [ ] Colaboración con otros usuarios

## 📝 Licencia

Este proyecto es de demostración. Puedes usarlo y modificarlo libremente.

---

**Creado con ❤️ usando React, Next.js y Tailwind CSS**
