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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload');

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setIsLoading(true);
    setCurrentStep('analyze');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuggestions(response.data.suggestions || []);
      setCurrentStep('analyze');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al analizar el archivo. Por favor intente nuevamente.');
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChart = (suggestion) => {
    setSelectedCharts([...selectedCharts, suggestion]);
    if (selectedCharts.length === 0) {
      setCurrentStep('dashboard');
    }
  };

  const handleRemoveChart = (index) => {
    const newCharts = selectedCharts.filter((_, i) => i !== index);
    setSelectedCharts(newCharts);
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setSelectedCharts([]);
    setUploadedFile(null);
    setCurrentStep('upload');
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

          {suggestions.length > 0 && currentStep === 'analyze' && (
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

        {selectedCharts.length > 0 && (
          <section className="action-buttons">
            <button className="reset-btn" onClick={handleStartOver}>
              Cargar nuevo archivo
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
