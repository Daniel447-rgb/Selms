import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiStar, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName, form.role);
      toast.success('Account created! Welcome to SELMS 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <FiStar className="brand-icon" />
          <h1>SELMS</h1>
          <p>Self E-Learning Management System</p>
        </div>
        <div className="auth-illustration">
          <div className="floating-card fc1"><span>🎯</span><p>Self-paced</p></div>
          <div className="floating-card fc2"><span>🎓</span><p>Earn Badges</p></div>
          <div className="floating-card fc3"><span>📊</span><p>Analytics</p></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box fade-in">
          <div className="auth-header">
            <h2>Create account</h2>
            <p>Start learning today — it's free</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" />
                <input type="text" placeholder="John Doe" value={form.displayName} onChange={update('displayName')} />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" />
                <input type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
              </div>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={update('role')} style={{padding:'0.75rem 1rem',borderRadius:'10px',border:'2px solid var(--border)',fontFamily:'var(--font)',fontSize:'0.95rem',background:'var(--bg)',outline:'none',width:'100%'}}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={update('password')} />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input type="password" placeholder="Repeat password" value={form.confirm} onChange={update('confirm')} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
