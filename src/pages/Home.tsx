import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Timestamp, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { Search, MapPin, Clock, Briefcase, Zap, Building2, Bookmark, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ensurePlatformJobs } from '../services/jobService';
import { fetchJobsFromFirebase, getFallbackJobs, readCachedJobs, saveCachedJobs } from '../services/jobFeedService';
import { db } from '../firebase';

const PAGE_SIZE = 10;
const FEED_LIMIT = 150;
const REFRESH_INTERVAL_MS = 90 * 1000;

const DESCRIPTION_VARIATIONS = [
  'You will play a key role in building momentum across campaigns while keeping communication clear and timely across stakeholders.',
  'This role is ideal for someone who can blend execution with creative thinking and ship quality work without constant supervision.',
  'You will own delivery quality, collaborate across teams, and help improve performance through steady, measurable iteration.'
];

const STANDARD_APPLICATION_QUESTIONS = [
  'Please add your LinkedIn account here',
  'What is your expected salary?',
  'Have you read the complete JD?'
];

function toTimestampValue(value: any) {
  if (value instanceof Timestamp) return value.toMillis();
  if (value) return new Date(value).getTime();
  return 0;
}

function blendDefaultFeed(jobList: Job[]) {
  const leadGateway = jobList.filter((job) => job.company === 'LeadGateway');
  const others = jobList.filter((job) => job.company !== 'LeadGateway');

  return [...leadGateway.slice(0, 2), ...others];
}

function pickDescriptionVariation(job: Job) {
  const seed = [...(job.id || job.title)].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DESCRIPTION_VARIATIONS[seed % DESCRIPTION_VARIATIONS.length];
}

function inferWorkingHours(job: Job) {
  if (job.weeklyHours <= 20) return '08:00 PM - 12:00 AM (4 Hours)';
  if (job.weeklyHours <= 30) return '04:00 PM - 10:00 PM (6 Hours)';
  return '09:00 AM - 06:00 PM (8 Hours)';
}

function buildFullJobDescription(job: Job) {
  const existing = (job.description || '').trim();
  if (existing.length > 260 && /Key Responsibilities|Requirements|Application Question/i.test(existing)) {
    return existing;
  }

  const roleLine = `We're hiring ${job.title}${job.workType ? ` (${job.workType})` : ''}`;
  const requirements = Array.from(new Set([...(job.requirements || []), 'Collaboration', 'Execution Quality'])).slice(0, 5);
  const location = job.location || 'Remote';
  const experienceHint = /senior|lead|manager/i.test(job.title) ? '2+ years' : '1+ year';

  return [
    'Full job description',
    roleLine,
    '',
    `Working Hours: ${inferWorkingHours(job)}`,
    'Working Days: Monday to Friday',
    `Location: ${location}`,
    '',
    'Key Responsibilities:',
    `- Deliver high-impact work for ${job.title.toLowerCase()} goals with consistent quality and attention to detail`,
    `- Manage and publish updates aligned with team priorities and business outcomes`,
    `- Maintain consistency in communication, execution standards, and reporting`,
    `- Collaborate with cross-functional teams to plan and improve weekly campaigns`,
    '',
    'Requirements:',
    `- ${experienceHint} of relevant practical experience`,
    ...requirements.map((req) => `- Strong ${req.toLowerCase()} skills`),
    '',
    pickDescriptionVariation(job),
    '',
    `Job Type: ${job.duration}`,
    `Pay: ${job.salaryRange} per month`,
    '',
    'Application Question(s):',
    ...STANDARD_APPLICATION_QUESTIONS.map((question) => `- ${question}`),
    '',
    `Experience: ${job.title} related work (${experienceHint})`
  ].join('\n');
}

