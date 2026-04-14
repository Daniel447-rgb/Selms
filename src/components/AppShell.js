import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBook, FiCheckSquare, FiBarChart2,
  FiMessageSquare, FiUser, FiLogOut, FiMenu, FiX,
  FiPlusSquare, FiStar
} from 'react-icons/fi';
import './AppShell.css';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/courses', icon: FiBook, label: 'Courses' },
  { path: '/quizzes', icon: FiCheckSquare, label: 'Quizzes' },
  { path: '/progress', icon: FiBarChart2, label: 'Progress' },
  { path: '/messages', icon: FiMessageSquare, label: 'Messages' },
  { path: '/profile', icon: FiUser, label: 'Profile' },
];

export default function AppShell() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isInstructor = userProfile?.role === 'instructor';

  const allNav = isInstructor
    ? [...navItems, { path: '/manage-course', icon: FiPlusSquare, label: 'Manage Courses' }]
    : navItems;

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FiStar className="logo-icon" />
            <span>SELMS</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar-sm">{initials}</div>
          <div className="user-info-sm">
            <p className="user-name-sm">{currentUser?.displayName || 'User'}</p>
            <span className={`badge ${isInstructor ? 'badge-warning' : 'badge-primary'}`}>
              {userProfile?.role || 'student'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {allNav.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="main-content">
        {/* Top Bar (mobile) */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <div className="logo logo-small">
            <FiStar className="logo-icon" />
            <span>SELMS</span>
          </div>
          <div className="user-avatar-xs" onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="mobile-nav">
          {allNav.slice(0, 5).map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
