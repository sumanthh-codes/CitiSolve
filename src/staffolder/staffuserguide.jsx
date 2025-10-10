import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './staffuserguidestyle.module.css';

const UserGuideStaff = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  const sidebarRef = useRef(null);
  const menuIconRef = useRef(null);
  const mainRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
          setUser(data.user);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isProfileDropdownOpen && !event.target.closest(`.${styles.profileDropdown}`) && !event.target.closest(`.${styles.profileSymbol}`)) {
        setIsProfileDropdownOpen(false);
      }

      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target) && menuIconRef.current && !menuIconRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
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

  return (
    <div className={styles.mainContainer}>
      {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>}

      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`} ref={sidebarRef}>
        <h2>CitiSolve Staff</h2>
        <a onClick={() => navigate("/staff/home")} className={styles.navLink}>
          🏠 Home
        </a>
        <a onClick={() => navigate("/staff/departmentcomplaints")} className={styles.navLink}>
          📋 Department Complaints
        </a>
        <a onClick={() => navigate("/staff/search")} className={styles.navLink}>
          🔍 Advanced Search
        </a>
        <a onClick={() => navigate("/staff/faq")} className={styles.navLink}>
          ❓ FAQ
        </a>
        <a onClick={() => navigate("/staff/support")} className={styles.navLink}>
          💬 Support
        </a>
        <a className={`${styles.navLink} ${styles.active}`}>
          📖 User Guide
        </a>
      </div>

      <div className={`${styles.main} ${isSidebarOpen ? styles.shifted : ''}`} ref={mainRef}>
        <div className={styles.topnav}>
          <div className={styles.menuIcon} onClick={toggleSidebar} ref={menuIconRef}>
            ☰
          </div>
          <div className={styles.breadcrumb}>
            <span>User Guide</span>
          </div>
          <div className={styles.profileSymbol} onClick={toggleProfileDropdown}>
            {user.fullname ? user.fullname[0].toUpperCase() : 'S'}
          </div>
          <div className={`${styles.profileDropdown} ${isProfileDropdownOpen ? styles.open : ''}`}>
            <p>
              <strong>Staff Member</strong>
            </p>
            <p>Name: {user.fullname}</p>
            <p>Email: {user.email}</p>
            <p>Department: {user.department}</p>
            <p style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <a href="#" style={{ color: '#4a90e2', textDecoration: 'none' }}>
                Settings
              </a>{' '}
              |{' '}
              <a onClick={handleLogout} style={{ color: '#4a90e2', textDecoration: 'none', cursor: 'pointer' }}>
                Logout
              </a>
            </p>
          </div>
        </div>

        <div className={styles.content} id="userguide-page">
          <div className={styles.welcomeSection}>
            <h1>📖 Staff User Guide</h1>
            <p>A comprehensive guide to help you navigate and use the CitiSolve Staff Portal.</p>
          </div>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            <div className={styles.infoCard}>
              <h3>🏠 Getting Started</h3>
              <p>Welcome to the **CitiSolve Staff Portal**. This system is designed to help you efficiently manage and resolve citizen complaints submitted to your department. The main dashboard gives you a quick overview of your assigned tasks and important metrics.</p>
            </div>
            
            <div className={styles.infoCard}>
              <h3>📋 Department Complaints</h3>
              <p>
                The **"Department Complaints"** page is your primary workspace. Here you will see a list of all complaints that have been assigned to your specific department.
                You can use the **filters** at the top of the page to sort complaints by **Priority** (High, Medium, Low) and **Status** (Pending, In Progress, Resolved).
                Clicking on any individual complaint item will take you to a detailed view where you can read the full description and update its status.
              </p>
            </div>
            
            <div className={styles.infoCard}>
              <h3>📊 Status Overview</h3>
              <p>
                The **"Status Overview"** page provides a broader perspective on all complaints within the entire system, not just those assigned to you. This is a read-only page designed for monitoring.
                You can filter complaints here by **Status** and **Sort By** date (Newest or Oldest first) to see the overall complaint resolution trends across the city.
              </p>
            </div>

            <div className={styles.infoCard}>
              <h3>🔍 Advanced Search</h3>
              <p>
                The **"Advanced Search"** page is a powerful tool for finding specific complaints based on multiple criteria. This is useful when you need to find a complaint but do not have its ID.
                Here you can search for complaints by **Keyword**, **Department**, **Submission Date Range**, and **Status**. This helps you quickly locate a specific complaint or a group of complaints related to a particular topic.
              </p>
            </div>
            
            <div className={styles.infoCard}>
              <h3>💬 Support & FAQ</h3>
              <p>
                If you encounter any issues or have questions, the **"Support"** and **"FAQ"** pages are your first stop. The FAQ page contains answers to common questions about using the portal, while the Support page provides contact information for the system administrator and a form to submit a direct message for assistance.
              </p>
            </div>

            <div className={styles.infoCard}>
              <h3>🎯 Priority Guidelines</h3>
              <p>
                To ensure timely resolution of complaints, please adhere to the following priority guidelines:
                <br />
                <strong>High Priority:</strong> Requires attention and resolution within 24-48 hours.
                <br />
                <strong>Medium Priority:</strong> Should be addressed within 3-5 business days.
                <br />
                <strong>Low Priority:</strong> Can be addressed within 1-2 weeks.
              </p>
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

export default UserGuideStaff;