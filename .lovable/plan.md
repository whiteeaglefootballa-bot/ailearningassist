
## Implementation Plan for Functional Requirements

### 1. User Roles System (FR-2)
- Create `user_roles` table with enum (`student`, `teacher`, `admin`)
- Add RLS policies with security definer function `has_role()`
- Update UI to show role-based features (teachers see upload/create buttons, students see view-only)
- Default new users to `student` role

### 2. Password Recovery (FR-1)
- Add "Forgot Password?" link on Auth page
- Create `/reset-password` page for setting new password
- Wire up `supabase.auth.resetPasswordForEmail()` and `updateUser()`

### 3. Teacher File Uploads (FR-4)
- Create `course_materials` table (title, file_url, course_id, uploaded_by)
- Create `course-materials` storage bucket with RLS
- Add upload UI on CourseDetail page (visible to teachers only)
- Add download/view for students

### 4. Notifications System (FR-7)
- Create `notifications` table (user_id, title, message, type, is_read, created_at)
- Add RLS policies for user-owned notifications
- Create notification bell component in dashboard header
- Auto-generate notifications when new materials or quizzes are added via database trigger

### Order of Implementation
1. User roles (foundation for everything else)
2. Password recovery (quick win)
3. File uploads (depends on roles)
4. Notifications (depends on roles + materials)
