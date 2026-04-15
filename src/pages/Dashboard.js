import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiBook, FiCheckSquare, FiBarChart2, FiAward, FiArrowRight, FiClock } from 'react-icons/fi';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({ courses: 0, completed: 0, quizzes: 0, score: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecentCourses(courses.slice(0, 3));

        const enrolledCount = userProfile?.enrolledCourses?.length || 0;
        const completedCount = userProfile?.completedLessons?.length || 0;

        setStats({
          courses: enrolledCount,
          completed: completedCount,
          quizzes: 0,
          score: completedCount > 0 ? Math.round((completedCount / Math.max(enrolledCount * 5, 1)) * 100) : 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userProfile]);

  const statCards = [
    { icon: FiBook, label: 'Enrolled Courses', value: stats.courses, color: '#6C63FF', bg: '#EEF0FF' },
    { icon: FiCheckSquare, label: 'Lessons Done', value: stats.completed, color: '#43D9AD', bg: '#E6FFF8' },
    { icon: FiBarChart2, label: 'Progress %', value: `${stats.score}%`, color: '#FFB547', bg: '#FFF8E6' },
    { icon: FiAward, label: 'Badges', value: userProfile?.badges?.length || 0, color: '#FF6584', bg: '#FFF0F3' },
  ];

  return (
    <div className="dashboard fade-in">
      {/* Hero */}
      <div className="dashboard-hero">
        <div>
          <p className="greeting-label">{greeting} 👋</p>
          <h1 className="greeting-name">{currentUser?.displayName || 'Learner'}</h1>
          <p className="greeting-sub">
            {userProfile?.role === 'instructor'
              ? 'Ready to inspire your students today?'
              : 'Continue your learning journey.'}
          </p>
        </div>
        <div className="hero-avatar">
          {currentUser?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="stat-card card">
            <div className="stat-icon" style={{ background: bg, color }}>
              <Icon />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="section-header">
        <h2>Available Courses</h2>
        <Link to="/courses" className="see-all">See all <FiArrowRight /></Link>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{padding:'2rem'}}>
          <div className="spinner" />
        </div>
      ) : recentCourses.length === 0 ? (
        <div className="card empty-state" style={{padding:'2rem'}}>
          <FiBook />
          <h3>No courses yet</h3>
          <p>Courses will appear here once instructors add them</p>
        </div>
      ) : (
        <div className="courses-grid">
          {recentCourses.map(course => (
            <Link key={course.id} to={`/courses/${course.id}`} className="course-card card">
              <div className="course-thumb" style={{ background: course.color || 'linear-gradient(135deg,#6C63FF,#43D9AD)' }}>
                <span>{course.emoji || '📚'}</span>
              </div>
              <div className="course-info">
                <h3>{course.title}</h3>
                <p>{course.description?.slice(0, 70)}...</p>
                <div className="course-meta">
                  <span className="badge badge-primary">{course.category || 'General'}</span>
                  <span className="course-lessons">
                    <FiClock /> {course.lessonCount || 0} lessons
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="section-header" style={{marginTop:'1.5rem'}}>
        <h2>Quick Actions</h2>
      </div>
      <div className="quick-actions">
        <Link to="/quizzes" className="quick-action-btn">
          <FiCheckSquare /> Take a Quiz
        </Link>
        <Link to="/progress" className="quick-action-btn">
          <FiBarChart2 /> View Progress
        </Link>
        <Link to="/messages" className="quick-action-btn">
          💬 Messages
        </Link>
      </div>
    </div>
  );
}
