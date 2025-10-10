import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./submitcomplaintstyle.module.css";

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [image, setimage] = useState('');
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error"); // "error" or "success"
  const [imageerror, setimageerror] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    priority: "medium",
    status: "pending",
  });

  const [formErrors, setFormErrors] = useState({
    title: false,
    category: false,
    location: false,
    description: false
  });

  const handleFileChange = (e) => {
    const el = document.getElementById("file-upload");
    if (e.target.files.length > 0) {
      setimage(e.target.files[0]);
      setFileName(e.target.files[0].name);
      el.style.backgroundColor = "#81b183ff";
      setimageerror("");
    } else {
      setimage('');
      setFileName("");
      el.style.backgroundColor = "#fefae0";
      setimageerror("Please upload an image");
    }
  };

  // Fetch user from session
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

  const getCharCount = (fieldName) => {
    const limits = {
      title: 50,
      location: 60,
      description: 500
    };
    return `${formData[fieldName].length} / ${limits[fieldName]}`;
  };

  const toggleSidebar = () => setSidebarActive(!sidebarActive);
  const closeSidebar = () => setSidebarActive(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const limits = {
      title: 50,
      category: 30,
      location: 60,
      description: 500
    };

    // This handles both text inputs and the priority select
    // as it updates the formData for all fields.
    if (limits[name] && value.length > limits[name]) {
      return;
    }
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: false });
  };

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      category: !formData.category,
      location: !formData.location.trim(),
      description: !formData.description.trim()
    };
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const showAlertPopup = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
  };

  const clearForm = () => {
    setFormData({
      title: "",
      category: "",
      location: "",
      description: "",
      priority: "medium",
      status: "pending",
    });
    setimage('');
    setFileName("");
    const el = document.getElementById("file-upload");
    if (el) {
      el.style.backgroundColor = "#fefae0";
    }
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
    setFormErrors({
      title: false,
      category: false,
      location: false,
      description: false
    });
    setimageerror(""); // Clear image error on form reset
  };

