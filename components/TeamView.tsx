import React, { useState, useEffect } from 'react';
import { Mail, Phone, MoreVertical, Shield, Plus, Users, X, Trash2, ArrowLeft, CheckCircle, PieChart, AlertCircle, UserPlus } from 'lucide-react';
import { User, UserRole, Team, Task, TaskStatus } from '../types';

interface TeamViewProps {
  users: User[];
  currentUser: User;
  teams: Team[];
  tasks: Task[]; // Received tasks to calculate performance
  onAddTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddMemberToTeam: (teamId: string, userId: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ users, currentUser, teams, tasks, onAddTeam, onDeleteTeam, onAddMemberToTeam }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  
  // State for Add Member Modal
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Sync selectedTeam with teams prop to ensure updates are reflected
  useEffect(() => {
    if (selectedTeam) {
      const updatedTeam = teams.find(t => t.id === selectedTeam.id);
      if (updatedTeam) {
        setSelectedTeam(updatedTeam);
      }
    }
  }, [teams, selectedTeam?.id]);
  
  const canManageTeam = currentUser.role === UserRole.SUPER_ADMIN || 
                     currentUser.role === UserRole.ADMIN || 
                     currentUser.role === UserRole.MANAGER;
                     
  const canDeleteTeam = currentUser.role === UserRole.SUPER_ADMIN;

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;

    const members = users.filter(u => newTeamMembers.includes(u.id));
    
    // Assign a random gradient
    const gradients = [
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-purple-500 to-pink-500',
        'from-orange-500 to-amber-500',
        'from-indigo-500 to-violet-500'
    ];
    const randomColor = gradients[Math.floor(Math.random() * gradients.length)];

    const newTeam: Team = {
        id: Math.random().toString(36).substr(2, 9),
        name: newTeamName,
        description: newTeamDesc,
        members: members,
        color: randomColor
    };

