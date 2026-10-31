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
