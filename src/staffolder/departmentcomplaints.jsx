import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './departmentcomplaintsstyle.module.css';

const DepartmentComplaints = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdateButtonDisabled, setIsUpdateButtonDisabled] = useState(false);

  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    sortBy: 'newest',
  });

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

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailPage(true);
    setIsUpdateButtonDisabled(complaint.status === 'resolved');
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
    if (!user) return;
    const fetchComplaints = async () => {
      setComplaintsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/auth/staff/complaints', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints);
        }
      } catch (err) {
        console.error('Error fetching complaints:', err);
      } finally {
        setComplaintsLoading(false);
      }
    };
    fetchComplaints();
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
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isProfileDropdownOpen, isSidebarOpen]);

  const getFilteredComplaints = () => {
    let filtered = [...complaints];
    if (filters.priority !== 'all') {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleBackToList = () => {
    setShowDetailPage(false);
    setSelectedComplaint(null);
  };

  const handleUpdateStatus = async () => {
    const newStatus = document.getElementById('updateStatus').value;
    if (newStatus === 'resolved') {
        const confirmed = window.confirm('Are you sure you want to set this complaint to "Resolved"? This action cannot be undone.');
        if (!confirmed) {
            return;
        }
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/staff/complaints/${selectedComplaint.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id ? { ...c, status: newStatus } : c
          )
        );
        setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
        if (newStatus === 'resolved') {
          setSuccessMessage('Thank you for your cooperation in resolving this complaint.');
          setIsUpdateButtonDisabled(true);
        } else {
          setSuccessMessage('Status updated successfully!');
          setIsUpdateButtonDisabled(false);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Error updating status');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      roads: '🛣️',
      water: '💧',
      power: '💡',
      sanitation: '🗑️',
      other: '📋',
    };
    return icons[category?.toLowerCase()] || '📋';
  };

  const getStatusText = (status) => {
    return status === 'progress'
      ? 'In Progress'
      : status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const truncateDescription = (text, maxLength) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Error: User not found. Redirecting...</div>;
  }

  const filteredComplaints = getFilteredComplaints();

  const Loader = () => (
    <div className={styles.complaintsListLoader}>
      <div className={styles.loadingSpinner}></div>
      <div>Fetching complaints...</div>
    </div>
  );

  return (
    <div className={styles.mainContainer}>
      {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <h2>CitiSolve Staff</h2>
        <a onClick={() => navigate('/staff/home')} className={styles.navLink}>
          🏠 Home
        </a>
        <a className={`${styles.navLink} ${styles.active}`}>
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

      <div className={styles.main}>
        <div className={styles.topnav}>
          <div className={styles.menuIcon} onClick={toggleSidebar}>
            ☰
          </div>
          <div className={styles.breadcrumb}>
            <span>Department Complaints</span>
          </div>
          <div className={styles.profileSymbol} onClick={toggleProfileDropdown}>
            {user.fullname ? user.fullname[0].toUpperCase() : 'S'}
          </div>
          <div className={`${styles.profileDropdown} ${isProfileDropdownOpen ? styles.open : ''}`}>
            <div>
              <strong>Staff Member</strong>
            </div>
            <div>Email: {user.email}</div>
            <div>Department: {user.department}</div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
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
            </div>
          </div>
        </div>

        <div className={styles.content}>
            {successMessage && (
                <div className={styles.successMessage} style={{ display: 'block' }}>
                  {successMessage}
                </div>
            )}
          <div id="department-page" style={{ display: showDetailPage ? 'none' : 'block' }}>
            <div className={styles.welcomeSection}>
              <h1>📋 Department Complaints</h1>
              <div>Complaints assigned to your department, sorted by priority</div>
            </div>
            <div className={styles.complaintsContainer}>
              <div className={styles.filtersBar}>
                <div className={styles.filterGroup}>
                  <label>Priority:</label>
                  <select
                    id="dept-filter-priority"
                    className={styles.filterSelect}
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label>Status:</label>
                  <select
                    id="dept-filter-status"
                    className={styles.filterSelect}
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label>Sort By:</label>
                  <select
                    id="dept-filter-sortby"
                    className={styles.filterSelect}
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              <div id="department-complaints-list" className={styles.complaintsListArea}>
                {complaintsLoading ? (
                  <Loader />
                ) : filteredComplaints.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🔭</div>
                    <h3>No Complaints Found</h3>
                    <div>No complaints match your current filters.</div>
                  </div>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={styles.complaintItem}
                      onClick={() => handleComplaintClick(complaint)}
                      data-priority={complaint.priority}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.priorityIndicator}></div>
                      <div className={styles.complaintHeader}>
                        <div className={styles.complaintHeaderLeft}>
                          <div className={styles.complaintTitle}>{complaint.title}</div>
                          <div className={styles.complaintId}>CMPID: {complaint.id}</div>
                        </div>
                        <span className={`${styles.complaintBadge} ${styles['badge-' + complaint.status]}`}>
                          {getStatusText(complaint.status)}
                        </span>
                      </div>
                      <div className={styles.listDescription}>
                        {truncateDescription(complaint.description, 100)}
                      </div>
                      <div className={styles.complaintDetails}>
                        <span className={styles.detailItem}>
                          {getCategoryIcon(complaint.category)}{' '}
                          {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                        </span>
                        <span className={styles.detailItem}>📍 {complaint.location}</span>
                        <span className={styles.detailItem}>📅 {complaint.date}</span>
                        <span className={styles.detailItem}>
                          <span className={styles[`priority${complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}`]}>
                              ⚡ {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                          </span>
                           Priority
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div id="complaint-detail-page" style={{ display: showDetailPage ? 'block' : 'none' }}>
            <button className={styles.backButton} id="backToDept" onClick={handleBackToList}>
              ← Back to List
            </button>
            <div className={styles.welcomeSection}>
              <h1 id="detailComplaintTitle">{selectedComplaint ? selectedComplaint.title : 'Complaint Details'}</h1>
            </div>
            {selectedComplaint && (
            <>  
                {selectedComplaint.status === 'resolved' && (
                    <div className={styles.resolvedMessage}>
                      This complaint has been marked as resolved.
                    </div>
                )}
              <div className={styles.formCard}>
                <div id="complaintDetailContent">
                  <div className={styles.detailItemRow}>
                    <strong>CMPID:</strong>
                    <span>{selectedComplaint.id}</span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Title:</strong>
                    <span>{selectedComplaint.title}</span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Description:</strong>
                    <div className={styles.detailDescription}>
                      {selectedComplaint.description}
                    </div>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Category:</strong>
                    <span>{selectedComplaint.category}</span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Location:</strong>
                    <span>{selectedComplaint.location}</span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Priority:</strong>
                    <span className={styles[`priority${selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)}`]}>
                      {selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)}
                    </span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Status:</strong>
                    <span className={styles[`status${selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}`]}>
                      {getStatusText(selectedComplaint.status)}
                    </span>
                  </div>
                  <div className={styles.detailItemRow}>
                    <strong>Date:</strong>
                    <span>{selectedComplaint.date}</span>
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <select
                    id="updateStatus"
                    className={styles.filterSelect}
                    defaultValue={selectedComplaint.status}
                    disabled={isUpdateButtonDisabled}
                  >
                    <option value="pending">Pending</option>
                    <option value="progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    className={styles.btnPrimary}
                    id="updateComplaintBtn"
                    onClick={handleUpdateStatus}
                    disabled={isUpdateButtonDisabled}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </>
            )}
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

export default DepartmentComplaints;