import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskBoard from './components/TaskBoard';
import DashboardView from './components/DashboardView';
import ChatArea from './components/ChatArea';
import TeamView from './components/TeamView';
import SettingsView from './components/SettingsView';
import AuthPage from './components/AuthPage';
import { Project, Task, User, TaskStatus, Priority, ViewState, UserRole, Team, TaskCategory, ChatMessage, Attachment } from './types';
import { notifyTaskAssignment, checkDeadlines, requestNotificationPermission } from './services/notificationService';

// Mock Data with Hierarchy Roles
// Added default preferences
const MOCK_USERS_DATA: User[] = [
  { id: '1', name: 'Diana Prince', role: UserRole.SUPER_ADMIN, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100', preferences: { email: true, desktop: true } },
  { id: '2', name: 'Clark Kent', role: UserRole.ADMIN, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', preferences: { email: true, desktop: true } },
  { id: '3', name: 'Bruce Wayne', role: UserRole.MANAGER, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', preferences: { email: false, desktop: true } },
  { id: '4', name: 'Peter Parker', role: UserRole.USER, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100', preferences: { email: true, desktop: false } },
];

const MOCK_TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Frontend Force',
    description: 'Responsible for all client-side development and UI/UX implementation.',
    members: [MOCK_USERS_DATA[0], MOCK_USERS_DATA[3]], // Diana, Peter
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'team2',
    name: 'Backend Ops',
    description: 'Server management, API development, and database optimizations.',
    members: [MOCK_USERS_DATA[1], MOCK_USERS_DATA[2]], // Clark, Bruce
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'team3',
    name: 'Product Design',
    description: 'Designing user journeys, wireframes, and high-fidelity prototypes.',
    members: [MOCK_USERS_DATA[0], MOCK_USERS_DATA[2]], 
    color: 'from-purple-500 to-pink-500'
  }
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Nexus Dashboard Redesign',
    description: 'Revamping the core analytics dashboard for better user experience and performance.',
    members: MOCK_USERS_DATA,
    createdAt: new Date().toISOString(),
    color: 'bg-emerald-500',
    isArchived: false
  },
  {
    id: 'p2',
    name: 'Mobile App Launch',
    description: 'Preparing for the Q4 launch of the new mobile application on iOS and Android.',
    members: [MOCK_USERS_DATA[0], MOCK_USERS_DATA[1], MOCK_USERS_DATA[3]],
    createdAt: new Date().toISOString(),
    color: 'bg-blue-500',
    isArchived: false
  },
  {
    id: 'p3',
    name: 'Marketing Campaign',
    description: 'Q3 social media and content marketing strategy execution.',
    members: [MOCK_USERS_DATA[0], MOCK_USERS_DATA[2]],
    createdAt: new Date().toISOString(),
    color: 'bg-purple-500',
    isArchived: false
  }
];

const ALL_TASKS_PROJECT: Project = {
    id: 'all-tasks',
    name: 'All Tasks',
    description: 'Overview of all tasks across all workspaces.',
    members: [],
    createdAt: new Date().toISOString(),
    color: 'bg-slate-500',
    isArchived: false
};

// Initial Messages for different projects
const INITIAL_MESSAGES: ChatMessage[] = [
    // General / All Tasks Chat
    {
        id: 'm1',
        projectId: 'all-tasks',
        senderId: 'system',
        text: 'Welcome to the company-wide general channel.',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        attachments: []
    },
    // Project P1 Chat
    {
        id: 'm2',
        projectId: 'p1',
        senderId: '1', // Diana
        text: 'The dashboard wireframes are looking solid. Good job team.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        attachments: []
    },
    {
        id: 'm3',
        projectId: 'p1',
        senderId: '2', // Clark
        text: 'I will start the API integration for the new widgets tomorrow.',
        timestamp: new Date(Date.now() - 82000000).toISOString(),
        attachments: []
    },
    // Project P2 Chat
    {
        id: 'm4',
        projectId: 'p2',
        senderId: '3', // Bruce
        text: 'TestFlight build is delayed by 2 hours. Heads up.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        attachments: []
    },
    {
        id: 'm5',
        projectId: 'p2',
        senderId: '4', // Peter
        text: 'No worries, I am still polishing the icons.',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        attachments: []
    }
];

const INITIAL_TASKS: Task[] = [
  // Project P1 Tasks
  {
    id: 't1',
    projectId: 'p1',
    title: 'Research Competitor UX',
    description: 'Analyze top 3 competitors and document their dashboard flows.',
    status: TaskStatus.DONE,
    priority: Priority.HIGH,
    category: TaskCategory.MARKETING,
    assignees: [MOCK_USERS_DATA[1]],
    attachments: [],
    checklist: [
      { 
        id: 'cl1', 
        text: 'Analyze Competitor A', 
        isCompleted: true,
        attachments: [
          { id: 'a1', name: 'competitor_a_screenshot.png', type: 'image/png', size: '1.2 MB', url: '#' }
        ]
      },
      { id: 'cl2', text: 'Analyze Competitor B', isCompleted: true, attachments: [] },
      { id: 'cl3', text: 'Create comparison matrix', isCompleted: true, attachments: [] }
    ],
    comments: [
      {
        id: 'c1',
        senderId: '2',
        senderName: 'Sarah Chen',
        avatar: MOCK_USERS_DATA[1].avatar,
        text: 'Great work on this, Alex! The report is very thorough.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    dueDate: '2023-10-15'
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Design System Update',
    description: 'Update the Figma library with new color palette and typography.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    category: TaskCategory.DESIGN,
    assignees: [MOCK_USERS_DATA[3], MOCK_USERS_DATA[0]],
    attachments: [],
    checklist: [
      { id: 'cl4', text: 'Update primary colors', isCompleted: true, attachments: [] },
      { id: 'cl5', text: 'Update typography scales', isCompleted: false, attachments: [] },
      { id: 'cl6', text: 'Update component buttons', isCompleted: false, attachments: [] }
    ],
    comments: [],
    dueDate: '2023-10-20'
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'API Integration',
    description: 'Connect the frontend widgets to the real-time data stream.',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    category: TaskCategory.DEVELOPMENT,
    assignees: [MOCK_USERS_DATA[2]],
    attachments: [],
    checklist: [],
    comments: [],
    dueDate: '2023-10-25'
  },
  // Project P2 Tasks
  {
    id: 't4',
    projectId: 'p2',
    title: 'iOS Beta Build',
    description: 'Prepare the first beta build for internal testing via TestFlight.',
    status: TaskStatus.REVIEW,
    priority: Priority.HIGH,
    category: TaskCategory.DEVELOPMENT,
    assignees: [MOCK_USERS_DATA[3]],
    attachments: [],
    checklist: [],
    comments: [],
    dueDate: '2023-11-01'
  },
  {
    id: 't5',
    projectId: 'p2',
    title: 'App Icon Design',
    description: 'Create scalable vector assets for the new application icon.',
    status: TaskStatus.DONE,
    priority: Priority.MEDIUM,
    category: TaskCategory.DESIGN,
    assignees: [MOCK_USERS_DATA[0]],
    attachments: [],
    checklist: [],
    comments: [],
    dueDate: '2023-10-10'
  },
   // Project P3 Tasks
  {
    id: 't6',
    projectId: 'p3',
    title: 'Draft Blog Posts',
    description: 'Write 3 blog posts covering the new features of the platform.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    category: TaskCategory.MARKETING,
    assignees: [MOCK_USERS_DATA[0], MOCK_USERS_DATA[2]],
    attachments: [],
    checklist: [],
    comments: [],
    dueDate: '2023-10-30'
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS_DATA);
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project>(MOCK_PROJECTS[0]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Request Notification Permissions on load (or when auth changes)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      requestNotificationPermission();
      
      // Initial check
      checkDeadlines(tasks, currentUser);

      // Check periodically (e.g., every hour, but for demo every 30 seconds)
      const interval = setInterval(() => {
        checkDeadlines(tasks, currentUser);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser, tasks]);

  // Filter projects based on current user membership
  const visibleProjects = currentUser 
    ? projects.filter(p => p.members.some(m => m.id === currentUser.id)) 
    : [];

  // Effect to validate current project access when user changes
  useEffect(() => {
    if (currentUser && visibleProjects.length > 0) {
      const hasAccess = visibleProjects.some(p => p.id === currentProject.id);
      if (!hasAccess) {
        // If user lost access to current project, switch to their first available project
        // prioritize active projects
        const activeProjects = visibleProjects.filter(p => !p.isArchived);
        setCurrentProject(activeProjects.length > 0 ? activeProjects[0] : visibleProjects[0]);
      }
    }
  }, [currentUser, visibleProjects, currentProject]);

  // Handle Authentication
  const handleLogin = (email: string, name?: string) => {
    // If it's the admin mock
    if (email === 'admin@nexus.co') {
      setCurrentUser(MOCK_USERS_DATA[0]); // Diana Prince (Super Admin)
    } else {
       // If mock user exists by partial match (simple logic for demo)
       // Or create a new temp user for the session
       if (name) {
          const newUser: User = {
             id: Math.random().toString(36).substr(2, 9),
             name: name,
             role: UserRole.USER,
             avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
             preferences: { email: true, desktop: true }
          };
          setUsers([...users, newUser]);
          setCurrentUser(newUser);
       } else {
          // Default to Peter Parker for other logins in this demo if no name provided
          setCurrentUser(MOCK_USERS_DATA[3]);
       }
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleAddTask = (task: Task) => {
    // Notify assignees
    if (currentUser) {
      task.assignees.forEach(assignee => {
        notifyTaskAssignment(task, assignee, currentUser);
      });
    }
    setTasks([...tasks, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    // Check for NEW assignees to notify them
    const oldTask = tasks.find(t => t.id === updatedTask.id);
    if (oldTask && currentUser) {
       const oldAssigneeIds = oldTask.assignees.map(u => u.id);
       const newAssignees = updatedTask.assignees.filter(u => !oldAssigneeIds.includes(u.id));
       
       newAssignees.forEach(assignee => {
         notifyTaskAssignment(updatedTask, assignee, currentUser);
       });
    }

    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleBulkDelete = (taskIds: string[]) => {
    setTasks(tasks.filter(t => !taskIds.includes(t.id)));
  };

  const handleBulkUpdate = (updatedTasks: Task[]) => {
    setTasks(prevTasks => {
      const updateMap = new Map(updatedTasks.map(t => [t.id, t]));
      return prevTasks.map(t => updateMap.get(t.id) || t);
    });
  };

  const handleAddTeam = (team: Team) => {
    setTeams([...teams, team]);
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(teams.filter(t => t.id !== teamId));
  };

  const handleAddMemberToTeam = (teamId: string, userId: string) => {
    setTeams(teams.map(team => {
      if (team.id === teamId) {
        const userToAdd = users.find(u => u.id === userId);
        if (userToAdd && !team.members.some(m => m.id === userId)) {
          return { ...team, members: [...team.members, userToAdd] };
        }
      }
      return team;
    }));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleAddProject = (project: Project) => {
    // When adding a project, ensure the creator is a member
    const projectWithMember = {
        ...project,
        members: project.members.some(m => m.id === currentUser?.id) 
            ? project.members 
            : [...project.members, currentUser!]
    };
    
    setProjects([...projects, projectWithMember]);
    setCurrentProject(projectWithMember);
    setCurrentView('dashboard');
  };
  
  const handleToggleArchiveProject = (projectId: string) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, isArchived: !p.isArchived } : p
    );
    setProjects(updatedProjects);
    
    // Update current project reference if it's the one being toggled
    if (currentProject.id === projectId) {
      const updatedCurrent = updatedProjects.find(p => p.id === projectId);
      if (updatedCurrent) {
        setCurrentProject(updatedCurrent);
      }
    }
  };

  const handleSendMessage = (text: string, isAi: boolean = false, attachments: Attachment[] = []) => {
      // Determine target project ID based on current view/selection
      // If we are in "All Tasks" view or Dashboard, we might route chat to a 'general' channel or the currently selected project in context
      const targetProjectId = currentView === 'projects' || currentView === 'dashboard' 
          ? ALL_TASKS_PROJECT.id // Default Global Chat
          : currentProject.id;

      const newMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: targetProjectId,
          senderId: isAi ? 'ai' : currentUser!.id,
          text: text,
          timestamp: new Date().toISOString(),
          isAi,
          attachments
      };
      setAllMessages(prev => [...prev, newMessage]);
  };

  const getFilteredTasks = () => {
     return tasks.filter(t => t.projectId === currentProject.id);
  };
  
  // Get all tasks from all projects visible to the current user
  const getAllVisibleTasks = () => {
     const visibleProjectIds = visibleProjects.map(p => p.id);
     return tasks.filter(t => visibleProjectIds.includes(t.projectId));
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            tasks={getAllVisibleTasks()}
            users={users}
            currentUser={currentUser}
          />
        );
      case 'projects': // Global View "All Tasks"
        return (
          <TaskBoard 
            project={ALL_TASKS_PROJECT} 
            tasks={getAllVisibleTasks()} 
            onAddTask={handleAddTask} 
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkUpdate}
            currentUser={currentUser}
            onToggleArchive={() => {}} // No archive action for global view
            allProjects={visibleProjects}
          />
        );
      case 'project_board': // Specific Project Board
        return (
          <TaskBoard 
            project={{...currentProject, members: currentProject.members}} 
            tasks={getFilteredTasks()} 
            onAddTask={handleAddTask} 
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkUpdate}
            currentUser={currentUser}
            onToggleArchive={handleToggleArchiveProject}
            allProjects={visibleProjects} // Still pass all projects so modal can be smart if needed, though mostly used in global view
          />
        );
      case 'chat':
        // Determine which project's chat to show. 
        // If coming from global views, show "General/All Tasks" chat. 
        // If coming from specific project, show that project's chat.
        // NOTE: Sidebar selection logic usually sets 'currentProject' before switching view.
        
        // However, if we clicked "Messages" from sidebar, we might be in 'dashboard' or 'projects' mode before.
        // The Sidebar component updates 'currentProject' when a workspace is clicked, but the top menu items (Dashboard, All Tasks) usually 
        // don't change 'currentProject' to 'all-tasks' explicitly in state unless we enforce it.
        // But for CHAT, we want "Messages" button to show chat for the *active workspace context*.
        
        // If currentProject is one of the user's projects, show that.
        // If we are effectively in a global context (how do we know?), we might want global chat.
        // Let's assume `currentProject` is the source of truth for the chat context.
        
        const chatContextProject = currentView === 'chat' && currentProject ? currentProject : ALL_TASKS_PROJECT;
        const projectMessages = allMessages.filter(m => m.projectId === chatContextProject.id);

        return (
            <ChatArea 
                currentUser={currentUser} 
                users={users} 
                currentProject={chatContextProject}
                messages={projectMessages}
                onSendMessage={handleSendMessage}
            />
        );
      case 'teams':
        return (
          <TeamView 
            users={users} 
            currentUser={currentUser} 
            teams={teams}
            tasks={tasks}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onAddMemberToTeam={handleAddMemberToTeam}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            theme={theme}
            onThemeChange={setTheme}
            onLogout={handleLogout}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <AuthPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          currentUser={currentUser}
          availableUsers={users}
          onSwitchUser={setCurrentUser}
          projects={visibleProjects} 
          currentProject={currentProject}
          onSwitchProject={setCurrentProject}
          onAddProject={handleAddProject}
        />
        
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 h-screen overflow-hidden pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;