import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaArrowLeft
} from 'react-icons/fa';
import '../../styles/Auth.css';

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Signup failed. Please try again.');
        return;
      }

      // Save token (for authenticated requests later)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Notify parent (optional)
      if (onSignup) {
        onSignup(data.user);
      }

      // Show success animation then go to dashboard
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMsg('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={() => navigate('/')} className="back-btn">
          <FaArrowLeft /> Back to Home
        </button>

        <div className="auth-header">
          <FaBuilding className="auth-logo" />
          <h1>Create Account</h1>
          <p>Start your building inspection journey</p>
        </div>

        {/* Success animation banner */}
        {success && (
          <div className="auth-success">
            <div className="success-icon" />
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        {/* Inline error (no alert) */}
        {errorMsg && !success && (
          <div className="auth-error">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <FaUser /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your full name"
              required
            />
          </div>

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
              placeholder="Enter your email"
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
              placeholder="Create a password (min 6 chars)"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaLock /> Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
              placeholder="Confirm your password"
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
                Creating Account...
              </>
            ) : (
              <>
                <FaUserPlus /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;