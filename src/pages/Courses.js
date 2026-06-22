import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBook, FiSearch, FiClock, FiUser, FiPlus } from 'react-icons/fi';
import './Courses.css';

const CATEGORIES = ['All', 'Programming', 'Design', 'Mathematics', 'Science', 'Business', 'Language'];

export default function Courses() {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const isInstructor = userProfile?.role === 'instructor';

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let result = courses;
    if (search) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category !== 'All') {
      result = result.filter(c => c.category === category);
    }
    setFiltered(result);
  }, [courses, search, category]);

  async function fetchCourses() {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(data);
      setFiltered(data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

 async function enroll(courseId) {
  if (!currentUser) return;
  try {
    const userRef = doc(db, 'users', currentUser.uid);

    // Check if user document exists first
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Document missing — create it with setDoc
      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'User',
        role: 'student',
        createdAt: new Date().toISOString(),
        bio: '',
        enrolledCourses: [courseId],
        completedLessons: [],
        badges: [],
        quizResults: {}
      });
    } else {
      // Document exists — safely update
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(courseId)
      });
    }

    setUserProfile(prev => ({
      ...(prev || {}),
      enrolledCourses: [...((prev?.enrolledCourses) || []), courseId]
    }));
    toast.success('Enrolled successfully! 🎉');
  } catch (err) {
    console.error('Enroll error:', err); // <-- check this in DevTools
    toast.error(err.message || 'Failed to enroll');
  }
}

  const isEnrolled = (courseId) => userProfile?.enrolledCourses?.includes(courseId);

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p>Loading courses...</p>
    </div>
  );

  return (
    <div className="courses-page fade-in">
      <div className="page-title-row">
        <div>
          <h1>Courses</h1>
          <p className="page-subtitle">{filtered.length} course{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
        {isInstructor && (
          <Link to="/manage-course" className="btn btn-primary">
            <FiPlus /> New Course
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="search-bar card">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <FiBook />
          <h3>No courses found</h3>
          <p>{search ? 'Try a different search term' : 'No courses in this category yet'}</p>
          {isInstructor && <Link to="/manage-course" className="btn btn-primary">Create Course</Link>}
        </div>
      ) : (
        <div className="courses-list">
          {filtered.map(course => (
            <div key={course.id} className="course-item card">
              <div
                className="course-banner"
                style={{ background: course.color || 'linear-gradient(135deg,#6C63FF,#43D9AD)' }}
              >
                <span className="course-emoji">{course.emoji || '📚'}</span>
                {isEnrolled(course.id) && (
                  <span className="enrolled-badge">✓ Enrolled</span>
                )}
              </div>
              <div className="course-body">
                <div className="course-category-tag">
                  <span className="badge badge-primary">{course.category || 'General'}</span>
                </div>
                <h3>{course.title}</h3>
                <p className="course-desc">{course.description}</p>
                <div className="course-footer">
                  <div className="course-meta-row">
                    <span><FiClock /> {course.lessonCount || 0} lessons</span>
                    <span><FiUser /> {course.instructorName || 'Instructor'}</span>
                  </div>
                  <div className="course-actions">
                    <Link to={`/courses/${course.id}`} className="btn btn-outline btn-sm">
                      View
                    </Link>
                    {!isInstructor && !isEnrolled(course.id) && (
                      <button className="btn btn-primary btn-sm" onClick={() => enroll(course.id)}>
                        Enroll
                      </button>
                    )}
                    {isInstructor && course.instructorId === currentUser?.uid && (
                      <Link to={`/manage-course/${course.id}`} className="btn btn-outline btn-sm">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
