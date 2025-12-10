import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './supportstaffstyle.module.css';

const SupportStaff = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [successmessage, setSuccessMessage] = useState(false);
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

  const handlesubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const subject = form.subject.value;
    const category = form.category.value;
    const message = form.message.value;
    if (!subject || !category || !message) {
      alert('Please fill in all required fields.');
      return;}
    try {
      const res = await fetch('http://localhost:5000/api/auth/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, category, message }),
      });
        if (res.ok) {setSuccessMessage(true);
        form.reset();
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        const errorData = await res.json();
        alert('Error: ' + (errorData.message || 'Failed to send message.'));
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('An error occurred. Please try again later.');
    }
    }

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
          setUser(data);
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
        <a className={`${styles.navLink} ${styles.active}`}>
          💬 Support
        </a>
        <a onClick={() => navigate("/staff/userguide")} className={styles.navLink}>
          📖 User Guide
        </a>
      </div>

      <div className={`${styles.main} ${isSidebarOpen ? styles.mainShifted : ''}`} ref={mainRef}>
        <div className={styles.topnav}>
          <div className={styles.menuIcon} onClick={toggleSidebar} ref={menuIconRef}>
            ☰
          </div>
          <div className={styles.breadcrumb}>
            <span>Support</span>
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
        
            {successmessage && (
                <div className={styles.successMessage} style={{ display: 'block' }}>
                    Support Message sent successfully!
                </div>
            )}
        

        <div className={styles.content} id="support-page">
          <div className={styles.welcomeSection}>
            <h1>💬 Support & Contact</h1>
            <p>Get help or contact the administrator</p>
          </div>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className={styles.infoCard}>
              <h3>📞 Administrator Contact</h3>
              <p><strong>Name:</strong> System Administrator</p>
              <p><strong>Email:</strong> admin@citisolve.com</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
            </div>
            <div className={styles.formCard} style={{ marginTop: '24px' }}>
              <h2>Contact Administrator</h2>
              <form onSubmit={handlesubmit}>
                <div className={styles.formGroup}>
                  <label>Subject *</label>
                  <input type="text" name="subject" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select name="category" required>
                    <option value="">Select...</option>
                    <option value="technical">Technical Issue</option>
                    <option value="reassignment">Request Reassignment</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Message *</label>
                  <textarea name="message" rows="6" required></textarea>
                </div>
                <button type="submit" className={styles.btnPrimary} style={{ width: '100%' }}>
                  Send Message
                </button>
              </form>
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

export default SupportStaff;