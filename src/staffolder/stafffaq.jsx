import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './stafffaqstyle.module.css';

const faqData = [
  {
    question: 'How do I update complaint status?',
    answer: 'Navigate to Department Complaints, click on any complaint to view details, then use the status dropdown at the bottom to update the status. Click "Update Status" to save changes.'
  },
  {
    question: 'How are complaints prioritized?',
    answer: 'Complaints are automatically sorted by priority: High (urgent), Medium (standard), and Low (non-urgent). Focus on high-priority complaints first.'
  },
  {
    question: 'What is the expected resolution time?',
    answer: 'High priority: 24-48 hours, medium priority: 3-5 business days, low priority: 7-14 business days. These are targets and may vary.'
  },
  {
    question: 'Can I reassign complaints?',
    answer: 'Reassignment requires admin approval. Contact the administrator via the Support page if a complaint is incorrectly assigned.'
  },
];

const FaqStaff = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();
  
  const sidebarRef = useRef(null);
  const menuIconRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
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
        <a className={`${styles.navLink} ${styles.active}`}>
          ❓ FAQ
        </a>
        <a onClick={() => navigate("/staff/support")} className={styles.navLink}>
          💬 Support
        </a>
        <a onClick={() => navigate("/staff/userguide")} className={styles.navLink}>
          📖 User Guide
        </a>
      </div>

      <div className={styles.main}>
        <div className={styles.topnav}>
          <div className={styles.menuIcon} onClick={toggleSidebar} ref={menuIconRef}>
            ☰
          </div>
          <div className={styles.breadcrumb}>
            <span>FAQ</span>
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

        <div className={styles.content} id="faq-page">
          <div className={styles.welcomeSection}>
            <h1>❓ Frequently Asked Questions</h1>
            <p>Common questions for staff members</p>
          </div>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {faqData.map((item, index) => (
              <div 
                key={index}
                className={`${styles.faqItem} ${openFaq === index ? styles.open : ''}`}
              >
                <div 
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(index)}
                >
                  {item.question}
                </div>
                <div 
                  className={styles.faqAnswer}
                  style={{ height: openFaq === index ? 'auto' : '0' }}
                >
                  {item.answer}
                </div>
              </div>
            ))}
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

export default FaqStaff;