import {
  AuthProps,
  MemberProps,
  MessageProps,
  ProjectProps,
  TaskProps,
} from "./slices/types";

export const formatUserResponse = (userData: any) => {
  if (Array.isArray(userData)) {
    return userData.map((item) => {
      formatSingleUser(item);
    });
  }

  return formatSingleUser(userData);
};

export const formatDashBoardProjectResponse = (
  projectData: any,
): ProjectProps[] => {
  if (Array.isArray(projectData)) {
    return projectData.map((item) => {
      return formatSingleDashBoardProjects(item);
    });
  }

  return [];
};

export const formatProjectResponse = (projectData: any): ProjectProps[] => {
  console.log(`Project Data is :: ${JSON.stringify(projectData)}`);

  if (!projectData) {
    return [];
  }

  if (Array.isArray(projectData)) {
    return projectData.map((item) => {
      return formatSingleProject(item);
    });
  }

  return [];
};

export const formatTaskResponse = (TaskData: any): TaskProps[] => {
  if (!TaskData) {
    return [];
  }

  if (Array.isArray(TaskData)) {
    return TaskData.map((item) => {
      return formatSingleTask(item);
    });
  }

  return [];
};

export const formatMemberResponse = (memberData: any): MemberProps[] => {
  if (!memberData) {
    return [];
  }

  if (Array.isArray(memberData)) {
    return memberData.map((item) => formatSingleMember(item));
  }

  return [];
};

export const formatMessageResponse = (messageData: any): MessageProps[] => {
  if (!messageData) {
    return [];
  }

  if (Array.isArray(messageData)) {
    return messageData.map((item) => formatSingleMessage(item));
  }

  return [];
};

export const formatCommentsResponse = (commentData: any) => {
  if (Array.isArray(commentData)) {
    return commentData.map((item) => {
      formatSingleComments(item);
    });
  }

  return formatSingleComments(commentData);
};

export const formatSingleProject = (projectData: any): ProjectProps => {
  console.log(`Format Project data is :: ${JSON.stringify(projectData)}`);

  return {
    projectId: projectData.projectId,
    adminId: projectData.adminId,
    admin: {
      email: projectData.admin.email,
      fullName: projectData.admin.fullName,
      profileImageUrl: projectData.admin.profileImgUrl,
      userId: projectData.admin.userId,
    },
    projectHeader: projectData.projectHeader,
    projectDesc: projectData.projectDesc,
    priority: projectData.priority,
    priorityRank: projectData.priorityRank,
    projectDeadline: projectData.projectDeadline,
    status: projectData.status,
    userRole: projectData.userRole,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,

    // Rename Prisma counts
    totalTasksCount: projectData._count?.projectTasks ?? 0,
    membersCount: projectData._count?.members ?? 0,
    messageCount: projectData._count?.messages ?? 0,
    completedTaskCount: projectData.projectTasks.length ?? 0,
  };
};

export const formatSingleTask = (taskData: any): TaskProps => {
  return {
    taskId: taskData.taskId,
    taskHeader: taskData.taskHeader,
    taskDesc: taskData.taskDesc,
    projectId: taskData.projectId,
    priority: taskData.priority,
    priorityRank: taskData.priorityRank,
    taskDeadline: taskData.taskDeadline,
    taskCreatorId: taskData.taskCreatorId,
    status: taskData.status,
    createdAt: taskData.createdAt,
    updatedAt: taskData.updatedAt,
    taskCreator: taskData.taskCreator,
    userRole: taskData.userRole,
    project: taskData.project,
    commentCount: taskData._count.comments ?? 0,
    messageCount: taskData._count.messages ?? 0,
  };
};

