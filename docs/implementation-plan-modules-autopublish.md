# Final plan: Modules, bulk upload and manual module publishing

## Context
Sky Birds publishes **one whole module at a time**, so courses need Course → Modules → Lessons, with bulk video upload per module. **Nothing goes live automatically**: an admin explicitly publishes.

This replaces the auto-publish design in `docs/implementation-plan-modules-autopublish.md`. Bunny webhooks stay, but only to record readiness and notify the admin.

**Confirmed decisions:**
- Publishing a module is **blocked** until every lesson is ready.
- A lesson added to a live module stays hidden until **manually published**.
- Modules are a grouping layer (`course.modules[]` + `lesson.moduleId`). `course.videos` stays the source of truth, so playback, purchases and cleanup keep working.

**Effort:** about 3–4 working days. Every phase ends with tests passing and all apps building.

## Phase 0: Prerequisites
1. **Update the docs:** replace `docs/implementation-plan-modules-autopublish.md` with this plan.
2. **Protect current work:** show the user what will be committed. Commit and push only after they confirm.
3. **Out of scope, by user decision:** testimonials are not touched in this work.
4. **User action:** regenerate the MSG91 key and any other key shown in a screenshot, then update `.env` and Render.

## Phase 1: Modules and publishing rules (API)
`skybird-api/models/Course.js` (additive):
- `moduleSchema`: `id`, `title`, `description`, `upcoming` (default **true**)
- `course.modules[]`
- lesson fields: `moduleId`, `videoFailedAt`, `processingSince`, and notification flags

Lessons with no `moduleId` appear in a default, published **"Course content"** group. Existing courses need no migration.

**Rules, enforced by the API:**
- New modules and new lessons start **Upcoming**. Readiness never changes these flags.
- `isLessonLocked(course, lesson)` is the single rule: locked if the lesson or its module is Upcoming. Used by playback, public data, purchased data and Live checks.
- **Publish module:** re-checks every lesson with Bunny at click time. Refuses with `409` and a per-lesson list if the module is empty or any lesson has no video, is processing or failed. On success, publishes the module and all its lessons in one save.
- **Publish lesson** in a live module: same ready check, manual only.
- **Unpublish module:** refused if a Live/Private course would have no playable lesson.
- **Course Live/Private:** needs at least one unlocked lesson with a ready video. Status never changes automatically.
- **Delete module:** only when empty.

**Endpoints** in `routes/admin.js`, following `updateLesson` and `reorderLessons` in `controllers/adminController.js`: module create, edit, delete, reorder, publish, unpublish; `moduleId` added to lesson add and edit.

**Data exposure:** update `controllers/courseController.js` and `customerController.getPurchasedCourses` to return modules and the effective lock, with no `videoId` for locked lessons. `getPurchasedCourses` currently returns it for upcoming lessons.

**Simultaneous updates:**
- Enable `optimisticConcurrency` on the course schema.
- Wrap admin lesson and module saves in a small retry helper. If the retry also conflicts, return `409` "Please refresh".
- The webhook and sweep update only the matching lesson, using `arrayFilters`, never a whole-document save.

**Audit log:** new `CourseAudit` model recording admin, action, course, target and time for publish, unpublish, status change, lesson move, and lesson or module delete. Add `GET /admin/courses/:id/activity`.

## Phase 2: Readiness, bulk upload and resume (API)
- **`services/videoReadiness.js`:** `isVideoReady(lesson)` uses Bunny or the legacy status check. Errors count as not ready.
- **Bunny limits:** publish checks run at most 5 at a time. If Bunny doesn't respond, return "Couldn't confirm all lessons, please retry" and publish nothing.
- **Batch status:** `POST /admin/videos/bunny/status` with `{ ids }`, max 50. Required because `/api` allows only 300 requests per 15 minutes, and the current per-video polling would hit that in about 7 minutes with 12 videos.
- **Bulk creation:** `POST /admin/courses/:id/modules/:moduleId/lessons/bulk` with `{ lessons:[{ title, size }] }`:
  - max 50 files; validates title length and declared size; has its own rate limit
  - creates Bunny videos and saved Upcoming lessons in order, and returns one signed upload per lesson
  - if creation fails partway, deletes the videos already created and saves nothing
- **Size limit:** `BUNNY_MAX_UPLOAD_BYTES`, default 5 GB. The server checks the declared size and the browser checks the file. Bunny receives the upload directly, so this can't be strictly enforced server-side.
- **Resume:** `POST /admin/videos/bunny/:videoId/upload-signature` issues a fresh signature for a lesson's existing video, only if that video belongs to a lesson and Bunny hasn't received it.

