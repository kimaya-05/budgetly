import React from 'react';
import { Link } from 'react-router-dom';
import './LandingScreen.css';

const LandingScreen = () => {
  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1 className="landing-title">Budgetly</h1>
        <p className="landing-subtitle">Take control of your finances</p>
      </div>
      
      <div className="landing-hero">
        <div className="hero-image">
          <div className="placeholder-image">💰</div>
        </div>
        
        <div className="hero-content">
          <h2>Manage Your Money with Ease</h2>
          <p>Track expenses, set budgets, and achieve your financial goals with our intuitive budgeting app.</p>
          
          <div className="feature-grid">
            <div className="feature">
              <h3>📊 Expense Tracking</h3>
              <p>Monitor your income and expenses in real-time</p>
            </div>
            <div className="feature">
              <h3>📈 Financial Insights</h3>
              <p>Get valuable insights into your spending habits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-actions">
        <Link to="/login" className="btn btn-primary">
          Get Started - Login
        </Link>
        <Link to="/register" className="btn btn-outlined">
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default LandingScreen;