export const formatSingleUser = (userData: any): AuthProps => {
  return {
    userId: userData.userId,

    firstName: userData.firstName,
    lastName: userData.lastName ?? null,
    fullName: userData.fullName,

    email: userData.email,
    phone: userData.phone ?? null,

    profileImgUrl: userData.profileImgUrl ?? null,
    profileImgPublicId: userData.profileImgPublicId ?? null,

    // Authentication
    authProvider: userData.authProvider,
    googleId: userData.googleId ?? null,
    githubId: userData.githubId ?? null,

    isVerifiedByPassword: userData.isVerifiedByPassword ?? false,
    isEmailVerified: userData.isEmailVerified,
    emailVerifiedAt: userData.emailVerifiedAt
      ? new Date(userData.emailVerifiedAt).toISOString()
      : null,
    lastLoginAt: userData.lastLoginAt
      ? new Date(userData.lastLoginAt).toISOString()
      : null,

    // Personal
    bio: userData.bio ?? null,
    designation: userData.designation ?? null,
    department: userData.department ?? null,
    company: userData.company ?? null,

    dateOfBirth: userData.dateOfBirth
      ? new Date(userData.dateOfBirth).toISOString()
      : null,
    gender: userData.gender ?? null,

    address: userData.address ?? null,
    city: userData.city ?? null,
    state: userData.state ?? null,
    country: userData.country ?? null,
    zipCode: userData.zipCode ?? null,

    language: userData.language ?? null,
    timezone: userData.timezone ?? null,
    website: userData.website ?? null,

    // Professional
    employeeId: userData.employeeId ?? null,
    experience: userData.experience ?? null,
    joiningDate: userData.joiningDate
      ? new Date(userData.joiningDate).toISOString()
      : null,

    // Skills: Prisma gives Skill[] objects — flatten to just names
    skills: userData.skills?.map((skill: { name: string }) => skill.name) ?? [],

    // Social
    githubUrl: userData.githubUrl ?? null,
    linkedinUrl: userData.linkedinUrl ?? null,
    twitterUrl: userData.twitterUrl ?? null,
    portfolioUrl: userData.portfolioUrl ?? null,

    isProfilePublic: userData.isProfilePublic,

    createdAt: new Date(userData.createdAt).toISOString(),
    updatedAt: new Date(userData.updatedAt).toISOString(),

    stats: {
      totalProjects:
        (userData._count?.createdProjects ?? 0) +
        (userData._count?.AssignedTo ?? 0),
      totalMyProjects: userData._count?.createdProjects ?? 0,
      pendingMyProjects:
        (userData._count?.createdProjects ?? 0) -
        (userData?.completedStates?._count?.createdProjects ?? 0),
      completedMyProjects:
        userData?.completedStates?._count?.createdProjects ?? 0,

      completedProjects:
        (userData?.completedStates?._count?.createdProjects ?? 0) +
        (userData?.AssignedTo.length ?? 0),
      pendingProjects:
        (userData._count?.createdProjects ?? 0) +
        (userData._count?.AssignedTo ?? 0) -
        (userData?.AssignedTo?.length ?? 0),

      completedAssignProjects: userData?.AssignedTo.length ?? 0,
      pendingAssignProjects:
        (userData._count?.AssignedTo ?? 0) - (userData?.AssignedTo.length ?? 0), // --
      totalAssignProjects: userData._count?.AssignedTo ?? 0,

      completedTasks: userData?.completedStates?._count?.createdTasks ?? 0,
      pendingTasks:
        (userData?._count?.createdTasks ?? 0) -
        (userData.completedStates?._count?.createdTasks ?? 0),
      totalComments: userData._count?.totalComments ?? 0,
      totalTasks: userData._count?.createdTasks ?? 0,
    },
  };
};

export const formatSingleMember = (memberData: any): MemberProps => {
  return {
    memberId: memberData.memberId,
    projectId: memberData.projectId,
    memberName: memberData.assignedMember.fullName,
    memberEmail: memberData.assignedMember.email,
    assignedMemberId: memberData.assignedMemberId,
    role: memberData.role,
    joinedAt: memberData.joinedAt,
    project: {
      projectId: memberData.project.projectId,
      projectHeader: memberData.project.projectHeader,
      projectDesc: memberData.project.projectDesc,
      status: memberData.project.status,
      createdAt: memberData.project.createdAt,
      admin: memberData.project.admin,
    },
    assignedMember: {
      userId: memberData.assignedMember.userId,
      fullName: memberData.assignedMember.fullName,
      email: memberData.assignedMember.email,
      profileImageUrl: memberData.assignedMember.profileImgUrl,
    },
    assignedBy: {
      userId: memberData.assignedMember.userId,
      fullName: memberData.assignedMember.fullName,
      email: memberData.assignedMember.email,
      profileImageUrl: memberData.assignedMember.profileImgUrl,
    },
  };
};

export const formatSingleMessage = (messageData: any): MessageProps => {
  return {
    messageId: messageData.messageId,
    message: messageData.message,
    createdAt: messageData.createdAt,
    updatedAt: messageData.updatedAt,
    commentCount: messageData._count.comments ?? 0,

    messageSender: {
      userId: messageData.messageSender?.userId,
      name: messageData.messageSender?.fullName,
      email: messageData.messageSender?.email,
      profileImageUrl: messageData.messageSender?.profileImgUrl,
      userRole: messageData.messageSender?.AssignedTo?.[0]?.role ?? null,
      memberId: messageData.messageSender?.AssignedTo?.[0]?.memberId ?? null,
    },

    messageReceiver: {
      userId: messageData?.messageReceiver?.userId,
      email: messageData?.messageReceiver?.email,
      fullName: messageData?.messageReceiver?.fullName,
      profileImageUrl: messageData?.messageReceiver?.profileImgUrl,
    },
    project: {
      projectId: messageData?.project?.projectId,
      projectHeader: messageData?.project?.projectHeader,
      projectDesc: messageData?.project?.projectDesc,
      status: messageData?.project?.status,
      createdAt: messageData?.project?.createdAt,
      admin: messageData?.project?.admin,
    },

    task: messageData?.task,
  };
};

export const formatSingleComments = (commentData: any) => {};

export const formatSingleDashBoardProjects = (
  projectData: any,
): ProjectProps => {
  return {
    projectId: projectData.projectId,
    adminId: projectData.adminId,
    admin: {
      email: projectData.admin.email,
      fullName: projectData.admin.fullName,
      profileImageUrl: projectData.admin.profileImgUrl,
      userId: projectData.admin.userId,
    },
    projectHeader: projectData.projectHeader,
    projectDesc: projectData.projectDesc,
    priority: projectData.priority,
    priorityRank: projectData.priorityRank,
    projectDeadline: projectData.projectDeadline,
    status: projectData.status,
    userRole: projectData.userRole,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,

    // Rename Prisma counts
    totalTasksCount: projectData?.totalTasksCount ?? 0,
    membersCount: projectData?.memberCount ?? 0,
    messageCount: projectData?.messageCount ?? 0,
    completedTaskCount: projectData.projectTasks.length ?? 0,
  };
};
