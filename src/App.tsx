import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';
import { ensurePlatformJobs } from './services/jobService';
import { LayoutDashboard, LogOut, Menu, X, Sun, Moon, ArrowRight, Bookmark, Home as HomeIcon, Send, Gem, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
const Home = lazy(() => import('./pages/Home'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Auth = lazy(() => import('./pages/Auth'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const MyApplications = lazy(() => import('./pages/MyApplications'));
const SavedJobs = lazy(() => import('./pages/SavedJobs'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
import { getChatbotResponse } from './services/geminiService';

class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Route render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorScreen />;
    }

    return this.props.children;
  }
}

function RouteSpinner({ label = 'Loading page...' }: { label?: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-bold theme-text-secondary">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
        />
        <span>{label}</span>
      </div>
    </div>
  );
}

function RouteErrorScreen({ message = 'We hit a route issue. Please retry navigation.' }: { message?: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="theme-card-bg border theme-border rounded-2xl p-6 max-w-lg text-center space-y-4">
        <h2 className="text-xl font-black theme-text-primary">Navigation Recovery</h2>
        <p className="text-sm theme-text-secondary">{message}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

function ProtectedProfileRoute({ user, profile, profileLoadError }: { user: any; profile: UserProfile | null; profileLoadError: string | null }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!user || profile || profileLoadError) {
      setTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [user, profile, profileLoadError]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profileLoadError) {
    return <RouteErrorScreen message={profileLoadError} />;
  }

  if (timedOut) {
    return <RouteErrorScreen message="Profile is taking longer than expected. Please retry." />;
  }

  if (!profile) {
    return <RouteSpinner label="Loading profile..." />;
  }

  return <Profile user={user} profile={profile} />;
}

function NavigationRecovery({ onRouteChange }: { onRouteChange: () => void }) {
  const location = useLocation();

  useEffect(() => {
    onRouteChange();
    document.body.style.pointerEvents = '';
  }, [location.pathname, onRouteChange]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered;

  useEffect(() => {
    let hasResolvedAuth = false;
    const loadingTimeout = window.setTimeout(() => {
      if (!hasResolvedAuth) {
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setProfileLoadError(null);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Ensure the specific email always has admin role in the UI
            if (u.email === 'sufyanrasheed12@gmail.com' && data.role !== 'admin') {
              const updatedProfile = { ...data, role: 'admin' as const };
              await updateDoc(docRef, { role: 'admin' });
              setProfile(updatedProfile);
            } else {
              setProfile(data);
            }
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email!,
              fullName: u.displayName || 'Anonymous User',
              role: u.email === 'sufyanrasheed12@gmail.com' ? 'admin' : 'user',
              applicationLimit: 1,
              applicationsThisWeek: 0,
              subscriptionTier: 'free',
              jobCredits: 0
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          setProfileLoadError('Unable to load profile right now. Please try again.');
        }
      } else {
        setProfile(null);
      }
      hasResolvedAuth = true;
      window.clearTimeout(loadingTimeout);
      setLoading(false);
    });

    void ensurePlatformJobs();
    return () => {
      window.clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark text-white' : 'text-text-dark'}`}>
        <NavigationRecovery onRouteChange={closeMobileMenu} />
        
        <Navbar 
          user={user} 
          profile={profile} 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          isSidebarPinned={isSidebarPinned}
          setIsSidebarPinned={setIsSidebarPinned}
          onMobileMenuToggle={() => setIsMobileMenuOpen((prev: boolean) => !prev)}
          isMobileViewport={isMobileViewport}
        />
        
        <div className="main-wrapper">
          <Sidebar
            user={user}
            profile={profile}
            isCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={closeMobileMenu}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          />
          
          <main className={`content-area transition-all duration-300 ${isSidebarCollapsed ? 'expanded' : ''}`}>
            <RouteErrorBoundary>
              <Suspense fallback={<RouteSpinner />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home user={user} profile={profile} />} />
                  <Route path="/job/:id" element={<JobDetails user={user} profile={profile} />} />
                  <Route path="/profile" element={<ProtectedProfileRoute user={user} profile={profile} profileLoadError={profileLoadError} />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard user={user} profile={profile} />} />
                  <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
                  <Route path="/client" element={<ClientDashboard user={user} profile={profile} />} />
                  <Route path="/applications" element={<MyApplications user={user} profile={profile} />} />
                  <Route path="/saved-jobs" element={<SavedJobs user={user} />} />
                  <Route path="/saved" element={<Navigate to="/saved-jobs" replace />} />
                  <Route path="/pricing" element={<Pricing user={user} profile={profile} />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
            <Footer />
          </main>
        </div>

        <BottomDock user={user} profile={profile} />

        <Chatbot isOpen={isChatOpen} setIsOpen={setIsChatOpen} profile={profile} />
      </div>
    </Router>
  );
}

function Sidebar({ user, profile, isCollapsed, isMobileOpen, onCloseMobile, onMouseEnter, onMouseLeave }: any) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      />
      <aside
        className={`sidebar transition-all duration-300 ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
      {user && profile && !isCollapsed && (
        <div className="bg-primary-light dark:bg-blue-900/20 border border-primary/10 dark:border-blue-800 p-5 rounded-2xl shadow-sm mb-6">
          <div className="text-[10px] uppercase tracking-widest font-extrabold text-primary mb-1 opacity-80">Available Applications</div>
          <div className="text-3xl font-black text-text-dark dark:text-white">
            {profile.applicationLimit - profile.applicationsThisWeek}/{profile.applicationLimit}
          </div>
          <div className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-wider">
            Resets in 7 days ({profile.subscriptionTier} Plan)
          </div>
        </div>
      )}

      <div className="space-y-8 w-full">
        <div>
          {!isCollapsed && <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-4 opacity-50 px-4">Main Menu</h4>}
          <ul className="space-y-2">
            <SidebarItem to="/home" icon={<HomeIcon className="w-5 h-5" />} label="Jobs Feed" active={location.pathname === '/home'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
            <SidebarItem to="/applications" icon={<Send className="w-5 h-5" />} label="My Applications" active={location.pathname === '/applications'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
            <SidebarItem to="/saved-jobs" icon={<Bookmark className="w-5 h-5" />} label="Saved Jobs" active={location.pathname === '/saved-jobs'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
            <SidebarItem to="/pricing" icon={<Gem className="w-5 h-5" />} label="Pricing" active={location.pathname === '/pricing'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
          </ul>
        </div>

        {profile?.role === 'admin' && (
          <div>
            {!isCollapsed && <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-4 opacity-50 px-4">Administration</h4>}
            <ul className="space-y-2">
              <SidebarItem to="/admin-dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Admin Dashboard" active={location.pathname === '/admin-dashboard'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
            </ul>
          </div>
        )}

        {profile?.role === 'client' && (
          <div>
            {!isCollapsed && <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-4 opacity-50 px-4">Employer Hub</h4>}
            <ul className="space-y-2">
              <SidebarItem to="/client" icon={<LayoutDashboard className="w-5 h-5" />} label="Client Panel" active={location.pathname === '/client'} isCollapsed={isCollapsed} onClick={onCloseMobile} />
            </ul>
          </div>
        )}
      </div>

      {user && (
        <div className="mt-auto pt-8 w-full">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      )}
      </aside>
    </>
  );
}

function SidebarItem({ to, icon, label, active, isCollapsed, onClick }: any) {
  return (
    <li>
      <Link 
        to={to} 
        onClick={onClick}
        title={label}
        className={`flex items-center space-x-3 rounded-xl text-sm font-bold transition-all duration-200 ${
          isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
        } ${
          active 
            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
            : 'theme-hover-item'
        }`}
      >
        <span className={`${active ? 'text-white' : ''}`}>{icon}</span>
        {!isCollapsed && <span>{label}</span>}
      </Link>
    </li>
  );
}

function Navbar({ user, profile, darkMode, toggleDarkMode, isSidebarPinned, setIsSidebarPinned, onMobileMenuToggle, isMobileViewport }: any) {
  return (
    <header className="h-16 bg-sidebar/90 dark:bg-sidebar/85 border-b border-border dark:border-gray-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => {
            if (isMobileViewport) {
              onMobileMenuToggle();
              return;
            }
            setIsSidebarPinned(!isSidebarPinned);
          }}
          title={isMobileViewport ? 'Open menu' : isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-text-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/home" className="flex items-center group">
          <img src="/applyhub-logo.svg" alt="ApplyHub.me" className="h-10 md:h-11 w-auto group-hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        <button onClick={toggleDarkMode} title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-text-muted">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-text-dark dark:text-white leading-none">{profile?.fullName}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{profile?.role}</span>
            </div>
            <Link to="/profile" title="Open profile" className="w-10 h-10 bg-primary-light text-primary rounded-xl flex items-center justify-center font-black text-sm ring-2 ring-white dark:ring-gray-700 shadow-card hover:scale-105 transition-transform">
              {profile?.fullName?.[0] || <UserCircle2 className="w-5 h-5" />}
            </Link>
          </div>
        ) : (
          <Link to="/auth" className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-primary/20">
            Get Started
          </Link>
        )}
      </div>
    </header>
  );
}

function BottomDock({ user, profile }: any) {
  const location = useLocation();

  const links = [
    { to: '/home', label: 'Jobs', icon: HomeIcon, show: true },
    { to: '/applications', label: 'Applied', icon: Send, show: !!user },
    { to: '/saved-jobs', label: 'Saved', icon: Bookmark, show: !!user },
    { to: '/pricing', label: 'Plans', icon: Gem, show: true },
    { to: '/profile', label: 'Profile', icon: UserCircle2, show: !!user }
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-sidebar/95 dark:bg-sidebar/90 backdrop-blur-md border border-border dark:border-gray-700 rounded-2xl px-2 py-1.5 shadow-xl w-[min(96vw,640px)]">
      <ul className="flex items-center justify-between gap-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                title={label}
                className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'theme-hover-item'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-10 py-6 text-center">
      <p className="text-xs text-text-muted">© 2026 applyhub.me • Built for the future of remote work</p>
    </footer>
  );
}

function Chatbot({ isOpen, setIsOpen, profile }: any) {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: `Hi ${profile?.fullName || 'there'}! 😸 I'm the ApplyHub Catbot. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getChatbotResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="catbot-bubble flex flex-col h-112.5 w-[320px] bg-white dark:bg-sidebar rounded-3xl shadow-2xl border border-border p-4"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-lg">😺</div>
                <div>
                  <h4 className="text-xs font-black">Catbot</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="grow overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-gray-50 dark:bg-gray-700 text-text-dark dark:text-white rounded-tl-none border border-border'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none text-[10px] italic text-text-muted border border-border">Catbot is thinking...</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Catbot..."
                className="grow bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />
              <button onClick={handleSend} className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="catbot-avatar shadow-2xl cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        😺
      </motion.div>
    </div>
  );
}

