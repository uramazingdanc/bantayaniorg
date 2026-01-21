import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, HelpCircle } from 'lucide-react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Only this email can sign up as admin
const ADMIN_EMAIL = 'bantayaniph@gmail.com';

export const AuthScreen = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminMode, setAdminMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');
  
  const { signIn, signUp, isAuthenticated, role, isLoading } = useAuthContext();
  const navigate = useNavigate();

  // Watch for authentication state and redirect once role is determined
  useEffect(() => {
    if (isAuthenticated && role && !isLoading) {
      const redirectPath = role === 'lgu_admin' ? '/dashboard' : '/farmer';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      return;
    }
    
    setIsSubmitting(true);
    setAdminError('');
    
    try {
      if (showAdminLogin) {
        // Admin flow
        if (adminMode === 'signup') {
          // Only allow admin signup for the designated email
          if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            setAdminError('Admin registration is restricted to authorized email addresses only.');
            setIsSubmitting(false);
            return;
          }
          await signUp(email, password, name, 'lgu_admin');
          navigate('/dashboard', { replace: true });
        } else {
          await signIn(email, password);
          // Redirect will happen via useEffect once role is fetched
        }
      } else {
        // Farmer flow
        if (mode === 'signin') {
          await signIn(email, password);
          // Redirect will happen via useEffect once role is fetched
        } else {
          await signUp(email, password, name, 'farmer');
          navigate('/farmer', { replace: true });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setAgreedToTerms(false);
  };

  const toggleAdminLogin = () => {
    setShowAdminLogin(!showAdminLogin);
    setAdminMode('signin');
    setAdminError('');
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Auth Card */}
      <div className="glass-card w-full max-w-md p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <BantayAniLogo size="lg" />
        </div>

        {/* Admin Login Badge */}
        {showAdminLogin && (
          <div className="mb-6 p-3 rounded-lg bg-accent/20 border border-accent/50 text-center">
            <span className="text-accent-foreground text-sm font-medium">LGU Admin Access</span>
          </div>
        )}

        {/* Admin Error Message */}
        {adminError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-center">
            <span className="text-destructive text-sm">{adminError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field - for farmer signup OR admin signup */}
          {((mode === 'signup' && !showAdminLogin) || (showAdminLogin && adminMode === 'signup')) && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-muted-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  className="pl-11 h-12 input-dark"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 input-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              {((mode === 'signin' && !showAdminLogin) || (showAdminLogin && adminMode === 'signin')) && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 input-dark"
              required
              minLength={6}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline">
                Terms and Conditions
              </a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !agreedToTerms}
            className="w-full h-12 text-base font-semibold btn-primary-glow"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {showAdminLogin 
                  ? (adminMode === 'signin' ? 'Signing in...' : 'Creating admin account...')
                  : (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                }
              </>
            ) : (
              showAdminLogin 
                ? (adminMode === 'signin' ? 'Sign In' : 'Create Admin Account')
                : (mode === 'signin' ? 'Sign In' : 'Sign Up')
            )}
          </Button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        {showAdminLogin ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {adminMode === 'signin' ? (
              <>
                Need to create admin account?{' '}
                <button
                  type="button"
                  onClick={() => { setAdminMode('signup'); setAdminError(''); resetForm(); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an admin account?{' '}
                <button
                  type="button"
                  onClick={() => { setAdminMode('signin'); setAdminError(''); resetForm(); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); resetForm(); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); resetForm(); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        )}

        {/* Help / User Guide */}
        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <HelpCircle className="w-4 h-4" />
          <span>Help / User Guide</span>
        </div>

        {/* Admin Access Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={toggleAdminLogin}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {showAdminLogin ? '← Back to User Login' : 'Admin Access →'}
          </button>
        </div>
      </div>
    </div>
  );
};
