# AI Learning Assistant — Software Requirements Specification (SRS) & Thesis Documentation

> **Project Title:** AI Learning Assistant — An Online Learning Platform  
> **Version:** 1.0  
> **Date:** March 2026  
> **Technology Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Edge Functions)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Module Descriptions](#4-module-descriptions)
5. [Database Design (ER Diagram)](#5-database-design-er-diagram)
6. [Data Flow Diagrams (DFD)](#6-data-flow-diagrams-dfd)
7. [Use Case Diagrams](#7-use-case-diagrams)
8. [Sequence Diagrams](#8-sequence-diagrams)
9. [Activity Diagrams](#9-activity-diagrams)
10. [Class Diagram (Component Structure)](#10-class-diagram-component-structure)
11. [Functional Requirements](#11-functional-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [System Interfaces](#13-system-interfaces)
14. [Security & RLS Policies](#14-security--rls-policies)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Future Enhancements](#17-future-enhancements)
18. [References](#18-references)

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive Software Requirements Specification (SRS) for the **AI Learning Assistant** platform. It serves as both the technical specification and thesis documentation for the project, following IEEE 830-1998 SRS standards.

### 1.2 Scope
The AI Learning Assistant is a full-stack web application that provides:
- Interactive course browsing with lesson tracking
- AI-powered chatbot tutoring
- Quiz assessments with automated scoring
- AI-generated personalized study plans
- Real-time progress dashboards with analytics
- User authentication and profile management

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| SPA | Single Page Application |
| RLS | Row-Level Security (PostgreSQL) |
| SDK | Software Development Kit |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| JWT | JSON Web Token |
| SRS | Software Requirements Specification |
| DFD | Data Flow Diagram |
| ER | Entity-Relationship |
| UUID | Universally Unique Identifier |

### 1.4 Problem Statement
Traditional learning systems suffer from:
- Lack of personalized study paths
- No real-time progress tracking
- Limited access to instant tutoring
- Rigid schedules without adaptive learning
- Manual grading and feedback delays

### 1.5 Proposed Solution
An AI-powered learning platform that automates quiz grading, generates personalized study plans, provides real-time analytics, and offers an AI tutor chatbot — all accessible from any device via a modern web interface.

---

## 2. Overall Description

### 2.1 Product Perspective
The system is a client-server web application where:
- **Frontend:** React SPA with TypeScript, served via Vite
- **Backend:** Supabase (PostgreSQL database, Auth, Edge Functions, Realtime)
- **AI Services:** Edge Functions calling LLM APIs for tutoring and study plan generation

### 2.2 User Classes

| User Type | Description | Access Level |
|-----------|-------------|--------------|
| Guest | Unauthenticated visitor | Landing page only |
| Student | Registered learner | All modules (own data only) |
| Shared User | Anyone with share link | View shared study plan only |

### 2.3 Operating Environment
- **Client:** Modern web browser (Chrome, Firefox, Safari, Edge)
- **Server:** Supabase Cloud (PostgreSQL 15+, Deno Edge Functions)
- **Hosting:** CDN-hosted static frontend assets

### 2.4 Constraints
- Requires internet connection
- AI features depend on external LLM model availability
- Supabase free tier has connection/storage limits
- Web-only (no native mobile app)

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

See: `diagrams/01_system_architecture.mmd`

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  React   │ │ React    │ │ Tanstack │ │Framer  │ │
│  │  Router  │ │ Context  │ │ Query    │ │Motion  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┘ │
│       └─────────────┼───────────┘                    │
│                     │                                │
│            ┌────────▼────────┐                       │
│            │ Supabase JS SDK │                       │
│            └────────┬────────┘                       │
└─────────────────────┼───────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────┼───────────────────────────────┐
│              SUPABASE BACKEND                        │
│  ┌──────────┐ ┌────▼──────┐ ┌──────────┐           │
│  │  Auth    │ │ REST API  │ │Realtime  │           │
│  │ (JWT)   │ │ (PostgREST│ │(WebSocket│           │
│  └────┬─────┘ └────┬──────┘ └────┬─────┘           │
│       └─────────────┼────────────┘                   │
│              ┌──────▼──────┐                         │
│              │ PostgreSQL  │                         │
│              │ + RLS       │                         │
│              └──────┬──────┘                         │
│  ┌──────────────────┼──────────────────┐             │
│  │           Edge Functions            │             │
│  │  ┌──────────┐  ┌───────────────┐   │             │
│  │  │ai-tutor  │  │generate-study │   │             │
│  │  │          │  │-plan          │   │             │
│  │  └──────────┘  └───────────────┘   │             │
│  └─────────────────────────────────────┘             │
└──────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack Detail

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 18 | Component-based SPA |
| Language | TypeScript | Type-safe development |
| Build Tool | Vite 5 | Fast HMR & bundling |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS + accessible components |
| State Management | TanStack React Query | Server state caching & synchronization |
| Routing | React Router v6 | Client-side routing with nested layouts |
| Animations | Framer Motion | Smooth UI transitions |
| Database | PostgreSQL (via Supabase) | Relational data storage |
| Authentication | Supabase Auth | JWT-based email/password auth |
| Serverless Functions | Supabase Edge Functions (Deno) | AI tutor & study plan generation |
| Realtime | Supabase Realtime | WebSocket subscriptions for live updates |
| Charts | Recharts | Data visualization (dashboards) |
| PDF Generation | jsPDF | Export study plans as PDF |
| Testing | Vitest + Testing Library | Unit & integration tests |

---

## 4. Module Descriptions

### 4.1 Authentication Module
- **Components:** `Auth.tsx`, `AuthContext.tsx`
- **Features:** Email/password signup & login, session management, protected routes, auto-redirect
- **Data Flow:** User credentials → Supabase Auth → JWT token → Session stored in context

### 4.2 Courses Module
- **Components:** `Courses.tsx`, `CourseDetail.tsx`
- **Features:** Browse 6 courses, view lessons, mark lessons complete, track progress
- **Tables:** `courses`, `lessons`, `user_progress`
- **Hooks:** `useCourses.ts`, `useTopicsProgress.ts`

### 4.3 Quizzes Module
- **Components:** `Quizzes.tsx`, `QuizImprovementSuggestions.tsx`
- **Features:** Take quizzes, auto-score answers, view explanations, track attempts
- **Tables:** `quizzes`, `quiz_questions`, `quiz_attempts`
- **Hooks:** `useQuizzes.ts`

### 4.4 AI Tutor Module
- **Components:** `AITutor.tsx`
- **Features:** Chat with AI tutor, conversation history, context-aware responses
- **Tables:** `chat_messages`
- **Edge Function:** `ai-tutor/index.ts`

### 4.5 Study Plan Module
- **Components:** `StudyPlan.tsx`, `StudyPlanGenerator.tsx`, `StudyPlanViewer.tsx`, `SharePlanDialog.tsx`, `LearningGoals.tsx`, `WeeklySummary.tsx`, `StudyAchievements.tsx`
- **Features:** AI-generated study plans, share via link, export PDF, set goals, track weekly progress
- **Tables:** `study_plans`, `study_session_completions`, `shared_study_plan_links`, `learning_goals`
- **Edge Function:** `generate-study-plan/index.ts`

### 4.6 Dashboard / Analytics Module
- **Components:** `Dashboard.tsx`, `ActivityHeatmap.tsx`, `StrengthsWeaknesses.tsx`, `StudyStreakWidget.tsx`
- **Features:** Study streak tracking, activity heatmap (GitHub-style), quiz performance analytics, strengths/weaknesses analysis
- **Hooks:** `useStudyStreak.ts`, `useActivityHeatmap.ts`, `useWeeklyProgress.ts`, `useRealtimeProgress.ts`

### 4.7 Settings Module
- **Components:** `Settings.tsx`, `LearningPreferences.tsx`
- **Features:** Profile management, learning level preferences, preferred subjects
- **Tables:** `profiles`

---

## 5. Database Design (ER Diagram)

See: `diagrams/02_er_diagram.mmd`

### 5.1 Tables Overview

| Table | Primary Key | Description | Row Count (Sample) |
|-------|------------|-------------|-------------------|
| `courses` | `id` (UUID) | Course catalog | 6 |
| `lessons` | `id` (UUID) | Lessons within courses | 30+ |
| `quizzes` | `id` (UUID) | Quiz assessments | 5 |
| `quiz_questions` | `id` (UUID) | Questions per quiz | 25+ |
| `quiz_attempts` | `id` (UUID) | User quiz submissions | Dynamic |
| `user_progress` | `id` (UUID) | Lesson completion tracking | Dynamic |
| `profiles` | `id` (UUID) | User profile data | Dynamic |
| `chat_messages` | `id` (UUID) | AI tutor chat history | Dynamic |
| `study_plans` | `id` (UUID) | Generated study plans | Dynamic |
| `study_session_completions` | `id` (UUID) | Study session tracking | Dynamic |
| `shared_study_plan_links` | `id` (UUID) | Shareable plan links | Dynamic |
| `learning_goals` | `id` (UUID) | User learning goals | Dynamic |

### 5.2 Relationships

```
auth.users (1) ──── (N) profiles
auth.users (1) ──── (N) user_progress
auth.users (1) ──── (N) quiz_attempts
auth.users (1) ──── (N) chat_messages
auth.users (1) ──── (N) study_plans
auth.users (1) ──── (N) learning_goals

courses (1) ──── (N) lessons
courses (1) ──── (N) quizzes
courses (1) ──── (N) user_progress

lessons (1) ──── (N) user_progress
lessons (1) ──── (N) quizzes

quizzes (1) ──── (N) quiz_questions
quizzes (1) ──── (N) quiz_attempts

study_plans (1) ──── (N) study_session_completions
study_plans (1) ──── (N) shared_study_plan_links
```

---

## 6. Data Flow Diagrams (DFD)

### 6.1 Context Diagram (Level 0)
See: `diagrams/03_dfd_level0.mmd`

**External Entities:** Student, AI Service (LLM)  
**System:** AI Learning Assistant  
**Data Flows:**
- Student → System: Login credentials, quiz answers, chat messages, study preferences
- System → Student: Course content, quiz scores, AI responses, study plans, analytics
- System → AI Service: Prompts (tutor queries, plan generation)
- AI Service → System: AI-generated responses

### 6.2 Level 1 DFD
See: `diagrams/04_dfd_level1.mmd`

**Processes:**
1. **P1 - Authenticate User:** Validates credentials, manages sessions
2. **P2 - Manage Courses:** Fetches courses/lessons, tracks completion
3. **P3 - Process Quizzes:** Loads questions, scores answers, stores attempts
4. **P4 - AI Tutoring:** Sends messages to LLM, stores conversation history
5. **P5 - Generate Study Plan:** Collects preferences, calls AI, stores plan
6. **P6 - Dashboard Analytics:** Aggregates progress data, computes streaks

---

## 7. Use Case Diagrams

See: `diagrams/05_use_cases.mmd`

### 7.1 Use Case Descriptions

| ID | Use Case | Actor | Description |
|----|----------|-------|-------------|
| UC-01 | Register Account | Guest | Create account with email, password, full name |
| UC-02 | Login | Guest | Authenticate with email & password |
| UC-03 | Browse Courses | Student | View list of available courses with details |
| UC-04 | View Lessons | Student | Read lesson content within a course |
| UC-05 | Mark Lesson Complete | Student | Toggle lesson completion status |
| UC-06 | Take Quiz | Student | Answer questions and submit for scoring |
| UC-07 | View Quiz Results | Student | See score, correct answers, explanations |
| UC-08 | Chat with AI Tutor | Student | Ask questions, get AI-powered responses |
| UC-09 | Generate Study Plan | Student | Input goals/preferences, receive AI plan |
| UC-10 | Share Study Plan | Student | Create shareable link for a study plan |
| UC-11 | Export Study Plan PDF | Student | Download study plan as PDF document |
| UC-12 | View Dashboard | Student | See progress analytics, streaks, heatmap |
| UC-13 | Update Profile | Student | Change name, learning level, subjects |
| UC-14 | View Shared Plan | Shared User | Access study plan via share link |
| UC-15 | Set Learning Goals | Student | Create weekly/monthly learning targets |
| UC-16 | Logout | Student | End session and return to landing page |

---

## 8. Sequence Diagrams

See: `diagrams/06_sequence_auth.mmd`, `diagrams/07_sequence_quiz.mmd`, `diagrams/08_sequence_ai_tutor.mmd`

### 8.1 Authentication Flow
```
User → Auth Page → Supabase Auth → JWT Token → AuthContext → Protected Route → Dashboard
```

### 8.2 Quiz Flow
```
User → Quiz Page → Supabase (fetch questions) → Display Questions → User Answers
→ Score Calculation → Supabase (store attempt) → Show Results
```

### 8.3 AI Tutor Flow
```
User → Chat Input → Supabase (store message) → Edge Function (ai-tutor)
→ LLM API → AI Response → Supabase (store response) → Display in Chat
```

### 8.4 Study Plan Generation Flow
```
User → Plan Form (goals, hours, days) → Edge Function (generate-study-plan)
→ LLM API → Generated Schedule → Supabase (store plan) → Display Plan
```

---

## 9. Activity Diagrams

See: `diagrams/09_activity_quiz.mmd`, `diagrams/10_activity_course.mmd`

### 9.1 Quiz Activity Flow
1. Student navigates to Quizzes page
2. System fetches available quizzes from database
3. Student selects a quiz
4. System loads quiz questions
5. Student answers each question
6. Student submits quiz
7. System calculates score (correct answers / total questions × 100)
8. System stores attempt in `quiz_attempts` table
9. System displays score with explanations
10. Student can view improvement suggestions

### 9.2 Course Learning Activity Flow
1. Student browses course catalog
2. Student selects a course
3. System loads course details and lessons
4. Student reads lesson content
5. Student marks lesson as complete
6. System updates `user_progress` table
7. Dashboard reflects updated progress

---

## 10. Class Diagram (Component Structure)

See: `diagrams/11_component_structure.mmd`

### 10.1 Frontend Component Hierarchy

```
App
├── AuthProvider (Context)
│   ├── QueryClientProvider (TanStack)
│   │   ├── BrowserRouter
│   │   │   ├── PublicRoute
│   │   │   │   ├── Index (Landing Page)
│   │   │   │   └── Auth (Login/Signup)
│   │   │   ├── ProtectedRoute
│   │   │   │   └── DashboardLayout
│   │   │   │       ├── Dashboard
│   │   │   │       │   ├── StudyStreakWidget
│   │   │   │       │   ├── ActivityHeatmap
│   │   │   │       │   └── StrengthsWeaknesses
│   │   │   │       ├── Courses
│   │   │   │       │   └── CourseDetail
│   │   │   │       ├── Quizzes
│   │   │   │       │   └── QuizImprovementSuggestions
│   │   │   │       ├── AITutor
│   │   │   │       ├── StudyPlan
│   │   │   │       │   ├── StudyPlanGenerator
│   │   │   │       │   ├── StudyPlanViewer
│   │   │   │       │   ├── SharePlanDialog
│   │   │   │       │   ├── LearningGoals
│   │   │   │       │   ├── WeeklySummary
│   │   │   │       │   └── StudyAchievements
│   │   │   │       └── Settings
│   │   │   │           └── LearningPreferences
│   │   │   └── SharedPlan (Public)
│   │   │   └── NotFound (404)
```

### 10.2 Custom Hooks

| Hook | Purpose | Data Source |
|------|---------|-------------|
| `useAuth()` | Auth state & methods | AuthContext |
| `useCourses()` | Fetch courses list | `courses` table |
| `useQuizzes()` | Fetch quizzes & questions | `quizzes`, `quiz_questions` |
| `useTopicsProgress()` | Track lesson completions | `user_progress` |
| `useStudyStreak()` | Calculate study streaks | `user_progress`, `quiz_attempts` |
| `useActivityHeatmap()` | Generate heatmap data | `user_progress`, `quiz_attempts` |
| `useWeeklyProgress()` | Weekly analytics | `user_progress` |
| `useRealtimeProgress()` | Live progress updates | Supabase Realtime |
| `useStudyReminders()` | Study reminder settings | Local state |
| `useGoalExpirationReminders()` | Goal deadline alerts | `learning_goals` |

---

## 11. Functional Requirements

### 11.1 Authentication (FR-01 to FR-04)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System shall allow users to register with email, password, and full name | High |
| FR-02 | System shall authenticate users via email/password login | High |
| FR-03 | System shall redirect authenticated users away from login page | Medium |
| FR-04 | System shall protect all dashboard routes from unauthenticated access | High |

### 11.2 Courses (FR-05 to FR-08)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05 | System shall display all available courses with title, description, category, and difficulty | High |
| FR-06 | System shall show lessons within each course ordered by index | High |
| FR-07 | System shall allow students to mark lessons as complete/incomplete | High |
| FR-08 | System shall track and display course completion percentage | Medium |

### 11.3 Quizzes (FR-09 to FR-13)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | System shall display available quizzes linked to courses | High |
| FR-10 | System shall load quiz questions with multiple-choice options | High |
| FR-11 | System shall auto-score quizzes upon submission | High |
| FR-12 | System shall store quiz attempts with scores and answers | High |
| FR-13 | System shall show correct answers with explanations after submission | Medium |

### 11.4 AI Tutor (FR-14 to FR-17)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14 | System shall provide a chat interface for AI tutoring | High |
| FR-15 | System shall send user messages to AI model via Edge Function | High |
| FR-16 | System shall display AI responses in real-time | High |
| FR-17 | System shall persist chat history per conversation | Medium |

### 11.5 Study Plans (FR-18 to FR-23)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-18 | System shall generate personalized study plans using AI | High |
| FR-19 | System shall accept user goals, available hours, and preferred days | High |
| FR-20 | System shall display generated schedule in weekly view | Medium |
| FR-21 | System shall allow sharing study plans via unique links | Medium |
| FR-22 | System shall export study plans as PDF documents | Low |
| FR-23 | System shall track study session completions | Medium |

### 11.6 Dashboard (FR-24 to FR-28)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-24 | System shall display overall learning progress statistics | High |
| FR-25 | System shall show study streak (current and best) | Medium |
| FR-26 | System shall render activity heatmap (GitHub-style) | Medium |
| FR-27 | System shall analyze strengths and weaknesses by quiz category | Medium |
| FR-28 | System shall show recent quiz performance with scores | Medium |

---

## 12. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Pages shall load within 3 seconds on 4G connection |
| NFR-02 | Performance | Quiz scoring shall complete within 500ms |
| NFR-03 | Scalability | System shall support 1000+ concurrent users |
| NFR-04 | Security | All database tables shall have RLS policies |
| NFR-05 | Security | Authentication shall use JWT tokens with secure session management |
| NFR-06 | Security | API keys shall be stored as environment variables, never in code |
| NFR-07 | Usability | UI shall be responsive (mobile, tablet, desktop) |
| NFR-08 | Usability | System shall provide toast notifications for user actions |
| NFR-09 | Reliability | System shall handle API errors gracefully with user-friendly messages |
| NFR-10 | Availability | System shall target 99.5% uptime via managed cloud infrastructure |
| NFR-11 | Compatibility | System shall work on Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-12 | Maintainability | Code shall use TypeScript for type safety across the codebase |

---

## 13. System Interfaces

### 13.1 Frontend ↔ Supabase SDK

```typescript
// Database operations
supabase.from('courses').select('*')
supabase.from('quiz_attempts').insert({ ... })
supabase.from('user_progress').upsert({ ... })

// Authentication
supabase.auth.signUp({ email, password })
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
supabase.auth.getSession()

// Edge Functions
supabase.functions.invoke('ai-tutor', { body: { message, context } })
supabase.functions.invoke('generate-study-plan', { body: { goals, hours, days } })

// Realtime subscriptions
supabase.channel('progress').on('postgres_changes', { event: '*', schema: 'public' }, callback)
```

### 13.2 Edge Function APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/ai-tutor` | POST | `{ message, conversation_id, context }` | `{ response: string }` |
| `/generate-study-plan` | POST | `{ goals[], hours, preferred_days[] }` | `{ schedule: JSON }` |

### 13.3 Database Function

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `get_shared_study_plan` | `p_share_token: string` | `JSON` | Retrieves study plan data by share token |

---

## 14. Security & RLS Policies

### 14.1 Row-Level Security Overview

All tables have RLS enabled. Policies ensure users can only access their own data:

```sql
-- Example: Users can only read their own quiz attempts
CREATE POLICY "Users can view own quiz attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Example: Users can only insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 14.2 Public vs Protected Data

| Access Level | Tables |
|-------------|--------|
| Public Read | `courses`, `lessons`, `quizzes`, `quiz_questions` |
| Authenticated Read (own data) | `profiles`, `user_progress`, `quiz_attempts`, `chat_messages`, `study_plans`, `learning_goals` |
| Public Read (via token) | `shared_study_plan_links` (active links only) |

### 14.3 Authentication Security
- Passwords hashed using bcrypt (Supabase Auth default)
- JWT tokens with expiration
- Session refresh handled automatically by Supabase SDK
- Protected routes enforce authentication at component level

---

## 15. Testing Strategy

### 15.1 Testing Levels

| Level | Tool | Scope |
|-------|------|-------|
| Unit Testing | Vitest | Individual functions, hooks, utilities |
| Component Testing | Testing Library + Vitest | React component rendering & behavior |
| Integration Testing | Vitest + Supabase SDK | API calls, data flow, auth flow |
| End-to-End Testing | Manual Browser Testing | Complete user journeys |

### 15.2 Test Cases

| TC-ID | Module | Test Case | Expected Result |
|-------|--------|-----------|-----------------|
| TC-01 | Auth | Register with valid credentials | Account created, redirect to verify email |
| TC-02 | Auth | Login with valid credentials | Session established, redirect to dashboard |
| TC-03 | Auth | Login with invalid password | Error toast displayed |
| TC-04 | Courses | Load courses page | 6 courses displayed with details |
| TC-05 | Courses | Open course detail | Lessons listed in order |
| TC-06 | Courses | Mark lesson complete | Progress updated, UI reflects change |
| TC-07 | Quizzes | Start a quiz | Questions loaded with options |
| TC-08 | Quizzes | Submit quiz answers | Score calculated and displayed |
| TC-09 | Quizzes | View quiz explanations | Correct answers shown with explanations |
| TC-10 | AI Tutor | Send a message | AI response received and displayed |
| TC-11 | Study Plan | Generate plan with goals | Study schedule created and displayed |
| TC-12 | Study Plan | Share plan via link | Shareable URL generated |
| TC-13 | Dashboard | View study streak | Current and best streak shown |
| TC-14 | Dashboard | View activity heatmap | Calendar grid rendered with activity data |
| TC-15 | Settings | Update profile name | Name updated in database |

---

## 16. Deployment Architecture

See: `diagrams/12_deployment.mmd`

```
┌─────────────────────┐     ┌─────────────────────────┐
│   User's Browser    │     │    CDN (Lovable)         │
│   ┌───────────┐     │────▶│   Static Assets          │
│   │ React SPA │     │     │   (HTML, JS, CSS)        │
│   └─────┬─────┘     │     └─────────────────────────┘
│         │           │
│         │ HTTPS     │     ┌─────────────────────────┐
│         └───────────│────▶│   Supabase Cloud         │
│                     │     │   ┌─────────────────┐   │
│                     │     │   │ Auth Service     │   │
│                     │     │   ├─────────────────┤   │
│                     │     │   │ PostgREST API    │   │
│                     │     │   ├─────────────────┤   │
│                     │     │   │ Realtime Engine  │   │
│                     │     │   ├─────────────────┤   │
│                     │     │   │ Edge Functions   │   │
│                     │     │   ├─────────────────┤   │
│                     │     │   │ PostgreSQL DB    │   │
│                     │     │   └─────────────────┘   │
│                     │     └─────────────────────────┘
└─────────────────────┘
```

### 16.1 Build & Deploy

```bash
# Build production bundle
npm run build

# Output: dist/ folder (static files)
# Deploy to: Lovable hosting, Vercel, Netlify, or any CDN
```

---

## 17. Future Enhancements

| Priority | Feature | Description |
|----------|---------|-------------|
| High | Video Lessons | Embed video content within lessons |
| High | Adaptive Quizzes | AI adjusts difficulty based on performance |
| Medium | Spaced Repetition | Flashcard-style review system |
| Medium | Collaborative Study | Group study rooms with shared progress |
| Medium | Mobile App | React Native version for iOS/Android |
| Low | Gamification | Badges, leaderboards, XP points |
| Low | Face Recognition | Identity verification for assessments |
| Low | Content Summarization | AI-powered lesson summaries |

---

## 18. References

1. IEEE 830-1998 — IEEE Recommended Practice for Software Requirements Specifications
2. React Documentation — https://react.dev
3. Supabase Documentation — https://supabase.com/docs
4. TypeScript Handbook — https://www.typescriptlang.org/docs
5. Tailwind CSS Documentation — https://tailwindcss.com/docs
6. shadcn/ui Components — https://ui.shadcn.com
7. Vite Build Tool — https://vitejs.dev
8. TanStack React Query — https://tanstack.com/query
9. PostgreSQL Documentation — https://www.postgresql.org/docs
10. Recharts Library — https://recharts.org

---

## Appendix A: Diagram Files

All diagrams are available as Mermaid (`.mmd`) files in the `diagrams/` folder:

| File | Diagram |
|------|---------|
| `01_system_architecture.mmd` | System Architecture |
| `02_er_diagram.mmd` | Entity-Relationship Diagram |
| `03_dfd_level0.mmd` | DFD Level 0 (Context) |
| `04_dfd_level1.mmd` | DFD Level 1 |
| `05_use_cases.mmd` | Use Case Diagram |
| `06_sequence_auth.mmd` | Sequence: Authentication |
| `07_sequence_quiz.mmd` | Sequence: Quiz Flow |
| `08_sequence_ai_tutor.mmd` | Sequence: AI Tutor |
| `09_activity_quiz.mmd` | Activity: Quiz Process |
| `10_activity_course.mmd` | Activity: Course Learning |
| `11_component_structure.mmd` | Component Structure |
| `12_deployment.mmd` | Deployment Architecture |

---

*Document generated for AI Learning Assistant v1.0 — March 2026*