    onAddTeam(newTeam);
    setIsModalOpen(false);
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamMembers([]);
  };

  const toggleMemberSelection = (userId: string) => {
      if (newTeamMembers.includes(userId)) {
          setNewTeamMembers(newTeamMembers.filter(id => id !== userId));
      } else {
          setNewTeamMembers([...newTeamMembers, userId]);
      }
  };

  // Helper to calculate user performance
  const getUserPerformance = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignees.some(a => a.id === userId));
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
  };

  // Helper to get tasks for the selected team
  const getTeamTasks = (team: Team) => {
      const memberIds = team.members.map(m => m.id);
      return tasks.filter(t => t.assignees.some(a => memberIds.includes(a.id)));
  };

  // Get available users not in the currently selected team
  const availableUsersForTeam = selectedTeam 
      ? users.filter(u => !selectedTeam.members.some(m => m.id === u.id)) 
      : [];

  // RENDER: Team Detail View
  if (selectedTeam) {
    const teamTasks = getTeamTasks(selectedTeam);
    const completedTeamTasks = teamTasks.filter(t => t.status === TaskStatus.DONE).length;
    const teamProgress = teamTasks.length > 0 ? Math.round((completedTeamTasks / teamTasks.length) * 100) : 0;

    return (
      <div className="h-full overflow-y-auto pr-2 pb-10 animate-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedTeam(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Teams</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
           <div className={`h-32 bg-gradient-to-r ${selectedTeam.color} p-8 flex items-end`}>
              <h1 className="text-3xl font-bold text-white shadow-sm">{selectedTeam.name}</h1>
           </div>
           <div className="p-8">
              <div className="flex justify-between items-start">
                  <div className="max-w-2xl">
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-6">{selectedTeam.description}</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <Users className="text-indigo-500 dark:text-indigo-400" />
                           <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTeam.members.length} Members</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <CheckCircle className="text-emerald-500 dark:text-emerald-400" />
                           <span className="font-semibold text-slate-700 dark:text-slate-200">{completedTeamTasks}/{teamTasks.length} Tasks Done</span>
                        </div>
                    </div>
                  </div>
                  
                  {/* Overall Team Progress Circle */}
                  <div className="flex flex-col items-center">
                     <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                className="stroke-slate-100 dark:stroke-slate-700"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                strokeDasharray={`${teamProgress}, 100`}
                            />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-slate-800 dark:text-white">
                            {teamProgress}%
                        </div>
                     </div>
                     <span className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Overall Progress</span>
                  </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Member Performance Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">Member Performance</h2>
                   {canManageTeam && (
                     <button 
                       onClick={() => setIsAddMemberModalOpen(true)}
                       className="text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
                     >
                       <UserPlus size={16} /> Add Member
                     </button>
                   )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeam.members.map(member => {
                        const stats = getUserPerformance(member.id);
                        return (
                            <div key={member.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-700" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 dark:text-white">{member.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{member.role}</p>
                                    
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        <span>Tasks Completed</span>
                                        <span className="font-semibold">{stats.completed}/{stats.total} ({stats.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                stats.percentage === 100 ? 'bg-emerald-500' : 
                                                stats.percentage > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                            }`} 
                                            style={{ width: `${stats.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">Active Team Tasks</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {teamTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                            No tasks assigned to members of this team yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {teamTasks.map(task => (
                                <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            task.status === TaskStatus.DONE ? 'bg-emerald-500' : 
                                            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 
                                            'bg-slate-300 dark:bg-slate-600'
                                        }`}></div>
                                        <div>
                                            <h4 className={`font-medium text-sm ${task.status === TaskStatus.DONE ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                    task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400' : 
                                                    'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                                                }`}>{task.priority}</span>
                                                <span className="text-[10px] text-slate-400">{task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {task.assignees.map((a, i) => (
                                            <img key={i} src={a.avatar} className="w-6 h-6 rounded-full border border-white dark:border-slate-800" title={a.name} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Side Stats Column */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <PieChart size={18} className="text-indigo-500" /> Task Distribution
                   </h3>
                   <div className="space-y-3">
                      {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE].map(status => {
                          const count = teamTasks.filter(t => t.status === status).length;
                          return (
                              <div key={status} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">{status}</span>
                                  <span className="font-mono font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-200">{count}</span>
                              </div>
                          );
                      })}
                   </div>
                </div>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} /> Team Goals
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                        Keep up the good work! Ensure all high priority tasks are addressed before the weekend.
                    </p>
                </div>
            </div>
        </div>

        {/* Add Member Modal */}
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Member to {selectedTeam.name}</h2>
                    <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X size={24} />
                    </button>
                 </div>
                 
                 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {availableUsersForTeam.length === 0 ? (
                       <p className="text-center text-slate-500 dark:text-slate-400 py-8 italic">All available users are already in this team.</p>
                    ) : (
                       availableUsersForTeam.map(user => (
                          <div 
                             key={user.id} 
                             onClick={() => {
                                onAddMemberToTeam(selectedTeam.id, user.id);
                                setIsAddMemberModalOpen(false);
                             }}
                             className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer transition-all group"
                          >
                             <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                             <div className="flex-1">
                                <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                             </div>
                             <div className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={16} />
                             </div>
                          </div>
                       ))
                    )}
                 </div>
                 
                 <div className="mt-6 flex justify-end">
                    <button 
                       onClick={() => setIsAddMemberModalOpen(false)}
                       className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium"
                    >
                       Close
                    </button>
                 </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: Default Team List View
  return (
    <div className="h-full overflow-y-auto pr-2 pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Work Teams</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage project teams and member allocations.</p>
        </div>
        
        {canManageTeam && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> New Team
            </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {teams.map(team => {
            const teamTasks = getTeamTasks(team);
            const doneCount = teamTasks.filter(t => t.status === TaskStatus.DONE).length;
            const progress = teamTasks.length ? Math.round((doneCount / teamTasks.length) * 100) : 0;

            return (
                <div 
                    key={team.id} 
                    onClick={() => setSelectedTeam(team)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 hover:-translate-y-1 transition-all group overflow-hidden flex flex-col cursor-pointer"
                >
                    <div className={`h-2 bg-gradient-to-r ${team.color}`}></div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{team.name}</h3>
                            {canDeleteTeam && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTeam(team.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Delete Team"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1 line-clamp-2">{team.description}</p>
                        
                        <div className="mt-auto">
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full bg-gradient-to-r ${team.color}`} 
                                    style={{ width: `${progress}%` }} 
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                <span>{team.members.length} Members</span>
                                <span>{progress}% Efficiency</span>
                            </div>
                            <div className="flex -space-x-2 overflow-hidden py-1">
                                {team.members.map(member => (
                                    <img 
                                        key={member.id} 
                                        src={member.avatar} 
                                        alt={member.name} 
                                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800" 
                                        title={member.name}
                                    />
                                ))}
                                {team.members.length === 0 && (
                                    <span className="text-xs text-slate-400 italic">No members assigned</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">All Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
                const stats = getUserPerformance(user.id);
                return (
                    <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-4 border-slate-50 dark:border-slate-700" />
                        <button className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200">
                            <MoreVertical size={20} />
                        </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide
                            ${user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            user.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            user.role === UserRole.MANAGER ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }
                        `}>
                        {user.role}
                        </span>
                        
                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                <span>Performance</span>
                                <span>{stats.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        stats.percentage === 100 ? 'bg-emerald-500' : 
                                        stats.percentage > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                    }`} 
                                    style={{ width: `${stats.percentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Mail size={16} className="mr-3 text-slate-400" />
                            <span className="truncate">{user.name.toLowerCase().replace(' ', '.')}@nexus.co</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Phone size={16} className="mr-3 text-slate-400" />
                            <span>+1 (555) 000-0000</span>
                        </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Add Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Team</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g. Marketing Squad"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-20 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="What is this team responsible for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Members</label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-1">
                    {users.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => toggleMemberSelection(user.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                newTeamMembers.includes(user.id) 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800' 
                                    : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                newTeamMembers.includes(user.id) 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                                {newTeamMembers.includes(user.id) && <Plus size={10} className="text-white" />}
                            </div>
                            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">{newTeamMembers.length} members selected</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;