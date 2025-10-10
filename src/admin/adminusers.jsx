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

  const getFilteredUsers = () => {
    return usersData.filter((user) => {
      // Use user.role instead of user.type for filtering
      const typeMatch = filters.role === 'all' || user.role === filters.role;
      const searchLower = searchTerm.toLowerCase();
      const searchMatch =
        searchTerm === '' ||
        (user.fullname && user.fullname.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.ward && user.ward.toLowerCase().includes(searchLower)) ||
        (user.department && user.department.toLowerCase().includes(searchLower)) ||
        (user.id && user.id.toLowerCase().includes(searchLower));
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

  const handleEditSubmit = async () => {
    try {
      const { password, ...formData } = editForm;
      const res = await fetch(`http://localhost:5000/api/auth/admin/users/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Failed to update user: ' + (data.error || 'Unknown error'));
        return;
      }
      setUsersData(
        usersData.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                fullname: editForm.name,
                email: editForm.email,
                role: editForm.role,
                ward: editForm.role === 'citizen' ? editForm.wardOrDept : u.ward,
                department: editForm.role === 'staff' ? editForm.wardOrDept : u.department,
              }
            : u
        )
      );
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('An error occurred while updating the user.');
    }
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
            <button className={`${styles.actionBtn} ${styles.edit}`} title="Edit" onClick={() => handleEditClick(user)}>
              ✏️
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
          <button className={styles.btnPrimary} onClick={handleAddUser}>
            ➕ Add User
          </button>
          <button className={styles.btnSecondary}>📥 Export CSV</button>
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

      {showEditModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowEditModal(false)}>
          <div className={`${styles.modalContent} ${styles.editModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedUser ? `Edit User: ${selectedUser.fullname}` : 'Add New User'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={styles.formInput}
                  value={editForm.name}
                  onChange={onFormChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={styles.formInput}
                  value={editForm.email}
                  onChange={onFormChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">User Type</label>
                <select id="role" name="role" className={styles.formSelect} value={editForm.role} onChange={onFormChange}>
                  <option value="citizen">Citizen</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(editForm.role === 'citizen' || editForm.role === 'staff') && (
                <div className={styles.formGroup}>
                  <label htmlFor="wardOrDept">
                    {editForm.role === 'citizen' ? 'Ward' : 'Department'}
                  </label>
                  <input
                    type="text"
                    id="wardOrDept"
                    name="wardOrDept"
                    className={styles.formInput}
                    value={editForm.wardOrDept}
                    onChange={onFormChange}
                  />
                </div>
              )}

              {!selectedUser && (
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={styles.formInput}
                    onChange={onFormChange}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className={styles.btnPrimary} onClick={selectedUser ? handleEditSubmit : handleAddSubmit}>
                  {selectedUser ? 'Save Changes' : 'Add User'}
                </button>
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