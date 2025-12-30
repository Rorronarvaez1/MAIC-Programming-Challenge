import React, { useState } from 'react';
import '../styles/FileUpload.css';

export const FileUpload = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

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
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  const addFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validTypes = ['.xlsx', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (validTypes.includes(fileExtension)) {
        setSelectedFiles((prev) => [...prev, file]);
      } else {
        alert('Por favor cargue un formato válido (.xlsx o .csv)');
      }
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else if (type.includes('csv')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  };

  return (
    <div className="file-upload-container">
      {selectedFiles.length === 0 ? (
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
                <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                  <path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H520q-33 0-56.5-23.5T440-240v-206l-64 62-56-56 160-160 160 160-56 56-64-62v206h220q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h100v80H260Zm220-280Z"/>
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
                  multiple
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
            <label htmlFor="file-input-add" className="btn-add-file-header">
              ＋
            </label>
            <input
              type="file"
              id="file-input-add"
              onChange={handleChange}
              accept=".xlsx,.csv"
              style={{ display: 'none' }}
              multiple
            />
          </div>
          
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-item-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="file-item-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    Tamaño: {formatFileSize(file.size)}
                  </div>

                </div>
                <button
                  className="btn-remove"
                  onClick={() => removeFile(index)}
                  disabled={isLoading}
                  title="Eliminar archivo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="file-actions">
            <button className="btn-analyze" onClick={handleStartAnalysis} disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Iniciar análisis'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
