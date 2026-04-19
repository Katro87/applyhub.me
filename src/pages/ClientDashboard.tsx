import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Job, Application, UserProfile } from '../types';
import { Plus, Briefcase, Users, Check, X, AlertCircle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboard({ user, profile }: any) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    company: profile?.fullName || '',
    description: '',
    requirements: '',
    salaryRange: '',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'Remote' as any,
    location: ''
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'jobs'), where('clientUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeJob) return;
    const q = query(collection(db, 'applications'), where('jobUid', '==', activeJob.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplicants(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return () => unsubscribe();
  }, [activeJob]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.jobCredits < 1) {
      alert('You need job credits to post a job. Please purchase them in the Pricing section.');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await addDoc(collection(db, 'jobs'), {
        ...formData,
        requirements: formData.requirements.split(',').map(s => s.trim()),
        clientUid: user.uid,
        postedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        status: 'active',
        isFeatured: false
      });

      // Deduct credit
      await updateDoc(doc(db, 'users', user.uid), {
        jobCredits: profile.jobCredits - 1
      });

      setShowPostModal(false);
      alert('Job posted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'jobs_or_user_credits');
    }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  if (profile?.role !== 'client' && profile?.role !== 'admin') {
    return <div className="py-20 text-center">Please switch to a Client account to post jobs.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold">Client Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-primary-light dark:bg-blue-900/30 px-4 py-2 rounded-xl border border-primary/20 dark:border-blue-900/50 flex items-center shadow-sm">
            <DollarSign className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{profile.jobCredits} Job Credits</span>
          </div>
          <button 
            onClick={() => setShowPostModal(true)}
            className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" /> Post a Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-bold mb-4">Your Posted Jobs</h3>
          {jobs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-sidebar rounded-2xl border border-dashed border-border">
              <p className="text-text-muted text-sm">No jobs posted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all shadow-sm ${activeJob?.id === job.id ? 'border-primary bg-primary-light dark:bg-blue-900/20' : 'bg-white dark:bg-sidebar border-border dark:border-gray-700 hover:border-primary/50'}`}
                >
                  <h4 className="font-bold text-sm">{job.title}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">Posted: {job.postedAt?.toDate().toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {activeJob ? (
            <div className="bg-white dark:bg-sidebar rounded-3xl p-8 shadow-card border border-border dark:border-gray-700 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold">{activeJob.title}</h2>
                  <p className="text-text-muted text-sm">Manage applicants for this position</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{activeJob.status}</span>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center text-sm uppercase tracking-wider text-text-muted"><Users className="w-4 h-4 mr-2 text-primary" /> Applicants ({applicants.length})</h4>
                {applicants.length === 0 ? (
                  <div className="py-12 text-center text-text-muted italic text-sm">No applications yet.</div>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((app) => (
                      <div key={app.id} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-border dark:border-gray-700 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">Applicant ID: {app.userUid.slice(0, 8)}</p>
                            <p className="text-xs text-text-muted font-medium mt-1">Experience: {app.experience} years | Expected: ${app.expectedSalary}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                            app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' :
                            app.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted italic">"{app.coverLetter.slice(0, 150)}..."</p>
                        <div className="flex space-x-2">
                          <button onClick={() => updateAppStatus(app.id, 'Under Review')} className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">Review</button>
                          <button onClick={() => updateAppStatus(app.id, 'Shortlisted')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">Shortlist</button>
                          <button onClick={() => updateAppStatus(app.id, 'Rejected')} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-sidebar rounded-3xl border border-dashed border-border p-12 text-center">
              <Briefcase className="w-16 h-16 text-text-muted mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-text-muted opacity-50">Select a job to view applicants</h3>
            </div>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPostModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none" placeholder="e.g. Sales Manager" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl min-h-25 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Requirements (comma separated)</label>
                  <input required value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none" placeholder="React, Node.js, Sales" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Salary Range</label>
                    <input required value={formData.salaryRange} onChange={e => setFormData({...formData, salaryRange: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none" placeholder="$2k - $4k" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weekly Hours</label>
                    <input type="number" required value={formData.weeklyHours} onChange={e => setFormData({...formData, weeklyHours: Number(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Type</label>
                    <select value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value as any})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none">
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setShowPostModal(false)} className="grow py-4 border dark:border-gray-700 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="grow py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Post Job (1 Credit)</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
