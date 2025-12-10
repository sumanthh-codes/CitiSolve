import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Citizenstyle.module.css";
import Chart from "chart.js/auto";

const CitizenPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [complaintsdata, setComplaintsData] = useState({
    totalcomplaints: 0,
    resolved: 0,
    pending: 0,
    inprogress: 0,
    roads: 0,
    water: 0,
    power: 0,
    sanitation: 0,
    other: 0,
  });

  // Use refs to store chart instances
  const chartRefs = useRef({
    statusChart: null,
    trendsChart: null,
    categoryChart: null,
    timeChart: null,
  });

  // Fetch user from session when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ User data fetched:", data);
          setUser(data);
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

  // Fetch complaints data when user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchComplaintsData = async () => {
      setComplaintsLoading(true);
      try {
        console.log("📊 Fetching complaints data...");
        const res = await fetch('http://localhost:5000/api/auth/citizen/complaints/data', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Complaints data received:", data);
          setComplaintsData(data);
        } else {
          console.error("❌ Failed to fetch complaints data");
        }
      } catch (err) {
        console.error('❌ Error fetching complaints data:', err);
      } finally {
        setComplaintsLoading(false);
      }
    };

    fetchComplaintsData();
  }, [user]);

  // Initialize event listeners and notices
  useEffect(() => {
    if (!user) return;

    const searchBox = document.getElementById("searchBox");
    const refreshNotices = document.getElementById("refreshNotices");

    const sampleNotices = [
      "🚧 New road project near City Hall",
      "💧 Water supply cut tomorrow",
      "🗑️ Garbage delayed due to rain",
      "💡 Energy-saving campaign",
      "🌳 Park maintenance this weekend",
      "🚦 Traffic signal repair at Junction 5",
      "📱 New mobile app update available",
      "🏥 Health camp this Saturday"
    ];

    const handleRefreshNotices = () => {
      const noticesList = document.getElementById("noticesList");
      if (!noticesList) return;
      
      noticesList.innerHTML = "";
      noticesList.classList.add(styles.loading);

      setTimeout(() => {
        let randomNotices = sampleNotices.sort(() => 0.5 - Math.random()).slice(0, 3);
        randomNotices.forEach((notice) => {
          const li = document.createElement("li");
          li.textContent = notice;
          noticesList.appendChild(li);
        });
        noticesList.classList.remove(styles.loading);
      }, 200);
    };

    const handleSearch = () => {
      const value = searchBox.value.toLowerCase();
      document.querySelectorAll(`.${styles["complaint-card"]}`).forEach((card) => {
        card.style.display = card.textContent.toLowerCase().includes(value) ? "" : "none";
      });
    };

    refreshNotices?.addEventListener("click", handleRefreshNotices);
    searchBox?.addEventListener("keyup", handleSearch);

    document.querySelectorAll(`.${styles.card}, .${styles.stat}`).forEach((el) => {
      const handleClick = () => {
        el.style.transform = "scale(0.95)";
        setTimeout(() => { el.style.transform = ""; }, 150);
      };
      el.addEventListener("click", handleClick);
    });

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 1024) {
          setSidebarActive(false);
        }
        // Resize charts
        Object.values(chartRefs.current).forEach((chart) => {
          if (chart) chart.resize();
        });
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      refreshNotices?.removeEventListener("click", handleRefreshNotices);
      searchBox?.removeEventListener("keyup", handleSearch);
      window.removeEventListener("resize", handleResize);
    };
  }, [user]);

  // Initialize/update charts when complaintsdata changes
  useEffect(() => {
    if (complaintsdata.totalcomplaints >= 0) {
      console.log("📈 Initializing charts with data:", complaintsdata);
      initializeCharts();
    }
  }, [complaintsdata]);

  // Handle clicks outside sidebar and profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarActive && !e.target.closest(`.${styles.sidebar}`) && !e.target.closest(`.${styles.menuicon}`)) {
        setSidebarActive(false);
      }
      if (profileDropdownOpen && !e.target.closest(`.${styles.profilesymbol}`) && !e.target.closest(`.${styles.profiledropdown}`)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarActive, profileDropdownOpen]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      Object.values(chartRefs.current).forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, []);

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

  const initializeCharts = () => {
    if (complaintsLoading) return;
    // Destroy existing charts
    Object.keys(chartRefs.current).forEach(key => {
      if (chartRefs.current[key]) {
        chartRefs.current[key].destroy();
        chartRefs.current[key] = null;
      }
    });

    const chartColors = {
      primary: "#dda15e",
      secondary: "#bc6c25",
      success: "#606c38",
      warning: "#f4a261",
      danger: "#e76f51",
      info: "#2a9d8f",
    };

    const responsiveOptions = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 768 ? 1.5 : 2,
      plugins: {
        legend: {
          labels: {
            padding: window.innerWidth < 768 ? 10 : 15,
            font: { family: "Poppins", size: window.innerWidth < 768 ? 10 : 12 },
          },
        },
      },
    };

    // Status Chart
    const statusCtx = document.getElementById("statusChart");
    if (statusCtx) {
      chartRefs.current.statusChart = new Chart(statusCtx.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Resolved", "In Progress", "Pending"],
          datasets: [
            {
              data: [complaintsdata.resolved, complaintsdata.inprogress, complaintsdata.pending],
              backgroundColor: [chartColors.success, chartColors.warning, chartColors.danger],
              borderWidth: 0,
            },
          ],
        },
        options: { 
          ...responsiveOptions, 
          plugins: { 
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.parsed;
                }
              }
            }
          } 
        },
      });
      console.log("✅ Status chart created");
    }

    // Category Chart
    const categoryCtx = document.getElementById("categoryChart");
    if (categoryCtx) {
      chartRefs.current.categoryChart = new Chart(categoryCtx.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Roads", "Water", "Power", "Sanitation", "Other"],
          datasets: [
            {
              label: "Complaints",
              data: [
                complaintsdata.roads,
                complaintsdata.water,
                complaintsdata.power,
                complaintsdata.sanitation,
                complaintsdata.other
              ],
              backgroundColor: [
                chartColors.primary,
                chartColors.info,
                chartColors.warning,
                chartColors.success,
                chartColors.secondary,
              ],
              borderRadius: 8,
            },
          ],
        },
        options: { 
          ...responsiveOptions, 
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'Count: ' + context.parsed.y;
                }
              }
            }
          } 
        },
      });
      console.log("✅ Category chart created");
    }
  };

  if (loading) {
    return (
      <div className={styles.fullLoading} />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className={`${styles.overlay} ${sidebarActive ? styles.active : ''}`} onClick={() => setSidebarActive(false)}></div>
      
      <div className={`${styles.sidebar} ${sidebarActive ? styles.active : ''}`}>
        <h2>CitiSolve</h2>
        <a data-page="home">🏠 Home</a>
        <a onClick={() => navigate("/citizen/submit")} data-page="submit">📝 Submit a complaint</a>
        <a onClick={() => navigate("/citizen/complaints")} data-page="complaints">📋 My Complaints</a>
        <a onClick={() => navigate("/citizen/faq")}>❓ FAQ</a>
        <a onClick={() => navigate("/citizen/userguide")}>📖 User Guide</a>
      </div>

      <div className={styles.main}>
        <div className={styles.topnav}>
          <div className={styles.menuicon} onClick={(e) => { e.stopPropagation(); setSidebarActive(!sidebarActive); }}>☰</div>
          <div className={styles.profilesymbol} onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }}>
            {user.fullname?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={`${styles.profiledropdown} ${profileDropdownOpen ? styles.show : ''}`}>
            <p><strong>Id : {user.id}</strong></p>
            <p><strong>{user.fullname}</strong></p>
            <p>Email: {user.email}</p>
            <p>Ward: {user.ward}</p>
            <p style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
              <div className = {styles.logout} onClick={handleLogout}>Logout</div>
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.welcomesection}>
            <h1>Hi, {user.fullname} 👋</h1>
            <p>What's bothering you today?</p>
          </div>

          <div className={styles.maingrid}>
            <div className={styles.leftpanel}>
              <div className={styles.quicklinks}>
                <a className={styles.card} onClick={() => navigate("/citizen/submit")}>📝 Submit a Complaint</a>
                <a onClick={() => navigate("/citizen/complaints")} className={styles.card}>📋 Track Complaints</a>
              </div>

              <div className={styles.dashboardcards}>
                <div className={`${styles.stat} ${styles["complaint-card"]} ${complaintsLoading ? styles.loading : ''}`} data-category="total">
                  <span className={styles.statnumber}>{complaintsLoading ? <span style={{visibility: 'hidden'}}>88</span> : complaintsdata.totalcomplaints}</span>
                  <span className={styles.statlabel}>Total Complaints</span>
                </div>
                <div className={`${styles.stat} ${styles["complaint-card"]} ${complaintsLoading ? styles.loading : ''}`} data-category="resolved">
                  <span className={styles.statnumber}>{complaintsLoading ? <span style={{visibility: 'hidden'}}>88</span> : complaintsdata.resolved}</span>
                  <span className={styles.statlabel}>Resolved</span>
                </div>
                <div className={`${styles.stat} ${styles["complaint-card"]} ${complaintsLoading ? styles.loading : ''}`} data-category="progress">
                  <span className={styles.statnumber}>{complaintsLoading ? <span style={{visibility: 'hidden'}}>88</span> : complaintsdata.inprogress}</span>
                  <span className={styles.statlabel}>In Progress</span>
                </div>
                <div className={`${styles.stat} ${styles["complaint-card"]} ${complaintsLoading ? styles.loading : ''}`} data-category="pending">
                  <span className={styles.statnumber}>{complaintsLoading ? <span style={{visibility: 'hidden'}}>88</span> : complaintsdata.pending}</span>
                  <span className={styles.statlabel}>Pending</span>
                </div>
              </div>

              <div className={styles.chartssection}>
                <h2>📊 Analytics Dashboard</h2>
                <div className={styles.chartsgrid}>
                  <div className={`${styles.chartcontainer} ${complaintsLoading ? styles.loading : ''}`}>
                    <h3>Complaint Status Distribution</h3>
                    {complaintsLoading ? <div className={styles.placeholderCanvas} /> : <canvas id="statusChart"></canvas>}
                  </div>
                  <div className={`${styles.chartcontainer} ${complaintsLoading ? styles.loading : ''}`}>
                    <h3>Category Breakdown</h3>
                    {complaintsLoading ? <div className={styles.placeholderCanvas} /> : <canvas id="categoryChart"></canvas>}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.rightpanel}>
              <div className={styles.infocard}>
                <h3>📢 Latest Notices</h3>
                <ul id="noticesList">
                  <li>🚧 Road repair at Main Street</li>
                  <li>💡 Power outage on Sunday</li>
                  <li>🗑️ Garbage collection at 6 AM</li>
                </ul>
                <button id="refreshNotices" className={styles.button}>🔄 Refresh Notices</button>
              </div>

              <div className={styles.infocard}>
                <h3>👤 Your Info</h3>
                <p><strong>Name:</strong> {user.fullname}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Ward:</strong> {user.ward}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>

              <div className={styles.infocard}>
                <h3>❓ Need Help?</h3>
                <p><a onClick={()=>navigate("/citzens/faq")}>📚 FAQ</a></p>
                <p><a onClick={()=>navigate("/citizen/userguide")}>📖 User Guide</a></p>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          Powered by CitiSolve | <a onClick={()=>navigate("/citizen/userguide")}>How can we help you?</a>
        </footer>
      </div>
    </>
  );
};

export default CitizenPortal;