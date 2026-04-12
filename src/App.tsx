import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleRedirect } from "@/components/auth/RoleRedirect";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AITutor from "./pages/AITutor";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Quizzes from "./pages/Quizzes";
import Settings from "./pages/Settings";
import StudyPlan from "./pages/StudyPlan";
import SharedPlan from "./pages/SharedPlan";
import Modules from "./pages/Modules";
import ModuleDetail from "./pages/ModuleDetail";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherQuizzes from "./pages/TeacherQuizzes";
import TeacherStudents from "./pages/TeacherStudents";
import AdminUsers from "./pages/AdminUsers";
import AdminActivity from "./pages/AdminActivity";
import AdminCourses from "./pages/AdminCourses";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/shared/:token" element={<SharedPlan />} />
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Role-based redirect at /dashboard */}
        <Route index element={<RoleRedirect />} />

        {/* Student routes */}
        <Route path="student" element={<RoleGuard allowedRoles={['student']}><Dashboard /></RoleGuard>} />
        <Route path="tutor" element={<RoleGuard allowedRoles={['student']}><AITutor /></RoleGuard>} />
        <Route path="courses" element={<RoleGuard allowedRoles={['student']}><Courses /></RoleGuard>} />
        <Route path="courses/:id" element={<RoleGuard allowedRoles={['student']}><CourseDetail /></RoleGuard>} />
        <Route path="modules" element={<RoleGuard allowedRoles={['student']}><Modules /></RoleGuard>} />
        <Route path="modules/:id" element={<RoleGuard allowedRoles={['student']}><ModuleDetail /></RoleGuard>} />
        <Route path="quizzes" element={<RoleGuard allowedRoles={['student']}><Quizzes /></RoleGuard>} />
        <Route path="study-plan" element={<RoleGuard allowedRoles={['student']}><StudyPlan /></RoleGuard>} />
        <Route path="settings" element={<Settings />} />

        {/* Teacher routes */}
        <Route path="teacher" element={<RoleGuard allowedRoles={['teacher']}><TeacherDashboard /></RoleGuard>} />
        <Route path="teacher/courses" element={<RoleGuard allowedRoles={['teacher']}><TeacherCourses /></RoleGuard>} />
        <Route path="teacher/quizzes" element={<RoleGuard allowedRoles={['teacher']}><TeacherQuizzes /></RoleGuard>} />
        <Route path="teacher/students" element={<RoleGuard allowedRoles={['teacher']}><TeacherStudents /></RoleGuard>} />

        {/* Admin routes */}
        <Route path="admin/users" element={<RoleGuard allowedRoles={['admin']}><AdminUsers /></RoleGuard>} />
        <Route path="admin/courses" element={<RoleGuard allowedRoles={['admin']}><AdminCourses /></RoleGuard>} />
        <Route path="admin/activity" element={<RoleGuard allowedRoles={['admin']}><AdminActivity /></RoleGuard>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
