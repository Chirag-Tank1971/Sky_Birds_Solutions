// Rules for what learners can see and play. Lessons stay in course.videos; modules only group them.
// Works on Mongoose documents and plain (lean) objects alike.

const moduleOf = (course, lesson) =>
  (lesson?.moduleId && (course?.modules || []).find((item) => item.id === lesson.moduleId)) || null;

// The single locking rule: a lesson is locked if it, or its module, is upcoming.
const isLessonLocked = (course, lesson) => Boolean(lesson?.upcoming || moduleOf(course, lesson)?.upcoming);

// At least one lesson a buyer can play right now. Published lessons were ready when published.
const hasPlayableLesson = (course) =>
  (course?.videos || []).some((lesson) => lesson.videoId && !isLessonLocked(course, lesson));

const publicVideos = (course) =>
  (course?.videos || []).map((lesson) => {
    const locked = isLessonLocked(course, lesson);
    return {
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration || "",
      videoId: locked ? "" : lesson.videoId || "",
      upcoming: locked,
      provider: lesson.provider || "local",
      moduleId: moduleOf(course, lesson)?.id || "",
    };
  });

const publicModules = (course) =>
  (course?.modules || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    upcoming: Boolean(item.upcoming),
  }));

module.exports = { moduleOf, isLessonLocked, hasPlayableLesson, publicVideos, publicModules };
