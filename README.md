# AI Learning Assistant — Complete Project Documentation

> **Project Title:** AI Learning Assistant — An Online Learning Platform  
> **Version:** 1.0  
> **Date:** March 2026  
> **Technology Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Edge Functions)  
> **Live URL:** [https://ailearningassist.lovable.app](https://ailearningassist.lovable.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How to Run](#2-how-to-run)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Module Descriptions](#5-module-descriptions)
6. [Database Design (ER Diagram)](#6-database-design-er-diagram)
7. [Data Flow Diagrams (DFD)](#7-data-flow-diagrams-dfd)
8. [Use Case Diagram](#8-use-case-diagram)
9. [Sequence Diagrams](#9-sequence-diagrams)
10. [Activity Diagrams](#10-activity-diagrams)
11. [Component Structure](#11-component-structure)
12. [Functional Requirements](#12-functional-requirements)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [System Interfaces](#14-system-interfaces)
15. [Security & RLS Policies](#15-security--rls-policies)
16. [Testing Strategy](#16-testing-strategy)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Future Enhancements](#18-future-enhancements)
19. [Diagram Files Index](#19-diagram-files-index)
20. [References](#20-references)

---

## 1. Project Overview

The **AI Learning Assistant** is a full-stack web application that provides:
- Interactive course browsing with lesson tracking
- AI-powered chatbot tutoring
- Quiz assessments with automated scoring
- AI-generated personalized study plans
- Real-time progress dashboards with analytics (GitHub-style activity heatmap)
- User authentication and profile management
- Study plan sharing and PDF export

### Problem Statement
Traditional learning systems suffer from lack of personalized study paths, no real-time progress tracking, limited access to instant tutoring, rigid schedules without adaptive learning, and manual grading delays.

### Proposed Solution
An AI-powered learning platform that automates quiz grading, generates personalized study plans, provides real-time analytics, and offers an AI tutor chatbot — all accessible from any device via a modern web interface.

---

## 2. How to Run

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

### Build for Production

```sh
npm run build
# Deploy the generated `dist/` folder to any static hosting
```

---

## 3. Technology Stack

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

## 4. System Architecture

> 📄 Diagram file: `diagrams/01_system_architecture.mmd`

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
│  │ (JWT)   │ │(PostgREST)│ │(WebSocket)│           │
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

### Mermaid Diagram (System Architecture)

```mermaid
graph TB
    subgraph Client["Client Browser"]
        React["React 18 SPA"]
        Router["React Router v6"]
        Query["TanStack Query"]
        AuthCtx["Auth Context"]
        SDK["Supabase JS SDK"]
        
        React --> Router
        React --> Query
        React --> AuthCtx
        Query --> SDK
        AuthCtx --> SDK
    end

    subgraph Supabase["Supabase Backend"]
        Auth["Auth Service - JWT Tokens"]
        PostgREST["PostgREST API - REST Endpoints"]
        Realtime["Realtime Engine - WebSocket"]
        EdgeFn["Edge Functions - Deno Runtime"]
        DB["PostgreSQL 15+ with RLS"]
        
        Auth --> DB
        PostgREST --> DB
        Realtime --> DB
        EdgeFn --> DB
    end

    subgraph AI["AI Services"]
        LLM["LLM API - Language Model"]
    end

    SDK -->|HTTPS| Auth
    SDK -->|REST API| PostgREST
    SDK -->|WebSocket| Realtime
    SDK -->|Invoke| EdgeFn
    EdgeFn -->|API Call| LLM
```

---

## 5. Module Descriptions

### 5.1 Authentication Module
- **Components:** `Auth.tsx`, `AuthContext.tsx`
- **Features:** Email/password signup & login, session management, protected routes, auto-redirect
- **Data Flow:** User credentials → Supabase Auth → JWT token → Session stored in context

### 5.2 Courses Module
- **Components:** `Courses.tsx`, `CourseDetail.tsx`
- **Features:** Browse 6 courses, view lessons, mark lessons complete, track progress
- **Tables:** `courses`, `lessons`, `user_progress`
- **Hooks:** `useCourses.ts`, `useTopicsProgress.ts`

### 5.3 Quizzes Module
- **Components:** `Quizzes.tsx`, `QuizImprovementSuggestions.tsx`
- **Features:** Take quizzes, auto-score answers, view explanations, track attempts
- **Tables:** `quizzes`, `quiz_questions`, `quiz_attempts`
- **Hooks:** `useQuizzes.ts`

### 5.4 AI Tutor Module
- **Components:** `AITutor.tsx`
- **Features:** Chat with AI tutor, conversation history, context-aware responses
- **Tables:** `chat_messages`
- **Edge Function:** `ai-tutor/index.ts`

### 5.5 Study Plan Module
- **Components:** `StudyPlan.tsx`, `StudyPlanGenerator.tsx`, `StudyPlanViewer.tsx`, `SharePlanDialog.tsx`, `LearningGoals.tsx`, `WeeklySummary.tsx`, `StudyAchievements.tsx`
- **Features:** AI-generated study plans, share via link, export PDF, set goals, track weekly progress
- **Tables:** `study_plans`, `study_session_completions`, `shared_study_plan_links`, `learning_goals`
- **Edge Function:** `generate-study-plan/index.ts`

### 5.6 Dashboard / Analytics Module
- **Components:** `Dashboard.tsx`, `ActivityHeatmap.tsx`, `StrengthsWeaknesses.tsx`, `StudyStreakWidget.tsx`
- **Features:** Study streak tracking, activity heatmap (GitHub-style), quiz performance analytics, strengths/weaknesses analysis
- **Hooks:** `useStudyStreak.ts`, `useActivityHeatmap.ts`, `useWeeklyProgress.ts`, `useRealtimeProgress.ts`

### 5.7 Settings Module
- **Components:** `Settings.tsx`, `LearningPreferences.tsx`
- **Features:** Profile management, learning level preferences, preferred subjects
- **Tables:** `profiles`

---

## 6. Database Design (ER Diagram)

> 📄 Diagram file: `diagrams/02_er_diagram.mmd`

### 6.1 Tables Overview

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

### 6.2 Relationships

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

### 6.3 ER Diagram (Mermaid)

```mermaid
erDiagram
    courses ||--o{ lessons : contains
    courses ||--o{ quizzes : has
    courses ||--o{ user_progress : tracks
    lessons ||--o{ user_progress : tracks
    lessons ||--o{ quizzes : linked
    quizzes ||--o{ quiz_questions : contains
    quizzes ||--o{ quiz_attempts : has
    study_plans ||--o{ study_session_completions : tracks
    study_plans ||--o{ shared_study_plan_links : shares

    courses {
        uuid id PK
        string title
        string description
        string category
        string difficulty
        string image_url
        int total_lessons
    }

    lessons {
        uuid id PK
        uuid course_id FK
        string title
        text content
        int order_index
        int duration_minutes
    }

    quizzes {
        uuid id PK
        uuid course_id FK
        uuid lesson_id FK
        string title
        string difficulty
    }

    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        string question
        json options
        int correct_answer
        string explanation
        int order_index
    }

    quiz_attempts {
        uuid id PK
        uuid user_id
        uuid quiz_id FK
        int score
        int total_questions
        json answers
        timestamp completed_at
    }

    user_progress {
        uuid id PK
        uuid user_id
        uuid course_id FK
        uuid lesson_id FK
        boolean completed
        timestamp completed_at
        int score
        int time_spent_minutes
    }

    profiles {
        uuid id PK
        uuid user_id
        string full_name
        string avatar_url
        string learning_level
        array preferred_subjects
    }

    chat_messages {
        uuid id PK
        uuid user_id
        string conversation_id
        string role
        text content
        json context
    }

    study_plans {
        uuid id PK
        uuid user_id
        string title
        array goals
        int available_hours_per_week
        array preferred_days
        json schedule
        boolean is_active
    }

    study_session_completions {
        uuid id PK
        uuid user_id
        uuid study_plan_id FK
        string day
        int session_index
        timestamp completed_at
    }

    shared_study_plan_links {
        uuid id PK
        uuid study_plan_id FK
        uuid created_by
        string share_token
        boolean is_active
        timestamp expires_at
    }

    learning_goals {
        uuid id PK
        uuid user_id
        string title
        string goal_type
        int target_value
        int current_value
        string unit
        boolean is_active
        timestamp period_start
    }
```

---

## 7. Data Flow Diagrams (DFD)

### 7.1 Context Diagram (Level 0)

> 📄 Diagram file: `diagrams/03_dfd_level0.mmd`

**External Entities:** Student, AI Service (LLM)  
**System:** AI Learning Assistant  
**Data Flows:**
- Student → System: Login credentials, quiz answers, chat messages, study preferences
- System → Student: Course content, quiz scores, AI responses, study plans, analytics
- System → AI Service: Prompts (tutor queries, plan generation)
- AI Service → System: AI-generated responses

```mermaid
graph LR
    Student(("Student"))
    AIService(("AI Service LLM"))
    
    System["AI Learning Assistant System"]

    Student -->|"Login Credentials, Quiz Answers, Chat Messages, Study Preferences"| System
    System -->|"Course Content, Quiz Scores, AI Responses, Study Plans, Analytics"| Student
    System -->|"Tutor Prompts, Plan Generation Requests"| AIService
    AIService -->|"AI Responses, Generated Plans"| System
```

### 7.2 Level 1 DFD

> 📄 Diagram file: `diagrams/04_dfd_level1.mmd`

**Processes:**
1. **P1 - Authenticate User:** Validates credentials, manages sessions
2. **P2 - Manage Courses:** Fetches courses/lessons, tracks completion
3. **P3 - Process Quizzes:** Loads questions, scores answers, stores attempts
4. **P4 - AI Tutoring:** Sends messages to LLM, stores conversation history
5. **P5 - Generate Study Plan:** Collects preferences, calls AI, stores plan
6. **P6 - Dashboard Analytics:** Aggregates progress data, computes streaks

```mermaid
graph TB
    Student(("Student"))
    AIService(("AI Service"))
    
    subgraph System["AI Learning Assistant"]
        P1["P1 Authenticate User"]
        P2["P2 Manage Courses"]
        P3["P3 Process Quizzes"]
        P4["P4 AI Tutoring"]
        P5["P5 Generate Study Plan"]
        P6["P6 Dashboard Analytics"]
    end

    DB1[("Users and Profiles DB")]
    DB2[("Courses and Lessons DB")]
    DB3[("Quizzes and Attempts DB")]
    DB4[("Chat Messages DB")]
    DB5[("Study Plans DB")]
    DB6[("Progress DB")]

    Student -->|"Credentials"| P1
    P1 -->|"Session Token"| Student
    P1 -->|"User Data"| DB1

    Student -->|"Browse Request"| P2
    P2 -->|"Course Content"| Student
    P2 <-->|"Courses/Lessons"| DB2
    P2 -->|"Completion"| DB6

    Student -->|"Quiz Answers"| P3
    P3 -->|"Score and Results"| Student
    P3 <-->|"Questions"| DB3

    Student -->|"Chat Message"| P4
    P4 -->|"AI Response"| Student
    P4 -->|"Prompt"| AIService
    AIService -->|"Response"| P4
    P4 <-->|"History"| DB4

    Student -->|"Goals and Preferences"| P5
    P5 -->|"Study Schedule"| Student
    P5 -->|"Plan Request"| AIService
    AIService -->|"Generated Plan"| P5
    P5 <-->|"Plans"| DB5

    P6 -->|"Analytics and Streaks"| Student
    P6 <-->|"Progress Data"| DB6
    P6 <-->|"Quiz Data"| DB3
```

---

## 8. Use Case Diagram

> 📄 Diagram file: `diagrams/05_use_cases.mmd`

### 8.1 Use Case Table

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

### 8.2 Use Case Diagram (Mermaid)

```mermaid
graph LR
    Guest(("Guest"))
    Student(("Student"))
    SharedUser(("Shared User"))

    subgraph System["AI Learning Assistant"]
        UC01["UC-01 Register Account"]
        UC02["UC-02 Login"]
        UC03["UC-03 Browse Courses"]
        UC04["UC-04 View Lessons"]
        UC05["UC-05 Mark Lesson Complete"]
        UC06["UC-06 Take Quiz"]
        UC07["UC-07 View Quiz Results"]
        UC08["UC-08 Chat with AI Tutor"]
        UC09["UC-09 Generate Study Plan"]
        UC10["UC-10 Share Study Plan"]
        UC11["UC-11 Export Plan as PDF"]
        UC12["UC-12 View Dashboard"]
        UC13["UC-13 Update Profile"]
        UC14["UC-14 View Shared Plan"]
        UC15["UC-15 Set Learning Goals"]
        UC16["UC-16 Logout"]
    end

    Guest --> UC01
    Guest --> UC02
    Student --> UC03
    Student --> UC04
    Student --> UC05
    Student --> UC06
    Student --> UC07
    Student --> UC08
    Student --> UC09
    Student --> UC10
    Student --> UC11
    Student --> UC12
    Student --> UC13
    Student --> UC15
    Student --> UC16
    SharedUser --> UC14
```

---

## 9. Sequence Diagrams

### 9.1 Authentication Flow

> 📄 Diagram file: `diagrams/06_sequence_auth.mmd`

```mermaid
sequenceDiagram
    actor User
    participant AuthPage as Auth Page
    participant AuthCtx as Auth Context
    participant SDK as Supabase SDK
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    Note over User, DB: Registration Flow
    User->>AuthPage: Enter email, password, name
    AuthPage->>AuthCtx: signUp(email, password, name)
    AuthCtx->>SDK: auth.signUp()
    SDK->>Auth: POST /auth/signup
    Auth->>DB: Insert user record
    DB-->>Auth: User created
    Auth-->>SDK: Confirmation email sent
    SDK-->>AuthCtx: Success response
    AuthCtx-->>AuthPage: Show verification message
    AuthPage-->>User: Check your email

    Note over User, DB: Login Flow
    User->>AuthPage: Enter email, password
    AuthPage->>AuthCtx: signIn(email, password)
    AuthCtx->>SDK: auth.signInWithPassword()
    SDK->>Auth: POST /auth/token
    Auth->>DB: Validate credentials
    DB-->>Auth: User verified
    Auth-->>SDK: JWT Token + Session
    SDK-->>AuthCtx: Session established
    AuthCtx->>AuthCtx: Set user state
    AuthCtx-->>AuthPage: Redirect to /dashboard
    AuthPage-->>User: Dashboard loaded
```

### 9.2 Quiz Flow

> 📄 Diagram file: `diagrams/07_sequence_quiz.mmd`

```mermaid
sequenceDiagram
    actor User
    participant QuizPage as Quizzes Page
    participant Hook as useQuizzes Hook
    participant SDK as Supabase SDK
    participant DB as PostgreSQL

    User->>QuizPage: Navigate to /dashboard/quizzes
    QuizPage->>Hook: Fetch quizzes
    Hook->>SDK: from('quizzes').select('*')
    SDK->>DB: SELECT * FROM quizzes
    DB-->>SDK: Quiz list (5 quizzes)
    SDK-->>Hook: Quiz data
    Hook-->>QuizPage: Display quiz cards
    QuizPage-->>User: Show available quizzes

    User->>QuizPage: Select quiz
    QuizPage->>Hook: Fetch questions
    Hook->>SDK: from('quiz_questions').select('*').eq('quiz_id', id)
    SDK->>DB: SELECT * FROM quiz_questions WHERE quiz_id = ?
    DB-->>SDK: Questions (5 per quiz)
    SDK-->>Hook: Question data
    Hook-->>QuizPage: Display questions
    QuizPage-->>User: Show question with options

    User->>QuizPage: Answer all questions
    User->>QuizPage: Submit quiz
    QuizPage->>QuizPage: Calculate score
    QuizPage->>SDK: from('quiz_attempts').insert({score, answers})
    SDK->>DB: INSERT INTO quiz_attempts
    DB-->>SDK: Attempt stored
    SDK-->>QuizPage: Success
    QuizPage-->>User: Show score + explanations
```

### 9.3 AI Tutor Flow

> 📄 Diagram file: `diagrams/08_sequence_ai_tutor.mmd`

```mermaid
sequenceDiagram
    actor User
    participant Chat as AI Tutor Page
    participant SDK as Supabase SDK
    participant DB as PostgreSQL
    participant EdgeFn as Edge Function ai-tutor
    participant LLM as LLM API

    User->>Chat: Type message
    User->>Chat: Send message
    Chat->>SDK: from('chat_messages').insert({role:'user', content})
    SDK->>DB: INSERT user message
    DB-->>SDK: Stored
    Chat->>Chat: Display user message

    Chat->>SDK: functions.invoke('ai-tutor', {message, context})
    SDK->>EdgeFn: POST /ai-tutor
    EdgeFn->>EdgeFn: Build prompt with context
    EdgeFn->>LLM: Send prompt
    LLM-->>EdgeFn: AI response text
    EdgeFn-->>SDK: {response: "AI answer"}
    SDK-->>Chat: AI response received

    Chat->>SDK: from('chat_messages').insert({role:'assistant', content})
    SDK->>DB: INSERT assistant message
    DB-->>SDK: Stored
    Chat-->>User: Display AI response
```

---

## 10. Activity Diagrams

### 10.1 Quiz Activity Flow

> 📄 Diagram file: `diagrams/09_activity_quiz.mmd`

```mermaid
flowchart TD
    A([Start]) --> B[Navigate to Quizzes Page]
    B --> C[System fetches quizzes from DB]
    C --> D{Quizzes available?}
    D -->|No| E[Display empty state message]
    D -->|Yes| F[Display quiz cards]
    F --> G[User selects a quiz]
    G --> H[System loads quiz questions]
    H --> I[Display first question]
    I --> J[User selects an answer]
    J --> K{More questions?}
    K -->|Yes| L[Display next question]
    L --> J
    K -->|No| M[User clicks Submit]
    M --> N[System calculates score]
    N --> O[Score = correct / total x 100]
    O --> P[System stores attempt in quiz_attempts]
    P --> Q[Display score and results]
    Q --> R{View explanations?}
    R -->|Yes| S[Show correct answers with explanations]
    R -->|No| T{Take another quiz?}
    S --> T
    T -->|Yes| F
    T -->|No| U([End])
    E --> U
```

### 10.2 Course Learning Activity Flow

> 📄 Diagram file: `diagrams/10_activity_course.mmd`

```mermaid
flowchart TD
    A([Start]) --> B[Navigate to Courses Page]
    B --> C[System fetches courses from DB]
    C --> D[Display course cards with details]
    D --> E[User selects a course]
    E --> F[System loads course detail + lessons]
    F --> G[Display lessons list with progress]
    G --> H[User clicks on a lesson]
    H --> I[Display lesson content]
    I --> J{Mark as complete?}
    J -->|Yes| K[User toggles completion]
    K --> L[System upserts user_progress]
    L --> M[Update progress percentage]
    M --> N[Update UI with new status]
    J -->|No| O{Read next lesson?}
    N --> O
    O -->|Yes| P[Navigate to next lesson]
    P --> I
    O -->|No| Q{Back to courses?}
    Q -->|Yes| D
    Q -->|No| R([End])
```

---

## 11. Component Structure

> 📄 Diagram file: `diagrams/11_component_structure.mmd`

### 11.1 Component Hierarchy

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

### 11.2 Component Structure Diagram (Mermaid)

```mermaid
graph TD
    App["App.tsx"]
    App --> QCP["QueryClientProvider"]
    App --> TTP["TooltipProvider"]
    App --> Toaster["Toaster Components"]
    
    QCP --> BR["BrowserRouter"]
    BR --> AP["AuthProvider"]
    AP --> Routes["AppRoutes"]
    
    Routes --> Index["Index - Landing Page"]
    Routes --> AuthPage["Auth - Login/Signup"]
    Routes --> SharedPlan["SharedPlan - Public View"]
    Routes --> NotFound["NotFound - 404 Page"]
    Routes --> Protected["ProtectedRoute"]
    
    Protected --> DashLayout["DashboardLayout"]
    DashLayout --> Sidebar["Sidebar Navigation"]
    DashLayout --> GlobalSearch["GlobalSearch"]
    
    DashLayout --> Dashboard["Dashboard"]
    Dashboard --> Streak["StudyStreakWidget"]
    Dashboard --> Heatmap["ActivityHeatmap"]
    Dashboard --> Strengths["StrengthsWeaknesses"]
    
    DashLayout --> Courses["Courses"]
    Courses --> CourseDetail["CourseDetail"]
    
    DashLayout --> Quizzes["Quizzes"]
    Quizzes --> QuizSuggestions["QuizImprovementSuggestions"]
    
    DashLayout --> AITutor["AITutor"]
    
    DashLayout --> StudyPlan["StudyPlan"]
    StudyPlan --> Generator["StudyPlanGenerator"]
    StudyPlan --> Viewer["StudyPlanViewer"]
    StudyPlan --> ShareDialog["SharePlanDialog"]
    StudyPlan --> Goals["LearningGoals"]
    StudyPlan --> Weekly["WeeklySummary"]
    StudyPlan --> Achievements["StudyAchievements"]
    
    DashLayout --> Settings["Settings"]
    Settings --> LearningPrefs["LearningPreferences"]
```

### 11.3 Custom Hooks

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

## 12. Functional Requirements

### 12.1 Authentication (FR-01 to FR-04)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System shall allow users to register with email, password, and full name | High |
| FR-02 | System shall authenticate users via email/password login | High |
| FR-03 | System shall redirect authenticated users away from login page | Medium |
| FR-04 | System shall protect all dashboard routes from unauthenticated access | High |

### 12.2 Courses (FR-05 to FR-08)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05 | System shall display all available courses with title, description, category, and difficulty | High |
| FR-06 | System shall show lessons within each course ordered by index | High |
| FR-07 | System shall allow students to mark lessons as complete/incomplete | High |
| FR-08 | System shall track and display course completion percentage | Medium |

### 12.3 Quizzes (FR-09 to FR-13)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | System shall display available quizzes linked to courses | High |
| FR-10 | System shall load quiz questions with multiple-choice options | High |
| FR-11 | System shall auto-score quizzes upon submission | High |
| FR-12 | System shall store quiz attempts with scores and answers | High |
| FR-13 | System shall show correct answers with explanations after submission | Medium |

### 12.4 AI Tutor (FR-14 to FR-17)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14 | System shall provide a chat interface for AI tutoring | High |
| FR-15 | System shall send user messages to AI model via Edge Function | High |
| FR-16 | System shall display AI responses in real-time | High |
| FR-17 | System shall persist chat history per conversation | Medium |

### 12.5 Study Plans (FR-18 to FR-23)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-18 | System shall generate personalized study plans using AI | High |
| FR-19 | System shall accept user goals, available hours, and preferred days | High |
| FR-20 | System shall display generated schedule in weekly view | Medium |
| FR-21 | System shall allow sharing study plans via unique links | Medium |
| FR-22 | System shall export study plans as PDF documents | Low |
| FR-23 | System shall track study session completions | Medium |

### 12.6 Dashboard (FR-24 to FR-28)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-24 | System shall display overall learning progress statistics | High |
| FR-25 | System shall show study streak (current and best) | Medium |
| FR-26 | System shall render activity heatmap (GitHub-style) | Medium |
| FR-27 | System shall analyze strengths and weaknesses by quiz category | Medium |
| FR-28 | System shall show recent quiz performance with scores | Medium |

---

## 13. Non-Functional Requirements

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

## 14. System Interfaces

### 14.1 Frontend ↔ Supabase SDK

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

### 14.2 Edge Function APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/ai-tutor` | POST | `{ message, conversation_id, context }` | `{ response: string }` |
| `/generate-study-plan` | POST | `{ goals[], hours, preferred_days[] }` | `{ schedule: JSON }` |

### 14.3 Database Function

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `get_shared_study_plan` | `p_share_token: string` | `JSON` | Retrieves study plan data by share token |

---

## 15. Security & RLS Policies

### 15.1 Row-Level Security Overview

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

### 15.2 Public vs Protected Data

| Access Level | Tables |
|-------------|--------|
| Public Read | `courses`, `lessons`, `quizzes`, `quiz_questions` |
| Authenticated Read (own data) | `profiles`, `user_progress`, `quiz_attempts`, `chat_messages`, `study_plans`, `learning_goals` |
| Public Read (via token) | `shared_study_plan_links` (active links only) |

### 15.3 Authentication Security
- Passwords hashed using bcrypt (Supabase Auth default)
- JWT tokens with expiration
- Session refresh handled automatically by Supabase SDK
- Protected routes enforce authentication at component level

---

## 16. Testing Strategy

### 16.1 Testing Levels

| Level | Tool | Scope |
|-------|------|-------|
| Unit Testing | Vitest | Individual functions, hooks, utilities |
| Component Testing | Testing Library + Vitest | React component rendering & behavior |
| Integration Testing | Vitest + Supabase SDK | API calls, data flow, auth flow |
| End-to-End Testing | Manual Browser Testing | Complete user journeys |

### 16.2 Test Cases

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

## 17. Deployment Architecture

> 📄 Diagram file: `diagrams/12_deployment.mmd`

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

### Deployment Diagram (Mermaid)

```mermaid
graph TB
    subgraph UserDevice["User Device"]
        Browser["Web Browser - Chrome / Firefox / Safari / Edge"]
    end

    subgraph CDN["CDN - Lovable Hosting"]
        Static["Static Assets - HTML, JS, CSS, Images - Built with Vite"]
    end

    subgraph SupabaseCloud["Supabase Cloud Infrastructure"]
        AuthSvc["Auth Service - JWT Authentication"]
        PostgREST["PostgREST - Auto-generated REST API"]
        RealtimeEng["Realtime Engine - WebSocket Server"]
        EdgeRuntime["Edge Functions Runtime - Deno Deploy"]
        
        subgraph EdgeFunctions["Edge Functions"]
            AiTutor["ai-tutor - Chat with LLM"]
            GenPlan["generate-study-plan - AI Study Plan"]
        end
        
        subgraph Database["PostgreSQL Database"]
            Tables["12 Tables with RLS Policies"]
            Functions["Database Functions - get_shared_study_plan"]
        end
        
        EdgeRuntime --> EdgeFunctions
        AuthSvc --> Database
        PostgREST --> Database
        RealtimeEng --> Database
        EdgeFunctions --> Database
    end

    subgraph External["External Services"]
        LLM["LLM API - AI Language Model"]
    end

    Browser -->|"HTTPS GET"| CDN
    CDN -->|"Static Files"| Browser
    Browser -->|"HTTPS REST"| PostgREST
    Browser -->|"HTTPS Auth"| AuthSvc
    Browser -->|"WSS"| RealtimeEng
    Browser -->|"HTTPS Invoke"| EdgeRuntime
    EdgeFunctions -->|"API Call"| LLM
```

---

## 18. Future Enhancements

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

## 19. Diagram Files Index

All diagrams are available as Mermaid (`.mmd`) files in the `diagrams/` folder:

| File | Diagram |
|------|---------|
| `diagrams/01_system_architecture.mmd` | System Architecture |
| `diagrams/02_er_diagram.mmd` | Entity-Relationship Diagram |
| `diagrams/03_dfd_level0.mmd` | DFD Level 0 (Context) |
| `diagrams/04_dfd_level1.mmd` | DFD Level 1 |
| `diagrams/05_use_cases.mmd` | Use Case Diagram |
| `diagrams/06_sequence_auth.mmd` | Sequence: Authentication |
| `diagrams/07_sequence_quiz.mmd` | Sequence: Quiz Flow |
| `diagrams/08_sequence_ai_tutor.mmd` | Sequence: AI Tutor |
| `diagrams/09_activity_quiz.mmd` | Activity: Quiz Process |
| `diagrams/10_activity_course.mmd` | Activity: Course Learning |
| `diagrams/11_component_structure.mmd` | Component Structure |
| `diagrams/12_deployment.mmd` | Deployment Architecture |

---

## 20. References

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

*Document generated for AI Learning Assistant v1.0 — March 2026*
