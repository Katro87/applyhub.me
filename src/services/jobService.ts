import { collection, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';

const LEADGATEWAY_JOBS = [
  { title: "Sales Executive", company: "LeadGateway", workType: "Hybrid", salaryRange: "PKR 50k - 120k", duration: "Long-term", weeklyHours: 40, description: "Drive sales growth for our innovative platform.", requirements: ["Sales", "Communication", "CRM"], isFeatured: true },
  { title: "Business Development Representative", company: "LeadGateway", workType: "Remote", salaryRange: "PKR 50k - 120k", duration: "Long-term", weeklyHours: 40, description: "Identify and qualify new business opportunities.", requirements: ["Lead Gen", "Outreach"], isFeatured: true },
  { title: "Lead Closer", company: "LeadGateway", workType: "On-site", salaryRange: "PKR 120k - 220k", duration: "Long-term", weeklyHours: 30, description: "Close high-ticket sales leads.", requirements: ["Negotiation", "Closing"], isFeatured: true },
  { title: "Digital Marketing Assistant", company: "LeadGateway", workType: "Remote", salaryRange: "PKR 25k - 40k", duration: "6 months", weeklyHours: 20, description: "Support our digital marketing campaigns.", requirements: ["SEO", "Content"], isFeatured: true },
  { title: "Social Media Manager", company: "LeadGateway", workType: "Hybrid", salaryRange: "PKR 50k - 120k", duration: "Long-term", weeklyHours: 35, description: "Manage and grow our social presence.", requirements: ["Social Media", "Design"], isFeatured: true },
  { title: "Performance Marketing Intern", company: "LeadGateway", workType: "Remote", salaryRange: "PKR 25k - 40k", duration: "3 months", weeklyHours: 40, description: "Learn and execute paid ad campaigns.", requirements: ["Analytics", "Ads"], isFeatured: true },
  { title: "Client Outreach Coordinator", company: "LeadGateway", workType: "Remote", salaryRange: "PKR 50k - 120k", duration: "Long-term", weeklyHours: 40, description: "Coordinate outreach to potential clients.", requirements: ["Email Marketing", "Coordination"], isFeatured: true },
  { title: "Appointment Setter", company: "LeadGateway", workType: "On-site", salaryRange: "PKR 25k - 40k", duration: "Long-term", weeklyHours: 30, description: "Set appointments for our sales team.", requirements: ["Calling", "Scheduling"], isFeatured: true },
  { title: "Junior Sales Manager", company: "LeadGateway", workType: "Hybrid", salaryRange: "PKR 120k - 220k", duration: "Long-term", weeklyHours: 40, description: "Manage a small team of sales reps.", requirements: ["Leadership", "Sales"], isFeatured: true },
  { title: "Growth Operations Assistant", company: "LeadGateway", workType: "Remote", salaryRange: "PKR 50k - 120k", duration: "Long-term", weeklyHours: 40, description: "Optimize our growth operations.", requirements: ["Operations", "Data"], isFeatured: true }
];

const ROTATING_JOB_TITLES = [
  'Frontend Developer',
  'Backend Engineer',
  'Fullstack Developer',
  'UI/UX Designer',
  'Product Manager',
  'Data Analyst',
  'DevOps Engineer',
  'QA Tester',
  'Sales Specialist',
  'Marketing Strategist',
  'Customer Success Manager',
  'Operations Coordinator'
];

const ROTATING_COMPANIES = [
  'TechFlow',
  'CloudNine',
  'DataNexus',
  'WebWizards',
  'AppArtisans',
  'SoftSphere',
  'BitBuilders',
  'CodeCraft',
  'RemoteRocket',
  'GrowthGrid',
  'PixelForge',
  'NexaWorks'
];

const ROTATING_LOCATIONS = ['Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Karachi', 'Multan'];
const ROTATING_WORK_TYPES = ['Remote', 'Hybrid', 'On-site', 'Remote', 'Hybrid'] as const;
const ROTATING_REQUIREMENTS = [
  ['React', 'TypeScript', 'Firebase'],
  ['Node.js', 'API Design', 'Databases'],
  ['Figma', 'UX Research', 'Prototyping'],
  ['Analytics', 'Reporting', 'SQL'],
  ['Sales', 'Outreach', 'CRM'],
  ['Marketing', 'Copywriting', 'Campaigns']
];

const ROTATING_JOB_COUNT = 250;
const LEADGATEWAY_JOB_COUNT = 10;

function makeSalaryRange(title: string, index: number) {
  if (/intern|assistant|coordinator|setter|support/i.test(title)) {
    return 'PKR 25k - 40k';
  }

  if (/manager|engineer|developer|designer|analyst|tester|specialist|sales executive|marketing/i.test(title)) {
    return index % 4 === 0 ? 'PKR 120k - 220k' : 'PKR 50k - 120k';
  }

  return 'PKR 50k - 120k';
}

function buildRotatingJob(index: number) {
  const title = ROTATING_JOB_TITLES[index % ROTATING_JOB_TITLES.length];
  const company = ROTATING_COMPANIES[index % ROTATING_COMPANIES.length];
  const workType = ROTATING_WORK_TYPES[index % ROTATING_WORK_TYPES.length];
  const location = workType === 'Remote' ? 'Remote' : ROTATING_LOCATIONS[index % ROTATING_LOCATIONS.length];
  const requirements = ROTATING_REQUIREMENTS[index % ROTATING_REQUIREMENTS.length];

  const postedAt = new Date();
  postedAt.setDate(postedAt.getDate() - (index % 30));

  const expiresAt = new Date(postedAt);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    title,
    company,
    location,
    workType,
    description: `High-impact opportunity for a ${title.toLowerCase()} to support ${company}'s growing remote team.`,
    requirements,
    salaryRange: makeSalaryRange(title, index),
    weeklyHours: index % 2 === 0 ? 40 : 35,
    duration: index % 5 === 0 ? 'Long-term' : '6 months',
    postedAt: Timestamp.fromDate(postedAt),
    expiresAt: Timestamp.fromDate(expiresAt),
    isFeatured: index % 12 === 0,
    status: 'active' as const,
    seedGroup: 'rotating' as const
  };
}

