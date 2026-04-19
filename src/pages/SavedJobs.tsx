import React, { useEffect, useState } from 'react';
import { Bookmark, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';

export default function SavedJobs({ user }: any) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      setMessage('Please login to view saved jobs');
      navigate('/login');
      return;
    }

    const loadSavedJobs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users', user.uid, 'savedJobs'), orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        setSavedJobs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Job)));
      } catch {
        setMessage('Unable to load saved jobs right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadSavedJobs();
  }, [navigate, user?.uid]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {message && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-primary p-3 rounded-xl text-xs border border-primary/20 font-bold">
          {message}
        </div>
      )}

      <h1 className="text-3xl font-extrabold">Saved Jobs</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 theme-card-bg border theme-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="text-center space-y-6 py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-sidebar rounded-full flex items-center justify-center mx-auto border border-border">
            <Bookmark className="w-10 h-10 text-text-muted opacity-20" />
          </div>
          <p className="text-text-muted">You haven't saved any jobs yet. Browse the feed to find opportunities you like!</p>
          <Link to="/home" className="inline-flex bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((job) => (
            <Link key={job.id} to={`/job/${job.id}`} className="block theme-card-bg border theme-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="job-title text-lg font-black">{job.title}</h3>
                  <p className="text-sm text-text-muted font-bold flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {job.company}
                  </p>
                </div>
                <span className="salary-tag salary-text text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
                  {job.salaryRange}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
