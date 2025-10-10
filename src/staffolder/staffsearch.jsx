import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './staffsearchstyle.module.css';

const Loader = () => (
  <div className={styles.complaintsListLoader}>
    <div className={styles.loadingSpinner}></div>
    <div>Fetching complaints...</div>
  </div>
);

const SearchStaff = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [complaintsData, setComplaintsData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    priority: '',
    keyword: '',
  });

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdateButtonDisabled, setIsUpdateButtonDisabled] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const menuIconRef = useRef(null);
  
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

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/staff/complaints', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setComplaintsData(data.complaints);
        setSearchResults(data.complaints);
      } else {
        console.error('Failed to fetch complaints.');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndComplaints = async () => {
      setLoading(true);
      try {
        const resUser = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });

        if (resUser.ok) {
          const userData = await resUser.json();
          setUser(userData.user);
          await fetchComplaints();
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

    fetchUserAndComplaints();
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

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    const filterMap = {
      'searchDateFrom': 'dateFrom',
      'searchDateTo': 'dateTo',
      'searchStatus': 'status',
      'searchPriority': 'priority',
      'searchKeyword': 'keyword'
    };
    
    const filterKey = filterMap[id];
    if (filterKey) {
      setSearchFilters(prevState => ({
        ...prevState,
        [filterKey]: value,
      }));
    }
  };

  const parseIndianDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      
      return new Date(year, month, day);
    }
    
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleSearch = () => {
    let results = [...complaintsData];
    const { dateFrom, dateTo, status, priority, keyword } = searchFilters;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      results = results.filter(c => {
        const complaintDate = parseIndianDate(c.date);
        if (!complaintDate) {
          return false;
        }
        complaintDate.setHours(0, 0, 0, 0);
        return complaintDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      results = results.filter(c => {
        const complaintDate = parseIndianDate(c.date);
        if (!complaintDate) return false;
        return complaintDate <= toDate;
      });
    }

    if (status.trim()) {
      results = results.filter(c => 
        c.status && c.status.toLowerCase().includes(status.toLowerCase().trim())
      );
    }

    if (priority) {
      results = results.filter(c => 
        c.priority && c.priority.toLowerCase() === priority.toLowerCase()
      );
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase().trim();
      results = results.filter(c =>
        (c.title && c.title.toLowerCase().includes(lowerKeyword)) ||
        (c.description && c.description.toLowerCase().includes(lowerKeyword)) ||
        (c.location && c.location.toLowerCase().includes(lowerKeyword))
      );
    }
    
    setSearchResults(results);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      priority: '',
      keyword: '',
    });
    setSearchResults(complaintsData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailPage(true);
    setIsUpdateButtonDisabled(complaint.status === 'resolved');
  };

  const handleBackToList = () => {
    setShowDetailPage(false);
    setSelectedComplaint(null);
    setSuccessMessage('');
  };

  const handleUpdateStatus = async () => {
    const newStatus = document.getElementById('updateStatus').value;
    const isCurrentlyResolved = selectedComplaint.status === 'resolved';

    if (isCurrentlyResolved && newStatus !== 'resolved') {
      alert('A resolved complaint cannot be reverted.');
      return;
    }

    if (newStatus === 'resolved' && !isCurrentlyResolved) {
      const confirmed = window.confirm('Are you sure you want to set this complaint to "Resolved"? This action cannot be undone.');
      if (!confirmed) {
          return;
      }
    }

    setComplaintsLoading(true);
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
        setComplaintsData((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id ? { ...c, status: newStatus } : c
          )
        );
        setSearchResults((prev) =>
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
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Error updating status');
    } finally {
      setComplaintsLoading(false);
    }
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
    return <div className={styles.pageLoader}><div className={styles.loadingSpinner}></div><div>Loading...</div></div>;
  }

  if (!user) {
    return <div className={styles.errorContainer}>Error: User not found. Redirecting...</div>;
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
        <a className={`${styles.navLink} ${styles.active}`}>
          🔍 Advanced Search
        </a>
        <a onClick={() => navigate("/staff/faq")} className={styles.navLink}>
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
            <span>Advanced Search</span>
          </div>
          <div className={styles.profileSymbol} onClick={toggleProfileDropdown}>
            {user.fullname ? user.fullname[0].toUpperCase() : 'S'}
          </div>
          <div className={`${styles.profileDropdown} ${isProfileDropdownOpen ? styles.open : ''}`}>
            <div>
              <strong>Staff Member</strong>
            </div>
            <div>Name: {user.fullname}</div>
            <div>Email: {user.email}</div>
            <div>Department: {user.department}</div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <a href="#" style={{ color: '#4a90e2', textDecoration: 'none' }}>
                Settings
              </a>{' '}
              |{' '}
              <a onClick={handleLogout} style={{ color: '#4a90e2', textDecoration: 'none', cursor: 'pointer' }}>
                Logout
              </a>
            </div>
          </div>
        </div>

        <div className={styles.content} id="search-page">
          {successMessage && (
            <div className={styles.successMessage} style={{ display: 'block' }}>
              {successMessage}
            </div>
          )}
          {!showDetailPage ? (
            <>
              <div className={styles.welcomeSection}>
                <h1>🔍 Advanced Search</h1>
                <div>Search complaints by multiple criteria</div>
              </div>
              <div className={styles.formCard}>
                <h2 style={{ marginBottom: '24px' }}>Search Filters</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="searchDateFrom">Date From:</label>
                  <input 
                    type="date" 
                    id="searchDateFrom" 
                    onChange={handleInputChange} 
                    onKeyPress={handleKeyPress}
                    value={searchFilters.dateFrom}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="searchDateTo">Date To:</label>
                  <input 
                    type="date" 
                    id="searchDateTo" 
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    value={searchFilters.dateTo} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="searchStatus">Status:</label>
                  <select 
                    id="searchStatus" 
                    onChange={handleInputChange} 
                    value={searchFilters.status}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="progress">In Progress</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="searchPriority">Priority:</label>
                  <select 
                    id="searchPriority" 
                    onChange={handleInputChange} 
                    value={searchFilters.priority}
                  >
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="searchKeyword">Keyword:</label>
                  <input 
                    type="text" 
                    id="searchKeyword" 
                    placeholder="Search by title, description, or location" 
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    value={searchFilters.keyword} 
                  />
                </div>
                
                <div className={styles.buttonGroup}>
                  <button className={styles.btnPrimary} onClick={handleSearch}>
                    Search
                  </button>
                  <button className={styles.btnSecondary} onClick={handleClearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className={styles.complaintsContainer} style={{ marginTop: '24px' }}>
                <div className={styles.complaintsHeader}>
                  Search Results ({searchResults.length} {searchResults.length === 1 ? 'complaint' : 'complaints'})
                </div>
                <div id="search-results-list">
                  {complaintsLoading ? (
                    <Loader />
                  ) : searchResults.length > 0 ? (
                    searchResults.map(complaint => {
                      const statusClass = 'badge-' + complaint.status;
                      const statusText = getStatusText(complaint.status);
                      return (
                        <div
                          className={styles.complaintItem}
                          key={complaint.id}
                          onClick={() => handleComplaintClick(complaint)}
                          data-priority={complaint.priority}
                        >
                          <div className={styles.priorityIndicator}></div>
                          <div className={styles.complaintHeader}>
                            <div className={styles.complaintHeaderLeft}>
                              <div className={styles.complaintTitle}>{complaint.title}</div>
                              <div className={styles.complaintId}>CMPID: {complaint.id}</div>
                            </div>
                            <div className={`${styles.complaintBadge} ${styles[statusClass]}`}>{statusText}</div>
                          </div>
                          <div className={styles.listDescription}>
                            {truncateDescription(complaint.description, 100)}
                          </div>
                          <div className={styles.complaintDetails}>
                            <div className={styles.detailItem}>
                              <div className={styles.detailIcon}>📍</div>
                              <div className={styles.detailText}>{complaint.location}</div>
                            </div>
                            <div className={styles.detailItem}>
                              <div className={styles.detailIcon}>📅</div>
                              <div className={styles.detailText}>{complaint.date}</div>
                            </div>
                            <div className={styles.detailItem}>
                              <div className={styles.detailIcon}>⚡</div>
                              <div className={`${styles.detailText} ${styles[`priority${complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}`]}`}>
                                {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)} Priority
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.noResults}>
                      <div className={styles.noResultsText}>No complaints match your search criteria.</div>
                      <button className={styles.btnSecondary} onClick={handleClearFilters}>
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div id="complaint-detail-page" className={styles.formCard}>
              {complaintsLoading && <Loader />}
              <button className={styles.backButton} id="backToSearch" onClick={handleBackToList}>
                ← Back to Search
              </button>
              <div className={styles.welcomeSection}>
                <h1 id="detailComplaintTitle">Complaint Details</h1>
              </div>
              
              {selectedComplaint && (
                <>
                  {selectedComplaint.status === 'resolved' && (
                    <div className={styles.resolvedMessage}>
                      This complaint has been marked as resolved.
                    </div>
                  )}
                  <div id="complaintDetailContent">
                    <div className={styles.detailField}>
                      <strong>CMPID:</strong> <div>{selectedComplaint.id}</div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Title:</strong> <div>{selectedComplaint.title}</div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Description:</strong> 
                      <div className={styles.detailDescription}>
                        {selectedComplaint.description}
                      </div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Category:</strong> <div>{selectedComplaint.category}</div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Location:</strong> <div>{selectedComplaint.location}</div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Priority:</strong> 
                      <div className={styles[`priority${selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)}`]}>
                        {selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)}
                      </div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Status:</strong> 
                      <div className={styles[`status${selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}`]}>
                        {getStatusText(selectedComplaint.status)}
                      </div>
                    </div>
                    <div className={styles.detailField}>
                      <strong>Date:</strong> <div>{selectedComplaint.date}</div>
                    </div>
                  </div>
                  <div className={styles.updateStatusContainer}>
                    <select
                      id="updateStatus"
                      className={styles.updateStatusSelect}
                      defaultValue={selectedComplaint.status}
                      disabled={isUpdateButtonDisabled}
                    >
                      <option value="pending">Pending</option>
                      <option value="progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      className={styles.updateStatusBtn}
                      id="updateComplaintBtn"
                      onClick={handleUpdateStatus}
                      disabled={isUpdateButtonDisabled}
                    >
                      Update Status
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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

export default SearchStaff;