function buildLeadGatewayJob(job: typeof LEADGATEWAY_JOBS[number], index: number) {
  const postedAt = new Date();
  postedAt.setDate(postedAt.getDate() - index);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);

  return {
    ...job,
    salaryRange: makeSalaryRange(job.title, index),
    postedAt: Timestamp.fromDate(postedAt),
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'active' as const,
    seedGroup: 'leadgateway' as const
  };
}

async function commitBatchedJobs(jobsCol: ReturnType<typeof collection>, entries: Array<{ id: string; data: Record<string, unknown> }>) {
  const batchSize = 400;
  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = writeBatch(db);
    const slice = entries.slice(index, index + batchSize);

    for (const entry of slice) {
      batch.set(doc(jobsCol, entry.id), entry.data);
    }

    await batch.commit();
  }
}

export async function seedLeadGatewayJobs() {
  try {
    const jobsCol = collection(db, 'jobs');
    const checkpointRef = doc(jobsCol, `leadgateway-${String(LEADGATEWAY_JOB_COUNT).padStart(2, '0')}`);
    const checkpoint = await getDoc(checkpointRef);

    if (!checkpoint.exists()) {
      console.log('LeadGateway jobs are missing. Seeding permanent entries...');
      const jobsToSeed = LEADGATEWAY_JOBS.map((job, index) => ({
        id: `leadgateway-${String(index + 1).padStart(2, '0')}`,
        data: buildLeadGatewayJob(job, index)
      }));

      await commitBatchedJobs(jobsCol, jobsToSeed);
      console.log('LeadGateway jobs seeded successfully.');
    } else {
      console.log('LeadGateway seed already present. Skipping seed.');
    }
  } catch (error) {
    console.error("Error seeding LeadGateway jobs:", error);
  }
}

export async function seedRotatingJobs(count: number = ROTATING_JOB_COUNT) {
  try {
    const jobsCol = collection(db, 'jobs');
    const checkpointRef = doc(jobsCol, `rotating-${String(count).padStart(4, '0')}`);
    const checkpoint = await getDoc(checkpointRef);

    if (!checkpoint.exists()) {
      console.log(`Rotating seed missing for target ${count}. Seeding inventory...`);
      const jobsToSeed = Array.from({ length: count }, (_, index) => ({
        id: `rotating-${String(index + 1).padStart(4, '0')}`,
        data: buildRotatingJob(index)
      }));

      await commitBatchedJobs(jobsCol, jobsToSeed);
      console.log(`${count} rotating jobs seeded.`);
    } else {
      console.log('Rotating seed already present. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding rotating jobs:', error);
  }
}

export async function seedFakeJobs(count: number = 50) {
  return seedRotatingJobs(Math.max(count, 1));
}

export async function ensurePlatformJobs() {
  await Promise.all([
    seedLeadGatewayJobs(),
    seedRotatingJobs(ROTATING_JOB_COUNT)
  ]);
}
