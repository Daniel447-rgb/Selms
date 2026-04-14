import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiEdit2, FiSave, FiUser, FiMail, FiBook, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const { currentUser, userProfile, setUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: userProfile?.displayName || '',
    bio: userProfile?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const initials = currentUser?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function saveProfile() {
    if (!form.displayName.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: form.displayName });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: form.displayName,
        bio: form.bio
      });
      setUserProfile(prev => ({ ...prev, displayName: form.displayName, bio: form.bio }));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const stats = [
    { label: 'Enrolled', value: userProfile?.enrolledCourses?.length || 0, icon: FiBook },
    { label: 'Completed Lessons', value: userProfile?.completedLessons?.length || 0, icon: FiBook },
    { label: 'Badges', value: userProfile?.badges?.length || 0, icon: '🏆' },
  ];

  return (
    <div className="profile-page fade-in">
      {/* Profile Card */}
      <div className="profile-card card">
        <div className="profile-banner" />
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
        </div>
        <div className="profile-header-info">
          {!editing ? (
            <>
              <h1>{userProfile?.displayName || 'User'}</h1>
              <p className="profile-email"><FiMail /> {currentUser?.email}</p>
              <span className={`badge ${userProfile?.role === 'instructor' ? 'badge-warning' : 'badge-primary'}`}>
                {userProfile?.role || 'student'}
              </span>
              {userProfile?.bio && <p className="profile-bio">{userProfile.bio}</p>}
            </>
          ) : (
            <div className="profile-edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.displayName} onChange={update('displayName')} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={update('bio')} placeholder="Tell us about yourself..." rows={3} />
              </div>
            </div>
          )}
        </div>

        <div className="profile-actions">
          {!editing ? (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              <FiEdit2 /> Edit Profile
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="profile-stat-card card">
            <span className="ps-value">{value}</span>
            <span className="ps-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div className="account-section card">
        <h2>Account Details</h2>
        <div className="account-item">
          <FiUser />
          <div>
            <p className="ai-label">Display Name</p>
            <p className="ai-value">{currentUser?.displayName}</p>
          </div>
        </div>
        <div className="account-item">
          <FiMail />
          <div>
            <p className="ai-label">Email</p>
            <p className="ai-value">{currentUser?.email}</p>
          </div>
        </div>
        <div className="account-item">
          <FiBook />
          <div>
            <p className="ai-label">Role</p>
            <p className="ai-value" style={{ textTransform: 'capitalize' }}>{userProfile?.role}</p>
          </div>
        </div>
        <div className="account-item">
          <span>📅</span>
          <div>
            <p className="ai-label">Member Since</p>
            <p className="ai-value">
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <button className="btn btn-danger logout-btn" onClick={handleLogout}>
        <FiLogOut /> Sign Out
      </button>
    </div>
  );
}