// Replace the handleSubmit function in your submitcomplaint.jsx with this:

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate image first
  if (!image) {
    setimageerror("Please upload an image");
    return;
  } else {
    setimageerror("");
  }

  if (!validateForm()) {
    return;
  }

  setSubmitting(true);

  try {
    const formdata = new FormData();
    formdata.append('title', formData.title);
    formdata.append('category', formData.category);
    formdata.append('location', formData.location);
    formdata.append('description', formData.description);
    formdata.append('priority', formData.priority);
    formdata.append('status', formData.status);
    formdata.append('image', image); // This matches upload.single("image") in backend
    
    console.log("Submitting complaint with data:", {
      title: formData.title,
      category: formData.category,
      location: formData.location,
      priority: formData.priority,
      hasImage: !!image
    });
    
    const res = await fetch('http://localhost:5000/api/auth/submit', {
      method: 'POST',
      credentials: 'include',
      body: formdata,
      // Don't set Content-Type header - browser will set it automatically with boundary
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setSuccessMessage("Complaint submitted successfully! 🎉");
      setShowSuccess(true);
      clearForm();
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/citizen/complaints");
      }, 500);
    } else {
      console.error("Server error:", data);
      showAlertPopup(data.message || 'Submission failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error("Submission error:", err);
    showAlertPopup('Something went wrong! Please check your connection and try again.', 'error');
  } finally {
    setSubmitting(false);
  }
};

  const handleCancel = () => {
    showAlertPopup('Are you sure you want to cancel? All form data will be lost.', 'confirm');
  };

  const handleConfirmCancel = () => {
    closeAlert();
    navigate("/citizen/home");
  };

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
      {showSuccess && (
        <div className={styles.deletionmessage} style={{ backgroundColor: '#4caf50' }}>
          {successMessage}
        </div>
      )}

      {/* Alert Popup */}
      {showAlert && (
        <div className={styles.popupoverlay} onClick={alertType !== 'confirm' ? closeAlert : null}>
          <div className={styles.alertpopup} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closebtn} onClick={closeAlert}>
              &times;
            </button>
            <div className={styles.alertcontent}>
              <div className={styles.alerticon}>
                {alertType === 'error' ? '⚠️' : alertType === 'success' ? '✅' : '❓'}
              </div>
              <div className={styles.alertmessage}>{alertMessage}</div>
              <div className={styles.alertactions}>
                {alertType === 'confirm' ? (
                  <>
                    <button className={styles.alertbtn} onClick={closeAlert}>
                      No, Keep Editing
                    </button>
                    <button 
                      className={`${styles.alertbtn} ${styles.alertbtnprimary}`}
                      onClick={handleConfirmCancel}
                    >
                      Yes, Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={styles.alertbtn}
                      onClick={closeAlert}
                    >
                      Close
                    </button>
                    {alertType === 'error' && (
                      <button 
                        className={`${styles.alertbtn} ${styles.alertbtnprimary}`}
                        onClick={() => { closeAlert(); clearForm(); }}
                      >
                        Clear Inputs
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`${styles.overlay} ${sidebarActive ? styles.active : ''}`}
        onClick={toggleSidebar}
      ></div>

      <div className={`${styles.sidebar} ${sidebarActive ? styles.active : ''}`}>
        <h2>CitiSolve</h2>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/home"); closeSidebar(); }}>
          🏠 Home
        </a>
        <a className={`${styles.navlink} ${styles.active}`}>
          📝 Submit
        </a>
        <a className={styles.navlink} onClick={() => { navigate("/citizen/complaints"); closeSidebar(); }}>
          📋 My Complaints
        </a>
        <a className={styles.navlink} onClick={() => navigate("/citizen/faq")}>❓ FAQ</a>
        <a className={styles.navlink} onClick={() => navigate("/citizen/userguide")}>📖 User Guide</a>
      </div>

      <div className={styles.topnav}>
        <div className={styles.menuicon} onClick={toggleSidebar}>☰</div>
        <div className={styles.breadcrumb}>Submit Complaint</div>
        <div 
          className={styles.profilesymbol} 
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          {user.fullname?.charAt(0).toUpperCase()}
        </div>
        <div className={`${styles.profiledropdown} ${profileDropdownOpen ? styles.show : ''}`}>
          <p><strong>id :</strong>{user.id}</p>
          <p><strong>{user.fullname}</strong></p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Ward:</strong> {user.ward}</p>
          <p style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
           <div className={styles.logout} onClick={handleLogout}>
              Logout
            </div>
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.welcomesection}>
          <h1>📝 Submit a Complaint</h1>
          <p>Help us serve you better by reporting issues in your area</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "40px" }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "clamp(24px, 4vw, 32px)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)"
          }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 24px)", fontWeight: "600", color: "#283618", marginBottom: "8px" }}>
              New Complaint Form
            </h2>
            <p style={{ fontSize: "14px", color: "#606c38", marginBottom: "24px" }}>
              Please fill in all the required fields
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#283618" }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the issue"
                  style={{
                    padding: "12px 16px",
                    border: `2px solid ${formErrors.title ? '#ef5350' : '#e0d5b7'}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    transition: "all 0.3s ease"
                  }}
                  required
                />
                <div style={{ fontSize: "12px", color: "#606c38", textAlign: "right" }}>
                  {getCharCount("title")}
                </div>
                {formErrors.title && (
                  <span style={{ fontSize: "12px", color: "#ef5350" }}>
                    Please enter a complaint title
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#283618" }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    padding: "12px 16px",
                    border: `2px solid ${formErrors.category ? '#ef5350' : '#e0d5b7'}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    background: "white",
                    cursor: "pointer"
                  }}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="roads">🛣️ Roads & Infrastructure</option>
                  <option value="water">💧 Water Supply</option>
                  <option value="power">💡 Power & Electricity</option>
                  <option value="sanitation">🗑️ Sanitation & Garbage</option>
                  <option value="other">📋 Other</option>
                </select>
                {formErrors.category && (
                  <span style={{ fontSize: "12px", color: "#ef5350" }}>
                    Please select a category
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#283618" }}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Street name, landmark, or area"
                  style={{
                    padding: "12px 16px",
                    border: `2px solid ${formErrors.location ? '#ef5350' : '#e0d5b7'}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif"
                  }}
                  required
                />
                <div style={{ fontSize: "12px", color: "#606c38", textAlign: "right" }}>
                  {getCharCount("location")}
                </div>
                {formErrors.location && (
                  <span style={{ fontSize: "12px", color: "#ef5350" }}>
                    Please enter a location
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#283618" }}>
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Provide detailed information about the issue..."
                  style={{
                    padding: "12px 16px",
                    border: `2px solid ${formErrors.description ? '#ef5350' : '#e0d5b7'}`,
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    resize: "vertical"
                  }}
                  required
                />
                <div style={{ fontSize: "12px", color: "#606c38", textAlign: "right" }}>
                  {getCharCount("description")}
                </div>
                {formErrors.description && (
                  <span style={{ fontSize: "12px", color: "#ef5350" }}>
                    Please provide a description
                  </span>
                )}
              </div>
              <div>
                  <label id="file-upload" className={styles.customfileupload}>
                    📁 Upload Image *
                    <input type="file" onChange={handleFileChange} accept="image/*"/>
                  </label>
                  {fileName && <p style={{ marginTop: "8px", fontSize: "13px", color: "#606c38" }}>Selected file: {fileName}</p>}
              </div>
              {imageerror&& <span style={{ fontSize: "10px", color: "#ef5350" }}>
                    {imageerror}
                  </span>}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#283618" }}>
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  style={{
                    padding: "12px 16px",
                    border: "2px solid #e0d5b7",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="low">Low - Can wait</option>
                  <option value="medium">Medium - Normal</option>
                  <option value="high">High - Urgent</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  style={{
                    flex: "1",
                    minWidth: "140px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #e0e0e0, #bdbdbd)",
                    color: "#424242",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "'Poppins', sans-serif",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    transition: "all 0.3s ease"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitbtn}
                  style={{
                    flex: "1",
                    minWidth: "140px",
                    padding: "12px 24px",
                    background: submitting ? "#a9b9c9" : "linear-gradient(135deg, #dda15e, #bc6c25)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "'Poppins', sans-serif",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 12px rgba(221, 161, 94, 0.3)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {submitting ? (
                    <>
                      <div className={styles.loadingnow} style={{ width: "16px", height: "16px", borderWidth: "3px" }}></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#283618", marginBottom: "12px" }}>
                📋 Submission Guidelines
              </h3>
              <ul style={{ listStyle: "none", padding: "0", margin: "0", color: "#606c38", fontSize: "14px", lineHeight: "1.8" }}>
                <li>✓ Be specific about the location</li>
                <li>✓ Provide clear description</li>
                <li>✓ Select correct category</li>
                <li>✓ One issue per complaint</li>
              </ul>
            </div>

            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#283618", marginBottom: "12px" }}>
                ⏱️ Expected Response Time
              </h3>
              <p style={{ fontSize: "14px", color: "#606c38", margin: "4px 0" }}>
                <strong>High Priority:</strong> 24-48 hours
              </p>
              <p style={{ fontSize: "14px", color: "#606c38", margin: "4px 0" }}>
                <strong>Medium Priority:</strong> 3-5 days
              </p>
              <p style={{ fontSize: "14px", color: "#606c38", margin: "4px 0" }}>
                <strong>Low Priority:</strong> 1-2 weeks
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        Powered by CitiSolve | <a href="#">How can we help you?</a>
      </footer>
    </div>
  );
};

export default SubmitComplaint;