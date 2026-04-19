import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc, where, orderBy, limit, onSnapshot, increment, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Job, Application, PaymentRequest } from '../types';
import { Users, Briefcase, FileText, CreditCard, Check, X, Search, Filter, TrendingUp, Terminal, Cpu, Globe, Shield, Activity, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard({ user, profile }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, jobs: 0, apps: 0, payments: 0 });
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'sufyanrasheed12@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const appsSnap = await getDocs(collection(db, 'applications'));
        const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('status', '==', 'Pending')));

        setStats({
          users: usersSnap.size,
          jobs: jobsSnap.size,
          apps: appsSnap.size,
          payments: paymentsSnap.size
        });
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'admin_overview');
      }
    };

    fetchData();
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="py-20 text-center text-red-500 font-bold">Access Denied. Admin only.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Control Center</h1>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
          Auth Node: {user.email}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Network Nodes" value={stats.users} />
        <StatCard icon={<Cpu className="w-5 h-5 text-emerald-600" />} label="Active Tasks" value={stats.jobs} />
        <StatCard icon={<Activity className="w-5 h-5 text-purple-600" />} label="Data Packets" value={stats.apps} />
        <StatCard icon={<Shield className="w-5 h-5 text-accent" />} label="Security Clearances" value={stats.payments} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border dark:border-gray-700 space-x-8 overflow-x-auto scrollbar-hide">
        {['overview', 'jobs', 'applications', 'users', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 font-bold capitalize transition-colors relative text-sm tracking-tight ${activeTab === tab ? 'text-primary' : 'text-text-muted'}`}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-sidebar rounded-3xl p-8 shadow-card border border-border dark:border-gray-700">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-white dark:bg-sidebar p-6 rounded-2xl shadow-sm border border-border dark:border-gray-700 flex items-center space-x-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

import { seedFakeJobs } from '../services/jobService';

function OverviewTab({ stats }: any) {
  const handleSeed = async () => {
    if (window.confirm('Seed 50 fake jobs?')) {
      await seedFakeJobs(50);
      alert('Seeded!');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-600" /> Platform Growth</h3>
        <button onClick={handleSeed} className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">
          Seed Fake Jobs
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 italic">
            Chart Simulation: Upward Trend
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm">
                <span className="text-gray-600 dark:text-gray-400">New user registered: user_{i}@example.com</span>
                <span className="text-gray-400">2m ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'payments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
      setPayments(list.sort((a, b) => {
        const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected', userUid: string, type: string, amount: number) => {
    await updateDoc(doc(db, 'payments', id), { status });
    
    if (status === 'Approved') {
      const userRef = doc(db, 'users', userUid);
      if (type === 'subscription') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await updateDoc(userRef, { 
          subscriptionTier: 'monthly',
          subscriptionExpiresAt: expiresAt.toISOString(),
          applicationLimit: 50 // High limit for monthly
        });
      } else if (type === 'job_credits') {
        await updateDoc(userRef, { 
          jobCredits: increment(2)
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Verify Payments</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 border-b dark:border-gray-700">
              <th className="pb-4 font-medium">User</th>
              <th className="pb-4 font-medium">Amount</th>
              <th className="pb-4 font-medium">Type</th>
              <th className="pb-4 font-medium">Method</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {payments.map((p) => (
              <tr key={p.id} className="text-sm">
                <td className="py-4">{p.userUid.slice(0, 8)}...</td>
                <td className="py-4 font-bold">{p.amount} {p.currency}</td>
                <td className="py-4 capitalize">{p.type}</td>
                <td className="py-4">{p.method}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-4">
                  {p.status === 'Pending' && (
                    <div className="flex space-x-2">
                      <button onClick={() => handleAction(p.id, 'Approved', p.userUid, p.type, p.amount)} className="p-1 bg-green-600 text-white rounded hover:bg-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleAction(p.id, 'Rejected', p.userUid, p.type, p.amount)} className="p-1 bg-red-600 text-white rounded hover:bg-red-700"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">User Management</h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg outline-none text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 border-b dark:border-gray-700">
              <th className="pb-4 font-medium">Name</th>
              <th className="pb-4 font-medium">Email</th>
              <th className="pb-4 font-medium">Role</th>
              <th className="pb-4 font-medium">Tier</th>
              <th className="pb-4 font-medium">Apps (Wk)</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {filteredUsers.map((u) => (
              <tr key={u.uid} className="text-sm">
                <td className="py-4 font-medium">{u.fullName}</td>
                <td className="py-4 text-gray-500">{u.email}</td>
                <td className="py-4 capitalize">{u.role}</td>
                <td className="py-4 capitalize">{u.subscriptionTier}</td>
                <td className="py-4">{u.applicationsThisWeek} / {u.applicationLimit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'jobs')), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(list.sort((a, b) => {
        const timeA = a.postedAt instanceof Timestamp ? a.postedAt.toMillis() : (a.postedAt ? new Date(a.postedAt).getTime() : 0);
        const timeB = b.postedAt instanceof Timestamp ? b.postedAt.toMillis() : (b.postedAt ? new Date(b.postedAt).getTime() : 0);
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Job Monitoring</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 border-b dark:border-gray-700">
              <th className="pb-4 font-medium">Title</th>
              <th className="pb-4 font-medium">Company</th>
              <th className="pb-4 font-medium">Posted</th>
              <th className="pb-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {jobs.map((j) => (
              <tr key={j.id} className="text-sm">
                <td className="py-4 font-medium">{j.title}</td>
                <td className="py-4">{j.company}</td>
                <td className="py-4 text-gray-500">{j.postedAt?.toDate().toLocaleDateString()}</td>
                <td className="py-4 capitalize">{j.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'applications')), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApps(list.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Application Tracking</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 border-b dark:border-gray-700">
              <th className="pb-4 font-medium">Job ID</th>
              <th className="pb-4 font-medium">User ID</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {apps.map((a) => (
              <tr key={a.id} className="text-sm">
                <td className="py-4">{a.jobUid.slice(0, 8)}...</td>
                <td className="py-4">{a.userUid.slice(0, 8)}...</td>
                <td className="py-4 capitalize">{a.status}</td>
                <td className="py-4 text-gray-500">{a.createdAt?.toDate().toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

