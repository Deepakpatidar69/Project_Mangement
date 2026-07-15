export type MemberRole = "ADMIN" | "EDITOR" | "VIEWER" | "CREATOR";

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW" | "URGENT";

export interface UserProps {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImgUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthProvider = "LOCAL" | "GOOGLE" | "GITHUB";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface UserStats {
  totalComments: number;

  totalMyProjects: number;
  pendingMyProjects: number;
  completedMyProjects: number;

  totalProjects: number;
  completedProjects: number;
  pendingProjects: number;

  totalAssignProjects: number;
  completedAssignProjects: number;
  pendingAssignProjects: number;

  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface AuthProps {
  // Basic
  userId: string;

  firstName: string;
  lastName?: string | null;
  fullName: string;

  email: string;
  phone?: string | null;

  profileImgUrl?: string | null;
  profileImgPublicId?: string | null;

  // Authentication
  authProvider: AuthProvider;

  googleId?: string | null;
  githubId?: string | null;

  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;

  // Personal
  bio?: string | null;

  designation?: string | null;
  department?: string | null;
  company?: string | null;

  dateOfBirth?: string | null;
  gender?: Gender | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;

  language?: string | null;
  timezone?: string | null;
  website?: string | null;

  // Professional
  employeeId?: string | null;
  experience?: number | null;
  joiningDate?: string | null;

  skills: string[];

  // Social
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  portfolioUrl?: string | null;

  isProfilePublic: boolean;

  createdAt: string;
  updatedAt: string;

  stats: UserStats;
}

export interface ProjectProps {
  projectId: string;
  projectHeader: string;
  projectDesc: string;
  adminId: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  priority: PriorityLevel;
  priorityRank: number;
  projectDeadline: Date;
  userRole: MemberRole;
  admin: userPreviewSelectionProps;
  totalTasksCount: number;
  messageCount: number;
  membersCount: number;
  completedTaskCount: number;
}

export interface TaskProps {
  taskId: string;
  taskHeader: string;
  taskDesc: string;
  taskCreatorId: string;
  taskCreator: UserProps;
  projectId: string;
  commentCount: number;
  messageCount: number;
  priority: PriorityLevel;
  priorityRank: number;
  taskDeadline: Date;
  status: boolean;
  userRole: MemberRole;
  createdAt: string;
  updatedAt: string;
  project: projectPreviewSelectionProps;
}

export interface MessageProps {
  messageId: string;
  message: string;
  createdAt: string;
  updatedAt: string;

  // Convert _count.comments -> commentCount
  commentCount: number;

  // Simplify sender
  messageSender: {
    userId: string;
    name: string;
    email: string;
    userRole: MemberRole;
    profileImageUrl: string;
    memberId: string;
  };

  messageReceiver: userPreviewSelectionProps;
  project: projectPreviewSelectionProps & {};

  task: taskPreviewSelectionProps;
}

export interface MemberProps {
  memberId: string;
  projectId: string;
  memberName: string;
  memberEmail: string;
  assignedMemberId: string;
  role: MemberRole;
  joinedAt: string;
  profileImgUrl: string;
  project: projectPreviewSelectionProps;
  assignedMember: userPreviewSelectionProps;
  assignedBy: userPreviewSelectionProps;
}

export type userPreviewSelectionProps = {
  userId: string;
  fullName: string;
  email: string;
  profileImgUrl: string;
};

export type projectPreviewSelectionProps = {
  projectId: string;
  projectHeader: string;
  projectDesc: string;
  status: boolean;
  createdAt: string;
  admin: userPreviewSelectionProps;
};

export type taskPreviewSelectionProps = {
  taskId: string;
  taskHeader: string;
  taskDesc: string;
  status: boolean;
  createdAt: string;
  taskCreator: userPreviewSelectionProps;
};
