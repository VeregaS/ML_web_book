export const STORAGE_KEYS = {
  COMPLETED_LESSONS: 'completedLessons',
  LESSON_CODE: (id) => `ml-lesson-${id}`,
};

export const TRANSITIONS = {
  PAGE: {
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1], // cubic-bezier
  },
};
