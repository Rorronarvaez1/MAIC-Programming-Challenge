import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import axios from 'axios';
import '../styles/Dashboard.css';
import API_URL from '../config';

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
  }, [selectedCharts, chartDataMap]);

  const fetchChartData = async (chart, index) => {
    setLoadingCharts(prev => new Set([...prev, index]));
    try {
      const response = await axios.post(`${API_URL}/api/chart-data`, {
        parameters: {
          x_axis: chart.parameters.x_axis,
          y_axis: chart.parameters.y_axis,
          aggregation: chart.parameters.aggregation || 'sum'
        }
      });
      setChartDataMap(prev => ({
        ...prev,
        [index]: response.data
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartDataMap(prev => ({
        ...prev,
        [index]: null
      }));
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

    const xKey = chart.parameters.x_axis;
    const yKey = chart.parameters.y_axis;

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chart.chart_type.toLowerCase()) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
              <Bar 
                dataKey={yKey} 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af' }}
              >
                {data.map((entry, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                type="number"
                name={xKey}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey={yKey}
                type="number"
                name={yKey}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
              <Scatter 
                name="Datos" 
                data={data} 
                fill="#3b82f6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="chart-error">Tipo de gráfico no soportado: {chart.chart_type}</div>;
    }
  };

  if (selectedCharts.length === 0) {
    return (
      <div className="empty-dashboard">
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2>Gráficos Seleccionados</h2>
      <div className="charts-grid">
        {selectedCharts.map((chart, index) => (
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
          </div>
        ))}
      </div>
    </div>
  );
};