import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './adminhome';
import UsersPage from './adminusers';
import ComplaintsPage from './admincomplaints';
import styles from './adminlayout.module.css';
import { useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: "Admin User", role: "Super Admin" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ User data fetched:", data.user);
          setUser(data.user);
        } else {
          console.log("❌ User not authenticated");
          navigate('/');
        }
      } catch (err) {
        console.error('❌ Error fetching user:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleMenuToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        console.log('✅ Logged out successfully');
        navigate('/');
      }
    } catch (err) {
      console.error('❌ Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a0a',
        color: '#888'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* === Sidebar === */}
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>CitiSolve</h2>
          <p className={styles.adminBadge}>ADMIN PORTAL</p>
        </div>
        <nav className={styles.sidebarNav}>
          <NavLink to="/admin/home" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>📊</span><span className={styles.navText}>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/complaints" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>📋</span><span className={styles.navText}>Complaints</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>👥</span><span className={styles.navText}>Users</span>
          </NavLink>
          <NavLink to="/admin/departments" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>🏢</span><span className={styles.navText}>Departments</span>
          </NavLink>
          <NavLink to="/admin/staff" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>👔</span><span className={styles.navText}>Staff Management</span>
          </NavLink>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p className={styles.adminName}>{user?.fullname || 'Admin User'}</p>
              <p className={styles.adminRole}>{user?.email || 'admin@citisolve.com'}</p>
              <p className={styles.adminRole}>id : {user?.id || 'none'}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* === Main Content Area === */}
      <div className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
        {/* === Navbar === */}
        <div className={styles.topbar}>
          <button className={styles.menuToggle} onClick={handleMenuToggle}>
            ☰
          </button>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <div className={styles.topbarRight}>
            <button className={styles.notificationBtn}>
              🔔<span className={styles.notificationBadge}>5</span>
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/complaints" element={<ComplaintsPage />}/>
          <Route path="/users" element={<UsersPage />}/>
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;