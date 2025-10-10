import React, { useEffect, useState } from 'react';
import styles from './staffhome.module.css';
import { useNavigate } from 'react-router-dom';

const StaffPortal = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true); // State for stats loading
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [complaintstats, setComplaintstats] = useState({
    total: 0,
    pending: 0,
    inprogress: 0,
    resolved: 0,
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setShowOverlay(!showOverlay);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          console.log('✅ User data fetched:', data.user);
          setUser(data.user);
        } else {
          console.log('❌ User not authenticated');
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
    if (!user) return;
    const fetchComplaintstats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/auth/staff/complaints', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setComplaintstats({
            total: data.total,
            pending: data.pending,
            inprogress: data.inprogress,
            resolved: data.resolved,
          });
          console.log('✅ Complaints data fetched:', data);
        }
      } catch (err) {
        console.error('Error fetching complaints:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchComplaintstats();
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isProfileDropdownOpen &&
        !event.target.closest(`.${styles.profileDropdown}`) &&
        !event.target.closest(`.${styles.profileSymbol}`)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        isSidebarOpen &&
        !event.target.closest(`.${styles.sidebar}`) &&
        !event.target.closest(`.${styles.menuIcon}`)
      ) {
        setIsSidebarOpen(false);
        setShowOverlay(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isProfileDropdownOpen, isSidebarOpen]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Error: User not found. Redirecting...</div>;
  }

  const Loader = () => (
    <div className={styles.statLoader}>
      <div className={styles.loadingSpinner}></div>
    </div>
  );

  return (
    <div className={styles.mainContainer}>
      {showOverlay && <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`} id="sidebar">
        <h2>CitiSolve Staff</h2>
        <a onClick={() => navigate('/staff/home')} className={`${styles.navLink} ${styles.active}`}>
          🏠 Home
        </a>
        <a onClick={() => navigate('/staff/departmentcomplaints')} className={styles.navLink}>
          📋 Department Complaints
        </a>
        <a onClick={() => navigate('/staff/search')} className={styles.navLink}>
          🔍 Advanced Search
        </a>
        <a onClick={() => navigate('/staff/faq')} className={styles.navLink}>
          ❓ FAQ
        </a>
        <a onClick={() => navigate('/staff/support')} className={styles.navLink}>
          💬 Support
        </a>
        <a onClick={() => navigate('/staff/userguide')} className={styles.navLink}>
          📖 User Guide
        </a>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.topnav}>
          <div className={styles.menuIcon} id="menuToggle" onClick={toggleSidebar}>
            ☰
          </div>
          <div className={styles.breadcrumb}>
            <span>Home</span>
          </div>
          <div className={styles.profileSymbol} id="profileSymbol" onClick={toggleProfileDropdown}>
            {user.fullname ? user.fullname[0].toUpperCase() : 'S'}
          </div>
          <div
            className={`${styles.profileDropdown} ${isProfileDropdownOpen ? styles.open : ''}`}
            id="profileDropdown"
          >
            <p>
              <strong>Name: </strong>
              <span id="userName">{user.fullname}</span>
            </p>
            <p>
              <strong>Email: </strong>
              <span id="userEmail">{user.email}</span>
            </p>
            <p>
              <strong>Department: </strong>
              <span id="userDept">{user.department}</span>
            </p>
            <p>
              <strong>Role: </strong>
              <span id="username">{user.role}</span>
            </p>
            <p style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <a href="#" style={{ color: '#4a90e2', textDecoration: 'none' }}>
                Settings
              </a>{' '}
              |{' '}
              <a
                onClick={handleLogout}
                style={{ color: '#4a90e2', textDecoration: 'none', cursor: 'pointer' }}
              >
                Logout
              </a>
            </p>
          </div>
        </div>
        <div className={styles.content} id="home-page">
          <div className={styles.welcomeSection}>
            <h1 id="welcomeText">Welcome {user.fullname ? user.fullname.split(' ')[0] : ''} 👋</h1>
            <p>Manage and resolve citizen complaints efficiently</p>
          </div>
          <div className={styles.mainGrid}>
            <div className={styles.leftPanel}>
              <div className={styles.quickLinks}>
                <a onClick={() => navigate('/staff/departmentcomplaints')} className={styles.card}>
                  📋 Department Complaints
                </a>
                <a onClick={() => navigate('/staff/search')} className={styles.card}>
                  🔍 Advanced Search
                </a>
                <a onClick={() => navigate('/staff/userguide')} className={styles.card}>
                  📖 User Guide
                </a>
              </div>
              <div className={styles.dashboardCards}>
                <button className={styles.stat}>
                  {statsLoading ? <Loader /> : <span className={styles.statNumber} id="totalCount">{complaintstats.total}</span>}
                  <span className={styles.statLabel}>Total Complaints</span>
                  <div className={styles.statHoverLine}></div>
                </button>
                <button className={styles.stat}>
                  {statsLoading ? <Loader /> : <span className={styles.statNumber} id="pendingCount">{complaintstats.pending}</span>}
                  <span className={styles.statLabel}>Pending</span>
                  <div className={styles.statHoverLine}></div>
                </button>
                <button className={styles.stat}>
                  {statsLoading ? <Loader /> : <span className={styles.statNumber} id="progressCount">{complaintstats.inprogress}</span>}
                  <span className={styles.statLabel}>In Progress</span>
                  <div className={styles.statHoverLine}></div>
                </button>
                <button className={styles.stat}>
                  {statsLoading ? <Loader /> : <span className={styles.statNumber} id="resolvedCount">{complaintstats.resolved}</span>}
                  <span className={styles.statLabel}>Resolved</span>
                  <div className={styles.statHoverLine}></div>
                </button>
              </div>
            </div>
            <div className={styles.rightPanel}>
              <div className={styles.infoCard}>
                <h3>📢 Recent Updates</h3>
                <p id="recentUpdates">No Recent updates</p>
              </div>
              <div className={styles.infoCard}>
                <h3>👤 Your Info</h3>
                <p>
                  <strong>id: </strong>
                  <span id="infoName">{user.id}</span>
                </p>
                <p>
                  <strong>Name: </strong>
                  <span id="infoName">{user.fullname}</span>
                </p>
                <p>
                  <strong>Department: </strong>
                  <span id="infoDept">{user.department}</span>
                </p>
                <p>
                  <strong>Email: </strong>
                  <span id="infoEmail">{user.email}</span>
                </p>
                <p>
                  <strong>Role: </strong>
                  <span id="infoEmail">{user.role}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <footer>
          Powered by CitiSolve Staff Portal |{' '}
          <a href="/supportstaff" style={{ color: 'white', textDecoration: 'none' }}>
            Contact Administrator
          </a>
        </footer>
      </div>
    </div>
  );
};

export default StaffPortal;