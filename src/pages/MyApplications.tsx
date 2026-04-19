import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Application, Job } from '../types';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MyApplications({ user, profile }: any) {
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'applications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        
        // Fetch job details for each application
        const appsWithJobs = await Promise.all(apps.map(async (app) => {
          const jobSnap = await getDoc(doc(db, 'jobs', app.jobUid));
          return { ...app, job: jobSnap.exists() ? { id: jobSnap.id, ...jobSnap.data() } as Job : undefined };
        }));

        setApplications(appsWithJobs);
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'applications_with_jobs');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return <div className="py-20 text-center">Please login to view your applications.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold">My Applications</h1>
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{applications.length} total applications</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-sidebar rounded-3xl border border-dashed border-border">
          <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
          <p className="text-text-muted mb-6">You haven't applied for any jobs yet.</p>
          <Link to="/home" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-sidebar p-6 rounded-2xl shadow-card border border-border dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-primary-light dark:bg-blue-900/30 text-primary rounded-xl flex items-center justify-center font-bold">
                  {app.job?.company[0] || '?'}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{app.job?.title || 'Unknown Job'}</h4>
                  <p className="text-sm text-text-muted font-medium">{app.job?.company || 'Unknown Company'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center">
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    app.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                    app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' :
                    app.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Applied</p>
                  <p className="text-sm text-text-muted flex items-center font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {app.createdAt ? formatDistanceToNow(app.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
                <Link to={`/job/${app.jobUid}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
