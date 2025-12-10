import React, { useEffect, useState } from "react";
import styles from "./Complaintstyle.module.css";
import { useNavigate } from "react-router-dom";

const Complaint = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [deletionmessage, Setdeletionmessage] = useState(false);
  const [showloader, setShowloader] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    search: "",
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Fetch user from session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch complaints
  useEffect(() => {
    if (!user) return;

    const fetchComplaints = async () => {
      try {
        setShowloader(true);
        const res = await fetch("http://localhost:5000/api/auth/complaints", {
          credentials: "include",
        });
        setShowloader(false);
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints);
        }
      } catch (err) {
        console.error("Error fetching complaints:", err);
      }
    };

    fetchComplaints();
  }, [user]);

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      filters.status === "all" ||
      c.status.toLowerCase().includes(filters.status);
    const matchesCategory =
      filters.category === "all" ||
      c.category.toLowerCase().includes(filters.category);
    const searchText = filters.search.toLowerCase();
    const createdDate = c.created_at
      ? new Date(c.created_at).toLocaleDateString()
      : "";
    const matchesSearch =
      c.title.toLowerCase().includes(searchText) ||
      c.description.toLowerCase().includes(searchText) ||
      c.id?.toString().toLowerCase().includes(searchText) ||
      createdDate.toLowerCase().includes(searchText) ||
      c.status.toLowerCase().includes(searchText);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete complaint ${id}?`)) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/complaints/delete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: id }),
          }
        );

        if (res.ok) {
          setComplaints((prev) => prev.filter((c) => c.id !== id));
          Setdeletionmessage(true);
          setTimeout(() => {
            Setdeletionmessage(false);
          }, 1500);
        }
      } catch (err) {
        alert("Error deleting complaint:", err);
      }
    }
  };

  const handleView = (id) => {
    const complaint = complaints.find((c) => c.id === id);
    setSelectedComplaint(complaint);
  };

  const handleClosePopup = () => {
    setSelectedComplaint(null);
  };

  const handleImageClick = (imageUrl) => {
    setFullScreenImage(imageUrl);
  };

  const handleCloseFullScreenImage = () => {
    setFullScreenImage(null);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/");
    } catch (err) {
      navigate("/");
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!user) return null;

  const getCategoryEmoji = (category) => {
    switch (category.toLowerCase()) {
      case "roads":
        return "🛣️";
      case "water":
        return "💧";
      case "power":
        return "💡";
      case "sanitation":
        return "🗑️";
      default:
        return "📋";
    }
  };

  return (
    <div className={styles.main}>
      {deletionmessage && (
        <div className={styles.deletionmessage}>
          Complaint deleted successfully
        </div>
      )}
      <div
        className={`${styles.overlay} ${sidebarActive ? styles.active : ""}`}
        onClick={toggleSidebar}
      ></div>

      <div
        className={`${styles.sidebar} ${sidebarActive ? styles.active : ""}`}
      >
        <h2>CitiSolve</h2>
        <a
          className={styles.navlink}
          onClick={() => {
            navigate("/citizen/home");
            setSidebarActive(false);
          }}
        >
          🏠 Home
        </a>
        <a
          className={styles.navlink}
          onClick={() => {
            navigate("/citizen/submit");
            setSidebarActive(false);
          }}
        >
          📝 Submit a complaint
        </a>
        <a className={`${styles.navlink} ${styles.active}`}>📋 My Complaints</a>
        <a className={styles.navlink} onClick={() => navigate("/citizen/faq")}>
          ❓ FAQ
        </a>
        <a
          className={styles.navlink}
          onClick={() => navigate("/citizen/userguide")}
        >
          📖 User Guide
        </a>
      </div>

      <div className={styles.topnav}>
        <div className={styles.menuicon} onClick={toggleSidebar}>
          ☰
        </div>
        <div className={styles.breadcrumb}>My Complaints</div>
        <div
          className={styles.profilesymbol}
          onClick={() => {
            document
              .querySelector(`.${styles.profiledropdown}`)
              .classList.toggle(styles.show);
          }}
        >
          {user.fullname?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.profiledropdown}>
          <p>
            <strong>{user.fullname}</strong>            
          </p>
          <p>
            <strong>Email: </strong>
            {user.email}
          </p>
          <p>
            <strong>Ward: </strong>
            {user.ward}
          </p>
          <p>
            <div className={styles.logout} onClick={handleLogout}>
              Logout
            </div>
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.welcomesection}>
          <h1>📋 My Complaints</h1>
          <p>Track and manage all your submitted complaints</p>
        </div>

        <div className={styles.filtersbar}>
          <div className={styles.filtergroup}>
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className={styles.filterselect}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className={styles.filtergroup}>
            <label>Category:</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className={styles.filterselect}
            >
              <option value="all">All</option>
              <option value="roads">🛣️Roads</option>
              <option value="water">💧Water</option>
              <option value="power">💡Power</option>
              <option value="sanitation">🗑️Sanitation</option>
              <option value="other">📋Other</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="🔍 Search complaints..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            className={styles.filtersearch}
          />
        </div>
        {showloader === true ? (
          <div className={styles.loadingscreen}>
            <div className={styles.loadernow}>
              <div className={styles.loadingnow}></div>
              <div className={styles.loadertext}>Fetching complaints..</div>
            </div>
          </div>
        ) : (
          <div className={styles.complaintslist}>
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((c) => (
                <div className={styles.complaintcard} key={c.id}>
                  <div className={styles.complaintheader}>
                    <div className={styles.complaintid}>#{c.id}</div>
                    <div
                      className={`${styles.complaintstatus} ${
                        c.status.toLowerCase().includes("pending")
                          ? styles.statuspending
                          : c.status.toLowerCase().includes("progress")
                          ? styles.statusprogress
                          : styles.statusresolved
                      }`}
                    >
                      {c.status}
                    </div>
                  </div>

                  <div className={styles.complaintbody}>
                    <div className={styles.complaintcategory}>
                      {getCategoryEmoji(c.category)} {c.category}
                    </div>
                    <div className={styles.complainttitle}>{c.title}</div>
                    <div className={styles.complaintdescription}>
                      {c.description.length > 100
                        ? `${c.description.substring(0, 100)}...`
                        : c.description}
                    </div>
                    <div className={styles.complaintlocation}>
                      📍 {c.location}
                    </div>
                    <div className={styles.complaintlocation}>
                      🖼️ view to see image
                    </div>
                  </div>

                  <div className={styles.complaintfooter}>
                    <div className={styles.complaintdate}>
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div className={styles.complaintactions}>
                      <button
                        className={`${styles.actionbtn} ${styles.btnview}`}
                        onClick={() => handleView(c.id)}
                      >
                        View
                      </button>
                      <button
                        className={`${styles.actionbtn} ${styles.btndelete}`}
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptystate}>
                <div className={styles.emptystateicon}>📋</div>
                <h3>No Complaints Found</h3>
                <p>You haven't submitted any complaints yet.</p>
                <button
                  className={styles.emptystatebtn}
                  onClick={() => navigate("/citizen/submit")}
                >
                  Submit Complaint
                </button>
              </div>
            )}
          </div>
        )}

        <footer className={styles.footer}>
          Powered by CitiSolve | <a href="#">How can we help you?</a>
        </footer>

        {selectedComplaint && (
          <div className={styles.popupoverlay} onClick={handleClosePopup}>
            <div className={`${styles.complaintcard} ${styles.popup}`} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closebtn} onClick={handleClosePopup}>
                &times;
              </button>
              
              <div className={styles.complaintheader}>
                <div className={styles.complaintid}>
                  #{selectedComplaint.id}
                </div>
                <div
                  className={`${styles.complaintstatus} ${
                    selectedComplaint.status.toLowerCase().includes("pending")
                      ? styles.statuspending
                      : selectedComplaint.status
                          .toLowerCase()
                          .includes("progress")
                      ? styles.statusprogress
                      : styles.statusresolved
                  }`}
                >
                  {selectedComplaint.status}
                </div>
              </div>

              <div className={styles.complaintbody}>
                <div className={styles.complaintcategory}>
                  {getCategoryEmoji(selectedComplaint.category)}{" "}
                  {selectedComplaint.category}
                </div>
                <div className={styles.complainttitle}>
                  {selectedComplaint.title}
                </div>
                <div className={styles.complaintdescription}>
                  {selectedComplaint.description}
                </div>
                <div className={styles.complaintlocation}>
                  📍 {selectedComplaint.location}
                </div>
                {selectedComplaint.imageurl && (
                  <img
                    src={selectedComplaint.imageurl}
                    alt="Complaint"
                    className={styles.complaintimage}
                    onClick={() => handleImageClick(selectedComplaint.imageurl)}
                  />
                )}
              </div>

              <div className={styles.complaintfooter}>
                <div className={styles.complaintdate}>
                  {selectedComplaint.created_at
                    ? new Date(
                        selectedComplaint.created_at
                      ).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}

        {fullScreenImage && (
          <div className={styles.fullscreenimageoverlay} onClick={handleCloseFullScreenImage}>
            <button className={styles.fullscreenclosebtn} onClick={handleCloseFullScreenImage}>
              &times;
            </button>
            <img
              src={fullScreenImage}
              alt="Full screen complaint"
              className={styles.fullscreenimage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaint;