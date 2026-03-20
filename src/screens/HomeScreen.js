import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './HomeScreen.css';

const HomeScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const transactionsRes = await axios.get(`${API_BASE_URL}/transactions`);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your finances...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1 className="welcome-message">Welcome, {user?.name}!</h1>
      
      <div className="summary-cards">
        <div className="summary-card balance-card">
          <h3>Balance</h3>
          <div className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
            {balance.toFixed(2)}
          </div>
        </div>
        
        <div className="summary-card income-card">
          <h3>Income</h3>
          <div className="amount positive">{totalIncome.toFixed(2)}</div>
        </div>
        
        <div className="summary-card expense-card">
          <h3>Expenses</h3>
          <div className="amount negative">{totalExpenses.toFixed(2)}</div>
        </div>
      </div>

      <div className="quick-actions">
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/transactions')}
        >
          + Add Transaction
        </button>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <button 
            className="btn-text"
            onClick={() => navigate('/transactions')}
          >
            View All →
          </button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{transaction.description}</td>
                    <td className={`amount ${transaction.type === 'income' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/transactions')}
            >
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
