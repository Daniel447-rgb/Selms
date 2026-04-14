import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  getDocs, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiBook, FiCheckSquare } from 'react-icons/fi';
import './ManageCourse.css';

const COLORS = [
  'linear-gradient(135deg,#6C63FF,#43D9AD)',
  'linear-gradient(135deg,#FF6584,#FFB547)',
  'linear-gradient(135deg,#43D9AD,#6C63FF)',
  'linear-gradient(135deg,#FFB547,#FF6584)',
  'linear-gradient(135deg,#1A1A2E,#6C63FF)',
];
const EMOJIS = ['📚','💻','🔬','🎨','📊','🧮','🌍','🎵','⚡','🧬'];

export default function ManageCourse() {
  const { courseId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!courseId;

  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState({
    title: '', description: '', category: 'Programming',
    duration: '', color: COLORS[0], emoji: EMOJIS[0]
  });
  const [lessons, setLessons] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: '', description: '', timeLimit: 30, passingScore: 60,
    questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }]
  });

  useEffect(() => {
    if (isEdit) fetchCourse();
  }, [courseId]);

  async function fetchCourse() {
    try {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) setCourse(snap.data());
      const lessonsSnap = await getDocs(collection(db, 'courses', courseId, 'lessons'));
      setLessons(lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.order||0)-(b.order||0)));
    } catch (err) { toast.error('Failed to load course'); }
  }

  async function saveCourse() {
    if (!course.title.trim()) return toast.error('Course title is required');
    setSaving(true);
    try {
      const data = {
        ...course,
        instructorId: currentUser.uid,
        instructorName: currentUser.displayName,
        lessonCount: lessons.length,
        updatedAt: serverTimestamp()
      };
      if (isEdit) {
        await updateDoc(doc(db, 'courses', courseId), data);
        toast.success('Course updated!');
      } else {
        const ref = await addDoc(collection(db, 'courses'), { ...data, createdAt: serverTimestamp() });
        toast.success('Course created!');
        navigate(`/manage-course/${ref.id}`);
      }
    } catch (err) { toast.error('Failed to save course'); }
    finally { setSaving(false); }
  }

  async function addLesson() {
    if (!courseId) return toast.error('Save the course first');
    try {
      const ref = await addDoc(collection(db, 'courses', courseId, 'lessons'), {
        title: 'New Lesson', type: 'text', content: '', order: lessons.length, createdAt: serverTimestamp()
      });
      setLessons(prev => [...prev, { id: ref.id, title: 'New Lesson', type: 'text', content: '', order: lessons.length }]);
    } catch { toast.error('Failed to add lesson'); }
  }

  async function updateLesson(idx, field, value) {
    const updated = [...lessons];
    updated[idx] = { ...updated[idx], [field]: value };
    setLessons(updated);
  }

  async function saveLesson(lesson) {
    try {
      await updateDoc(doc(db, 'courses', courseId, 'lessons', lesson.id), lesson);
      toast.success('Lesson saved!');
    } catch { toast.error('Failed to save lesson'); }
  }

  async function deleteLesson(lesson) {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'lessons', lesson.id));
      setLessons(prev => prev.filter(l => l.id !== lesson.id));
    } catch { toast.error('Failed to delete lesson'); }
  }

  async function saveQuiz() {
    if (!quizForm.title.trim()) return toast.error('Quiz title required');
    if (quizForm.questions.some(q => !q.question.trim())) return toast.error('All questions must have text');
    try {
      await addDoc(collection(db, 'quizzes'), {
        ...quizForm,
        courseId: courseId || null,
        courseTitle: course.title,
        instructorId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Quiz created!');
      setQuizForm({ title: '', description: '', timeLimit: 30, passingScore: 60,
        questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }] });
    } catch { toast.error('Failed to save quiz'); }
  }

  const addQuestion = () => setQuizForm(f => ({
    ...f, questions: [...f.questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]
  }));
  const removeQuestion = (i) => setQuizForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i, field, value) => setQuizForm(f => {
    const qs = [...f.questions]; qs[i] = { ...qs[i], [field]: value }; return { ...f, questions: qs };
  });
  const updateOption = (qi, oi, value) => setQuizForm(f => {
    const qs = [...f.questions]; qs[qi].options[oi] = value; return { ...f, questions: qs };
  });

  if (userProfile?.role !== 'instructor') return (
    <div className="empty-state card"><FiBook /><h3>Instructor Access Only</h3></div>
  );

  return (
    <div className="manage-course fade-in">
      <div className="mc-header">
        <button className="back-btn" onClick={() => navigate('/courses')}><FiArrowLeft /> Courses</button>
        <h1>{isEdit ? 'Edit Course' : 'New Course'}</h1>
      </div>

      {/* Tabs */}
      <div className="mc-tabs">
        {[
          { id: 'details', label: 'Details', icon: FiBook },
          { id: 'lessons', label: 'Lessons', icon: FiBook },
          { id: 'quiz', label: 'Add Quiz', icon: FiCheckSquare }
        ].map(t => (
          <button
            key={t.id}
            className={`mc-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {/* Course Details */}
      {tab === 'details' && (
        <div className="mc-section card">
          <div className="form-group">
            <label>Course Title</label>
            <input value={course.title} onChange={e => setCourse(c => ({...c, title: e.target.value}))} placeholder="e.g. Introduction to Python" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={course.description} onChange={e => setCourse(c => ({...c, description: e.target.value}))} placeholder="Describe your course..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={course.category} onChange={e => setCourse(c => ({...c, category: e.target.value}))}>
                {['Programming','Design','Mathematics','Science','Business','Language'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input value={course.duration} onChange={e => setCourse(c => ({...c, duration: e.target.value}))} placeholder="e.g. 4 weeks" />
            </div>
          </div>

          <div className="form-group">
            <label>Emoji</label>
            <div className="emoji-grid">
              {EMOJIS.map(e => (
                <button key={e} className={`emoji-btn ${course.emoji === e ? 'selected' : ''}`} onClick={() => setCourse(c => ({...c, emoji: e}))}>{e}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-grid">
              {COLORS.map(color => (
                <button key={color} className={`color-swatch ${course.color === color ? 'selected' : ''}`}
                  style={{ background: color }} onClick={() => setCourse(c => ({...c, color}))} />
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={saveCourse} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      )}

      {/* Lessons */}
      {tab === 'lessons' && (
        <div className="mc-section">
          {!courseId && <div className="empty-state card"><p>Save the course first to add lessons</p></div>}
          {courseId && (
            <>
              <button className="btn btn-primary" onClick={addLesson} style={{marginBottom:'1rem'}}>
                <FiPlus /> Add Lesson
              </button>
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="lesson-edit-card card">
                  <div className="le-header">
                    <span className="le-num">#{idx + 1}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteLesson(lesson)}>
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input value={lesson.title} onChange={e => updateLesson(idx, 'title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={lesson.type || 'text'} onChange={e => updateLesson(idx, 'type', e.target.value)}>
                      <option value="text">Text/Reading</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  {lesson.type === 'video' && (
                    <div className="form-group">
                      <label>Video URL (YouTube or direct)</label>
                      <input value={lesson.videoUrl || ''} onChange={e => updateLesson(idx, 'videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                    </div>
                  )}
                  {lesson.type === 'pdf' && (
                    <div className="form-group">
                      <label>PDF URL</label>
                      <input value={lesson.pdfUrl || ''} onChange={e => updateLesson(idx, 'pdfUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  )}
                  {lesson.type === 'text' && (
                    <div className="form-group">
                      <label>Content (HTML supported)</label>
                      <textarea value={lesson.content || ''} onChange={e => updateLesson(idx, 'content', e.target.value)} rows={5} placeholder="<h2>Introduction</h2><p>Your content here...</p>" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Duration (optional)</label>
                    <input value={lesson.duration || ''} onChange={e => updateLesson(idx, 'duration', e.target.value)} placeholder="e.g. 15 min" />
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => saveLesson(lesson)}>
                    <FiSave /> Save Lesson
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Quiz Builder */}
      {tab === 'quiz' && (
        <div className="mc-section card" style={{padding:'1.25rem'}}>
          <div className="form-group">
            <label>Quiz Title</label>
            <input value={quizForm.title} onChange={e => setQuizForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Module 1 Quiz" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={quizForm.description} onChange={e => setQuizForm(f => ({...f, description: e.target.value}))} placeholder="Brief quiz description" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input type="number" value={quizForm.timeLimit} onChange={e => setQuizForm(f => ({...f, timeLimit: +e.target.value}))} min={1} />
            </div>
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input type="number" value={quizForm.passingScore} onChange={e => setQuizForm(f => ({...f, passingScore: +e.target.value}))} min={1} max={100} />
            </div>
          </div>

          <h3 style={{fontWeight:700, marginBottom:'0.75rem'}}>Questions</h3>
          {quizForm.questions.map((q, qi) => (
            <div key={qi} className="question-edit-card card">
              <div className="le-header">
                <span className="le-num">Q{qi + 1}</span>
                {quizForm.questions.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)}><FiTrash2 /></button>
                )}
              </div>
              <div className="form-group">
                <label>Question</label>
                <input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Enter question..." />
              </div>
              <div className="options-edit">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`option-edit-row ${q.correctIndex === oi ? 'correct' : ''}`}>
                    <button
                      className={`correct-radio ${q.correctIndex === oi ? 'selected' : ''}`}
                      onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                      title="Mark as correct"
                    >{q.correctIndex === oi ? '✓' : String.fromCharCode(65+oi)}</button>
                    <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={addQuestion} style={{marginBottom:'1rem'}}>
            <FiPlus /> Add Question
          </button>

          <button className="btn btn-primary w-full" onClick={saveQuiz}>
            <FiSave /> Create Quiz
          </button>
        </div>
      )}
    </div>
  );
}
