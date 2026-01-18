import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'lgu_admin' ? '/dashboard' : '/farmer';
    return <Navigate to={redirectPath} replace />;
  }

  return <AuthScreen />;
};

export default Index;
