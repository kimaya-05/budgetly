import React, { Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../components/LoadingScreen';
import './MainLayout.css';

const BudgetAnalytics = React.lazy(() => import('../screens/BudgetAnalytics'));

const MainLayout = ({ activeTab = 'home' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'transactions', label: 'Transactions', path: '/transactions' },
    { key: 'analytics', label: 'Analytics', path: '/analytics' },
    { key: 'categories', label: 'Categories', path: '/categories' },
    { key: 'profile', label: 'Profile', path: '/profile' },
  ];

  const renderContent = () => {
    const currentPath = location.pathname;
    
    switch (currentPath) {
      case '/':
        return <HomeScreen />;
      case '/transactions':
        return <TransactionsScreen />;
      case '/analytics':
        return (
          <Suspense fallback={<LoadingScreen />}>
            <BudgetAnalytics />
          </Suspense>
        );
      case '/categories':
        return <CategoriesScreen />;
      case '/profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="main-layout">
      <nav className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${location.pathname === tab.path ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default MainLayout;
