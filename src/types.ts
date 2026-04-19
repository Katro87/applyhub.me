export type UserRole = 'user' | 'client' | 'admin';
export type JobStatus = 'active' | 'expired' | 'pending';
export type AppStatus = 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  role: UserRole;
  skills?: string[];
  interests?: string[];
  applicationLimit: number;
  applicationsThisWeek: number;
  lastApplicationDate?: string;
  subscriptionTier: 'free' | 'trial' | 'monthly';
  subscriptionExpiresAt?: string;
  jobCredits: number;
  bio?: string;
  title?: string;
  experienceYears?: number;
  hourlyRate?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salaryRange: string;
  weeklyHours: number;
  duration: string;
  workType: 'Remote' | 'On-site' | 'Hybrid';
  location?: string;
  postedAt: any; // Timestamp
  expiresAt: any; // Timestamp
  isFeatured: boolean;
  clientUid?: string;
  status: JobStatus;
}

export interface Application {
  id: string;
  jobUid: string;
  userUid: string;
  coverLetter: string;
  expectedSalary: number;
  experience: number;
  availability: number;
  startDate: string;
  status: AppStatus;
  createdAt: any; // Timestamp
}

export interface PaymentRequest {
  id: string;
  userUid: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  proofUrl?: string;
  type: 'subscription' | 'job_credits';
  planId?: string;
  timestamp: any; // Timestamp
}

export interface PaymentMethod {
  id: string;
  name: string;
  instructions: string;
  address: string;
  region: string;
  isActive: boolean;
}
