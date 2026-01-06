# Creador de Dashboards con IA

## Configuración y Ejecución Local

### Prerrequisitos
- Node.js v18+ y npm
- Python 3.10+
- Google Gemini API Key

### Backend (Python/Flask)

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate 

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
echo GEMINI_API_KEY=tu_api_key > .env

# Ejecutar servidor
python app.py
```


### Frontend (React)

```bash
cd maic

# Instalar dependencias
npm install

# Ejecutar aplicación
npm start
```


---

## Decisiones Técnicas

### Frontend
- React: Framework interactivo con excelente ecosistema
- Recharts: Gráficos declarativos y fáciles de personalizar
- Axios: Manejo robusto de requests HTTP
- CSS: Estilos encapsulados por componente

### Backend
- Flask: Framework ligero para APIs REST
- Flask-CORS: Comunicación frontend-backend
- Pandas: Análisis y manipulación de datos
- OpenPyXL: Lectura de archivos Excel
- Google Gemini: Modelo de IA con Structured Outputs para respuestas JSON validadas
- Pydantic: Validación de esquemas de respuestas

---

## Ingeniería de Prompts

### Estrategia
Escribi en el promp que Gemini actue como un analista de datos experto y que regrese su respuesta en un formato espesifico.

# Información dada al Modelo

1. Metadatos del dataset: filas, columnas, tipos de datos
2. Estadísticas por columna: valores únicos, nulos, rango, media
3. Muestra de datos: primeras 5 filas en JSON
4. Reglas estrictas: solo usar columnas existentes, mapeos correctos de gráficos

### Validación de Respuestas
Para validar que la respuesta dada esta en el formato JSON correcto ocupe Pydatic modes como `response_schema`

```python
class ChartSuggestion(BaseModel):
    title: str
    chart_type: Literal["bar", "line", "pie", "scatter"]
    parameters: ChartParameters
    insight: str
```


El promp instruye que el insight regrese en este formato
```
Resumen breve. | Beneficio 1. | Beneficio 2. | Beneficio 3.
```

Despues en el frontend hacemos un parce simple para separar la string cuando se encuentre un "|" 
```
Resumen breve
    - Beneficio 1
    - Beneficio 2
    - Beneficio 3
```
Source
https://ai.google.dev/gemini-api/docs/structured-output?example=recipe
