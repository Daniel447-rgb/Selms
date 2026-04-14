import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiClock, FiStar, FiPlus } from 'react-icons/fi';
import './Quizzes.css';

export default function Quizzes() {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInstructor = userProfile?.role === 'instructor';

  useEffect(() => {
    async function fetchQuizzes() {
      const snap = await getDocs(collection(db, 'quizzes'));
      setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchQuizzes();
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading quizzes...</p></div>;

  return (
    <div className="quizzes-page fade-in">
      <div className="page-title-row">
        <div>
          <h1>Quizzes</h1>
          <p className="page-subtitle">Test your knowledge</p>
        </div>
        {isInstructor && (
          <Link to="/manage-course" className="btn btn-primary btn-sm">
            <FiPlus /> Add Quiz
          </Link>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state card">
          <FiCheckSquare />
          <h3>No quizzes yet</h3>
          <p>Quizzes will appear here once instructors create them</p>
        </div>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map(quiz => {
            const attempted = userProfile?.quizResults?.[quiz.id];
            return (
              <div key={quiz.id} className="quiz-card card">
                <div className="quiz-icon-area" style={{ background: quiz.color || '#EEF0FF' }}>
                  <FiCheckSquare style={{ color: quiz.accentColor || 'var(--primary)', fontSize: '2rem' }} />
                </div>
                <div className="quiz-body">
                  <div className="quiz-header-row">
                    <span className="badge badge-primary">{quiz.courseTitle || 'General'}</span>
                    {attempted && <span className="badge badge-success">Attempted</span>}
                  </div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description}</p>
                  <div className="quiz-meta">
                    <span><FiCheckSquare /> {quiz.questions?.length || 0} questions</span>
                    <span><FiClock /> {quiz.timeLimit || '—'} min</span>
                    {attempted && <span><FiStar /> Score: {attempted.score}%</span>}
                  </div>
                  <Link
                    to={`/quizzes/${quiz.id}`}
                    className={`btn btn-sm ${attempted ? 'btn-outline' : 'btn-primary'}`}
                    style={{ marginTop: '0.75rem' }}
                  >
                    {attempted ? 'Retake Quiz' : 'Start Quiz'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
