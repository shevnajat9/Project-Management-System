import React, { useState, useRef, useEffect } from 'react';
import { Layout, CheckSquare, Users, MessageSquare, PlusCircle, Settings, Command, ChevronUp, Briefcase, X, Plus, Archive, ChevronDown, ChevronRight, Bell, Check, Clock } from 'lucide-react';
import { ViewState, User, Project, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User;
  availableUsers: User[];
  onSwitchUser: (user: User) => void;
  projects: Project[];
  currentProject: Project;
  onSwitchProject: (project: Project) => void;
  onAddProject: (project: Project) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  currentUser, 
  availableUsers, 
  onSwitchUser,
  projects,
  currentProject,
  onSwitchProject,
  onAddProject
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('bg-blue-500');
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  
  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
      { id: 1, text: 'Diana assigned you to "Design System Update"', time: '2h ago', isRead: false },
      { id: 2, text: 'New comment on "API Integration"', time: '4h ago', isRead: false },
      { id: 3, text: 'Task "iOS Beta Build" is due tomorrow', time: '5h ago', isRead: true },
      { id: 4, text: 'Welcome to Nexus Manage!', time: '1d ago', isRead: true },
  ]);
  
  const desktopNotificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check both desktop and mobile refs
      if (
        desktopNotificationRef.current && !desktopNotificationRef.current.contains(target) &&
        mobileNotificationRef.current && !mobileNotificationRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'projects', label: 'All Tasks', icon: CheckSquare },
    { id: 'teams', label: 'Team', icon: Users },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const projectColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 
    'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-slate-500'
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Filter projects
  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  // Logic to allow creation only for Admin and Super Admin
  const canCreateWorkspace = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      description: newProjectDesc,
      members: availableUsers, // For demo, add all users
      createdAt: new Date().toISOString(),
      color: newProjectColor,
      isArchived: false
    };

    onAddProject(newProject);
    setIsProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectColor('bg-blue-500');
  };

  const NotificationContent = () => (
    <>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
            <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell size={14} className="text-indigo-500" /> Notifications
            </span>
            {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} New
                </span>
            )}
        </div>
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No notifications yet</p>
                </div>
            ) : (
                notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-white dark:bg-slate-800' : 'opacity-70'}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${!notif.isRead ? 'bg-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        <div className="flex-1">
                            <p className={`text-sm leading-snug mb-1 ${!notif.isRead ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {notif.text}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {notif.time}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
        <div className="p-2 border-t border-slate-100 dark:border-slate-700 text-center bg-white dark:bg-slate-800">
            <button 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium py-1 px-3 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Mark all as read
            </button>
        </div>
    </>
  );

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex-col fixed left-0 top-0 z-20 transition-colors duration-200">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 relative">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
              <Command className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Nexus</span>
          </div>
          
          <div ref={desktopNotificationRef} className="relative">
            <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-full transition-all duration-200 outline-none ${
                    isNotificationsOpen 
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 border border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Desktop Notification Popover - Floats to the RIGHT of sidebar */}
            {isNotificationsOpen && (
                <div className="absolute left-full top-0 ml-4 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-left-2 duration-200">
                    <NotificationContent />
                </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewState)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-8 pb-2 flex justify-between items-center px-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspaces</p>
            {canCreateWorkspace && (
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" 
                title="Add Workspace"
              >
                <PlusCircle size={16} />
              </button>
            )}
          </div>
          <div className="px-4 space-y-2">
            {activeProjects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                   onSwitchProject(project);
                   onChangeView('project_board');
                }}
                className={`w-full flex items-center space-x-2 text-sm cursor-pointer p-2 rounded-lg transition-colors ${
                  currentProject.id === project.id && currentView === 'project_board'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${project.color || 'bg-slate-400'}`}></div>
                <span className="truncate flex-1 text-left">{project.name}</span>
                {currentProject.id === project.id && currentView === 'project_board' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Archived Projects Section */}
          {archivedProjects.length > 0 && (
            <div className="mt-6 px-4">
              <button 
                onClick={() => setIsArchivedOpen(!isArchivedOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 w-full mb-2"
              >
                 {isArchivedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                 <span>Archived</span>
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-1.5 rounded-full ml-auto">{archivedProjects.length}</span>
              </button>
              
              {isArchivedOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {archivedProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onSwitchProject(project);
                        onChangeView('project_board');
                      }}
                      className={`w-full flex items-center space-x-2 text-sm cursor-pointer p-2 rounded-lg transition-colors opacity-70 hover:opacity-100 ${
                        currentProject.id === project.id && currentView === 'project_board'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium' 
                          : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Archive size={14} className="text-slate-400" />
                      <span className="truncate flex-1 text-left">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Role Switcher Section for Desktop */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Current User (Demo)</p>
          
          <div className="relative group">
              <button className="flex items-center w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700" />
                  <div className="ml-2 text-left flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate">{currentUser.role}</p>
                  </div>
                  <ChevronUp size={14} className="text-slate-400" />
              </button>
              
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden hidden group-hover:block z-50">
                  {availableUsers.map(user => (
                      <button 
                          key={user.id}
                          onClick={() => onSwitchUser(user)}
                          className={`w-full flex items-center p-2 text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors ${user.id === currentUser.id ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                      >
                          <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                          <div className="ml-2">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 z-40 flex items-center justify-between transition-colors duration-200">
         <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Command className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-lg">Nexus</span>
        </div>
        <div className="flex items-center gap-4">
             {/* Mobile Notification Bell */}
             <div ref={mobileNotificationRef} className="relative">
                <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative text-slate-500 dark:text-slate-400 active:scale-95 transition-transform"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                    )}
                </button>

                {/* Mobile Notification Popover */}
                {isNotificationsOpen && (
                    <div className="absolute top-full right-[-50px] mt-4 w-[90vw] max-w-[320px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-top-5 fade-in duration-200">
                        <NotificationContent />
                    </div>
                )}
             </div>

             <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">{currentProject.name}</span>
                <div className={`w-2 h-2 rounded-full ${currentProject.color || 'bg-slate-400'}`}></div>
             </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Icons Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-2 py-3 z-50 pb-[env(safe-area-inset-bottom)] transition-colors duration-200">
        {menuItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
        
        {/* Mobile Profile / Switcher / Workspace Switcher */}
        <div className="relative">
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
             className={`p-0.5 rounded-full border-2 transition-all active:scale-95 ${isMobileMenuOpen ? 'border-indigo-600' : 'border-transparent'}`}
           >
              <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm" alt="Profile" />
           </button>
           
           {/* Mobile Menu Popover */}
           {isMobileMenuOpen && (
              <div className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col max-h-[80vh]">
                  
                  {/* Workspace Section Mobile */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Briefcase size={12} /> Workspaces
                        </p>
                        {canCreateWorkspace && (
                          <button 
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsProjectModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            <PlusCircle size={14} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {activeProjects.map(project => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onSwitchProject(project);
                              onChangeView('project_board');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center p-2 rounded-lg text-left transition-colors ${
                              currentProject.id === project.id 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${project.color || 'bg-slate-400'}`}></div>
                            <span className="text-sm font-medium truncate">{project.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Mobile Archived Section */}
                      {archivedProjects.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                               <Archive size={12} /> Archived
                            </p>
                            <div className="space-y-1">
                                {archivedProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => {
                                    onSwitchProject(project);
                                    onChangeView('project_board');
                                    setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center p-2 rounded-lg text-left transition-colors opacity-70 ${
                                    currentProject.id === project.id 
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200' 
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <Archive size={14} className="mr-2" />
                                    <span className="text-sm font-medium truncate">{project.name}</span>
                                </button>
                                ))}
                            </div>
                          </div>
                      )}
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Switch Account</p>
                      <div className="max-h-48 overflow-y-auto">
                        {availableUsers.map(user => (
                            <button 
                                key={user.id}
                                onClick={() => {
                                    onSwitchUser(user);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors ${user.id === currentUser.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}
                            >
                                <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</p>
                                </div>
                            </button>
                        ))}
                      </div>
                  </div>
                  
                  <div className="p-2">
                     <button 
                        onClick={() => {
                            onChangeView('settings');
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm"
                     >
                        <Settings size={16} /> Settings
                     </button>
                  </div>
              </div>
           )}
           {/* Backdrop to close menu */}
           {isMobileMenuOpen && (
             <div className="fixed inset-0 z-[-1]" onClick={() => setIsMobileMenuOpen(false)}></div>
           )}
        </div>
      </div>

      {/* ADD WORKSPACE MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Workspace</h2>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Q4 Marketing Sprint"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brief description of the project goals..."
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {projectColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewProjectColor(color)}
                        className={`w-8 h-8 rounded-full ${color} transition-all ${newProjectColor === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button 
                     onClick={() => setIsProjectModalOpen(false)}
                     className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleCreateProject}
                     disabled={!newProjectName.trim()}
                     className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-md"
                   >
                     Create Workspace
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;