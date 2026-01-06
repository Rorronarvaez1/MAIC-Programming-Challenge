import React from 'react';
import '../styles/AnalysisCards.css';

export const AnalysisCards = ({ suggestions, onAddChart }) => {
  const parseInsight = (insight) => {
    const parts = insight.split('|').map(part => part.trim());
    
    if (parts.length === 1) {
      return { summary: insight, bullets: [] };
    }
    
    return {
      summary: parts[0],
      bullets: parts.slice(1)
    };
  };

  const getChartIcon = (chartType) => {
    switch (chartType) {
      case 'bar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
            <path d="M640-160v-280h160v280H640Zm-240 0v-640h160v640H400Zm-240 0v-440h160v440H160Z"/>
          </svg>
        );
      case 'pie':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
            <path d="M520-520h278q-15-110-91.5-186.5T520-798v278Zm-80 358v-636q-121 15-200.5 105.5T160-480q0 122 79.5 212.5T440-162Zm80 0q110-14 187-91t91-187H520v278Zm-40-318Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z"/>
          </svg>
        );
      case 'scatter':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
            <path d="M680-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T760-280q0-33-23.5-56.5T680-360q-33 0-56.5 23.5T600-280q0 33 23.5 56.5T680-200Zm-400-40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T360-400q0-33-23.5-56.5T280-480q-33 0-56.5 23.5T200-400q0 33 23.5 56.5T280-320Zm160-240q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T520-720q0-33-23.5-56.5T440-800q-33 0-56.5 23.5T360-720q0 33 23.5 56.5T440-640Zm240 360ZM280-400Zm160-320Z"/>
          </svg>
        );
      case 'line':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
            <path d="m140-220-60-60 300-300 160 160 284-320 56 56-340 384-160-160-240 240Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const groupedByFile = suggestions.reduce((acc, suggestion, index) => {
    const file = suggestion.source_file || 'Sin archivo';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push({ suggestion, index });
    return acc;
  }, {});

  return (
    <div className="analysis-cards-container">
      <h2>Sugerencias de análisis</h2>
      
      {Object.entries(groupedByFile).map(([fileName, cards]) => (
        <div key={fileName} className="file-group">
          <h3 className="file-group-title">{fileName}</h3>
          <div className="cards-grid">
            {cards.map(({ suggestion, index }) => (
              <div key={index} className="analysis-card">
                <div className="card-header">
                  <h4>{suggestion.title}</h4>
                  <span className="chart-type-badge">{getChartIcon(suggestion.chart_type)}</span>
                </div>
                <div className="card-body">
                  {(() => {
                    const parsed = parseInsight(suggestion.insight);
                    return (
                      <>
                        <p className="insight-summary">{parsed.summary}</p>
                        {parsed.bullets.length > 0 && (
                          <ul className="insight-bullets">
                            {parsed.bullets.map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="card-footer">
                  <button
                    className="add-to-dashboard-btn"
                    onClick={() => onAddChart(suggestion, index)}
                  >
                    Agregar al panel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};



/*
Bar Chart Icon
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M640-160v-280h160v280H640Zm-240 0v-640h160v640H400Zm-240 0v-440h160v440H160Z"/></svg>

Pie Chart icon
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M520-520h278q-15-110-91.5-186.5T520-798v278Zm-80 358v-636q-121 15-200.5 105.5T160-480q0 122 79.5 212.5T440-162Zm80 0q110-14 187-91t91-187H520v278Zm-40-318Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z"/></svg>

Scatter Plot Icon
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M680-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T760-280q0-33-23.5-56.5T680-360q-33 0-56.5 23.5T600-280q0 33 23.5 56.5T680-200Zm-400-40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T360-400q0-33-23.5-56.5T280-480q-33 0-56.5 23.5T200-400q0 33 23.5 56.5T280-320Zm160-240q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T520-720q0-33-23.5-56.5T440-800q-33 0-56.5 23.5T360-720q0 33 23.5 56.5T440-640Zm240 360ZM280-400Zm160-320Z"/></svg>

Line Chart Icon
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m140-220-60-60 300-300 160 160 284-320 56 56-340 384-160-160-240 240Z"/></svg>
*/