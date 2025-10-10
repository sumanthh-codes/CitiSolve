import React, { useState, useEffect } from 'react';
import styles from './adminusersstyle.module.css';

const UsersPage = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: 'all' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    wardOrDept: '',
    password: '',
  });

  const departments = ['Roads', 'Water', 'Power', 'Sanitation', 'Others'];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/auth/admin/complaints');
        const data = await res.json();
        if (res.ok) {
          setUsersData(data.users || []);
        } else {
          console.error('Failed to fetch users:', data.error);
          setUsersData([]);
        }
      } catch (error) {
        console.error('Error in initial fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Enhanced search function that searches ALL fields
  const getFilteredUsers = () => {
    return usersData.filter((user) => {
      // Role/type filter
      const typeMatch = filters.role === 'all' || user.role === filters.role;
      
      // Comprehensive search across all fields
      if (searchTerm === '') {
        return typeMatch;
      }

      const searchLower = searchTerm.toLowerCase();
      
      // Convert all user fields to searchable strings
      const searchableFields = [
        user.id,
        user.fullname,
        user.email,
        user.role,
        user.ward,
        user.department,
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.created_at ? new Date(user.created_at).toLocaleString() : '',
      ];

      // Check if search term exists in any field
      const searchMatch = searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );

      return typeMatch && searchMatch;
    });
  };

  const getUserTypeBadge = (role) => {
    let badgeClass = '';
    if (role === 'citizen') badgeClass = 'badgePrimary';
    else if (role === 'staff') badgeClass = 'badgeProgress';
    else if (role === 'admin') badgeClass = 'badgeDanger';
    return <span className={`${styles.badge} ${styles[badgeClass]}`}>{role.toUpperCase()}</span>;
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.fullname || '',
      email: user.email || '',
      role: user.role || '',
      wardOrDept: user.ward || user.department || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/admin/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id }),
        credentials: 'include',
      });
      if (res.ok) {
        setUsersData(usersData.filter((u) => u.id !== selectedUser.id));
      } else {
        const data = await res.json();
        console.error('Failed to delete user:', data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setEditForm({
      name: '',
      email: '',
      role: 'citizen',
      wardOrDept: '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/admin/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Failed to add user: ' + (data.error || 'Unknown error'));
        return;
      }
      setUsersData([...usersData, data.newUser]);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('An error occurred while adding the user.');
    }
  };

  // CSV Export function
  const handleExportCSV = () => {
    const filteredUsers = getFilteredUsers();
    
    if (filteredUsers.length === 0) {
      alert('No users to export');
      return;
    }

    // CSV Headers
    const headers = ['ID', 'Name', 'Email', 'Type', 'Ward/Department', 'Joined Date'];
    
    // Convert users to CSV rows
    const csvRows = filteredUsers.map(user => [
      user.id || '',
      user.fullname || '',
      user.email || '',
      user.role || '',
      user.ward || user.department || '',
      user.created_at ? new Date(user.created_at).toLocaleString() : ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="7" className={styles.loadingCell}>
            <div className={styles.spinner}></div>
            <p>Loading users...</p>
          </td>
        </tr>
      );
    }
    const filteredUsers = getFilteredUsers();
    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan="7" className={styles.noDataCell}>
            No users found
          </td>
        </tr>
      );
    }
    return filteredUsers.map((user) => {
      if (!user) return null;
      return (
        <tr key={user.id}>
          <td data-label="ID">
            <strong>{user.id}</strong>
          </td>
          <td data-label="Name" className={styles.truncatedText} title={user.fullname}>
            {user.fullname}
          </td>
          <td data-label="Email" className={styles.truncatedText} title={user.email}>
            {user.email || 'N/A'}
          </td>
          <td data-label="Type">{getUserTypeBadge(user.role)}</td>
          <td data-label="Ward/Department" className={styles.truncatedText} title={user.ward || user.department}>
            {user.ward || user.department || 'N/A'}
          </td>
          <td data-label="Joined">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </td>
          <td data-label="Actions" className={styles.actionCell}>
            <button className={`${styles.actionBtn} ${styles.view}`} title="View Details" onClick={() => handleViewDetails(user)}>
              👁️
            </button>
            <button className={`${styles.actionBtn} ${styles.delete}`} title="Delete" onClick={() => handleDeleteClick(user)}>
              🗑️
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className={styles.contentArea}>
      <div className={styles.pageHeader}>
        <h2>All Users</h2>
        <div className={styles.pageActions}>
          <button className={styles.btnSecondary} onClick={handleExportCSV}>📥 Export CSV</button>
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>User Type:</label>
          <select name="role" className={styles.filterSelect} value={filters.role} onChange={handleFilterChange}>
            <option value="all">All Users</option>
            <option value="citizen">Citizens</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Search by ID, Name, Email..."
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
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Ward/Department</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      {showDetailModal && selectedUser && (
        <div className={styles.modalBackdrop} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>User Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>ID:</strong>
                  <span>{selectedUser.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Name:</strong>
                  <span>{selectedUser.fullname}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Email:</strong>
                  <span>{selectedUser.email || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Type:</strong>
                  <span>{getUserTypeBadge(selectedUser.role)}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Ward/Department:</strong>
                  <span>{selectedUser.ward || selectedUser.department || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Joined:</strong>
                  <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && selectedUser && (
        <div className={styles.modalBackdrop} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Confirm Deletion</h3>
              <button className={styles.closeBtn} onClick={() => setShowConfirmModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete user **{selectedUser.fullname}**?</p>
              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className={styles.btnDanger} onClick={handleConfirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;