import React from 'react';
import '../styles/AnalysisCards.css';

export const AnalysisCards = ({ suggestions, onAddChart }) => {
  return (
    <div className="analysis-cards-container">
      <h2>Sugerencias de análisis</h2>
      <div className="cards-grid">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="analysis-card">
            <div className="card-header">
              <h3>{suggestion.title}</h3>
              <span className="chart-type-badge">{suggestion.chart_type}</span>
            </div>
            <div className="card-body">
              <p className="insight">{suggestion.insight}</p>
            </div>
            <div className="card-footer">
              <button
                className="add-to-dashboard-btn"
                onClick={() => onAddChart(suggestion)}
              >
                Agregar al panel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
