import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiPlay, FiFileText, FiBook } from 'react-icons/fi';
import './LessonView.css';

export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const lessonKey = `${courseId}_${lessonId}`;
  const isCompleted = userProfile?.completedLessons?.includes(lessonKey);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    setLoading(true);
    try {
      const [courseDoc, lessonDoc, lessonsSnap] = await Promise.all([
        getDoc(doc(db, 'courses', courseId)),
        getDoc(doc(db, 'courses', courseId, 'lessons', lessonId)),
        getDocs(collection(db, 'courses', courseId, 'lessons'))
      ]);
      if (!lessonDoc.exists()) { navigate(`/courses/${courseId}`); return; }
      setCourse({ id: courseDoc.id, ...courseDoc.data() });
      setLesson({ id: lessonDoc.id, ...lessonDoc.data() });
      const all = lessonsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(all);
    } catch (err) {
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }

  async function markComplete() {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        completedLessons: arrayUnion(lessonKey)
      });
      setUserProfile(prev => ({
        ...prev,
        completedLessons: [...(prev.completedLessons || []), lessonKey]
      }));
      toast.success('Lesson marked as complete! ✅');
    } catch {
      toast.error('Failed to update progress');
    }
  }

  const currentIdx = lessons.findIndex(l => l.id === lessonId);
  const prevLesson = lessons[currentIdx - 1];
  const nextLesson = lessons[currentIdx + 1];

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading lesson...</p></div>;
  if (!lesson) return null;

  return (
    <div className="lesson-view fade-in">
      {/* Header */}
      <div className="lesson-header">
        <button className="back-btn" onClick={() => navigate(`/courses/${courseId}`)}>
          <FiArrowLeft /> {course?.title || 'Course'}
        </button>
        <div className="lesson-progress-info">
          Lesson {currentIdx + 1} of {lessons.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="lesson-card card">
        <div className="lesson-type-badge">
          {lesson.type === 'video' && <><FiPlay /> Video Lesson</>}
          {lesson.type === 'pdf' && <><FiFileText /> PDF Resource</>}
          {lesson.type === 'text' && <><FiBook /> Reading</>}
          {!lesson.type && <><FiBook /> Lesson</>}
        </div>
        <h1 className="lesson-title">{lesson.title}</h1>

        {/* Video */}
        {lesson.type === 'video' && lesson.videoUrl && (
          <div className="video-container">
            {lesson.videoUrl.includes('youtube') || lesson.videoUrl.includes('youtu.be') ? (
              <iframe
                src={lesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                title={lesson.title}
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <video controls>
                <source src={lesson.videoUrl} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}

        {/* PDF */}
        {lesson.type === 'pdf' && lesson.pdfUrl && (
          <div className="pdf-container">
            <div className="pdf-preview">
              <FiFileText className="pdf-icon" />
              <p>PDF Document</p>
              <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                Open PDF
              </a>
            </div>
          </div>
        )}

        {/* Text Content */}
        {lesson.content && (
          <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        )}

        {/* Embedded URL */}
        {lesson.type === 'text' && !lesson.content && lesson.resourceUrl && (
          <div className="resource-link card" style={{padding:'1rem',marginTop:'1rem'}}>
            <a href={lesson.resourceUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              Open Resource
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="lesson-actions">
        <div className="lesson-nav-btns">
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/courses/${courseId}/lesson/${prevLesson.id}`)}
            disabled={!prevLesson}
          >
            <FiArrowLeft /> Previous
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/courses/${courseId}/lesson/${nextLesson.id}`)}
            disabled={!nextLesson}
          >
            Next <FiArrowRight />
          </button>
        </div>

        {!isCompleted ? (
          <button className="btn btn-primary complete-btn" onClick={markComplete}>
            <FiCheckCircle /> Mark as Complete
          </button>
        ) : (
          <div className="completed-pill">
            <FiCheckCircle /> Completed!
          </div>
        )}
      </div>

      {/* Lesson Sidebar List */}
      <div className="lesson-list-panel card">
        <h3>All Lessons</h3>
        <div className="lesson-list-items">
          {lessons.map((l, idx) => {
            const done = userProfile?.completedLessons?.includes(`${courseId}_${l.id}`);
            return (
              <div
                key={l.id}
                className={`lesson-list-item ${l.id === lessonId ? 'current' : ''} ${done ? 'done' : ''}`}
                onClick={() => navigate(`/courses/${courseId}/lesson/${l.id}`)}
              >
                <span className="lil-num">{done ? '✓' : idx + 1}</span>
                <span className="lil-title">{l.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
