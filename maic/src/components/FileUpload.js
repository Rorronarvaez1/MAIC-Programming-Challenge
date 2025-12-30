import React, { useState } from 'react';
import '../styles/FileUpload.css';

export const FileUpload = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['.xlsx', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (validTypes.includes(fileExtension)) {
      setSelectedFile(file);
    } else {
      alert('Por favor cargue un formato válido (.xlsx o .csv)');
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('sheet') || type.includes('excel')) {
      return '📊';
    } else if (type.includes('csv')) {
      return '📄';
    }
    return '📁';
  };

  return (
    <div className="file-upload-container">
      {!selectedFile ? (
        <div
          className={`upload-area ${dragActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>La IA está analizando sus datos...</p>
                <p className="spinner-text">Esto puede tomar algunos segundos</p>
              </div>
            ) : (
              <>
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>Cargue sus datos</h2>
                <p className="main-text">Arrastra y suelta tu archivo aquí o haz clic para explorar</p>
                <p className="sub-text">Formatos soportados: .xlsx, .csv</p>
                <input
                  type="file"
                  id="file-input"
                  onChange={handleChange}
                  accept=".xlsx,.csv"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="upload-button">
                  Seleccionar archivo
                </label>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="file-info-card">
          <div className="file-info-header">
            <h3>Información del Archivo</h3>
          </div>
          <div className="file-info-content">
            <div className="file-icon">
              {getFileIcon(selectedFile.type)}
            </div>
            <div className="file-details">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-meta">
                Tamaño: {formatFileSize(selectedFile.size)}
              </div>
              <div className="file-meta">
                Tipo: {selectedFile.type || 'Desconocido'}
              </div>
            </div>
          </div>
          <div className="file-actions">
            <button className="btn-analyze" onClick={handleStartAnalysis} disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Iniciar análisis'}
            </button>
            <button className="btn-clear" onClick={handleClearFile} disabled={isLoading}>
              Cambiar archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
