"""
Backend para el Creador de Dashboards con IA
Utiliza Flask + Google Gemini con Structured Outputs
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

# Determinar si estamos en producción
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
CORS(app)

ALLOWED_EXTENSIONS = {'xlsx', 'csv'}
current_dataframe = {}

# Cliente Gemini - inicialización lazy para evitar errores al cargar
_genai_client = None

def get_genai_client():
    """Obtiene el cliente de Gemini, inicializándolo si es necesario"""
    global _genai_client
    if _genai_client is None:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY no está configurada. Configúrala como variable de entorno.")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


# Modelos 

class ChartParameters(BaseModel):
    """Parámetros para configurar un gráfico"""
    x_axis: str
    y_axis: str
    aggregation: Literal["sum", "mean", "count", "none"]


class ChartSuggestion(BaseModel):
    """Una sugerencia de visualización generada por la IA"""
    title: str
    chart_type: Literal["bar", "line", "pie", "scatter"]
    parameters: ChartParameters
    insight: str


class AnalysisResponse(BaseModel):
    """Respuesta completa del análisis de datos"""
    suggestions: list[ChartSuggestion]


def allowed_file(filename: str | None) -> bool:
    """Verifica si el archivo tiene una extensión permitida"""
    return filename is not None and '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_dataframe_info(df: pd.DataFrame) -> dict:
    """Extrae información relevante del DataFrame para el análisis"""
    
    info = {
        "num_rows": len(df),
        "num_columns": len(df.columns),
        "columns": []
    }
    
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique())
        }
        
        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["type"] = "numeric"
            col_info["min"] = float(df[col].min()) if not pd.isna(df[col].min()) else None
            col_info["max"] = float(df[col].max()) if not pd.isna(df[col].max()) else None
            col_info["mean"] = float(df[col].mean()) if not pd.isna(df[col].mean()) else None
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            col_info["type"] = "datetime"
            col_info["min"] = str(df[col].min())
            col_info["max"] = str(df[col].max())
        else:
            col_info["type"] = "categorical"
            if col_info["unique_count"] <= 20:
                col_info["unique_values"] = df[col].dropna().unique().tolist()[:20]
    
        info["columns"].append(col_info)
    
    info["sample_data"] = df.head(5).to_dict(orient='records')
    
    return info


def build_analysis_prompt(df_info: dict) -> str:
    """Construye el prompt para el análisis de datos"""
    
    prompt = f"""Eres un analista de datos experto. Tu tarea es analizar el siguiente conjunto de datos y sugerir las mejores visualizaciones.

## INFORMACIÓN DEL DATASET

- **Filas**: {df_info['num_rows']}
- **Columnas**: {df_info['num_columns']}

### Detalle de Columnas:

"""
    
    for col in df_info['columns']:
        prompt += f"\n**{col['name']}** ({col['type']})\n"
        prompt += f"  - Tipo de dato: {col['dtype']}\n"
        prompt += f"  - Valores únicos: {col['unique_count']}\n"
        prompt += f"  - Valores nulos: {col['null_count']}\n"
        
        if col['type'] == 'numeric':
            prompt += f"  - Rango: {col.get('min')} a {col.get('max')}\n"
            prompt += f"  - Media: {col.get('mean'):.2f}\n" if col.get('mean') else ""
        elif col['type'] == 'categorical' and 'unique_values' in col:
            prompt += f"  - Valores: {', '.join(str(v) for v in col['unique_values'][:10])}\n"
    
    prompt += f"""

### Muestra de Datos (primeras 5 filas):
{json.dumps(df_info['sample_data'], indent=2, default=str)}

## TU TAREA

Analiza estos datos y sugiere de 3 a 5 visualizaciones que revelen patrones interesantes o insights valiosos.

### Reglas importantes:
1. **SOLO** usa nombres de columnas que existan exactamente como aparecen arriba
2. Para gráficos de barras y pie: usa columnas categóricas en x_axis y numéricas en y_axis
3. Para gráficos de línea: idealmente usa fechas o secuencias en x_axis
4. Para scatter: usa dos columnas numéricas
5. El insight DEBE tener el siguiente formato:
   - Primera línea: Un resumen corto en una frase
   - Siguientes líneas: 2-3 beneficios o puntos clave, cada uno separado por " | "
   - Ejemplo: "Resumen del insight. | Primer beneficio. | Segundo beneficio. | Tercer beneficio."
6. Escribe todo en español

### Tipos de agregación:
- "sum": sumar valores (para ventas, cantidades, etc.)
- "mean": promediar valores (para ratings, promedios, etc.)
- "count": contar ocurrencias (cuando y_axis es igual a x_axis o para frecuencias)
- "none": sin agregación (para scatter plots o datos ya agregados)

