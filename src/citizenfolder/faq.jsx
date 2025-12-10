import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Complaintstyle.module.css";

const FAQ = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I submit a complaint?",
      answer: "Navigate to the 'Submit a Complaint' page from the sidebar or home screen. Fill out the required fields including title, category, location, and description. Click submit to register your complaint."
    },
    {
      question: "How can I track my complaints?",
      answer: "Visit the 'My Complaints' section to view all your submitted complaints. You can filter by status, category, or search by keywords to find specific complaints."
    },
    {
      question: "What is the expected response time?",
      answer: "High priority complaints are addressed within 24-48 hours. Medium priority issues take 3-5 days, while low priority matters are resolved within 1-2 weeks."
    },
    {
      question: "Can I edit my complaint after submission?",
      answer: "Currently, complaints cannot be edited after submission. If you need to provide additional information, you can contact support or submit a new complaint with updated details."
    },
    {
      question: "How do I check the analytics dashboard?",
      answer: "The dashboard is available from the sidebar menu. It displays charts showing complaint trends, status distribution, and category breakdowns to help you understand patterns."
    },
    {
      question: "What categories are available?",
      answer: "Available categories include Roads & Infrastructure, Water Supply, Power & Electricity, Sanitation & Garbage, and Other for miscellaneous issues."
    },
    {
      question: "How do I delete a complaint?",
      answer: "Go to 'My Complaints', find the complaint you want to remove, and click the 'Delete' button. Confirm your action when prompted."
    },
    {
      question: "Can I change my ward information?",
      answer: "Ward information is set during registration. To update it, visit the Settings page or contact support for assistance."
    }
  ];

  // Fetch user from session
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

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarActive && !e.target.closest(`.${styles.sidebar}`) && !e.target.closest(`.${styles.menuicon}`)) {
        setSidebarActive(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarActive]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    } catch (err) {
      navigate('/');
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!user) return null;

  return (
    <div className={styles.main}>
      <div className={`${styles.overlay} ${sidebarActive ? styles.active : ''}`} onClick={toggleSidebar}></div>

      <div className={`${styles.sidebar} ${sidebarActive ? styles.active : ''}`}>
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
        <a className={styles.navlink}>📊 Dashboard</a>
        <a className={`${styles.navlink} ${styles.active}`}>❓ FAQ</a>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/userguide"); setSidebarActive(false); }}>
          📖 User Guide
        </a>
      </div>

      <div className={styles.topnav}>
        <div className={styles.menuicon} onClick={toggleSidebar}>☰</div>
        <div className={styles.breadcrumb}>FAQ</div>
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
          <h1>❓ Frequently Asked Questions</h1>
          <p>Find answers to common questions about CitiSolve</p>
        </div>

        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {faqs.map((faq, index) => (
            <div key={index} style={{
              background: "white",
              borderRadius: "12px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              transition: "all 0.3s ease"
            }}>
              <div
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: openIndex === index ? "#fefae0" : "white",
                  transition: "background 0.3s ease"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#283618", margin: 0 }}>
                  {faq.question}
                </h3>
                <span style={{ fontSize: "20px", color: "#bc6c25", transition: "transform 0.3s ease", transform: openIndex === index ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </span>
              </div>
              {openIndex === index && (
                <div style={{
                  padding: "0 24px 20px 24px",
                  fontSize: "14px",
                  color: "#606c38",
                  lineHeight: "1.6",
                  animation: "fadeIn 0.3s ease"
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "40px",
          padding: "24px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#283618", marginBottom: "12px" }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: "14px", color: "#606c38", marginBottom: "20px" }}>
            Check out our User Guide for detailed instructions or contact support
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/citizen/userguide")}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #dda15e, #bc6c25)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
            >
              View User Guide
            </button>
            <button
              onClick={() => navigate("/citizen/home")}
              style={{
                padding: "12px 24px",
                background: "#f4f1de",
                color: "#283618",
                border: "2px solid #e0d5b7",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        Powered by CitiSolve | <a href="#">How can we help you?</a>
      </footer>
    </div>
  );
};

export default FAQ;