export default function Home({ user, profile }: any) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [salaryFilter, setSalaryFilter] = useState('Any');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const handleDetailPanelWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const panel = event.currentTarget;
    const parentScroller = panel.closest('.content-area');
    if (!(parentScroller instanceof HTMLElement)) return;

    const atTop = panel.scrollTop <= 0;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
    const scrollingDown = event.deltaY > 0;
    const scrollingUp = event.deltaY < 0;

    if ((scrollingDown && atBottom) || (scrollingUp && atTop)) {
      parentScroller.scrollBy({ top: event.deltaY, behavior: 'auto' });
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cachedJobs = readCachedJobs();
    if (cachedJobs.length) {
      setJobs(cachedJobs);
      setLoading(false);
    }

    const refreshJobs = async (attemptSeed: boolean = false) => {
      try {
        let jobList = await fetchJobsFromFirebase(FEED_LIMIT);

        if (!jobList.length && attemptSeed) {
          await ensurePlatformJobs();
          jobList = await fetchJobsFromFirebase(FEED_LIMIT);
        }

        if (!jobList.length) {
          jobList = getFallbackJobs();
        }

        const sorted = jobList.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return toTimestampValue(b.postedAt) - toTimestampValue(a.postedAt);
        });

        if (isMounted) {
          setJobs(sorted);
          saveCachedJobs(sorted);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          const fallback = cachedJobs.length ? cachedJobs : getFallbackJobs();
          setJobs(fallback);
          setLoading(false);
        }
        console.error('Job refresh failed', error);
      }
    };

    void refreshJobs(true);
    const intervalId = window.setInterval(() => {
      void refreshJobs(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, salaryFilter]);

  const filteredJobs = useMemo(() => {
    const source = searchTerm.trim() || filter !== 'All' || salaryFilter !== 'Any' ? jobs : blendDefaultFeed(jobs);

    return source.filter((job) => {
      const haystack = `${job.title} ${job.company} ${job.location || ''} ${job.salaryRange || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || job.workType === filter;
      const matchesSalary = salaryFilter === 'Any' || job.salaryRange === salaryFilter;
      return matchesSearch && matchesFilter && matchesSalary;
    });
  }, [jobs, searchTerm, filter, salaryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const visibleJobs = filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);
  const activeJob = selectedJob && filteredJobs.some((job) => job.id === selectedJob.id)
    ? selectedJob
    : filteredJobs[0] ?? jobs[0] ?? null;

  const hasMorePages = filteredJobs.length > PAGE_SIZE;

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    let cancelled = false;

    const loadSavedJobs = async () => {
      if (!user?.uid) {
        setSavedJobIds(new Set());
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'savedJobs'));
        if (cancelled) return;
        setSavedJobIds(new Set(snapshot.docs.map((item) => item.id)));
      } catch {
        if (!cancelled) {
          setNotice('Unable to load saved jobs right now.');
        }
      }
    };

    void loadSavedJobs();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const toggleSavedJob = useCallback(async (job: Job) => {
    if (!user?.uid) {
      setNotice('Please login to save jobs');
      navigate('/login', { state: { message: 'Please login to save jobs' } });
      return;
    }

    const savedRef = doc(db, 'users', user.uid, 'savedJobs', job.id);

    try {
      const alreadySaved = savedJobIds.has(job.id);
      if (alreadySaved) {
        await deleteDoc(savedRef);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
        setNotice('Job removed from saved jobs.');
      } else {
        await setDoc(savedRef, {
          ...job,
          jobUid: job.id,
          savedAt: serverTimestamp(),
          userUid: user.uid
        });
        setSavedJobIds((prev) => new Set(prev).add(job.id));
        setNotice('Job saved successfully.');
      }
    } catch {
      setNotice('Unable to update saved jobs. Please try again.');
    }
  }, [navigate, savedJobIds, user?.uid]);

  return (
    <div className="space-y-8 max-w-375 mx-auto">
      {notice && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-primary p-3 rounded-xl text-xs border border-primary/20 font-bold">
          {notice}
        </div>
      )}
      {/* Featured Banner */}
      <div className="leadgateway-banner">
        <div className="space-y-2">
          <div className="badge-featured">Now Hiring</div>
          <h2 className="text-2xl font-extrabold">Fresh Roles Across Top Remote Teams</h2>
          <p className="text-sm opacity-80 max-w-md">Browse a rotating mix of engineering, sales, product, and operations roles from multiple verified companies.</p>
        </div>
        <button className="hidden sm:block theme-card-bg theme-text-primary px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm theme-hover-item transition-colors shadow-lg">
          Explore Open Roles
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4 section-divider pt-5">
        <div className="relative grow" title="Search jobs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search jobs, companies, city, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-sidebar border border-border dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-sm text-text-dark dark:text-white placeholder:text-text-muted"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="scroll-divider overflow-x-auto flex gap-2 pb-2 md:pb-0 pr-2">
            {['All', 'Remote', 'On-site', 'Hybrid'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                title={`Filter by ${f}`}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                  filter === f
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white dark:bg-sidebar border-border dark:border-gray-700 text-text-muted hover:border-primary/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative min-w-50 sm:min-w-58" title="Salary filter">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2 theme-card-bg border theme-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-sm salary-text font-bold text-xs sm:text-sm"
              title="Filter by salary range"
            >
              <option value="Any">Any salary</option>
              <option value="PKR 25k - 40k">PKR 25k - 40k</option>
              <option value="PKR 50k - 120k">PKR 50k - 120k</option>
              <option value="PKR 120k - 220k">PKR 120k - 220k</option>
              <option value="PKR 220k+">PKR 220k+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
        {/* Job List - Left Side */}
        <div className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1 section-divider pt-4">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <JobCardSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              {visibleJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onSelect={() => {
                    setSelectedJob(job);
                  }}
                  active={activeJob?.id === job.id}
                  isSaved={savedJobIds.has(job.id)}
                  onToggleSave={toggleSavedJob}
                />
              ))}
            </>
          )}

          {!loading && hasMorePages && (
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-sidebar border border-border dark:border-gray-700 rounded-2xl px-3 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-light dark:bg-gray-800 text-text-dark dark:text-white disabled:opacity-40"
              >
                Previous Page
              </button>
              <span className="text-xs font-bold text-text-muted">Page {safeCurrentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          )}
        </div>

        {/* Detail View - Right Side */}
        <div className="hidden lg:block">
          {activeJob ? (
            <div
              className="bg-white dark:bg-sidebar rounded-4xl border border-border dark:border-gray-700 shadow-lg p-8 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 overflow-y-auto lg:overscroll-contain"
              onWheel={handleDetailPanelWheel}
            >
              <JobDetailPreview job={activeJob} user={user} profile={profile} />
            </div>
          ) : (
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-4xl border border-border dark:border-gray-700 p-12 flex items-center justify-center h-96">
              <div className="text-center space-y-3">
                <Briefcase className="w-16 h-16 text-text-muted/30 mx-auto" />
                <p className="text-text-muted font-bold">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-20 bg-white dark:bg-sidebar rounded-3xl border border-dashed border-border p-12">
          <Briefcase className="w-16 h-16 text-text-muted mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-black tracking-tight">No Jobs Found</h3>
          <p className="text-text-muted mt-2 max-w-xs mx-auto text-sm">
            {jobs.length === 0 
              ? "The database is currently empty. If you are an admin, please initialize the platform data." 
              : "We couldn't find any jobs matching your current search criteria. Try adjusting your filters."}
          </p>
          
          {(profile?.role === 'admin' || user?.email === 'sufyanrasheed12@gmail.com') && jobs.length === 0 && (
            <div className="mt-8 space-y-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Admin Actions Required</p>
              <button 
                onClick={async () => {
                  setLoading(true);
                  await ensurePlatformJobs();
                  const refreshedJobs = await fetchJobsFromFirebase(FEED_LIMIT);
                  setJobs(refreshedJobs.length ? refreshedJobs : getFallbackJobs());
                  saveCachedJobs(refreshedJobs.length ? refreshedJobs : getFallbackJobs());
                  setLoading(false);
                }}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center mx-auto"
              >
                <Zap className="w-4 h-4 mr-2" /> Initialize Platform Data
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function JobCardSkeleton() {
  return <div className="h-28 theme-card-bg border theme-border animate-pulse rounded-2xl" />;
}

const JobCard = memo(function JobCard({ job, onSelect, active, isSaved, onToggleSave }: any) {
  const postedTime = job.postedAt ? formatDistanceToNow(job.postedAt instanceof Timestamp ? job.postedAt.toDate() : new Date(job.postedAt), { addSuffix: true }) : 'Just now';

  return (
    <div
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      className={`w-full text-left border rounded-2xl p-4 transition-all group cursor-pointer shadow-sm hover:shadow-md ${
        active
          ? 'theme-card-bg border-primary/40 shadow-primary/5'
          : 'theme-card-bg theme-border hover:border-primary/40'
      }`}
    >
      <div className="space-y-2.5">
        {/* Header with Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="job-title text-sm sm:text-base font-black tracking-tight leading-snug">
              {job.title}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-text-muted mt-1 flex items-center gap-1" title="Company name">
              <Building2 className="w-3 h-3" />
              {job.company}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              isSaved 
                ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                : 'bg-primary-light dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
            aria-label={isSaved ? 'Remove from saved jobs' : 'Save this job'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <p className="text-[11px] sm:text-xs leading-relaxed text-text-muted line-clamp-2">
          {job.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2">
          {job.company === 'LeadGateway' && (
            <span className="flex items-center text-[8px] bg-blue-50 dark:bg-blue-900/40 text-primary px-2 py-0.5 rounded-full font-black tracking-widest uppercase border border-primary/20">
              ✓ Verified
            </span>
          )}
          <span className="text-[9px] sm:text-[10px] font-bold theme-text-primary uppercase tracking-widest salary-tag px-2 py-0.5 rounded-md" title="Work type">
            {job.workType}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold theme-text-primary uppercase tracking-widest salary-tag px-2 py-0.5 rounded-md" title="Engagement duration">
            {job.duration}
          </span>
          <span className="salary-tag salary-text text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" title="Salary range">
            {job.salaryRange}
          </span>
        </div>

        {/* Location & Posted */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-text-muted pt-2 section-divider">
          <span className="flex items-center gap-1" title="Location">
            <MapPin className="w-3 h-3 text-primary" />
            {job.location || 'Remote'}
          </span>
          <span className="flex items-center gap-1" title="Posted time">
            <Clock className="w-3 h-3" />
            {postedTime}
          </span>
        </div>
      </div>
    </div>
  );
});

function JobDetailPreview({ job, user, profile }: any) {
  const navigate = useNavigate();
  const postedTime = job.postedAt 
    ? formatDistanceToNow(job.postedAt instanceof Timestamp ? job.postedAt.toDate() : new Date(job.postedAt), { addSuffix: true }) 
    : 'Just now';
  const fullDescription = buildFullJobDescription(job);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2.5">
        <h1 className="job-title text-xl sm:text-2xl font-black tracking-tight">
          {job.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-text-muted" title="Company">{job.company}</span>
          {job.company === 'LeadGateway' && (
            <span className="flex items-center text-[9px] bg-blue-50 dark:bg-blue-900/40 text-primary px-2 py-0.5 rounded-full font-black tracking-widest uppercase border border-primary/20">
              ✓ Verified
            </span>
          )}
          <span className="salary-tag salary-text text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" title="Salary range">
            {job.salaryRange}
          </span>
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="info-box p-2.5 rounded-xl">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Job Type</div>
          <div className="font-bold theme-text-primary mt-1">{job.workType}</div>
        </div>
        <div className="info-box p-2.5 rounded-xl">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Location</div>
          <div className="font-bold theme-text-primary mt-1">{job.location || 'Remote'}</div>
        </div>
        <div className="info-box p-2.5 rounded-xl">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Duration</div>
          <div className="font-bold theme-text-primary mt-1">{job.duration}</div>
        </div>
        <div className="info-box p-2.5 rounded-xl">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Hours/Week</div>
          <div className="font-bold theme-text-primary mt-1">{job.weeklyHours}h</div>
        </div>
      </div>

      {/* CTA */}
      <button
        className="w-full bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
        title="Start application"
        onClick={() => navigate(`/job/${job.id}`)}
      >
        Apply Now
      </button>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="font-black text-xs sm:text-sm tracking-tight text-text-dark dark:text-white">Full Job Description</h3>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
          {fullDescription}
        </p>
      </div>

      {/* Requirements */}
      <div className="space-y-3">
        <h3 className="font-black text-xs sm:text-sm tracking-tight text-text-dark dark:text-white">Key Skills</h3>
        <div className="flex flex-wrap gap-2">
          {job.requirements?.slice(0, 4).map((req: string, i: number) => (
            <span key={i} className="text-[10px] sm:text-[11px] info-box px-2.5 py-1.5 rounded-md font-bold theme-text-primary" title="Key requirement">
              {req}
            </span>
          ))}
          {job.requirements?.length > 4 && (
            <span className="text-[11px] text-primary font-bold">+{job.requirements.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Posted Info */}
      <div className="pt-4 section-divider">
        <p className="text-[11px] text-text-muted">Posted {postedTime}</p>
      </div>
    </div>
  );
}

