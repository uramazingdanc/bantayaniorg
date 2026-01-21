import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, HelpCircle, ArrowLeft } from 'lucide-react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
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
              <button
                type="button"
                onClick={() => setShowTermsDialog(true)}
                className="text-primary hover:underline"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          {/* Terms and Conditions Dialog */}
          <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-bold">Terms and Conditions</DialogTitle>
                <p className="text-sm text-muted-foreground">Last updated: January 21, 2026</p>
              </DialogHeader>
              <ScrollArea className="h-[60vh] px-6 pb-6">
                <div className="space-y-6 pr-4">
                  <section>
                    <h3 className="font-semibold text-foreground mb-2">1. Introduction</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Welcome to BantayAni, a pest detection and agricultural monitoring application developed 
                      to assist farmers and Local Government Units (LGUs) in the Philippines. By accessing or 
                      using our application, you agree to be bound by these Terms and Conditions.
                    </p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">2. Definitions</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong className="text-foreground">"Application"</strong> refers to the BantayAni mobile and web platform.</li>
                      <li><strong className="text-foreground">"User"</strong> refers to any individual who accesses or uses the Application.</li>
                      <li><strong className="text-foreground">"Farmer"</strong> refers to registered users who use the Application for pest detection.</li>
                      <li><strong className="text-foreground">"LGU Admin"</strong> refers to authorized local government personnel managing the platform.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">3. User Accounts</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      To use certain features of the Application, you must create an account. You agree to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Provide accurate, current, and complete information during registration.</li>
                      <li>Maintain the security of your password and account credentials.</li>
                      <li>Notify us immediately of any unauthorized use of your account.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">4. Location Services</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      BantayAni requires access to your device's location services. By using the Application, you consent to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Collection of GPS coordinates when submitting pest detection reports.</li>
                      <li>Use of location data to map pest outbreaks and generate agricultural advisories.</li>
                      <li>Sharing of anonymized location data with LGU administrators.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">5. Image and Content Submission</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      When submitting pest detection reports, you grant BantayAni:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>A non-exclusive, royalty-free license to use, store, and process submitted images.</li>
                      <li>Permission to use images for AI model training and improvement.</li>
                      <li>The right to share images with agricultural experts for verification.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">6. AI Detection Disclaimer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The pest detection feature uses artificial intelligence. You acknowledge that AI detections 
                      are preliminary and subject to verification by LGU administrators. Detection accuracy may vary 
                      based on image quality. BantayAni is not liable for crop losses resulting from detection inaccuracies.
                    </p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">7. Privacy and Data Protection</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We are committed to protecting your privacy. Personal information collected through the Application 
                      is handled in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                    </p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-foreground mb-2">8. Contact Information</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      For questions regarding these Terms and Conditions, contact us at:
                    </p>
                    <div className="mt-2 p-3 bg-card rounded-lg border border-border">
                      <p className="text-sm text-foreground font-medium">BantayAni Support Team</p>
                      <p className="text-sm text-muted-foreground">Email: bantayaniph@gmail.com</p>
                    </div>
                  </section>

                  <section className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      By checking the "I agree to the Terms and Conditions" checkbox, you acknowledge 
                      that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

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
