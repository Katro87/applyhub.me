import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment, Timestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Job, UserProfile } from '../types';
import { MapPin, Clock, DollarSign, Briefcase, Calendar, Shield, ArrowLeft, CheckCircle2, AlertTriangle, Terminal, Cpu, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { getFallbackJobs, readCachedJobs } from '../services/jobFeedService';

export default function JobDetails({ user, profile }: any) {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    coverLetter: '',
    expectedSalary: '',
    experience: '',
    availability: '',
    startDate: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      const fallbackJob = [...readCachedJobs(), ...getFallbackJobs()].find((item) => item.id === id) || null;

      if (fallbackJob) {
        setJob(fallbackJob);
        setLoading(false);
      }

      try {
        const docRef = doc(db, 'jobs', id);
        const docSnap = await Promise.race<any>([
          getDoc(docRef),
          new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4000))
        ]);

        if (docSnap?.exists?.()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `jobs/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const canApply = () => {
    if (!profile) return false;
    if (profile.role !== 'user') return false;
    
    // Check limit: 1 per week for free users
    if (profile.subscriptionTier === 'free') {
      if (profile.applicationsThisWeek >= 1) {
        const lastDate = profile.lastApplicationDate ? new Date(profile.lastApplicationDate) : null;
        if (lastDate) {
          const now = new Date();
          const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 7) return false;
        }
      }
    }
    return true;
  };

  const handleApply = async () => {
    if (!user) {
      setError('Please login to apply for this job.');
      navigate('/login', { state: { message: 'Please login to apply for jobs' } });
      return;
    }
    if (!canApply()) {
      setError('You have reached your weekly application limit. Upgrade your plan to apply for more jobs.');
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!job || !profile) return;
    setApplying(true);
    setError('');

    try {
      const applicationPayload = {
        jobUid: job.id,
        userUid: profile.uid,
        coverLetter: formData.coverLetter,
        expectedSalary: Number(formData.expectedSalary),
        experience: Number(formData.experience),
        availability: Number(formData.availability),
        startDate: formData.startDate,
        status: 'Applied',
        createdAt: serverTimestamp()
      };

      const globalApplicationRef = await addDoc(collection(db, 'applications'), applicationPayload);
      await setDoc(doc(db, 'users', profile.uid, 'applications', globalApplicationRef.id), applicationPayload);

      // Update user application count
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        applicationsThisWeek: increment(1),
        lastApplicationDate: new Date().toISOString()
      });

      setApplied(true);
      setNotice('Application submitted successfully');
      setTimeout(() => {
        setShowApplyModal(false);
        navigate('/applications');
      }, 2000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'application_submission');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!job) return;

    if (!user?.uid) {
      setNotice('Please login to save jobs');
      navigate('/login', { state: { message: 'Please login to save jobs' } });
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'savedJobs', job.id), {
        ...job,
        jobUid: job.id,
        userUid: user.uid,
        savedAt: serverTimestamp()
      });
      setNotice('Job saved successfully.');
    } catch {
      setNotice('Unable to save this job right now.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="bg-white dark:bg-sidebar rounded-4xl border border-border dark:border-gray-700 overflow-hidden">
          <div className="h-2 bg-primary/30" />
          <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex flex-wrap gap-3">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-11/12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-10/12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
              </div>
            </div>
            <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!job) return <div className="py-20 text-center">Job not found.</div>;

  const postedTime = job.postedAt ? formatDistanceToNow(job.postedAt instanceof Timestamp ? job.postedAt.toDate() : new Date(job.postedAt), { addSuffix: true }) : 'Just now';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {notice && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-primary p-3 rounded-xl text-xs border border-primary/20 font-bold">
          {notice}
        </div>
      )}

      <Link to="/home" className="inline-flex items-center text-primary font-bold hover:underline group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Network
      </Link>

      <div className="theme-card-bg rounded-4xl shadow-2xl border theme-border overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
            <div className="flex items-start space-x-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border border-border ${job.company === 'LeadGateway' ? 'bg-primary text-white' : 'bg-primary-light text-primary dark:bg-gray-800 dark:text-white'}`}>
                {job.company}
              </div>
              <div>
                <h1 className="job-title text-4xl font-black tracking-tight mb-2">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-text-muted text-sm font-bold uppercase tracking-widest">
                  <span className="flex items-center"><Globe className="w-4 h-4 mr-2 text-primary" /> {job.company}</span>
                  <span className="flex items-center"><Terminal className="w-4 h-4 mr-2 text-primary" /> {job.workType}</span>
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> {postedTime}</span>
                  <span className="salary-text flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary" /> {job.salaryRange}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="md:col-span-2 space-y-12">
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-black tracking-tight">Mission Briefing</h3>
                </div>
                <p className="text-text-dark dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                  {job.description}
                </p>
              </section>

              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-black tracking-tight">Technical Requirements</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="info-box theme-text-primary flex items-center p-4 rounded-xl">
                      <Zap className="w-5 h-5 text-primary mr-3 shrink-0" />
                      <span className="font-bold">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-6">
              <div className="info-box p-8 rounded-3xl shadow-sm">
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-6 opacity-50">Node Metadata</h4>
                <div className="space-y-6 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Duration</span>
                    <span className="theme-text-primary font-black">{job.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Work Type</span>
                    <span className="theme-text-primary font-black">{job.workType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Location</span>
                    <span className="theme-text-primary font-black">{job.location || 'Remote'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Salary</span>
                    <span className="salary-text font-black">{job.salaryRange}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10 flex gap-4">
                <Shield className="w-6 h-6 text-primary shrink-0" />
                <p className="text-[11px] text-primary font-bold leading-relaxed uppercase tracking-wider">
                  Secure Application Protocol: Verify all job details before proceeding.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-border dark:border-gray-800">
            <button 
              onClick={handleApply}
              className="grow bg-primary text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Apply Now
            </button>
            <button
              onClick={handleSaveJob}
              className="px-10 py-5 border-2 theme-border rounded-2xl font-black theme-text-primary button-bg hover:bg-primary-light dark:hover:bg-gray-800 transition-all uppercase tracking-widest text-sm"
            >
              Save to Vault
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !applying && setShowApplyModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-sidebar w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              {applied ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold">Application Submitted!</h2>
                  <p className="text-text-muted">Application submitted successfully. Redirecting to your applications...</p>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-extrabold">Apply for {job.title}</h2>
                    <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>

                  {applyStep === 1 ? (
                    <div className="space-y-6">
                      <div className="bg-primary-light dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex gap-4">
                        <AlertTriangle className="w-6 h-6 text-primary shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary">Safety Disclaimer</h4>
                          <p className="text-sm text-primary opacity-80">
                            Jobs are posted by third-party users. Apply responsibly and never share sensitive personal information or payment details with employers.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setApplyStep(2)}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        I Understand, Continue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Cover Letter / Why should we hire you?</label>
                        <textarea 
                          required
                          value={formData.coverLetter}
                          onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                          className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl min-h-37.5 outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Tell us about your experience and skills..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Expected Salary ($)</label>
                          <input 
                            type="number"
                            required
                            value={formData.expectedSalary}
                            onChange={(e) => setFormData({...formData, expectedSalary: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Experience (Years)</label>
                          <input 
                            type="number"
                            required
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Weekly Availability (h)</label>
                          <input 
                            type="number"
                            required
                            value={formData.availability}
                            onChange={(e) => setFormData({...formData, availability: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Start Date</label>
                          <input 
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                      <button 
                        onClick={submitApplication}
                        disabled={applying}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                      >
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: any) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}
