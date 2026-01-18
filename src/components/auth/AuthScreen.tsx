import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, Sprout, Building2 } from 'lucide-react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@/hooks/useAuth';

export const AuthScreen = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [role, setRole] = useState<UserRole>('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, role);
      }
      
      // Navigate based on role (will be determined after auth completes)
      if (role === 'lgu_admin') {
        navigate('/dashboard');
      } else {
        navigate('/farmer');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Mode Toggle */}
        <div className="flex mb-8 p-1 bg-muted/50 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'signin'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <Label className="text-sm text-muted-foreground mb-3 block">Select your role</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'farmer'
                  ? 'bg-primary/20 border-primary text-primary shadow-glow'
                  : 'border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <Sprout className="w-5 h-5" />
              <span className="font-medium">Farmer</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('lgu_admin')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'lgu_admin'
                  ? 'bg-primary/20 border-primary text-primary shadow-glow'
                  : 'border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">LGU Admin</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-11 h-12 input-dark"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-11 h-12 input-dark"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold btn-primary-glow"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