Genera las sugerencias más útiles e interesantes para un analista de negocios.
"""
    
    return prompt


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Endpoint para cargar y analizar múltiples archivos Excel o CSV.
    Retorna sugerencias de visualización generadas por IA combinando todos los archivos.
    """
    global current_dataframe
    
    if 'files' not in request.files:
        return jsonify({"error": "No se enviaron archivos"}), 400
    
    files = request.files.getlist('files')
    
    if len(files) == 0:
        return jsonify({"error": "No se seleccionaron archivos"}), 400
    
    try:
        # Obtener cliente de Gemini
        client = get_genai_client()
        
        all_dataframes = []
        validated_suggestions = []
        
        for file in files:
            if not file.filename or file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                return jsonify({"error": f"Formato no soportado: {file.filename}. Use .xlsx o .csv"}), 400
            
            filename = secure_filename(file.filename)
            extension = filename.rsplit('.', 1)[1].lower()
            
            if extension == 'csv':
                df = pd.read_csv(file.stream)
            else:
                df = pd.read_excel(file.stream)
            
            all_dataframes.append(df)
            
            df_info = extract_dataframe_info(df)
            
            prompt = build_analysis_prompt(df_info)
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnalysisResponse,
                    temperature=0.7,
                )
            )
            
            if not response.text:
                continue
            
            result = json.loads(response.text)
            
            valid_columns = set(df.columns)
            
            for suggestion in result.get('suggestions', []):
                x_col = suggestion['parameters']['x_axis']
                y_col = suggestion['parameters']['y_axis']
                
                if x_col in valid_columns and y_col in valid_columns:
                    suggestion['source_file'] = filename
                    validated_suggestions.append(suggestion)
                else:
                    print(f"Sugerencia descartada ({filename}): columnas {x_col}, {y_col} no existen")
        
        if len(all_dataframes) > 0:
            combined_df = pd.concat(all_dataframes, ignore_index=True)
            session_id = "default"
            current_dataframe[session_id] = combined_df
            rows = len(combined_df)
            columns = len(combined_df.columns)
        else:
            return jsonify({"error": "No se pudieron procesar los archivos"}), 400
        
        file_names = [f.filename for f in files if f.filename]
        
        return jsonify({
            "success": True,
            "suggestions": validated_suggestions,
            "file_info": {
                "names": file_names,
                "rows": rows,
                "columns": columns
            }
        })
        
    except ValueError as e:
        # Error de configuración (API key faltante)
        print(f"Error de configuración: {str(e)}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error procesando archivo: {str(e)}")
        return jsonify({"error": f"Error procesando el archivo: {str(e)}"}), 500


@app.route('/api/chart-data', methods=['POST'])
def get_chart_data():
    """
    Endpoint para obtener los datos formateados para un gráfico específico.
    Recibe los parámetros del gráfico y retorna los datos agregados.
    """
    global current_dataframe
    
    session_id = "default"
    
    if session_id not in current_dataframe:
        return jsonify({"error": "No hay datos cargados. Suba un archivo primero."}), 400
    
    df = current_dataframe[session_id]
    
    try:
        data = request.get_json()
        params = data.get('parameters', {})
        
        x_axis = params.get('x_axis')
        y_axis = params.get('y_axis')
        aggregation = params.get('aggregation', 'sum')
        
        if x_axis not in df.columns or y_axis not in df.columns:
            return jsonify({"error": "Columnas no válidas"}), 400
        
        if aggregation == 'none':
            chart_data = df[[x_axis, y_axis]].dropna().head(500).to_dict(orient='records')
        
        elif aggregation == 'count':
            grouped = df[x_axis].value_counts().reset_index()
            grouped.columns = [x_axis, y_axis]
            chart_data = grouped.to_dict(orient='records')
        
        elif aggregation == 'mean':
            grouped = df.groupby(x_axis, as_index=False)[y_axis].mean()
            grouped[y_axis] = grouped[y_axis].round(2)
            chart_data = grouped.to_dict(orient='records')
        
        else:
            grouped = df.groupby(x_axis, as_index=False)[y_axis].sum()
            chart_data = grouped.to_dict(orient='records')
        
        if len(chart_data) > 50:
            chart_data = sorted(chart_data, key=lambda x: x.get(y_axis, 0), reverse=True)[:50]
        
        return jsonify(chart_data)
        
    except Exception as e:
        print(f"Error generando datos del gráfico: {str(e)}")
        return jsonify({"error": f"Error generando datos: {str(e)}"}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    api_key_configured = bool(os.getenv('GEMINI_API_KEY'))
    return jsonify({
        "status": "ok",
        "message": "Servidor funcionando correctamente",
        "gemini_api_key_configured": api_key_configured
    })


# Servir React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Sirve la aplicación React desde la carpeta static"""
    static_folder = app.static_folder or STATIC_FOLDER
    if path != "" and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    else:
        return send_from_directory(static_folder, 'index.html')


if __name__ == '__main__':
    if not os.getenv('GEMINI_API_KEY'):
        print("⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada")
        print("   Crea un archivo .env con tu API key de Gemini")
    else:
        print("✅ GEMINI_API_KEY configurada correctamente")
    
    print("🚀 Iniciando servidor en http://localhost:5000")
    app.run(debug=True, port=5000)