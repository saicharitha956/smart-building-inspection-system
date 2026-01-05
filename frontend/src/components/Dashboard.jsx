import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSpinner,
  FaRobot,
  FaHistory,
  FaBuilding,
  FaChartPie
} from 'react-icons/fa';
import UploadZone from './UploadZone';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const handleImageUpload = (file, previewUrl) => {
    setImage(file);
    setPreview(previewUrl);
  };

  // Fetch user's inspection history
  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/inspections', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = data.inspections || [];
        setInspections(list);

        if (list.length > 0) {
          const total = list.length;
          const avgScore =
            list.reduce(
              (sum, insp) => sum + (insp.health_score || 0),
              0
            ) / total;

          const severityCount = {
            Good: list.filter(i => i.severity === 'Good').length,
            Moderate: list.filter(i => i.severity === 'Moderate').length,
            Critical: list.filter(i => i.severity === 'Critical').length
          };

          setStats({
            totalInspections: total,
            averageScore: Math.round(avgScore),
            severityCount
          });
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      console.log('Could not fetch inspection history:', error.message);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleAnalyze = async () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const token = localStorage.getItem('token');
      let response;

      // Try authenticated API first if token exists
      if (token) {
        try {
          response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();

            // Refresh inspections after new analysis
            await fetchInspections();

            // Navigate to result page
            navigate('/result', {
              state: {
                analysis: data,
                image: preview,
                filename: image.name,
                inspectionId: data.inspection_id
              }
            });

            setImage(null);
            setPreview(null);
            setLoading(false);
            return;
          }
        } catch (authError) {
          console.log('Auth API failed, trying legacy:', authError.message);
        }
      }

      // Fallback to legacy API (no auth)
      response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/result', {
          state: {
            analysis: data,
            image: preview,
            filename: image.name
          }
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);

      // Fallback to mock data if backend fails
      const mockResponse = {
        detected_damages: {
          minor_crack: 2,
          spalling: 1,
          stain: 3
        },
        severity: 'Moderate',
        health_score: 72,
        precautions: [
          'Monitor cracks regularly',
          'Clean affected areas',
          'Schedule professional inspection'
        ],
        inspection_id: `demo_${Date.now()}`
      };

      alert('Using demo data (Backend not connected)');

      navigate('/result', {
        state: {
          analysis: mockResponse,
          image: preview,
          filename: image.name,
          inspectionId: mockResponse.inspection_id
        }
      });
    } finally {
      setLoading(false);
      setImage(null);
      setPreview(null);
    }
  };

  const handleDeleteInspection = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:5000/api/inspections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Delete failed:', data.error || 'Unknown error');
        return;
      }

      // Remove from local state so UI updates
      const remaining = inspections.filter(insp => (insp._id || insp.id) !== id);
      setInspections(remaining);

      // Recompute stats
      if (remaining.length > 0) {
        const total = remaining.length;
        const avgScore =
          remaining.reduce(
            (sum, insp) => sum + (insp.health_score || 0),
            0
          ) / total;

        const severityCount = {
          Good: remaining.filter(i => i.severity === 'Good').length,
          Moderate: remaining.filter(i => i.severity === 'Moderate').length,
          Critical: remaining.filter(i => i.severity === 'Critical').length
        };

        setStats({
          totalInspections: total,
          averageScore: Math.round(avgScore),
          severityCount
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Delete inspection error:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDamageType = (damages) => {
    if (!damages || Object.keys(damages).length === 0) {
      return 'No Damage';
    }

    const damageTypes = Object.keys(damages);
    if (damageTypes.includes('major_crack') || damageTypes.includes('spalling')) {
      return 'Critical Damage';
    } else if (damageTypes.includes('minor_crack') || damageTypes.includes('peeling')) {
      return 'Surface Damage';
    } else {
      return 'Minor Damage';
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Building Inspection Dashboard</h1>
          <p>Upload building images for AI-powered damage analysis</p>
        </div>

        <div className="dashboard-grid">
          {/* Upload Section */}
          <div className="dashboard-card main-card">
            <h2>
              <FaRobot /> AI Building Inspector
            </h2>
            <p className="card-description">
              Upload a clear image of building surface. Our AI will detect:
              Cracks, Spalling, Peeling, Algae, Stains, and more.
            </p>

            <UploadZone onImageUpload={handleImageUpload} />

            {preview && (
              <div className="preview-section">
                <h3>Image Preview:</h3>
                <img src={preview} alt="Preview" className="image-preview" />
              </div>
            )}

            <button
              onClick={handleAnalyze}
              className="btn btn-primary analyze-btn"
              disabled={!image || loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <FaRobot /> Analyze Building
                </>
              )}
            </button>

            <div className="upload-tips">
              <h4>📸 Tips for Best Results:</h4>
              <ul>
                <li>Use good natural lighting</li>
                <li>Capture clear, focused images</li>
                <li>Include entire damaged area</li>
                <li>Avoid shadows and reflections</li>
              </ul>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="sidebar">
            {/* Statistics Card */}
            {stats && (
              <div className="dashboard-card">
                <h3>
                  <FaChartPie /> Your Statistics
                </h3>
                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-value">{stats.totalInspections}</div>
                    <div className="stat-label">Total Inspections</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{stats.averageScore}</div>
                    <div className="stat-label">Avg Health Score</div>
                  </div>
                </div>
                <div className="severity-stats">
                  <div className="severity-stat">
                    <span className="severity-dot good"></span>
                    <span>Good: {stats.severityCount.Good || 0}</span>
                  </div>
                  <div className="severity-stat">
                    <span className="severity-dot moderate"></span>
                    <span>Moderate: {stats.severityCount.Moderate || 0}</span>
                  </div>
                  <div className="severity-stat">
                    <span className="severity-dot critical"></span>
                    <span>Critical: {stats.severityCount.Critical || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Inspection History */}
            <div className="dashboard-card">
              <h3>
                <FaHistory /> Inspection History
              </h3>
              {inspections.length > 0 ? (
                <div className="recent-list">
                  {inspections.slice(0, 5).map((inspection) => {
                    const id = inspection._id || inspection.id;

                    return (
                      <div
                        key={id}
                        className="recent-item"
                      >
                        <div
                          className="recent-main"
                          onClick={() =>
                            navigate('/result', {
                              state: {
                                analysis: {
                                  detected_damages: inspection.detected_damages,
                                  severity: inspection.severity,
                                  health_score: inspection.health_score,
                                  precautions: inspection.precautions
                                },
                                inspectionId: id
                              }
                            })
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="recent-type">
                            <FaBuilding />
                            <div>
                              <span className="damage-type-name">
                                {getDamageType(inspection.detected_damages)}
                              </span>
                              <span className="inspection-date">
                                {formatDate(inspection.created_at)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`recent-severity severity-${(
                              inspection.severity || 'Moderate'
                            ).toLowerCase()}`}
                          >
                            {inspection.severity || 'Moderate'}
                          </div>
                          <div className="recent-score">
                            {inspection.health_score || 75}
                          </div>
                        </div>

                        <button
                          className="history-delete-btn"
                          type="button"
                          onClick={() => handleDeleteInspection(id)}
                          title="Delete this inspection"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-history">
                  <p>No inspections yet. Upload your first image!</p>
                </div>
              )}
            </div>

            {/* Damage Types Info */}
            <div className="dashboard-card">
              <h3>Damage Types Detected</h3>
              <div className="damage-types">
                <div className="damage-type">
                  <span className="damage-badge critical">Major Crack</span>
                  <span className="damage-desc">Structural damage</span>
                </div>
                <div className="damage-type">
                  <span className="damage-badge moderate">Minor Crack</span>
                  <span className="damage-desc">Surface-level</span>
                </div>
                <div className="damage-type">
                  <span className="damage-badge critical">Spalling</span>
                  <span className="damage-desc">Concrete damage</span>
                </div>
                <div className="damage-type">
                  <span className="damage-badge moderate">Peeling</span>
                  <span className="damage-desc">Paint damage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;