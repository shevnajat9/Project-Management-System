import React from 'react';
import { Trophy, TrendingUp, CheckCircle, AlertTriangle, Activity, Zap, Star, Clock } from 'lucide-react';
import { Task, User, TaskStatus } from '../types';

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, users, currentUser }) => {
  
  // 1. Calculate Overall Stats (Global)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const overdueTasks = tasks.filter(t => {
    return t.status !== TaskStatus.DONE && new Date(t.dueDate) < new Date();
  }).length;

  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // 2. Calculate User Performance (Global across all visible projects)
  const userPerformance = users.map(user => {
    const userTasks = tasks.filter(t => t.assignees.some(a => a.id === user.id));
    const userTotal = userTasks.length;
    const userCompleted = userTasks.filter(t => t.status === TaskStatus.DONE).length;
    const completionRate = userTotal === 0 ? 0 : Math.round((userCompleted / userTotal) * 100);
    
    // Simple score: Completed tasks weigh more, rate acts as tie-breaker
    const score = (userCompleted * 10) + (completionRate / 10);

    // Determine "Badge" based on rate
    let badge = 'Member';
    if (userTotal > 0) {
        if (completionRate >= 80 && userTotal > 2) badge = 'Speedster';
        else if (completionRate >= 50) badge = 'Achiever';
        else if (userTotal > 5) badge = 'Busy Bee';
    }

    return {
      user,
      total: userTotal,
      completed: userCompleted,
      rate: completionRate,
      score,
      badge
    };
  })
  .sort((a, b) => b.score - a.score) // Sort by highest score
  .filter(u => u.total > 0); // Only show active users

  // 3. Get Recent Completions
  const recentCompletions = tasks
    .filter(t => t.status === TaskStatus.DONE)
    .sort((a, b) => {
        // Assuming tasks might not have a completedAt timestamp in this simple mock, 
        // strictly using array order or simulating recency is fine, 
        // but sorting by dueDate or ID helps consistency in mock.
        return b.id.localeCompare(a.id); 
    })
    .slice(0, 5);

  return (
    <div className="h-full overflow-y-auto pb-10 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome back, {currentUser.name}. Here is an overview of performance across <span className="font-semibold text-indigo-600 dark:text-indigo-400">all workspaces</span>.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
             <Activity size={24} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</p>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalTasks}</h3>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
             <CheckCircle size={24} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{completedTasks}</h3>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
             <TrendingUp size={24} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global Efficiency</p>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{progressPercentage}%</h3>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className={`p-3 rounded-lg ${overdueTasks > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
             <AlertTriangle size={24} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue</p>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{overdueTasks}</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TOP PERFORMERS / LEADERBOARD */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} /> Top Performers
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ranking based on task completion and speed across all projects.</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
               All Workspaces
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {userPerformance.length === 0 ? (
               <div className="text-center py-8 text-slate-400 italic">No activity recorded yet.</div>
            ) : (
               userPerformance.map((stat, index) => {
                 let rankColor = 'bg-slate-100 dark:bg-slate-700 text-slate-500';
                 if (index === 0) rankColor = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800';
                 if (index === 1) rankColor = 'bg-slate-200 dark:bg-slate-600 text-slate-600 border border-slate-300 dark:border-slate-500';
                 if (index === 2) rankColor = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 border border-orange-200 dark:border-orange-800';

                 return (
                   <div key={stat.user.id} className="relative">
                      <div className="flex items-center gap-4 mb-2">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor}`}>
                           {index + 1}
                         </div>
                         <img src={stat.user.avatar} alt={stat.user.name} className="w-12 h-12 rounded-full border-2 border-slate-50 dark:border-slate-700" />
                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                 {stat.user.name}
                                 {index === 0 && <Star size={14} className="text-amber-500 fill-amber-500" />}
                                 <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-600">
                                   {stat.badge}
                                 </span>
                               </h3>
                               <div className="text-right">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{stat.completed}</span>
                                  <span className="text-xs text-slate-400"> / {stat.total} Tasks</span>
                               </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-1000 ${
                                    index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 
                                    stat.rate >= 80 ? 'bg-emerald-500' :
                                    stat.rate >= 50 ? 'bg-indigo-500' : 'bg-slate-400'
                                 }`} 
                                 style={{ width: `${stat.rate}%` }}
                               ></div>
                            </div>
                         </div>
                      </div>
                   </div>
                 );
               })
            )}
          </div>
        </div>

        {/* RECENTLY COMPLETED */}
        <div className="col-span-1 space-y-6">
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <Zap size={18} className="text-yellow-500" /> Global Victories
              </h3>
              <div className="space-y-4">
                 {recentCompletions.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No tasks completed recently.</p>
                 ) : (
                    recentCompletions.map(task => (
                       <div key={task.id} className="flex gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                          <div className="mt-1">
                             <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1 rounded-full">
                                <CheckCircle size={14} />
                             </div>
                          </div>
                          <div>
                             <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="flex -space-x-1">
                                   {task.assignees.map(a => (
                                      <img key={a.id} src={a.avatar} className="w-4 h-4 rounded-full border border-white dark:border-slate-800" alt="" />
                                   ))}
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                   <Clock size={10} /> {new Date().toLocaleDateString()}
                                </span>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-10 -translate-y-10"></div>
               <h3 className="font-bold text-lg mb-2 relative z-10">Organization Goal</h3>
               <p className="text-indigo-100 text-sm mb-4 relative z-10">You're {progressPercentage}% done with all tasks across all projects.</p>
               <div className="w-full bg-indigo-900/50 rounded-full h-2 relative z-10">
                  <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;