import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TransactionsScreen.css';
import { useNavigate } from 'react-router-dom';

const TransactionsScreen = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  const filterTransactions = useCallback(() => {
    if (filterType === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === filterType));
    }
  }, [transactions, filterType]);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    } else if (new Date(formData.date) > new Date()) {
      errors.date = 'Date cannot be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/transactions`);
      setTransactions(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      console.log('=== FRONTEND DEBUG ===');
      console.log('Submitting transaction data:', transactionData);
      console.log('All categories:', categories);
      console.log('Matching categories for type:', categories.filter(cat => cat.type === formData.type));

      if (editingTransaction) {
        const response = await axios.put(
          `${API_BASE_URL}/transactions/${editingTransaction._id}`,
          transactionData
        );
        setTransactions(prev => prev.map(t => 
          t._id === editingTransaction._id ? response.data : t
        ));
      } else {
        console.log('Making POST request to:', `${API_BASE_URL}/transactions`);
        const response = await axios.post(
          `${API_BASE_URL}/transactions`, 
          transactionData
        );
        console.log('Response:', response.data);
        setTransactions(prev => [...prev, response.data]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || 'Failed to save transaction';
      setError(errorMessage);
      
      if (errorMessage.includes('Category') || errorMessage.includes('category')) {
        setFormErrors({ ...formErrors, category: errorMessage });
      }
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.split('T')[0]
    });
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`${API_BASE_URL}/transactions/${id}`);
        setTransactions(prev => prev.filter(t => t._id !== id));
        setError('');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Failed to delete transaction');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: getTodayDate()
    });
    setEditingTransaction(null);
    setError('');
    setFormErrors({});
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData({ ...formData, amount: value });
      if (formErrors.amount) {
        setFormErrors({ ...formErrors, amount: '' });
      }
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(category => category.type === formData.type);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Transaction
        </button>
      </div>

      {error && !showForm && <div className="error-message">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Income</h3>
          <div className="amount positive">{totalIncome.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <div className="amount negative">{totalExpenses.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <h3>Net Balance</h3>
          <div className={`amount ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
            {(totalIncome - totalExpenses).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${filterType === 'income' ? 'active' : ''}`}
          onClick={() => setFilterType('income')}
        >
          Income
        </button>
        <button 
          className={`filter-tab ${filterType === 'expense' ? 'active' : ''}`}
          onClick={() => setFilterType('expense')}
        >
          Expenses
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        type: e.target.value,
                        category: '' 
                      });
                    }}
                    className="form-input"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className={`form-input ${formErrors.amount ? 'error' : ''}`}
                    placeholder="0.00"
                    required
                  />
                  {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({...formData, category: e.target.value});
                    if (formErrors.category) {
                      setFormErrors({ ...formErrors, category: '' });
                    }
                  }}
                  className={`form-input ${formErrors.category ? 'error' : ''}`}
                  required
                >
                  <option value="">Select a category</option>
                  {getFilteredCategories().map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category && <span className="field-error">{formErrors.category}</span>}
                
                {getFilteredCategories().length === 0 && (
                  <div className="no-categories-message">
                    <p>No {formData.type} categories found.</p>
                    <button 
                      type="button" 
                      className="btn-link"
                      onClick={() => {
                        setShowForm(false);
                        navigate('/categories');
                      }}
                    >
                      Create {formData.type} categories first
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({...formData, description: e.target.value});
                    if (formErrors.description) {
                      setFormErrors({ ...formErrors, description: '' });
                    }
                  }}
                  className={`form-input ${formErrors.description ? 'error' : ''}`}
                  required
                />
                {formErrors.description && <span className="field-error">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  max={getTodayDate()} 
                  onChange={(e) => {
                    setFormData({...formData, date: e.target.value});
                    if (formErrors.date) {
                      setFormErrors({ ...formErrors, date: '' });
                    }
                  }}
                  className={`form-input ${formErrors.date ? 'error' : ''}`}
                  required
                />
                {formErrors.date && <span className="field-error">{formErrors.date}</span>}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outlined" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={getFilteredCategories().length === 0}
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => (
                <tr key={transaction._id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.category}</td>
                  <td>
                    <span className={`type-badge ${transaction.type}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(transaction._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionsScreen;