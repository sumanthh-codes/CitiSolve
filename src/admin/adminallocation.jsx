import React, { useEffect, useState } from 'react';
import styles from './admincomplaintsstyles.module.css';

const AllocationPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch complaints
        const complaintsRes = await fetch('http://localhost:5000/api/auth/admin/complaintsallocation', {
          credentials: 'include'
        });
        const complaintsData = await complaintsRes.json();
        
        if (complaintsRes.ok) {
          setComplaints(complaintsData.complaints || []);
        } else {
          console.error('Failed to fetch complaints:', complaintsData.error);
          setComplaints([]);
        }

        // Fetch staff members
        const staffRes = await fetch('http://localhost:5000/api/auth/admin/staff', {
          credentials: 'include'
        });
        const staffData = await staffRes.json();
        
        if (staffRes.ok) {
          setStaff(staffData.staff || []);
        } else {
          console.error('Failed to fetch staff:', staffData.error);
          setStaff([]);
        }
      } catch (error) {
        console.error('Error in initial fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getFilteredComplaints = () => {
    return complaints.filter((c) => {
      const statusMatch = filters.status === 'all' || c.status === filters.status;
      const categoryMatch = filters.category === 'all' || c.category === filters.category;
      const priorityMatch = filters.priority === 'all' || c.priority === filters.priority;

      if (searchTerm === '') {
        return statusMatch && categoryMatch && priorityMatch;
      }

      const searchLower = searchTerm.toLowerCase();
      
      const searchableFields = [
        c.id?.toString(),
        c.user_id?.toString(),
        c.user_email?.toString(),
        c.title?.toString(),
        c.description?.toString(),
        c.category?.toString(),
        c.location?.toString(),
        c.priority?.toString(),
        c.status?.toString(),
        c.created_at ? new Date(c.created_at).toLocaleString() : '',
      ];

      const searchMatch = searchableFields.some(field => 
        field && field.toLowerCase().includes(searchLower)
      );

      return statusMatch && categoryMatch && priorityMatch && searchMatch;
    });
  };

  const handleExportCSV = () => {
    const filteredComplaints = getFilteredComplaints();
    
    if (filteredComplaints.length === 0) {
      alert('No complaints to export');
      return;
    }

    const headers = [
      'ID',
      'User ID',
      'User Email',
      'Title',
      'Description',
      'Category',
      'Location',
      'Priority',
      'Status',
      'Created At',
      'Image URL'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredComplaints.map(c => {
        const formattedCreatedAt = c.created_at ? `"${new Date(c.created_at).toLocaleString().replace(/"/g, '""')}"` : '""';

        const row = [
          `"${c.id || ''}"`,
          `"${c.user_id || ''}"`,
          `"${c.user_email || ''}"`,
          `"${(c.title || '').replace(/"/g, '""')}"`,
          `"${(c.description || '').replace(/"/g, '""')}"`,
          `"${c.category || ''}"`,
          `"${(c.location || '').replace(/"/g, '""')}"`,
          `"${c.priority || ''}"`,
          `"${c.status || ''}"`,
          formattedCreatedAt,
          `"${c.imageurl || ''}"`
        ];
        return row.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

  const getMatchingStaff = (complaint) => {
    // Filter staff members by matching department (category)
    return staff.filter(s => s.department === complaint.category);
  };

  const handleAllocateClick = (complaint) => {
    if (complaint.status === 'resolved') {
      alert('Cannot allocate a resolved complaint');
      return;
    }

    const matchingStaff = getMatchingStaff(complaint);
    if (matchingStaff.length === 0) {
      alert(`No staff members available for ${complaint.category} department`);
      return;
    }

    setSelectedComplaint(complaint);
    setSelectedStaffId('');
    setShowAllocationModal(true);
  };

  const handleRandomAllocation = () => {
    const matchingStaff = getMatchingStaff(selectedComplaint);
    if (matchingStaff.length === 0) {
      alert('No staff members available for this department');
      return;
    }
    const randomStaff = matchingStaff[Math.floor(Math.random() * matchingStaff.length)];
    setSelectedStaffId(randomStaff.id);
  };

  const handleAllocationSubmit = async () => {
    if (!selectedStaffId) {
      alert('Please select a staff member');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/admin/complaints/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          staffId: selectedStaffId
        }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert('Failed to allocate complaint: ' + (data.error || 'Unknown error'));
        return;
      }

      // Update complaint status in local state
      setComplaints(
        complaints.filter((u) => u.id !== selectedComplaint.id)
      );

      setShowAllocationModal(false);
      alert('Complaint allocated successfully');
    } catch (error) {
      console.error('Error allocating complaint:', error);
      alert('Error allocating complaint');
    }
  };

  const handleImageClick = () => {
    setShowImageViewer(true);
  };

  const getStatusBadge = (status) => {
    if (!status) return 'N/A';
    const statusText = status === 'progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
    let badgeClass = '';
    if (status === 'pending') badgeClass = 'badgePending';
    else if (status === 'progress') badgeClass = 'badgeProgress';
    else if (status === 'resolved') badgeClass = 'badgeResolved';
    return <span className={`${styles.badge} ${styles[badgeClass]}`}>{statusText}</span>;
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return 'N/A';
    let badgeClass = '';
    if (priority === 'high') badgeClass = 'badgeHigh';
    else if (priority === 'medium') badgeClass = 'badgeMedium';
    else if (priority === 'low') badgeClass = 'badgeLow';
    return <span className={`${styles.badge} ${styles[badgeClass]}`}>{priority.toUpperCase()}</span>;
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="9" className={styles.loadingCell}>
            <div className={styles.spinner}></div>
            <p>Loading complaints...</p>
          </td>
        </tr>
      );
    }

    const filteredComplaints = getFilteredComplaints();
    if (filteredComplaints.length === 0) {
      return (
        <tr>
          <td colSpan="9" className={styles.noDataCell}>
            No complaints found
          </td>
        </tr>
      );
    }

    return filteredComplaints.map((c) => (
      <tr key={c.id}>
        <td data-label="ID">
          <strong>{c.id}</strong>
        </td>
        <td data-label="User ID" className={styles.truncatedText} title={c.user_id}>
          {c.user_id}
        </td>
        <td data-label="User Email" className={styles.truncatedText} title={c.user_email}>
          {c.user_email || 'N/A'}
        </td>
        <td data-label="Title" className={styles.truncatedText} title={c.title}>
          {c.title}
        </td>
        <td data-label="Category">
          {c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : 'N/A'}
        </td>
        <td data-label="Location" className={styles.truncatedText} title={c.location}>
          {c.location}
        </td>
        <td data-label="Priority">{getPriorityBadge(c.priority)}</td>
        <td data-label="Status">{getStatusBadge(c.status)}</td>
        <td data-label="Actions" className={styles.actionCell}>
          <button 
            className={`${styles.actionBtn} ${styles.view}`} 
            title="View Details" 
            onClick={() => handleViewDetails(c)}
          >
            👁️
          </button>
          <button
            className={`${styles.actionBtn} ${styles.edit}`}
            title={c.status === 'resolved' ? 'Cannot allocate resolved complaint' : 'Allocate'}
            onClick={() => handleAllocateClick(c)}
            disabled={c.status === 'resolved'}
          >
            Allocate
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className={styles.contentArea}>
      <div className={styles.pageHeader}>
        <h2>Complaint Allocation</h2>
        <div className={styles.pageActions}>
          <button className={styles.btnPrimary} onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button
            className={styles.btnSecondary}
            onClick={() => {
              setFilters({ status: 'all', category: 'all', priority: 'all' });
              setSearchTerm('');
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select 
            name="status" 
            className={styles.filterSelect} 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Category:</label>
          <select 
            name="category" 
            className={styles.filterSelect} 
            value={filters.category} 
            onChange={handleFilterChange}
          >
            <option value="all">All Categories</option>
            <option value="roads">Roads</option>
            <option value="water">Water</option>
            <option value="power">Power</option>
            <option value="sanitation">Sanitation</option>
            <option value="others">Others</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Priority:</label>
          <select 
            name="priority" 
            className={styles.filterSelect} 
            value={filters.priority} 
            onChange={handleFilterChange}
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Search across all fields..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>User Email</th>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className={styles.modalBackdrop} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Complaint Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>ID:</strong>
                  <span>{selectedComplaint.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>User ID:</strong>
                  <span>{selectedComplaint.user_id}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>User Email:</strong>
                  <span>{selectedComplaint.user_email || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Category:</strong>
                  <span>{selectedComplaint.category ? selectedComplaint.category.charAt(0).toUpperCase() + selectedComplaint.category.slice(1) : 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Priority:</strong>
                  <span>{getPriorityBadge(selectedComplaint.priority)}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Status:</strong>
                  <span>{getStatusBadge(selectedComplaint.status)}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <strong>Title:</strong>
                  <span>{selectedComplaint.title}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <strong>Location:</strong>
                  <span>{selectedComplaint.location}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <strong>Created At:</strong>
                  <span>{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.fullWidth} ${styles.description}`}>
                  <strong>Description:</strong>
                  <p>{selectedComplaint.description || 'N/A'}</p>
                </div>
                {selectedComplaint.imageurl && (
                  <div className={`${styles.detailItem} ${styles.fullWidth} ${styles.imageContainer}`}>
                    <strong>Image:</strong>
                    <img 
                      src={selectedComplaint.imageurl} 
                      alt="Complaint" 
                      onClick={handleImageClick} 
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && selectedComplaint && (
        <div className={styles.modalBackdrop} onClick={() => setShowAllocationModal(false)}>
          <div className={`${styles.modalContent} ${styles.editModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Allocate Complaint #{selectedComplaint.id}</h3>
              <button className={styles.closeBtn} onClick={() => setShowAllocationModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="staffSelect">Select Staff Member ({selectedComplaint.category} department)</label>
                  <select
                    id="staffSelect"
                    className={styles.filterSelect}
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">-- Select Staff --</option>
                    {getMatchingStaff(selectedComplaint).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>&nbsp;</label>
                  <button 
                    className={styles.btnSecondary} 
                    onClick={handleRandomAllocation}
                    type="button"
                  >
                    Assign Randomly 🔀
                  </button>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.btnSecondary} 
                  onClick={() => setShowAllocationModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={styles.btnPrimary} 
                  onClick={handleAllocationSubmit}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && selectedComplaint && selectedComplaint.imageurl && (
        <div className={styles.imageViewer} onClick={() => setShowImageViewer(false)}>
          <button className={styles.closeImageViewer} onClick={() => setShowImageViewer(false)}>
            ×
          </button>
          <img 
            src={selectedComplaint.imageurl} 
            alt="Complaint Full Screen" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default AllocationPage;