import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBuilding, FaEnvelope, FaLock, FaSignInAlt, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import '../../styles/Auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: 'swaran.nani022@gmail.com',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  
  // New state to control the success animation view
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Login Successful Logic
      if (data.token) localStorage.setItem('token', data.token);
      if (onLogin) onLogin({ ...data.user, isAdmin: false });

      // 1. Trigger the Success State (hides form, shows animation)
      setIsSuccess(true); 
      setLoading(false);

      // 2. Wait 2 seconds for animation to play, then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);

    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back button always visible unless success */}
        {!isSuccess && (
          <button onClick={() => navigate('/')} className="back-btn">
            <FaArrowLeft /> Back to Home
          </button>
        )}

        {/* CONDITION: If Success, show Animation. Else, show Form */}
        {isSuccess ? (
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <h2 className="success-title">Logged In Successfully!</h2>
            <p className="success-text">Redirecting to Dashboard...</p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <FaBuilding className="auth-logo" />
              <h1>Welcome Back</h1>
              <p>Sign in to continue building inspection</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter email : demo@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaLock /> Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Checking...
                  </>
                ) : (
                  <>
                    <FaSignInAlt /> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/signup">Sign up here</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;