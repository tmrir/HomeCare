import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Define user roles as a type
type UserRole = 'admin' | 'technician' | 'user';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

interface Profile {
  id: string;
  role: UserRole;
  // Add other profile fields as needed
}

const ProtectedRoute = ({ allowedRoles = ['admin'] }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user role from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single<Profile>();

        if (profileError) throw profileError;

        const role = profileData?.role || 'user';
        setUserRole(role);

        // Check if user has required role
        if (!allowedRoles.includes(role)) {
          // Redirect based on user role
          if (role === 'technician') {
            navigate('/technician-dashboard');
          } else if (role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/unauthorized');
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If we have a user role and it's in the allowed roles, render the children
  if (userRole && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // Default to showing nothing (redirect will happen in the effect)
  return null;
};

export default ProtectedRoute;
