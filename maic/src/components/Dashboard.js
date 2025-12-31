import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import axios from 'axios';
import '../styles/Dashboard.css';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const Dashboard = ({ selectedCharts, onRemoveChart }) => {
  const [chartDataMap, setChartDataMap] = useState({});
  const [loadingCharts, setLoadingCharts] = useState(new Set());

  useEffect(() => {
    selectedCharts.forEach((chart, index) => {
      if (!chartDataMap[index]) {
        fetchChartData(chart, index);
      }
    });
  }, [selectedCharts]);

  const fetchChartData = async (chart, index) => {
    setLoadingCharts(prev => new Set([...prev, index]));
    try {
      const response = await axios.post('http://localhost:5000/api/chart-data', {
        parameters: chart.parameters
      });
      setChartDataMap(prev => ({
        ...prev,
        [index]: response.data
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoadingCharts(prev => {
        const updated = new Set(prev);
        updated.delete(index);
        return updated;
      });
    }
  };

  const renderChart = (chart, data, index) => {
    if (loadingCharts.has(index)) {
      return <div className="chart-loading">Cargando gráfico...</div>;
    }

    if (!data || data.length === 0) {
      return <div className="chart-error">No hay datos disponibles</div>;
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 }
    };

    switch (chart.chart_type.toLowerCase()) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.parameters.x_axis} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.parameters.y_axis} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.parameters.x_axis} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={chart.parameters.y_axis} stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.parameters.y_axis}
                nameKey={chart.parameters.x_axis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.parameters.x_axis} />
              <YAxis />
              <Tooltip />
              <Scatter dataKey={chart.parameters.y_axis} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="chart-error">Tipo de gráfico no soportado</div>;
    }
  };

  const hasCharts = selectedCharts.length > 0;

  return (
    <div className="dashboard-container">
      <h2>Su panel</h2>
      <div className="charts-grid">
        {hasCharts ? (
          selectedCharts.map((chart, index) => (
            <div key={index} className="chart-card">
              <div className="chart-header">
                <h3>{chart.title}</h3>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveChart(index)}
                  title="Remover gráfico"
                >
                  ✕
                </button>
              </div>
              <div className="chart-body">
                {renderChart(chart, chartDataMap[index], index)}
              </div>
              <div className="chart-footer">
                <p className="chart-insight">{chart.insight}</p>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="chart-card placeholder-card">
              <div className="chart-header placeholder-header">
                <h3>Gráfico de ejemplo 1</h3>
              </div>
              <div className="chart-body placeholder-body">
                <div className="placeholder-chart"></div>
              </div>
              <div className="chart-footer">
                <p className="chart-insight">Selecciona gráficos de las sugerencias para visualizarlos aquí</p>
              </div>
            </div>
            <div className="chart-card placeholder-card">
              <div className="chart-header placeholder-header">
                <h3>Gráfico de ejemplo 2</h3>
              </div>
              <div className="chart-body placeholder-body">
                <div className="placeholder-chart"></div>
              </div>
              <div className="chart-footer">
                <p className="chart-insight">Los gráficos se mostrarán en tiempo real</p>
              </div>
            </div>
            <div className="chart-card placeholder-card">
              <div className="chart-header placeholder-header">
                <h3>Gráfico de ejemplo 3</h3>
              </div>
              <div className="chart-body placeholder-body">
                <div className="placeholder-chart"></div>
              </div>
              <div className="chart-footer">
                <p className="chart-insight">Comienza cargando tu archivo de datos</p>
              </div>
            </div>
            <div className="chart-card placeholder-card">
              <div className="chart-header placeholder-header">
                <h3>Gráfico de ejemplo 4</h3>
              </div>
              <div className="chart-body placeholder-body">
                <div className="placeholder-chart"></div>
              </div>
              <div className="chart-footer">
                <p className="chart-insight">Obtén insights automáticos de tus datos</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
