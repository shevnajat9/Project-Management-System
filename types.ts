
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum TaskCategory {
  DEVELOPMENT = 'Development',
  DESIGN = 'Design',
  MARKETING = 'Marketing',
  CONTENT = 'Content',
  FINANCE = 'Finance',
  ADMIN = 'Admin',
  HR = 'HR',
  OTHER = 'Other'
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Administrator',
  MANAGER = 'Manager',
  USER = 'User'
}

export interface NotificationPreferences {
  email: boolean;
  desktop: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  preferences?: NotificationPreferences; // Added preferences
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; 
  size: string;
}

export interface Comment {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignees: User[];
  priority: Priority;
  category: TaskCategory;
  attachments: Attachment[];
  comments: Comment[];
  checklist: ChecklistItem[];
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: User[];
  createdAt: string;
  color?: string;
  isArchived?: boolean;
}

export interface ChatMessage {
  id: string;
  projectId: string; 
  senderId: string; 
  text: string;
  timestamp: string;
  isAi?: boolean;
  attachments?: Attachment[]; 
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: User[];
  color: string;
}

export type ViewState = 'dashboard' | 'projects' | 'project_board' | 'teams' | 'chat' | 'settings';