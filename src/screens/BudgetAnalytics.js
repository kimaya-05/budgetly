import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import './BudgetAnalytics.css';

const BudgetAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('6');
  
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState([]);

  const API_BASE_URL = 'http://localhost:5000/api';

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        spendingRes,
        incomeExpenseRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/analytics/spending-by-category?months=${timeRange}`),
        axios.get(`${API_BASE_URL}/analytics/income-vs-expenses?months=${timeRange}`)
      ]);

      if (spendingRes.data.success) setSpendingByCategory(spendingRes.data.data);
      if (incomeExpenseRes.data.success) setIncomeVsExpenses(incomeExpenseRes.data.data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading your financial insights...</p>
      </div>
    );
  }

  return (
    <div className="budget-analytics">
      <div className="analytics-header">
        <h1>Financial Analytics</h1>
        <p>Visualize your spending patterns and budget performance</p>
        
        <div className="analytics-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="3">Last 3 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'spending' ? 'active' : ''}`}
          onClick={() => setActiveTab('spending')}
        >
          💰 Spending Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          📈 Income vs Expenses
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="chart-card">
              <h3>Spending by Category</h3>
              <div className="pie-chart-container">
                {spendingByCategory.length > 0 ? (
                <div 
                    className="pie-chart-simple"
                    style={{
                    '--segment-colors': spendingByCategory.map((item, index) => {
                        const total = spendingByCategory.reduce((sum, i) => sum + i.amount, 0);
                        const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                        const start = spendingByCategory.slice(0, index).reduce((sum, i) => {
                        const prevPercentage = total > 0 ? (i.amount / total) * 100 : 0;
                        return sum + prevPercentage;
                        }, 0);
                        return `${colors[index % colors.length]} ${start}% ${start + percentage}%`;
                    }).join(', ')
                    }}
                >
                    <div className="pie-center">
                    <div className="total-amount">
                        { (spendingByCategory.reduce((sum, item) => sum + item.amount, 0))}
                    </div>
                    <div className="total-label">Total Spent</div>
                    </div>
                </div>
                ) : (
                <div className="no-data-message">
                    No spending data available
                </div>
                )}
              </div>
              <div className="chart-legend">
                  {spendingByCategory.map((item, index) => {
                  const total = spendingByCategory.reduce((sum, i) => sum + i.amount, 0);
                  const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                  
                  return (
                      <div key={item.category} className="legend-item">
                      <span 
                          className="legend-color" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                      ></span>
                      <span className="legend-label">{item.category}</span>
                      <span className="legend-percentage">({percentage.toFixed(1)}%)</span>
                      <span className="legend-value">{ (item.amount)}</span>
                      </div>
                  );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spending' && (
          <div className="spending-analysis">
            <h2>Detailed Spending Analysis</h2>
            <div className="spending-table">
              <div className="table-header">
                <span>Category</span>
                <span>Amount</span>
                <span>Percentage</span>
              </div>
              {spendingByCategory.map((item, index) => {
                const total = spendingByCategory.reduce((sum, i) => sum + i.amount, 0);
                const percentage = (item.amount / total) * 100;
                
                return (
                  <div key={item.category} className="table-row">
                    <span className="category-name">
                      <span 
                        className="color-indicator"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></span>
                      {item.category}
                    </span>
                    <span className="amount">{ (item.amount)}</span>
                    <span className="percentage">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
            <div className="trends-analysis">
                <h2>Income vs Expenses Trend</h2>
                
                {incomeVsExpenses.length > 0 ? (
                <div className="line-chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={incomeVsExpenses} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="month" 
                        tickFormatter={(month) => formatMonth(month)} 
                        angle={-45} 
                        textAnchor="end"
                        height={60}
                        />
                        <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                        <Legend verticalAlign="top" height={36}/>
                        <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#4ECDC4" 
                        strokeWidth={3} 
                        dot={{ r: 5 }} 
                        name="Income"
                        />
                        <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#FF6B6B" 
                        strokeWidth={3} 
                        dot={{ r: 5 }} 
                        name="Expenses"
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                ) : (
                <div className="no-data-message">No income or expenses data available</div>
                )}

                <div className="trends-table">
                <div className="table-header">
                    <span>Month</span>
                    <span>Income</span>
                    <span>Expenses</span>
                    <span>Net</span>
                </div>
                {incomeVsExpenses.map((item) => (
                    <div key={item.month} className="table-row">
                    <span>{formatMonth(item.month)}</span>
                    <span className="income-amount">{ (item.income)}</span>
                    <span className="expense-amount">{ (item.expenses)}</span>
                    <span className={`net-amount ${item.net >= 0 ? 'positive' : 'negative'}`}>
                        { (item.net)}
                    </span>
                    </div>
                ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default BudgetAnalytics;
