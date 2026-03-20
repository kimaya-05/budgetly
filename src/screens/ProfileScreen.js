import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="user-info">
            <div className="info-item">
              <label>Name</label>
              <div className="info-value">{user?.name || 'Not set'}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{user?.email || 'Not set'}</div>
            </div>
            <div className="info-item">
              <label>Member Since</label>
              <div className="info-value">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Session</h2>
          <div className="logout-section">
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
            <p className="logout-note">
              Sign out of your account. You can sign back in anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;