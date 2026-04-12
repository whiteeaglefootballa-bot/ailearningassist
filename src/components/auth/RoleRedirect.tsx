import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

export function RoleRedirect() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (role) {
    case 'teacher':
      return <Navigate to="/dashboard/teacher" replace />;
    case 'admin':
      return <Navigate to="/dashboard/admin/users" replace />;
    default:
      return <Navigate to="/dashboard/student" replace />;
  }
}
