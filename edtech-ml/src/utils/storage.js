import { STORAGE_KEYS } from './constants';

export const storage = {
  getCompletedLessons: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get completed lessons from storage', e);
      return [];
    }
  },

  setLessonCompleted: (lessonId) => {
    try {
      const completed = storage.getCompletedLessons();
      if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(completed));
      }
    } catch (e) {
      console.error('Failed to save completed lesson to storage', e);
    }
  },

  getLessonCode: (lessonId, defaultCode = '') => {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEYS.LESSON_CODE(lessonId));
      return savedCode !== null ? savedCode : defaultCode;
    } catch (e) {
      console.error('Failed to get lesson code from storage', e);
      return defaultCode;
    }
  },

  saveLessonCode: (lessonId, code) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LESSON_CODE(lessonId), code);
    } catch (e) {
      console.error('Failed to save lesson code to storage', e);
    }
  },

  clearLessonCode: (lessonId) => {
    try {
      localStorage.removeItem(STORAGE_KEYS.LESSON_CODE(lessonId));
    } catch (e) {
      console.error('Failed to clear lesson code from storage', e);
    }
  },
};
