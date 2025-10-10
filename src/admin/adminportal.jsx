import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import DashboardPage from './adminhome';
import UsersPage from './adminusers';
import ComplaintsPage from './admincomplaints';
import DepartmentsPage from './admindepartments';
import StaffPage from './adminstaff';
import styles from './adminlayout.module.css';
import { useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth <= 768);
  const [user, setUser] = useState({ name: "Admin User", role: "Super Admin" });
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('Dashboard');

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    let title = 'Dashboard';
    if (path === '/admin/complaints') {
      title = 'Complaints';
    } else if (path === '/admin/users') {
      title = 'Users';
    } else if (path === '/admin/departments') {
      title = 'Departments';
    } else if (path === '/admin/staff') {
      title = 'Staff Management';
    } else if (path === '/admin/home' || path === '/admin/') {
      title = 'Dashboard';
    }
    setPageTitle(title);
  }, [location.pathname]);

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
          <NavLink to="/admin/home" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={() => window.innerWidth <= 768 && setIsSidebarCollapsed(false)}>
            <span className={styles.navIcon}>📊</span><span className={styles.navText}>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/complaints" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={() => window.innerWidth <= 768 && setIsSidebarCollapsed(false)}>
            <span className={styles.navIcon}>📋</span><span className={styles.navText}>Complaints</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={() => window.innerWidth <= 768 && setIsSidebarCollapsed(false)}>
            <span className={styles.navIcon}>👥</span><span className={styles.navText}>Users</span>
          </NavLink>
          <NavLink to="/admin/departments" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={() => window.innerWidth <= 768 && setIsSidebarCollapsed(false)}>
            <span className={styles.navIcon}>🏢</span><span className={styles.navText}>Departments</span>
          </NavLink>
          <NavLink to="/admin/staff" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={() => window.innerWidth <= 768 && setIsSidebarCollapsed(false)}>
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
      {isSidebarCollapsed && window.innerWidth <= 768 && <div className={styles.overlay} onClick={() => setIsSidebarCollapsed(true)} />}
      {/* === Main Content Area === */}
      <div className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
        {/* === Navbar === */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
             <button className={styles.menuToggle} onClick={handleMenuToggle}>
              ☰
            </button>
          </div>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
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
          <Route path="/departments" element={<DepartmentsPage />}/>
          <Route path="/staff" element={<StaffPage />}/>
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;