import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiCheckSquare, FiStar, FiAward, FiTrendingUp } from 'react-icons/fi';
import './Progress.css';

export default function Progress() {
  const { userProfile } = useAuth();
  const [courseProgress, setCourseProgress] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProgress() {
    if (!userProfile) return;
    try {
      const enrolled = userProfile.enrolledCourses || [];
      const courseData = [];

      for (const courseId of enrolled) {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) continue;
        const course = { id: courseDoc.id, ...courseDoc.data() };

        const lessonsSnap = await getDocs(collection(db, 'courses', courseId, 'lessons'));
        const totalLessons = lessonsSnap.size;
        const completed = (userProfile.completedLessons || [])
          .filter(key => key.startsWith(courseId + '_')).length;

        courseData.push({
          ...course,
          totalLessons,
          completedLessons: completed,
          progress: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
        });
      }

      setCourseProgress(courseData);

      // Quiz history
      const qResults = userProfile.quizResults || {};
      const quizList = [];
      for (const [qid, result] of Object.entries(qResults)) {
        const qDoc = await getDoc(doc(db, 'quizzes', qid));
        quizList.push({
          id: qid,
          title: qDoc.exists() ? qDoc.data().title : 'Quiz',
          ...result
        });
      }
      setQuizHistory(quizList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalCompleted = (userProfile?.completedLessons || []).length;
  const avgQuizScore = quizHistory.length > 0
    ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)
    : 0;
  const badges = userProfile?.badges || [];

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading progress...</p></div>;

  return (
    <div className="progress-page fade-in">
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Progress</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Track your learning journey
      </p>

      {/* Overview */}
      <div className="overview-grid">
        {[
          { icon: FiBook, label: 'Enrolled', value: courseProgress.length, color: '#6C63FF', bg: '#EEF0FF' },
          { icon: FiCheckSquare, label: 'Lessons Done', value: totalCompleted, color: '#43D9AD', bg: '#E6FFF8' },
          { icon: FiTrendingUp, label: 'Avg Quiz Score', value: `${avgQuizScore}%`, color: '#FFB547', bg: '#FFF8E6' },
          { icon: FiAward, label: 'Badges', value: badges.length, color: '#FF6584', bg: '#FFF0F3' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="overview-card card">
            <div className="ov-icon" style={{ background: bg, color }}><Icon /></div>
            <div className="ov-value">{value}</div>
            <div className="ov-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Course Progress */}
      <h2 className="section-title">Course Progress</h2>
      {courseProgress.length === 0 ? (
        <div className="empty-state card">
          <FiBook />
          <h3>Not enrolled in any courses</h3>
          <p>Enroll in courses to track your progress</p>
        </div>
      ) : (
        <div className="course-progress-list">
          {courseProgress.map(course => (
            <div key={course.id} className="cp-card card">
              <div className="cp-thumb" style={{ background: course.color || 'linear-gradient(135deg,#6C63FF,#43D9AD)' }}>
                <span>{course.emoji || '📚'}</span>
              </div>
              <div className="cp-info">
                <h3>{course.title}</h3>
                <p>{course.completedLessons} of {course.totalLessons} lessons</p>
                <div className="progress-bar" style={{ margin: '0.5rem 0' }}>
                  <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                </div>
                <div className="cp-footer">
                  <span className={`badge ${course.progress === 100 ? 'badge-success' : 'badge-primary'}`}>
                    {course.progress === 100 ? '✓ Completed' : `${course.progress}%`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz History */}
      {quizHistory.length > 0 && (
        <>
          <h2 className="section-title">Quiz Results</h2>
          <div className="quiz-history-list">
            {quizHistory.map(q => (
              <div key={q.id} className="qh-item card">
                <div className="qh-score" style={{ color: q.score >= 60 ? 'var(--accent)' : 'var(--secondary)' }}>
                  {q.score}%
                </div>
                <div className="qh-info">
                  <h4>{q.title}</h4>
                  <p>{q.correct}/{q.total} correct</p>
                </div>
                <span className={`badge ${q.score >= 60 ? 'badge-success' : 'badge-danger'}`}>
                  {q.score >= 60 ? 'Passed' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Badges */}
      <h2 className="section-title">Badges</h2>
      {badges.length === 0 ? (
        <div className="empty-state card" style={{ padding: '1.5rem' }}>
          <FiStar />
          <h3>No badges yet</h3>
          <p>Complete courses and quizzes to earn badges</p>
        </div>
      ) : (
        <div className="badges-grid">
          {badges.map((badge, i) => (
            <div key={i} className="badge-item card">
              <span className="badge-emoji">{badge.emoji || '🏆'}</span>
              <p>{badge.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
