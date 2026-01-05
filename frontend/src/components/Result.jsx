import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaDownload, FaRedo, FaCheckCircle, 
  FaExclamationTriangle, FaTimesCircle,
  FaChartLine, FaTools, FaArrowLeft
} from 'react-icons/fa';
import { generateInspectionReport } from '../utils/pdfGenerator';
import '../styles/Result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { analysis, image, filename, inspectionId } = location.state || {};

  if (!analysis) {
    navigate('/dashboard');
    return null;
  }

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <FaTimesCircle />;
      case 'moderate': return <FaExclamationTriangle />;
      case 'good': return <FaCheckCircle />;
      default: return null;
    }
  };

  const renderHealthScore = (score) => {
    const color = score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545';
    const circumference = 2 * Math.PI * 70;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="health-score-circle">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle 
            cx="80" 
            cy="80" 
            r="70" 
            fill="none" 
            stroke="#e9ecef" 
            strokeWidth="10"
          />
          <circle 
            cx="80" 
            cy="80" 
            r="70" 
            fill="none" 
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="score-text">
          <div className="score-value">{score}</div>
          <div className="score-label">Health Score</div>
        </div>
      </div>
    );
  };

  const handleDownloadPDF = () => {
    try {
      // pass optional inspectionId so PDF can include it
      const fileName = generateInspectionReport(analysis, {
        inspectionId,
        filename
      });
      alert(`PDF report downloaded: ${fileName}`);
    } catch (error) {
      alert('Failed to generate PDF report');
      console.error('PDF generation error:', error);
    }
  };

  const handleNewInspection = () => {
    navigate('/dashboard');
  };

  return (
    <div className="result-page">
      <div className="container">
        <div className="result-header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Inspection Results</h1>
          <p>AI-powered analysis complete for {filename || 'uploaded image'}</p>
        </div>

        <div className="result-grid">
          {/* Left Column */}
          <div className="result-column">
            <div className="result-card">
              <h2><FaChartLine /> Analysis Summary</h2>
              
              <div className="severity-section">
                <h3>Severity Assessment</h3>
                <div className={`severity-badge severity-${analysis.severity.toLowerCase()}`}>
                  {getSeverityIcon(analysis.severity)}
                  <span>{analysis.severity}</span>
                </div>
                <p className="severity-description">
                  {analysis.severity === 'Good' 
                    ? 'No critical damages detected. Building is in good condition.'
                    : analysis.severity === 'Moderate'
                    ? 'Some damages detected. Regular monitoring recommended.'
                    : 'Critical damages detected. Immediate attention required.'}
                </p>
              </div>

              <div className="detected-damages">
                <h3>Detected Damages</h3>
                {Object.keys(analysis.detected_damages).length === 0 ? (
                  <div className="no-damages">
                    <FaCheckCircle />
                    <h4>No Damages Detected!</h4>
                    <p>The building structure appears to be in excellent condition.</p>
                  </div>
                ) : (
                  <div className="damages-list">
                    {Object.entries(analysis.detected_damages).map(([damage, count]) => (
                      <div key={damage} className="damage-item">
                        <div className="damage-info">
                          <span className="damage-name">
                            {damage.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="damage-count">{count} detected</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="result-column">
            <div className="result-card">
              <h2><FaTools /> Health Assessment</h2>
              
              <div className="health-score-section">
                {renderHealthScore(analysis.health_score)}
              </div>

              <div className="precautions-section">
                <h3>Recommended Actions</h3>
                <div className="precautions-list">
                  {analysis.precautions.map((precaution, index) => (
                    <div key={index} className="precaution-item">
                      <div className="precaution-number">{index + 1}</div>
                      <div className="precaution-text">{precaution}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button onClick={handleDownloadPDF} className="btn btn-primary">
            <FaDownload /> Download PDF Report
          </button>
          <button onClick={handleNewInspection} className="btn btn-secondary">
            <FaRedo /> New Inspection
          </button>
        </div>

        {/* Image Preview */}
        {image && (
          <div className="image-preview-section">
            <h3>Analyzed Image</h3>
            <div className="image-container">
              <img src={image} alt="Analyzed" className="result-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;