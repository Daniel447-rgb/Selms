import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiPlay, FiFileText, FiLock, FiCheckCircle,
  FiUser, FiClock, FiBook
} from 'react-icons/fi';
import './CourseDetail.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const isEnrolled = userProfile?.enrolledCourses?.includes(courseId);
  const isInstructor = userProfile?.role === 'instructor';

  useEffect(() => {
    fetchCourse(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCourse() {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) { navigate('/courses'); return; }
      setCourse({ id: courseDoc.id, ...courseDoc.data() });

      const lessonsSnap = await getDocs(collection(db, 'courses', courseId, 'lessons'));
      const lessonsData = lessonsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(lessonsData);
    } catch (err) {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  async function enroll() {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        enrolledCourses: arrayUnion(courseId)
      });
      setUserProfile(prev => ({
        ...prev,
        enrolledCourses: [...(prev.enrolledCourses || []), courseId]
      }));
      toast.success('Enrolled! Start learning now 🎉');
    } catch {
      toast.error('Failed to enroll');
    }
  }

  const isCompleted = (lessonId) => userProfile?.completedLessons?.includes(`${courseId}_${lessonId}`);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading course...</p></div>;
  if (!course) return null;

  const completedCount = lessons.filter(l => isCompleted(l.id)).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="course-detail fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>

      {/* Course Header */}
      <div className="course-header-card card">
        <div
          className="course-header-banner"
          style={{ background: course.color || 'linear-gradient(135deg,#6C63FF,#43D9AD)' }}
        >
          <span className="course-header-emoji">{course.emoji || '📚'}</span>
        </div>
        <div className="course-header-body">
          <span className="badge badge-primary">{course.category || 'General'}</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>

          <div className="course-meta-list">
            <div className="meta-item"><FiUser /><span>{course.instructorName || 'Instructor'}</span></div>
            <div className="meta-item"><FiBook /><span>{lessons.length} lessons</span></div>
            <div className="meta-item"><FiClock /><span>{course.duration || 'Self-paced'}</span></div>
          </div>

          {isEnrolled && (
            <div className="course-progress-section">
              <div className="progress-label-row">
                <span>Your progress</span>
                <span className="progress-pct">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-note">{completedCount} of {lessons.length} lessons completed</p>
            </div>
          )}

          {!isEnrolled && !isInstructor && (
            <button className="btn btn-primary btn-lg" onClick={enroll} style={{marginTop:'1rem'}}>
              Enroll Now — It's Free
            </button>
          )}
          {isInstructor && course.instructorId === currentUser?.uid && (
            <Link to={`/manage-course/${courseId}`} className="btn btn-outline" style={{marginTop:'1rem',display:'inline-flex'}}>
              Edit Course
            </Link>
          )}
        </div>
      </div>

      {/* Lessons */}
      <h2 className="lessons-title">Course Content</h2>
      {lessons.length === 0 ? (
        <div className="empty-state card">
          <FiBook />
          <h3>No lessons yet</h3>
          <p>The instructor hasn't added lessons yet</p>
        </div>
      ) : (
        <div className="lessons-list">
          {lessons.map((lesson, idx) => {
            const done = isCompleted(lesson.id);
            const canAccess = isEnrolled || isInstructor;
            return (
              <div
                key={lesson.id}
                className={`lesson-item card ${done ? 'done' : ''} ${!canAccess ? 'locked' : ''}`}
                onClick={() => canAccess && navigate(`/courses/${courseId}/lesson/${lesson.id}`)}
              >
                <div className="lesson-number">{done ? <FiCheckCircle color="var(--accent)" /> : idx + 1}</div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <div className="lesson-meta">
                    {lesson.type === 'video' && <span><FiPlay /> Video</span>}
                    {lesson.type === 'pdf' && <span><FiFileText /> PDF</span>}
                    {lesson.type === 'text' && <span><FiBook /> Reading</span>}
                    {lesson.duration && <span><FiClock /> {lesson.duration}</span>}
                  </div>
                </div>
                <div className="lesson-action">
                  {!canAccess ? <FiLock color="var(--text-secondary)" /> : <FiPlay color="var(--primary)" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
