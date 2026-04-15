import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiClock } from 'react-icons/fi';
import './QuizTake.css';

export default function QuizTake() {
  const { quizId } = useParams();
  const { currentUser, setUserProfile } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      const snap = await getDoc(doc(db, 'quizzes', quizId));
      if (!snap.exists()) { navigate('/quizzes'); return; } // eslint-disable-line react-hooks/exhaustive-deps
      const data = { id: snap.id, ...snap.data() };
      setQuiz(data);
      if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId, navigate]);

  const submitQuiz = useCallback(async (finalAnswers) => {
    if (!quiz) return;
    const questions = quiz.questions || [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (finalAnswers[i] === q.correctIndex) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`quizResults.${quizId}`]: { score: pct, correct, total: questions.length, date: new Date().toISOString() }
      });
      setUserProfile(prev => ({
        ...prev,
        quizResults: { ...(prev.quizResults || {}), [quizId]: { score: pct, correct, total: questions.length } }
      }));
    } catch (err) {
      console.error(err);
    }
  }, [quiz, quizId, currentUser, setUserProfile]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { submitQuiz(answers); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted, answers, submitQuiz]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const selectAnswer = (idx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [current]: idx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < (quiz?.questions?.length || 0)) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }
    submitQuiz(answers);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading quiz...</p></div>;
  if (!quiz) return null;

  const questions = quiz.questions || [];
  const q = questions[current];

  if (submitted) {
    const passed = score >= (quiz.passingScore || 60);
    return (
      <div className="quiz-result fade-in">
        <div className="result-card card">
          <div className={`result-emoji-area ${passed ? 'pass' : 'fail'}`}>
            {passed ? '🏆' : '😓'}
          </div>
          <h1>{passed ? 'Congratulations!' : 'Keep Practising'}</h1>
          <p className="result-subtitle">
            {passed ? 'You passed the quiz!' : `You need ${quiz.passingScore || 60}% to pass`}
          </p>
          <div className="score-display">
            <div className="score-number" style={{ color: passed ? 'var(--accent)' : 'var(--secondary)' }}>
              {score}%
            </div>
            <p className="score-label">Your Score</p>
          </div>
          <div className="result-breakdown">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const correct = userAns === q.correctIndex;
              return (
                <div key={i} className={`breakdown-item ${correct ? 'correct' : 'wrong'}`}>
                  <span className="breakdown-icon">{correct ? '✓' : '✗'}</span>
                  <div>
                    <p className="breakdown-q">{q.question}</p>
                    {!correct && (
                      <p className="breakdown-ans">
                        Correct: {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="result-actions">
            <button className="btn btn-outline" onClick={() => { setSubmitted(false); setAnswers({}); setCurrent(0); setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null); }}>
              Retake
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/quizzes')}>
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-take fade-in">
      {/* Header */}
      <div className="quiz-take-header">
        <button className="back-btn" onClick={() => navigate('/quizzes')}>
          <FiArrowLeft /> Quizzes
        </button>
        <div className="quiz-take-meta">
          {timeLeft !== null && (
            <div className={`timer ${timeLeft < 60 ? 'urgent' : ''}`}>
              <FiClock />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <span className="question-counter">{current + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="quiz-card card">
        <p className="question-label">Question {current + 1}</p>
        <h2 className="question-text">{q?.question}</h2>

        <div className="options-list">
          {(q?.options || []).map((opt, idx) => (
            <button
              key={idx}
              className={`option-btn ${answers[current] === idx ? 'selected' : ''}`}
              onClick={() => selectAnswer(idx)}
            >
              <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
              <span className="option-text">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="quiz-nav">
        <button
          className="btn btn-outline"
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
        >
          <FiArrowLeft /> Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setCurrent(c => c + 1)}
          >
            Next <FiArrowRight />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit}>
            <FiCheckCircle /> Submit Quiz
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="question-dots">
        {questions.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''} ${answers[i] !== undefined ? 'answered' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}
