import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, role, isLoading } = useAuthContext();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already authenticated with known role
  if (isAuthenticated && role) {
    const redirectPath = role === 'lgu_admin' ? '/dashboard' : '/farmer';
    return <Navigate to={redirectPath} replace />;
  }

  return <AuthScreen />;
};

export default Index;
