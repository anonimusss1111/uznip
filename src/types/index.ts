export interface Profile {
  uid: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: 'worker' | 'employer' | 'admin' | 'super_admin';
  region: string;
  district?: string;
  neighborhood?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: string;
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  isVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  isPremium?: boolean;
  premiumUntil?: any;
  photoUrl?: string;
  createdAt?: any;
  lastActive?: any;
}

export interface ServicePost {
  id: string;
  workerId: string;
  title: string;
  description: string;
  category: string;
  expectedPrice: number;
  region: string;
  district: string;
  neighborhood?: string;
  images?: string[];
  status: 'active' | 'inactive' | 'moderation' | 'rejected';
  createdAt?: any;
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  workType: 'one-time' | 'recurring' | 'full-time';
  region: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  deadline?: string;
  images?: string[];
  requirements?: string;
  contractConditions?: string;
  isPromoted?: boolean;
  promotedUntil?: any;
  status: 'open' | 'filled' | 'in-progress' | 'completed' | 'closed';
  createdAt?: any;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  message?: string;
  createdAt?: any;
}

export interface Contract {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  amount: number;
  startDate: string;
  endDate: string;
  terms: string;
  employerSigned: boolean;
  workerSigned: boolean;
  adminApproved: boolean;
  status: 'draft' | 'signed' | 'active' | 'completed' | 'disputed';
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  attachmentUrl?: string;
  createdAt?: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt?: any;
}

export interface Dispute {
  id: string;
  contractId: string;
  openedById: string;
  reason: string;
  evidenceUrls?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  adminDecision?: string;
  createdAt?: any;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  idPhotoUrl: string;
  selfieUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export interface Review {
  id: string;
  workerId: string;
  employerId: string;
  rating: number;
  comment?: string;
  createdAt?: any;
}

export interface EmploymentStat {
  id: string;
  region: string;
  district?: string;
  neighborhood?: string;
  count: number;
}
