import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';

const CACHE_KEY = 'applyhub.jobs.cache.v1';
const CACHE_TIMESTAMP_KEY = 'applyhub.jobs.cache.ts.v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_TIMESTAMP_CACHE_KEY = 'applyhub.jobs.fallback.timestamps.v1';
const FALLBACK_AGE_BUCKETS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  45 * 60 * 1000,
  2 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
];

const FALLBACK_JOBS: Job[] = [
  {
    id: 'fallback-lead-1',
    title: 'Sales Executive',
    company: 'LeadGateway',
    description: `Full job description
We're hiring Part-Time Remote Sales Executive

Working Hours: 08:00 PM - 12:00 AM (4 Hours)
Working Days: Monday to Friday
Location: Remote / Hybrid (Lahore)

Key Responsibilities:
- Build and qualify leads through outbound calls, social channels, and follow-up workflows
- Maintain CRM hygiene and keep pipeline updates accurate
- Coordinate with the team on outreach ideas and campaign execution
- Present offers with confidence and close deals with professionalism

Requirements:
- 1-2 years of sales or business development experience
- Strong communication and client handling skills
- Hands-on CRM usage (HubSpot, Zoho, or similar)
- Organized, target-driven, and detail-oriented work style

If you are confident, proactive, and serious about growth, we would love to hear from you.

Job Type: Part-time
Pay: PKR 120k - 220k per month

Application Question(s):
- Please add your LinkedIn account here
- What is your expected salary?
- Have you read the complete JD?`,
    requirements: ['Sales', 'Communication', 'CRM'],
    salaryRange: 'PKR 120k - 220k',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'Hybrid',
    location: 'Lahore',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: true,
    status: 'active'
  },
  {
    id: 'fallback-lead-2',
    title: 'Client Outreach Coordinator',
    company: 'LeadGateway',
    description: `Full job description
We're hiring Client Outreach Coordinator (Remote)

Working Hours: 04:00 PM - 10:00 PM (6 Hours)
Working Days: Monday to Friday
Location: Remote

Key Responsibilities:
- Plan daily outreach schedules and coordinate follow-up cycles
- Manage communication touchpoints across email and social channels
- Update lead status, notes, and responses in CRM on time
- Work closely with sales managers to improve response rates

Requirements:
- 1+ year of outreach, customer support, or lead coordination experience
- Excellent written communication and follow-up discipline
- Familiarity with spreadsheets and CRM workflows
- Ability to handle multiple conversations without dropping quality

Job Type: Long-term
Pay: PKR 50k - 120k per month`,
    requirements: ['Outreach', 'Scheduling', 'Email'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 35,
    duration: 'Long-term',
    workType: 'Remote',
    location: 'Islamabad',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: true,
    status: 'active'
  },
  {
    id: 'fallback-1',
    title: 'Frontend Developer',
    company: 'TechFlow',
    description: `Full job description
We're hiring Frontend Developer (Hybrid)

Working Hours: 10:00 AM - 06:00 PM (8 Hours)
Working Days: Monday to Friday
Location: Rawalpindi

Key Responsibilities:
- Build responsive UI components for web and mobile breakpoints
- Collaborate with product and design teams on feature delivery
- Optimize page performance and maintain frontend code quality
- Ship tested releases with clean handover notes

Requirements:
- 1-3 years of React and TypeScript experience
- Strong understanding of component architecture and state management
- Experience with API integration and debugging tools
- Good eye for UX details and accessibility basics

Job Type: 6 months
Pay: PKR 50k - 120k per month`,
    requirements: ['React', 'TypeScript', 'UI Testing'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 40,
    duration: '6 months',
    workType: 'Hybrid',
    location: 'Rawalpindi',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-2',
    title: 'Backend Engineer',
    company: 'CloudNine',
    description: `Full job description
We're hiring Backend Engineer (On-site)

Working Hours: 09:00 AM - 06:00 PM (8 Hours)
Working Days: Monday to Friday
Location: Lahore

Key Responsibilities:
- Design and maintain REST APIs for high-traffic product modules
- Improve database performance, indexing, and query reliability
- Implement secure authentication and authorization controls
- Monitor production logs and resolve incidents quickly

Requirements:
- 2+ years in Node.js backend development
- Solid SQL fundamentals and data modeling practice
- Experience with API documentation and versioning
- Understanding of security and scalability best practices

Job Type: Long-term
Pay: PKR 120k - 220k per month`,
    requirements: ['Node.js', 'APIs', 'SQL'],
    salaryRange: 'PKR 120k - 220k',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'On-site',
    location: 'Lahore',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-3',
    title: 'Product Manager',
    company: 'NexaWorks',
    description: `Full job description
We're hiring Product Manager (Hybrid)

Working Hours: 10:00 AM - 06:00 PM (8 Hours)
Working Days: Monday to Friday
Location: Islamabad

Key Responsibilities:
- Define quarterly roadmap and prioritize high-impact initiatives
- Translate business goals into product specs and team execution plans
- Coordinate design, engineering, and QA for predictable delivery
- Track post-launch metrics and iterate based on user behavior

Requirements:
- 2+ years of product ownership experience
- Strong planning, communication, and stakeholder management skills
- Experience with analytics-driven decision making
- Ability to balance speed, quality, and long-term vision

Job Type: Long-term
Pay: PKR 120k - 220k per month`,
    requirements: ['Product Strategy', 'Analytics', 'Planning'],
    salaryRange: 'PKR 120k - 220k',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'Hybrid',
    location: 'Islamabad',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-4',
    title: 'Data Analyst',
    company: 'DataNexus',
    description: `Full job description
We're hiring Data Analyst (Remote)

Working Hours: 03:00 PM - 10:00 PM (7 Hours)
Working Days: Monday to Friday
Location: Faisalabad

Key Responsibilities:
- Build dashboards and weekly reports for growth and operations teams
- Clean, join, and validate datasets for decision-ready analysis
- Identify trends, anomalies, and opportunities across funnels
- Collaborate with stakeholders to convert questions into metrics

Requirements:
- 1-2 years of analysis experience with SQL and BI tools
- Strong data storytelling and visualization sense
- Comfort with data cleaning and documentation workflows
- Ability to communicate insight clearly to non-technical teams

Job Type: 6 months
Pay: PKR 50k - 120k per month`,
    requirements: ['SQL', 'BI', 'Data Modeling'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 35,
    duration: '6 months',
    workType: 'Remote',
    location: 'Faisalabad',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-5',
    title: 'UX Designer',
    company: 'PixelForge',
    description: `Full job description
We're hiring UX Designer (Hybrid)

Working Hours: 11:00 AM - 07:00 PM (8 Hours)
Working Days: Monday to Friday
Location: Rawalpindi

Key Responsibilities:
- Design user flows, wireframes, and clickable prototypes
- Run lightweight usability reviews and turn findings into improvements
- Maintain visual consistency in layout, spacing, and interaction patterns
- Collaborate with developers for practical and polished implementation

Requirements:
- 1-3 years of UX/UI design experience
- Strong command of Figma and prototyping workflows
- Good understanding of accessibility and responsive design
- Clear presentation and design rationale communication

Job Type: Contract
Pay: PKR 50k - 120k per month`,
    requirements: ['Figma', 'Research', 'Prototyping'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 30,
    duration: 'Contract',
    workType: 'Hybrid',
    location: 'Rawalpindi',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-6',
    title: 'QA Engineer',
    company: 'CodeCraft',
    description: `Full job description
We're hiring QA Engineer (On-site)

Working Hours: 09:00 AM - 06:00 PM (8 Hours)
Working Days: Monday to Friday
Location: Karachi

Key Responsibilities:
- Create test plans for core user journeys and release candidates
- Perform manual and automation testing across web modules
- Report bugs with clear reproduction steps and severity levels
- Partner with engineering teams to reduce regression risk

Requirements:
- 1-3 years of QA testing experience
- Familiarity with automation tools and bug tracking systems
- Strong analytical thinking and defect triage skills
- Discipline in documentation and release verification

Job Type: Long-term
Pay: PKR 50k - 120k per month`,
    requirements: ['Automation', 'Manual Testing', 'Bug Triage'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'On-site',
    location: 'Karachi',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-7',
    title: 'DevOps Engineer',
    company: 'BitBuilders',
    description: `Full job description
We're hiring DevOps Engineer (Hybrid)

Working Hours: 10:00 AM - 07:00 PM (9 Hours)
Working Days: Monday to Friday
Location: Lahore

Key Responsibilities:
- Maintain CI/CD pipelines for stable and repeatable deployments
- Improve cloud cost, reliability, and incident response workflows
- Automate infrastructure provisioning and environment configuration
- Monitor services and tune alerts for actionable visibility

Requirements:
- 2+ years in DevOps or cloud infrastructure roles
- Experience with CI/CD, containerization, and monitoring stacks
- Strong troubleshooting and scripting fundamentals
- Security-first mindset for production systems

Job Type: Long-term
Pay: PKR 120k - 220k per month`,
    requirements: ['CI/CD', 'Cloud', 'Monitoring'],
    salaryRange: 'PKR 120k - 220k',
    weeklyHours: 40,
    duration: 'Long-term',
    workType: 'Hybrid',
    location: 'Lahore',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  },
  {
    id: 'fallback-8',
    title: 'Marketing Specialist',
    company: 'GrowthGrid',
    description: `Full job description
We're hiring Marketing Specialist (Remote)

Working Hours: 02:00 PM - 09:00 PM (7 Hours)
Working Days: Monday to Friday
Location: Islamabad

Key Responsibilities:
- Plan and execute growth campaigns across paid and organic channels
- Write performance-oriented copy for ads, landing pages, and nurture flows
- Track acquisition metrics and optimize conversion funnels weekly
- Coordinate with design and content teams for campaign launches

Requirements:
- 1-3 years in digital marketing or campaign operations
- Solid understanding of copywriting and funnel optimization
- Familiarity with analytics and reporting tools
- Strong ownership and deadline management habits

Job Type: 6 months
Pay: PKR 50k - 120k per month`,
    requirements: ['Campaigns', 'Copywriting', 'Performance'],
    salaryRange: 'PKR 50k - 120k',
    weeklyHours: 35,
    duration: '6 months',
    workType: 'Remote',
    location: 'Islamabad',
    postedAt: Timestamp.now(),
    expiresAt: Timestamp.now(),
    isFeatured: false,
    status: 'active'
  }
];

function reviveTimestamp(value: any) {
  if (!value) return Timestamp.now();
  if (value instanceof Timestamp) return value;

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Timestamp(value.seconds, Number(value.nanoseconds || 0));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return Timestamp.now();
  return Timestamp.fromDate(parsed);
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    postedAt: reviveTimestamp(job.postedAt),
    expiresAt: reviveTimestamp(job.expiresAt),
    salaryRange: job.salaryRange || 'PKR 50k - 120k'
  };
}

function withFallbackTimestamps(jobList: Job[]): Job[] {
  if (typeof window === 'undefined') {
    return jobList.map((job, index) => {
      const offset = FALLBACK_AGE_BUCKETS_MS[index % FALLBACK_AGE_BUCKETS_MS.length];
      const postedAt = Timestamp.fromDate(new Date(Date.now() - offset));
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      return normalizeJob({ ...job, postedAt, expiresAt });
    });
  }

  const raw = window.localStorage.getItem(FALLBACK_TIMESTAMP_CACHE_KEY);
  const cached = raw ? JSON.parse(raw) as Record<string, string> : {};
  const nextCache: Record<string, string> = { ...cached };

  const mapped = jobList.map((job, index) => {
    let postedIso = cached[job.id];
    if (!postedIso) {
      const offset = FALLBACK_AGE_BUCKETS_MS[index % FALLBACK_AGE_BUCKETS_MS.length];
      postedIso = new Date(Date.now() - offset).toISOString();
      nextCache[job.id] = postedIso;
    }

    const postedAt = Timestamp.fromDate(new Date(postedIso));
    const expiresAt = Timestamp.fromDate(new Date(new Date(postedIso).getTime() + 30 * 24 * 60 * 60 * 1000));
    return normalizeJob({ ...job, postedAt, expiresAt });
  });

  window.localStorage.setItem(FALLBACK_TIMESTAMP_CACHE_KEY, JSON.stringify(nextCache));
  return mapped;
}

function parseCache(raw: string | null): Job[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Job[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readCachedJobs(): Job[] {
  if (typeof window === 'undefined') return [];
  const cacheTsRaw = window.localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const cacheTs = cacheTsRaw ? Number(cacheTsRaw) : 0;

  if (!cacheTs || Date.now() - cacheTs > CACHE_TTL_MS) return [];

  return parseCache(window.localStorage.getItem(CACHE_KEY)).map(normalizeJob);
}

export function saveCachedJobs(jobs: Job[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(jobs));
  window.localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
}

export async function fetchJobsFromFirebase(feedLimit: number): Promise<Job[]> {
  const jobsCol = collection(db, 'jobs');
  const q = query(jobsCol, orderBy('postedAt', 'desc'), limit(feedLimit));
  const snapshot = await getDocs(q);

  const jobs = snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Job));

  if (!jobs.length) {
    return withFallbackTimestamps(FALLBACK_JOBS);
  }

  return jobs.map(normalizeJob);
}

export function getFallbackJobs(): Job[] {
  return withFallbackTimestamps(FALLBACK_JOBS);
}