## Phase 3: Admin UI
Move new UI out of `skybird-admin/src/pages/CourseForm.jsx` (already about 1,300 lines) into `src/components/`.

**Curriculum:**
- Module cards: status, "10 of 12 ready", Publish/Unpublish, reorder, rename, delete (empty only).
- Lesson rows: move-to-module, readiness. The single-lesson add stays.
- Replace the per-video polling with the batch endpoint, every 10 s.

**Bulk upload:**
1. Pick or drag many videos.
2. Review list: titles from filenames with natural sorting (2 before 10), editable titles, reorder, remove. Warns about duplicate filenames and rejects wrong types or oversized files.
3. Start: lessons are saved first, so a refresh keeps them. 3 uploads at a time, reusing `uploadVideoFile` with per-file progress callbacks.
4. Per-file progress and an overall "7 of 12" bar. One failure doesn't stop the rest. Retry and Cancel per row; the leave-page warning stays on.
5. **Resume:** an interrupted lesson shows "Upload incomplete". The admin re-selects the file, because browsers can't keep it after a refresh. If the name and size match, tus continues from where it stopped using its saved upload record and a new signature. Otherwise it restarts.
6. Blank durations are filled from Bunny when encoding finishes.

**Publishing safety:**
- **Publish checklist:** "12 lessons, 3h 20m, all ready", with lesson order, before confirming.
- **View as learner:** a read-only admin preview of the module layout, with videos using the existing preview endpoint.
- **Confirmations:** moving or unpublishing a lesson or module that buyers can see states what will be locked.
- **Activity:** a list of the course's audit entries.

## Phase 4: User site
- `src/pages/CourseDetail.jsx`:
  - accordion by module, with locked items showing a lock and Upcoming
  - sales wording before purchase, for example "4 modules available, 2 coming soon"
- `src/pages/Watch.jsx`: sidebar grouped by module, opening on the first playable lesson.
- `src/components/CourseCard.jsx`: module count.

## Phase 5: Webhook, sweep and notifications (no auto-publish)
- `POST /api/webhooks/bunny`:
  - raw body, registered before the JSON parser like the Razorpay webhook in `app.js`
  - verifies Bunny's HMAC-SHA256 signature using `BUNNY_COURSES_READONLY_KEY`
  - ignores other libraries and re-fetches the video from Bunny before acting
  - **only records state:** duration, failure and notification flags. Safe to repeat.
- Sweep every 10 minutes and on admin course load: also only records state, in limited batches.
- Admin bell (`services/notificationService.js`), each shown once:
  - "Module X: all lessons ready to publish"
  - "Video failed: Y"
  - "Video stuck: Y has been processing for over 2 hours", with a re-upload link

## Rollout
1. Deploy the **API**, then add on Render: `BUNNY_COURSES_READONLY_KEY`, `BUNNY_MAX_UPLOAD_BYTES`, the `BUNNY_COURSES_*` keys, and `TRUST_PROXY=true`.
2. Set the Bunny webhook URL, and add the live domains to allowed referrers in the courses library.
3. Deploy the admin panel, then the user site.
4. Run the real test below.

**Rollback:** redeploy the previous builds. Module data is additive and older code ignores it, so lessons still play from `course.videos`. Clearing the webhook URL turns off notifications only.

## Verification
**New API tests** (`test/modules.test.js`, `test/bulkUpload.test.js`, `test/bunnyWebhook.test.js`), Bunny mocked:
- **No auto-publish:** a webhook or sweep on a finished video leaves `upcoming` unchanged.
- **Module publish:** blocked when empty, processing, failed, missing a video, or Bunny is unavailable; publishes everything together when ready.
- **Locking:** a locked module blocks playback for buyers and hides `videoId` in public and purchased responses.
- **Bulk:** keeps order, enforces file count and size limits, cleans up if creation fails partway.
- **Resume:** signs only eligible videos.
- **Concurrency:** a conflicting save retries or returns `409` without losing either change.
- **Webhook:** bad signature rejected, other libraries ignored, repeats change nothing, stuck flag raised.
- **Audit:** publish, unpublish and move actions are recorded.
- **Old data:** courses without modules still play.

**Regression:** all existing API tests (`npm test` in `skybird-api`), `npx eslint src` on the user site, and `npx vite build` for both frontends.

**Browser check (stubbed API, desktop and phone):** bulk upload, fail and retry a file, refresh and resume, Publish disabled until all are ready, checklist, View as learner, and the learner accordion and watch sidebar.

**Real test after setup:**
1. Upload 2–3 short videos into a module on Bunny, then close the page.
2. Confirm they stay locked after processing and the bell says they're ready.
3. Publish, then play as a buyer. Confirm a non-buyer is refused.
