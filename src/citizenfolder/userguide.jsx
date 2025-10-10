import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./complaintstyle.module.css";

const UserGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
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

  const sections = [
    {
      title: "Getting Started",
      icon: "🚀",
      content: [
        { subtitle: "Dashboard Overview", text: "Your home dashboard displays complaint statistics, analytics charts, and quick access links. Use the navigation sidebar to access different features." },
        { subtitle: "Profile Information", text: "Click your profile icon in the top-right corner to view your details including ID, name, email, and ward assignment." }
      ]
    },
    {
      title: "Submitting Complaints",
      icon: "📝",
      content: [
        { subtitle: "Required Fields", text: "Every complaint needs a title, category, location, and detailed description. Select the appropriate priority level based on urgency." },
        { subtitle: "Categories", text: "Choose from Roads & Infrastructure, Water Supply, Power & Electricity, Sanitation & Garbage, or Other. This helps route your complaint to the right department." },
        { subtitle: "Location Details", text: "Provide specific street names, landmarks, or area descriptions to help officials locate and address the issue quickly." }
      ]
    },
    {
      title: "Tracking Complaints",
      icon: "📋",
      content: [
        { subtitle: "My Complaints Page", text: "Access all your submitted complaints from the sidebar. Each complaint shows its ID, status, category, and submission date." },
        { subtitle: "Status Types", text: "Pending means your complaint is awaiting review. In Progress indicates action is being taken. Resolved means the issue has been addressed." },
        { subtitle: "Filtering & Search", text: "Use status and category filters to narrow down complaints. The search box allows you to find specific issues by keywords." }
      ]
    },
    {
      title: "Analytics Dashboard",
      icon: "📊",
      content: [
        { subtitle: "Complaint Statistics", text: "View total complaints, resolved count, in-progress items, and pending cases at a glance on your home page." },
        { subtitle: "Visual Charts", text: "Doughnut charts show status distribution. Line graphs display monthly trends. Bar charts break down complaints by category and resolution time." },
        { subtitle: "Understanding Trends", text: "Use analytics to identify patterns in your area and understand how quickly issues are typically resolved." }
      ]
    },
    {
      title: "Response Times",
      icon: "⏱️",
      content: [
        { subtitle: "Priority Levels", text: "High priority complaints receive attention within 24-48 hours. Medium priority takes 3-5 days. Low priority issues are addressed in 1-2 weeks." },
        { subtitle: "Updates & Notifications", text: "Check the Latest Notices section on your dashboard for municipal announcements and service updates that may affect your complaints." }
      ]
    },
    {
      title: "Tips & Best Practices",
      icon: "💡",
      content: [
        { subtitle: "Be Specific", text: "Provide clear, detailed descriptions with exact locations. Include nearby landmarks or intersections to help officials find the issue." },
        { subtitle: "One Issue Per Complaint", text: "Submit separate complaints for different issues to ensure each receives proper attention and tracking." },
        { subtitle: "Check Existing Complaints", text: "Search before submitting to see if someone else has already reported the same issue in your area." }
      ]
    }
  ];

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      const menuIcon = document.querySelector(`.${styles.menuicon}`);
      const profileDropdown = document.querySelector(`.${styles.profiledropdown}`);
      const profileSymbol = document.querySelector(`.${styles.profilesymbol}`);

      if (sidebarActive && sidebar && !sidebar.contains(e.target) && !menuIcon.contains(e.target)) {
        setSidebarActive(false);
      }

      if (profileDropdown && !profileDropdown.contains(e.target) && !profileSymbol.contains(e.target)) {
        profileDropdown.classList.remove(styles.show);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarActive]);

  const handleLogout = () => {
    navigate("/");
  };

  if (!user) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.main}>
      <div className={`${styles.overlay} ${sidebarActive ? styles.active : ""}`} onClick={toggleSidebar}></div>

      <div className={`${styles.sidebar} ${sidebarActive ? styles.active : ""}`}>
        <h2>CitiSolve</h2>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/home"); setSidebarActive(false); }}>
          🏠 Home
        </a>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/submit"); setSidebarActive(false); }}>
          📝 Submit a complaint
        </a>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/complaints"); setSidebarActive(false); }}>
          📋 My Complaints
        </a>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/faq"); setSidebarActive(false); }}>
          ❓ FAQ
        </a>
        <a className={`${styles.navlink} ${styles.active}`}>📖 User Guide</a>
      </div>

      <div className={styles.topnav}>
        <div className={styles.menuicon} onClick={toggleSidebar}>☰</div>
        <div className={styles.breadcrumb}>User Guide</div>
        <div className={styles.profilesymbol} onClick={() => {
          document.querySelector(`.${styles.profiledropdown}`).classList.toggle(styles.show);
        }}>
          {user.fullname?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.profiledropdown}>
          <p><strong>Name: </strong>{user.fullname}</p>
          <p><strong>Email: </strong>{user.email}</p>
          <p><strong>Ward: </strong>{user.ward}</p>
          <p><div className={styles.logout} onClick={handleLogout}>
                        Logout
                      </div></p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.welcomesection}>
          <h1>📖 User Guide</h1>
          <p>Complete guide to using CitiSolve effectively</p>
        </div>

        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{
              background: "white",
              borderRadius: "16px",
              marginBottom: "24px",
              padding: "clamp(20px, 4vw, 32px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
            }}>
              <h2 style={{ 
                fontSize: "clamp(20px, 4vw, 24px)", 
                fontWeight: "600", 
                color: "#283618", 
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "28px" }}>{section.icon}</span>
                {section.title}
              </h2>
              
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} style={{ marginBottom: "20px" }}>
                  <h3 style={{ 
                    fontSize: "16px", 
                    fontWeight: "600", 
                    color: "#606c38", 
                    marginBottom: "8px" 
                  }}>
                    {item.subtitle}
                  </h3>
                  <p style={{ 
                    fontSize: "14px", 
                    color: "#606c38", 
                    lineHeight: "1.6",
                    marginLeft: "0"
                  }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "40px",
          padding: "clamp(20px, 4vw, 32px)",
          background: "linear-gradient(135deg, #fefae0, #f4f1de)",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#283618", marginBottom: "16px", textAlign: "center" }}>
            Quick Navigation
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
            gap: "12px",
            marginTop: "20px"
          }}>
            <button
              onClick={() => navigate("/citizen/submit")}
              style={{
                padding: "12px 16px",
                background: "white",
                color: "#283618",
                border: "2px solid #e0d5b7",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Submit Complaint
            </button>
            <button
              onClick={() => navigate("/citizen/complaint")}
              style={{
                padding: "12px 16px",
                background: "white",
                color: "#283618",
                border: "2px solid #e0d5b7",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              My Complaints
            </button>
            <button
              onClick={() => navigate("/citizen/home")}
              style={{
                padding: "12px 16px",
                background: "white",
                color: "#283618",
                border: "2px solid #e0d5b7",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/citizen/faq")}
              style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg, #dda15e, #bc6c25)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              View FAQ
            </button>
          </div>
        </div>

        <div style={{
          marginTop: "24px",
          padding: "24px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#283618", marginBottom: "8px" }}>
            Need Additional Help?
          </h3>
          <p style={{ fontSize: "14px", color: "#606c38", marginBottom: "0" }}>
            Contact support or check our FAQ section for more information
          </p>
        </div>
      </div>

      <footer className={styles.footer}>
        Powered by CitiSolve | <a href="#">How can we help you?</a>
      </footer>
    </div>
  );
};

export default UserGuide