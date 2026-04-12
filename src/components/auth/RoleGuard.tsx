import { Navigate } from 'react-router-dom';
import { useUserRole, AppRole } from '@/hooks/useUserRole';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard
    const redirectMap: Record<AppRole, string> = {
      student: '/dashboard',
      teacher: '/dashboard/teacher',
      admin: '/dashboard/admin/users',
    };
    return <Navigate to={redirectMap[role]} replace />;
  }

  return <>{children}</>;
}
