// Lessons in display order, grouped by module. Lessons outside a module come first as "Course content".
// Modules with no lessons are left out; learners have nothing to see in them.
export function groupLessons(course) {
  const modules = course?.modules || [];
  const videos = course?.videos || [];
  const loose = videos.filter((video) => !modules.some((item) => item.id === video.moduleId));
  return [
    ...(loose.length ? [{ id: "", title: "Course content", description: "", upcoming: false, lessons: loose }] : []),
    ...modules
      .map((item) => ({ ...item, lessons: videos.filter((video) => video.moduleId === item.id) }))
      .filter((group) => group.lessons.length > 0),
  ];
}

// e.g. "4 modules available, 2 coming soon". Empty when the course isn't split into modules.
export function moduleSummary(course) {
  const modules = groupLessons(course).filter((group) => group.id);
  if (!modules.length) return "";
  const soon = modules.filter((group) => group.upcoming).length;
  const open = modules.length - soon;
  const parts = [];
  if (open) parts.push(`${open} ${open === 1 ? "module" : "modules"} available`);
  if (soon) parts.push(`${soon} coming soon`);
  return parts.join(", ");
}

// 95 -> "1:35", 3700 -> "1:01:40"
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

// Where to continue the course: the last lesson watched, or the next one if that was finished.
export function nextLesson(lessons, progress) {
  const playable = lessons.filter((lesson) => !lesson.upcoming);
  const watched = playable.filter((lesson) => progress[lesson.id]);
  if (!watched.length) return { lesson: playable[0] || null, state: "start" };
  const last = watched.reduce((a, b) =>
    new Date(progress[b.id].lastWatchedAt) > new Date(progress[a.id].lastWatchedAt) ? b : a);
  if (!progress[last.id].completed) return { lesson: last, state: "resume" };
  const following = playable.slice(playable.indexOf(last) + 1).find((lesson) => !progress[lesson.id]?.completed);
  const unfinished = following || playable.find((lesson) => !progress[lesson.id]?.completed);
  return unfinished ? { lesson: unfinished, state: progress[unfinished.id] ? "resume" : "next" } : { lesson: playable[0], state: "again" };
}
