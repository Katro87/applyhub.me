import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Mail, Lock, User, Phone, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verificationNotice, setVerificationNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    skills: [] as string[],
    interests: [] as string[]
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  React.useEffect(() => {
    const routeMessage = (location.state as any)?.message;
    if (routeMessage) {
      setVerificationNotice(routeMessage);
    }
  }, [location.state]);

  const mapAuthErrorMessage = (err: any) => {
    const code = err?.code || '';

    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please log in instead.';
      case 'auth/invalid-email':
        return 'Invalid email format. Please enter a correct email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'This email is already registered. Please login instead.';
      case 'auth/popup-closed-by-user':
        return 'Google login was cancelled before completion.';
      case 'auth/too-many-requests':
        return 'Too many attempts detected. Please wait a moment and try again.';
      default:
        return err?.message || 'Something went wrong. Please try again.';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (!userCredential.user.emailVerified) {
          setUnverifiedEmail(userCredential.user.email || formData.email);
          setError('Please verify your email before logging in.');
          await signOut(auth);
          return;
        }
        if (userCredential.user.email === 'sufyanrasheed12@gmail.com') {
          navigate('/admin-dashboard');
        } else {
          navigate('/home');
        }
      } else {
        if (step < 3) {
          setStep(step + 1);
          setLoading(false);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Invalid email format. Please enter a correct email address.');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const existingMethods = await fetchSignInMethodsForEmail(auth, formData.email.trim().toLowerCase());
        if (existingMethods.length > 0) {
          setError('This email is already registered. Please log in instead.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await sendEmailVerification(userCredential.user);
        let profileCreationSuccess = false;
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: formData.email,
            fullName: formData.fullName,
            phone: formData.phone,
            role: 'user',
            skills: formData.skills,
            interests: formData.interests,
            emailVerified: false,
            phoneVerified: false,
            applicationLimit: 1,
            applicationsThisWeek: 0,
            subscriptionTier: 'free',
            jobCredits: 0,
            createdAt: new Date().toISOString()
          });
          profileCreationSuccess = true;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
        }
        await signOut(auth);
        setUnverifiedEmail(formData.email);
        setVerificationNotice('A verification email has been sent. Please verify your email, then log in.');
        setIsLogin(true);
        setStep(1);
        if (profileCreationSuccess) {
          navigate('/home');
        }
      }
    } catch (err: any) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!unverifiedEmail) return;
    setError('');
    setVerificationNotice('');
    try {
      const credential = await signInWithEmailAndPassword(auth, unverifiedEmail, formData.password);
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setVerificationNotice('Verification email sent again. Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(mapAuthErrorMessage(err) || 'Unable to resend verification email.');
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-white text-text-dark placeholder:text-slate-400 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700';
  const inputWithIconClass = 'w-full pl-12 pr-4 py-3 bg-white text-text-dark placeholder:text-slate-400 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700';

  const handleGoogleLogin = async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      if (credential.user.email === 'sufyanrasheed12@gmail.com') {
        navigate('/admin-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(mapAuthErrorMessage(err));
    }
  };

  const addSkill = () => {
    if (skillInput && !formData.skills.includes(skillInput)) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput] });
      setSkillInput('');
    }
  };

  const addInterest = () => {
    if (interestInput && !formData.interests.includes(interestInput)) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput] });
      setInterestInput('');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-sidebar p-8 rounded-3xl shadow-card border border-border dark:border-gray-700">
        <div className="text-center mb-8">
          <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-text-muted mt-2 text-sm">
            {isLogin ? 'Login to access your job dashboard' : `Step ${step} of 3: ${step === 1 ? 'Basic Info' : step === 2 ? 'Your Skills' : 'Job Interests'}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-xs mb-6 border border-red-100 dark:border-red-900/50 font-bold">
            {error}
          </div>
        )}

        {verificationNotice && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs mb-6 border border-emerald-200 font-bold">
            {verificationNotice}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputWithIconClass}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={inputWithIconClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-text-muted font-bold">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    Show Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-primary font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className={inputWithIconClass}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={inputWithIconClass}
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={inputClass}
                        placeholder="name@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-text-muted font-bold">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                      />
                      Show Password
                    </label>
                  </>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Add Your Skills</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        className="grow bg-white text-text-dark placeholder:text-slate-400 px-4 py-3 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        placeholder="e.g. React, Sales, Marketing"
                      />
                      <button type="button" onClick={addSkill} className="bg-primary text-white px-4 rounded-xl font-bold shadow-md">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((s, i) => (
                        <span key={i} className="bg-primary-light dark:bg-blue-900/30 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
                          {s} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setFormData({ ...formData, skills: formData.skills.filter(x => x !== s) })} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Job Interests</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        className="grow bg-white text-text-dark placeholder:text-slate-400 px-4 py-3 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary shadow-sm dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        placeholder="e.g. Remote, Sales, Tech"
                      />
                      <button type="button" onClick={addInterest} className="bg-primary text-white px-4 rounded-xl font-bold shadow-md">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((s, i) => (
                        <span key={i} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
                          {s} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setFormData({ ...formData, interests: formData.interests.filter(x => x !== s) })} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            {!isLogin && step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="grow py-4 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold flex items-center justify-center text-text-muted"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="grow py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : step === 3 ? 'Finish Setup' : 'Continue'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {isLogin && unverifiedEmail && (
            <button
              type="button"
              onClick={resendVerificationEmail}
              className="w-full py-3 bg-primary-light text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              Resend verification email
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="px-2 bg-white dark:bg-sidebar text-text-muted">Or continue with</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-border dark:border-gray-700 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-sm font-bold">Google Login</span>
          </button>

          <p className="text-center text-sm text-text-muted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setStep(1); }} className="text-primary font-bold hover:underline">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function X({ className, onClick }: any) {
  return (
    <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}
