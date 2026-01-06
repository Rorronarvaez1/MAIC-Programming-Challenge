import React, { useState } from 'react';
import axios from 'axios';
import { FileUpload } from './components/FileUpload';
import { AnalysisCards } from './components/AnalysisCards';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (filesArray) => {
    const files = Array.isArray(filesArray) ? filesArray : [filesArray];
    
    if (files.length === 0) {
      alert('Por favor seleccione al menos un archivo');
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al analizar los archivos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChart = (suggestion, index) => {
    setSelectedCharts([...selectedCharts, suggestion]);
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleRemoveChart = (index) => {
    const newCharts = selectedCharts.filter((_, i) => i !== index);
    setSelectedCharts(newCharts);
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setSelectedCharts([]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Análisis Instantáneo</h1>
          <p>Creador de Dashboards con IA</p>
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">
          <section className="section upload-section">
            <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />
          </section>

          {suggestions.length > 0 && (
            <section className="section analysis-section">
              <AnalysisCards
                suggestions={suggestions}
                onAddChart={handleAddChart}
              />
            </section>
          )}

          <section className="section dashboard-section">
            <Dashboard
              selectedCharts={selectedCharts}
              onRemoveChart={handleRemoveChart}
            />
          </section>
        </div>

      </main>
    </div>
  );
}

export default App;
