import React, { useState } from 'react';
import { FaUpload } from 'react-icons/fa';

const UploadZone = ({ onImageUpload }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(file, reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput').click()}
    >
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="upload-content">
        <FaUpload className="upload-icon" />
        <h3>Drag & Drop or Click to Upload</h3>
        <p>Supports JPG, PNG, WebP (Max 10MB)</p>
        <button className="btn btn-secondary" style={{ marginTop: '15px' }}>
          Choose Image
        </button>
      </div>
    </div>
  );
};

export default UploadZone;