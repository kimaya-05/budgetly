import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';  
import LandingScreen from './screens/LandingScreen';           
import LoginScreen from './screens/LoginScreen';                
import RegisterScreen from './screens/RegisterScreen';         
import MainLayout from './navigation/MainLayout';               
import LoadingScreen from './components/LoadingScreen';    
import './App.css';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/landing" />;
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return !user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/landing" element={<PublicRoute><LandingScreen /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout activeTab="home" /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><MainLayout activeTab="transactions" /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><MainLayout activeTab="budgets" /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><MainLayout activeTab="analytics" /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><MainLayout activeTab="categories" /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout activeTab="profile" /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}