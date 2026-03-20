import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoriesScreen.css';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense'
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const hasAssociatedTransactions = (categoryName, categoryType) => {
    return transactions.some(transaction => 
      transaction.category === categoryName && transaction.type === categoryType
    );
  };

  const getTransactionCount = (categoryName, categoryType) => {
    return transactions.filter(transaction => 
      transaction.category === categoryName && transaction.type === categoryType
    ).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCategory) {
        const response = await axios.put(
          `${API_BASE_URL}/categories/${editingCategory._id}`,
          formData
        );
        setCategories(prev => prev.map(c => 
          c._id === editingCategory._id ? response.data : c
        ));
      } else {
        const response = await axios.post(`${API_BASE_URL}/categories`, formData);
        setCategories(prev => [...prev, response.data]);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    if (hasAssociatedTransactions(category.name, category.type)) {
      const transactionCount = getTransactionCount(category.name, category.type);
      setError(`Cannot delete "${category.name}" category. It has ${transactionCount} associated transaction${transactionCount > 1 ? 's' : ''}. Please delete or reassign the transactions first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/categories/${category._id}`);
        setCategories(prev => prev.filter(c => c._id !== category._id));
        setError('');
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense'
    });
    setEditingCategory(null);
    setError('');
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1>Categories</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className={`message ${error.includes('Cannot delete') ? 'message-warning' : 'error-message'}`}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
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
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="form-input"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outlined" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-lists">
        <div className="category-section">
          <h2>Income Categories</h2>
          {incomeCategories.length === 0 ? (
            <p className="no-categories">No income categories</p>
          ) : (
            <div className="categories-grid">
              {incomeCategories.map(category => {
                const hasTransactions = hasAssociatedTransactions(category.name, category.type);
                const transactionCount = getTransactionCount(category.name, category.type);
                
                return (
                  <div key={category._id} className={`category-card income ${hasTransactions ? 'has-transactions' : ''}`}>
                    <div className="category-info">
                      <span className="category-name">{category.name}</span>
                      {hasTransactions && (
                        <span className="transaction-count">
                          {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="category-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>
                      <button 
                        className={`btn-delete ${hasTransactions ? 'disabled' : ''}`}
                        onClick={() => !hasTransactions && handleDelete(category)}
                        disabled={hasTransactions}
                        title={hasTransactions ? `Cannot delete - has ${transactionCount} transaction${transactionCount > 1 ? 's' : ''}` : 'Delete category'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="category-section">
          <h2>Expense Categories</h2>
          {expenseCategories.length === 0 ? (
            <p className="no-categories">No expense categories</p>
          ) : (
            <div className="categories-grid">
              {expenseCategories.map(category => {
                const hasTransactions = hasAssociatedTransactions(category.name, category.type);
                const transactionCount = getTransactionCount(category.name, category.type);
                
                return (
                  <div key={category._id} className={`category-card expense ${hasTransactions ? 'has-transactions' : ''}`}>
                    <div className="category-info">
                      <span className="category-name">{category.name}</span>
                      {hasTransactions && (
                        <span className="transaction-count">
                          {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="category-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>
                      <button 
                        className={`btn-delete ${hasTransactions ? 'disabled' : ''}`}
                        onClick={() => !hasTransactions && handleDelete(category)}
                        disabled={hasTransactions}
                        title={hasTransactions ? `Cannot delete - has ${transactionCount} transaction${transactionCount > 1 ? 's' : ''}` : 'Delete category'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;