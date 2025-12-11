import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, Paperclip, Calendar, User as UserIcon, X, MessageSquare, Trash2, CheckSquare, ChevronDown, Users, CheckCircle, Lock, Tag, Clock, Circle, Eye, Archive, Briefcase, RotateCcw } from 'lucide-react';
import { Task, Project, TaskStatus, Priority, User, ChecklistItem, UserRole, TaskCategory, Comment } from '../types';
import { generateTaskSuggestions } from '../services/aiService';

interface TaskBoardProps {
  project: Project;
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkDelete: (taskIds: string[]) => void;
  onBulkUpdate: (tasks: Task[]) => void;
  currentUser: User;
  onToggleArchive: (projectId: string) => void;
  allProjects?: Project[];
}

const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
        case TaskCategory.DEVELOPMENT: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case TaskCategory.DESIGN: return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800';
        case TaskCategory.MARKETING: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        case TaskCategory.CONTENT: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
        case TaskCategory.FINANCE: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
        case TaskCategory.ADMIN: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        case TaskCategory.HR: return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
        case TaskCategory.OTHER:
        default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
};

const getStatusColor = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.TODO: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600';
        case TaskStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case TaskStatus.REVIEW: return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
        case TaskStatus.DONE: return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.TODO: return Circle;
        case TaskStatus.IN_PROGRESS: return Clock;
        case TaskStatus.REVIEW: return Eye;
        case TaskStatus.DONE: return CheckCircle;
        default: return Circle;
    }
};

const TaskBoard: React.FC<TaskBoardProps> = ({ project, tasks, onAddTask, onUpdateTask, onDeleteTask, onBulkDelete, onBulkUpdate, currentUser, onToggleArchive, allProjects }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Create Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>(TaskCategory.OTHER);
    const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newChecklistItems, setNewChecklistItems] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState('');
    
    // Global View: Selected Project for new task
    const [selectedProjectId, setSelectedProjectId] = useState<string>(project.id === 'all-tasks' && allProjects?.[0] ? allProjects[0].id : project.id);

    // Drag and Drop State
    const [dragActiveStatus, setDragActiveStatus] = useState<TaskStatus | null>(null);

    // Edit/Details State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');
    const [editingItemText, setEditingItemText] = useState('');

    // Bulk Selection State
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);

    // Checklist File Upload State
    const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);

    // AI suggestion state
    const [aiSuggestionInput, setAiSuggestionInput] = useState('');
    const [showAiInput, setShowAiInput] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const checklistFileInputRef = useRef<HTMLInputElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const isGlobalView = project.id === 'all-tasks';

    // --- PERMISSION HELPERS ---
    const canDelete = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
    const canDeleteBulk = canDelete;
    
    // Allow archiving for Admin/Super Admin/Manager
    const canArchive = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

    // Helper to find task project
    const getTaskProject = (task: Task) => {
        return allProjects?.find(p => p.id === task.projectId) || (project.id === task.projectId ? project : undefined);
    };

    // Regular user can only edit if assigned to them or if they are admin/manager
    const canEditTask = (task: Task) => {
        // Check if task's project is archived
        const taskProject = getTaskProject(task);
        if (taskProject?.isArchived) return false;

        if (currentUser.role === UserRole.USER) {
            return task.assignees.some(u => u.id === currentUser.id);
        }
        return true;
    };

    useEffect(() => {
        if (editingTask && commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [editingTask?.comments.length, editingTask]);

    // Set default assignee for USER role when opening modal
    useEffect(() => {
        if (isModalOpen && currentUser.role === UserRole.USER) {
            setNewTaskAssigneeIds([currentUser.id]);
        }
    }, [isModalOpen, currentUser]);

    // Update selectedProjectId when project prop changes or modal opens
    useEffect(() => {
        if (isGlobalView && allProjects && allProjects.length > 0) {
            if (!selectedProjectId || !allProjects.find(p => p.id === selectedProjectId)) {
                 setSelectedProjectId(allProjects[0].id);
            }
        } else {
             setSelectedProjectId(project.id);
        }
    }, [project.id, isGlobalView, allProjects, isModalOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && editingTask) {
            const files = Array.from(e.target.files);
            const newAttachments = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                url: URL.createObjectURL(file)
            }));
            
            setEditingTask({
                ...editingTask,
                attachments: [...editingTask.attachments, ...newAttachments]
            });
        }
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        if (editingTask) {
            setEditingTask({
                ...editingTask,
                attachments: editingTask.attachments.filter(a => a.id !== attachmentId)
            });
        }
    };

    // Checklist Handlers
    const handleAddChecklistItemCreate = () => {
        if (!newItemText.trim()) return;
        
        const newItem: ChecklistItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: newItemText,
            isCompleted: false,
            attachments: []
        };
        
        setNewChecklistItems([...newChecklistItems, newItem]);
        setNewItemText('');
    };

    const handleRemoveChecklistItemCreate = (id: string) => {
        setNewChecklistItems(newChecklistItems.filter(item => item.id !== id));
    };

    const handleAddChecklistItemEdit = () => {
        if (!editingItemText.trim() || !editingTask) return;
        
        const newItem: ChecklistItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: editingItemText,
            isCompleted: false,
            attachments: []
        };
        
        setEditingTask({
            ...editingTask,
            checklist: [...(editingTask.checklist || []), newItem]
        });
        setEditingItemText('');
    };

    const handleToggleChecklistItem = (itemId: string) => {
        if (!editingTask) return;
        
        const updatedChecklist = editingTask.checklist.map(item => 
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        
        setEditingTask({ ...editingTask, checklist: updatedChecklist });
    };

    const handleDeleteChecklistItem = (itemId: string) => {
        if (!editingTask) return;
        
        const updatedChecklist = editingTask.checklist.filter(item => item.id !== itemId);
        setEditingTask({ ...editingTask, checklist: updatedChecklist });
    };

    // Checklist File Upload Handlers
    const triggerChecklistFileUpload = (itemId: string) => {
        setActiveChecklistId(itemId);
        checklistFileInputRef.current?.click();
    };

    const handleChecklistFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && activeChecklistId) {
            const files = Array.from(e.target.files);
            const newAttachments = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                url: URL.createObjectURL(file)
            }));

            if (editingTask) {
                const updatedChecklist = editingTask.checklist.map(item => {
                    if (item.id === activeChecklistId) {
                        return {
                            ...item,
                            attachments: [...(item.attachments || []), ...newAttachments]
                        };
                    }
                    return item;
                });
                setEditingTask({ ...editingTask, checklist: updatedChecklist });
            } else {
                const updatedChecklist = newChecklistItems.map(item => {
                    if (item.id === activeChecklistId) {
                        return {
                            ...item,
                            attachments: [...(item.attachments || []), ...newAttachments]
                        };
                    }
                    return item;
                });
                setNewChecklistItems(updatedChecklist);
            }
        }
        if (checklistFileInputRef.current) {
            checklistFileInputRef.current.value = '';
        }
        setActiveChecklistId(null);
    };

    // AI Handlers
    const handleGenerateTasks = async () => {
        if (!aiSuggestionInput.trim()) return;
        setIsGenerating(true);
        const suggestions = await generateTaskSuggestions(aiSuggestionInput);
        
        // In Global View, prioritize selected project, otherwise use the first available one
        const targetProjectId = isGlobalView ? selectedProjectId : project.id;
        
        suggestions.forEach(s => {
            const task: Task = {
                id: Math.random().toString(36).substr(2, 9),
                projectId: targetProjectId,
                title: s.title,
                description: s.description || '',
                status: TaskStatus.TODO,
                priority: s.priority as Priority,
                category: TaskCategory.DEVELOPMENT, // Default for AI Generated Tasks
                attachments: [],
                checklist: [],
                comments: [],
                assignees: [],
                dueDate: new Date().toISOString().split('T')[0]
            };
            onAddTask(task);
        });
        
        setIsGenerating(false);
        setShowAiInput(false);
        setAiSuggestionInput('');
    };

    // Create/Update Task Handlers
    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) return;

        const attachments = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            size: (file.size / 1024).toFixed(2) + ' KB',
            url: URL.createObjectURL(file)
        }));

        // In global view, use users from the selected project if available, otherwise fallback to global member list
        const targetProject = isGlobalView ? allProjects?.find(p => p.id === selectedProjectId) : project;
        const membersList = targetProject ? targetProject.members : project.members;
        
        const assignees = membersList.filter(m => newTaskAssigneeIds.includes(m.id));

        const task: Task = {
            id: Math.random().toString(36).substr(2, 9),
            projectId: isGlobalView ? selectedProjectId : project.id,
            title: newTaskTitle,
            description: newTaskDesc,
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            category: newTaskCategory,
            attachments: attachments,
            checklist: newChecklistItems,
            comments: [],
            dueDate: newTaskDueDate,
            assignees: assignees
        };

        onAddTask(task);
        setIsModalOpen(false);
        // Reset form
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDueDate(new Date().toISOString().split('T')[0]);
        setNewTaskCategory(TaskCategory.OTHER);
        setNewTaskAssigneeIds([]);
        setNewFiles([]);
        setNewChecklistItems([]);
        setNewItemText('');
    };

    const toggleNewTaskAssignee = (memberId: string) => {
        if (currentUser.role === UserRole.USER) return;
        
        if (newTaskAssigneeIds.includes(memberId)) {
            setNewTaskAssigneeIds(newTaskAssigneeIds.filter(id => id !== memberId));
        } else {
            setNewTaskAssigneeIds([...newTaskAssigneeIds, memberId]);
        }
    };

    const toggleEditTaskAssignee = (memberId: string) => {
        if (!editingTask) return;
        if (currentUser.role === UserRole.USER) return;
        
        const currentTaskProject = getTaskProject(editingTask);
        if (currentTaskProject?.isArchived) return;

        const currentAssigneeIds = editingTask.assignees.map(a => a.id);
        let newAssignees;
        
        if (currentAssigneeIds.includes(memberId)) {
            newAssignees = editingTask.assignees.filter(a => a.id !== memberId);
        } else {
            // Find member in the project that owns the task
            const member = currentTaskProject?.members.find(m => m.id === memberId);
            if (member) {
                newAssignees = [...editingTask.assignees, member];
            } else {
                newAssignees = editingTask.assignees;
            }
        }
        
        setEditingTask({ ...editingTask, assignees: newAssignees });
    };

    const handleSaveEdit = () => {
        if (editingTask) {
            onUpdateTask(editingTask);
            setEditingTask(null);
            setNewComment('');
        }
    };

    const handleDeleteTaskAction = () => {
        if (editingTask && canDelete) {
            onDeleteTask(editingTask.id);
            setEditingTask(null);
        }
    };

    const handleAddComment = () => {
        if (!newComment.trim() || !editingTask) return;
        
        const comment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            senderId: currentUser.id,
            senderName: currentUser.name,
            avatar: currentUser.avatar,
            text: newComment,
            timestamp: new Date().toISOString()
        };
        
        setEditingTask({
            ...editingTask,
            comments: [...(editingTask.comments || []), comment]
        });
        setNewComment('');
    };

    // Bulk Action Handlers
    const toggleTaskSelection = (taskId: string) => {
        const newSelection = new Set(selectedTaskIds);
        if (newSelection.has(taskId)) {
            newSelection.delete(taskId);
        } else {
            newSelection.add(taskId);
        }
        setSelectedTaskIds(newSelection);
    };

    const handleBulkStatusChange = (status: TaskStatus) => {
        if (project.isArchived && !isGlobalView) return;

        const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
        const updatedTasks = selectedTasks.map(t => ({ ...t, status }));
        onBulkUpdate(updatedTasks);
        setSelectedTaskIds(new Set());
        setShowStatusMenu(false);
    };

    const handleBulkAssign = (userId: string) => {
        if (project.isArchived && !isGlobalView) return;

        // Note: For global bulk assign, we might have issues if user is not in all projects.
        // For simplicity, we assume we can assign if user is available in the current view context.
        
        // Find user in current project or all users if global
        // In global view, `project` is dummy, we need a user object. 
        // We'll search in all projects members
        let user: User | undefined;
        if (isGlobalView && allProjects) {
            for (const p of allProjects) {
                user = p.members.find(m => m.id === userId);
                if (user) break;
            }
        } else {
            user = project.members.find(m => m.id === userId);
        }

        if (!user) return;

        const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
        const updatedTasks = selectedTasks.map(t => {
            // Avoid duplicates
            if (t.assignees.some(a => a.id === user!.id)) return t;
            return { ...t, assignees: [...t.assignees, user!] };
        });

        onBulkUpdate(updatedTasks);
        setSelectedTaskIds(new Set());
        setShowAssignMenu(false);
    };

    const handleBulkDeleteAction = () => {
        if (project.isArchived && !isGlobalView) return;
        onBulkDelete(Array.from(selectedTaskIds));
        setSelectedTaskIds(new Set());
    };

    const handleClearSelection = () => {
        setSelectedTaskIds(new Set());
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (dragActiveStatus !== status) {
            setDragActiveStatus(status);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.relatedTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            return;
        }
        setDragActiveStatus(null);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        setDragActiveStatus(null);
        const taskId = e.dataTransfer.getData('taskId');
        
        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== status) {
                if (canEditTask(task)) {
                    onUpdateTask({ ...task, status });
                }
            }
        }
    };

    const renderProgress = (checklist: ChecklistItem[]) => {
        if (!checklist || checklist.length === 0) return null;
        
        const completed = checklist.filter(i => i.isCompleted).length;
        const total = checklist.length;
        const percent = Math.round((completed / total) * 100);

        return (
            <div className="mt-2 mb-1">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <div className="flex items-center gap-1">
                        <CheckSquare size={12} />
                        <span>{completed}/{total}</span>
                    </div>
                    <span>{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const renderColumn = (status: TaskStatus) => {
        const columnTasks = tasks.filter(t => t.status === status);
        const isDragActive = dragActiveStatus === status && !project.isArchived;

        return (
            <div 
                className={`flex-1 min-w-[300px] rounded-xl p-4 h-full flex flex-col transition-all duration-200 ${
                    isDragActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-400 ring-inset' 
                    : 'bg-slate-100 dark:bg-slate-800/50'
                }`}
                onDragOver={(e) => !project.isArchived && handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => !project.isArchived && handleDrop(e, status)}
            >
                <div className="flex items-center justify-between mb-4 pointer-events-none">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                            status === TaskStatus.TODO ? 'bg-slate-400' :
                            status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' :
                            status === TaskStatus.REVIEW ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        {status}
                        <span className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                            {columnTasks.length}
                        </span>
                    </h3>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[50px]">
                    {columnTasks.map(task => {
                        const isSelected = selectedTaskIds.has(task.id);
                        const isEditable = canEditTask(task);
                        const StatusIcon = getStatusIcon(task.status);
                        const taskProject = getTaskProject(task);

                        return (
                            <div
                                key={task.id}
                                draggable={isEditable}
                                onDragStart={(e) => isEditable && handleDragStart(e, task.id)}
                                onClick={() => isEditable || project.isArchived || isGlobalView ? setEditingTask(task) : alert("You can only view this task unless assigned to you.")}
                                className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border hover:shadow-md transition-all group relative ${
                                    isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700'
                                } ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-90'}`}
                            >
                                {!isEditable && (
                                    <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-600">
                                        <Lock size={14} />
                                    </div>
                                )}

                                {isEditable && !project.isArchived && (
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskSelection(task.id);
                                        }}
                                        className={`absolute top-3 right-3 z-10 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        } transition-opacity`}
                                    >
                                        {isSelected ? (
                                            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-50 dark:fill-indigo-900" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-500" />
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 mb-2 pointer-events-none">
                                    {isGlobalView && taskProject && (
                                        <div className="flex items-center gap-1 self-start bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 dark:border-slate-600">
                                            <Briefcase size={10} />
                                            <span className="truncate max-w-[120px]">{taskProject.name}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase flex items-center gap-1 ${getStatusColor(task.status)}`}>
                                            <StatusIcon size={12} /> {task.status}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                            task.priority === Priority.HIGH ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' :
                                            task.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' :
                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        {task.category && (
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getCategoryColor(task.category)}`}>
                                                {task.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h4 className="font-medium text-slate-800 dark:text-white mb-1 pr-6">{task.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                                
                                {renderProgress(task.checklist)}

                                {task.attachments.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 mt-2">
                                        <Paperclip size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                            {task.attachments.length} file{task.attachments.length > 1 ? 's' : ''} attached
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 pointer-events-none mt-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <Calendar size={12} />
                                        <span>{task.dueDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(task.comments?.length || 0) > 0 && (
                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                <MessageSquare size={12} />
                                                <span>{task.comments.length}</span>
                                            </div>
                                        )}
                                        {task.assignees && task.assignees.length > 0 ? (
                                            <div className="flex -space-x-2">
                                                {task.assignees.map((assignee, index) => (
                                                    <img 
                                                        key={assignee.id}
                                                        src={assignee.avatar}
                                                        alt={assignee.name}
                                                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800"
                                                        title={assignee.name}
                                                        style={{ zIndex: task.assignees.length - index }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                <UserIcon size={12} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {!project.isArchived && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="mt-3 w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Add Task
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const membersForSelection = isGlobalView 
      ? (allProjects?.find(p => p.id === selectedProjectId)?.members || []) 
      : project.members;

    return (
        <div className="h-full flex flex-col relative">
            <input 
                type="file" 
                multiple
                ref={checklistFileInputRef}
                className="hidden"
                onChange={handleChecklistFileChange}
            />
            
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                            {project.isArchived && (
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                    <Archive size={12} /> Archived
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{project.description}</p>
                    </div>
                    <div className="flex gap-3">
                        {!project.isArchived && (
                            <button 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:opacity-90 transition-all shadow-md text-sm font-medium flex items-center gap-2"
                            >
                                ✨ AI Auto-Plan
                            </button>
                        )}
                        {canArchive && (
                            <button 
                                onClick={() => onToggleArchive(project.id)}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                                    project.isArchived
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10'
                                }`}
                                title={project.isArchived ? "Unarchive Workspace" : "Archive Workspace"}
                            >
                                {project.isArchived ? (
                                    <><RotateCcw size={16} /> Unarchive</>
                                ) : (
                                    <Archive size={16} />
                                )}
                            </button>
                        )}
                        <div className="flex -space-x-2">
                            {project.members.map(m => (
                                <img 
                                    key={m.id}
                                    src={m.avatar} 
                                    alt={m.name} 
                                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800"
                                    title={m.name}
                                />
                            ))}
                            {!project.isArchived && !isGlobalView && (
                                <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-200 dark:hover:bg-slate-600">
                                    <Plus size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {project.isArchived && (
                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center gap-3 text-slate-600 dark:text-slate-400 mb-2">
                        <Archive size={18} />
                        <span className="text-sm">This workspace is archived. You can view tasks and comments, but editing is disabled.</span>
                    </div>
                )}

                {showAiInput && !project.isArchived && (
                    <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-4 rounded-xl animate-fade-in">
                        <label className="block text-sm font-medium text-violet-900 dark:text-violet-200 mb-2">
                            Describe your project goal, and AI will generate tasks for you.
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border-violet-200 dark:border-violet-700 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                placeholder="e.g., Launch a new marketing website for the summer campaign"
                                value={aiSuggestionInput}
                                onChange={(e) => setAiSuggestionInput(e.target.value)}
                            />
                            <button 
                                disabled={isGenerating}
                                onClick={handleGenerateTasks}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Plan'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full min-w-max">
                    {renderColumn(TaskStatus.TODO)}
                    {renderColumn(TaskStatus.IN_PROGRESS)}
                    {renderColumn(TaskStatus.REVIEW)}
                    {renderColumn(TaskStatus.DONE)}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedTaskIds.size > 0 && !project.isArchived && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                        <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                            {selectedTaskIds.size}
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-white">Selected</span>
                        <button onClick={handleClearSelection} className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={14} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                                className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                                Change Status <ChevronDown size={14} />
                            </button>
                            {showStatusMenu && (
                                <div className="absolute bottom-full mb-2 left-0 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden py-1">
                                    {Object.values(TaskStatus).map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => handleBulkStatusChange(status)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setShowAssignMenu(!showAssignMenu)}
                                className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                                <Users size={14} /> Assign to <ChevronDown size={14} />
                            </button>
                            {showAssignMenu && (
                                <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden py-1">
                                    {(isGlobalView ? allProjects?.flatMap(p => p.members) : project.members).filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i).map(member => (
                                        <button 
                                            key={member.id}
                                            onClick={() => handleBulkAssign(member.id)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                                        >
                                            <img src={member.avatar} className="w-5 h-5 rounded-full" alt="" />
                                            {member.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                        
                        {canDeleteBulk && (
                            <button 
                                onClick={handleBulkDeleteAction}
                                className="px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* CREATE TASK MODAL */}
            {isModalOpen && !project.isArchived && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl transform transition-all overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Task</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* In Global View, allow project selection */}
                            {isGlobalView && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Workspace</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <select 
                                            value={selectedProjectId}
                                            onChange={(e) => setSelectedProjectId(e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        >
                                            {allProjects?.filter(p => !p.isArchived).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="What needs to be done?"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea 
                                    value={newTaskDesc}
                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-24 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="Add details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <select 
                                            value={newTaskCategory}
                                            onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        >
                                            {Object.values(TaskCategory).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input 
                                            type="date" 
                                            value={newTaskDueDate}
                                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assignees</label>
                                <div className="flex flex-wrap gap-2">
                                    {membersForSelection?.map(member => (
                                        <div 
                                            key={member.id} 
                                            onClick={() => toggleNewTaskAssignee(member.id)}
                                            className={`flex items-center gap-2 p-1 pr-3 rounded-full border cursor-pointer select-none transition-colors ${
                                                newTaskAssigneeIds.includes(member.id) 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full" />
                                            <span className="text-xs font-medium">{member.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Checklist Creation */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checklist</label>
                                <div className="space-y-2 mb-2">
                                    {newChecklistItems.map(item => (
                                        <div key={item.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckSquare size={16} className="text-slate-400" />
                                            <span className="flex-1">{item.text}</span>
                                            <button onClick={() => triggerChecklistFileUpload(item.id)} className="text-slate-400 hover:text-indigo-500">
                                                <Paperclip size={14} />
                                            </button>
                                            {item.attachments && item.attachments.length > 0 && (
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{item.attachments.length}</span>
                                            )}
                                            <button onClick={() => handleRemoveChecklistItemCreate(item.id)} className="text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItemCreate()}
                                        placeholder="Add checklist item"
                                        className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                    <button 
                                        onClick={handleAddChecklistItemCreate}
                                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attachments</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <input 
                                        type="file" 
                                        multiple 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileChange} 
                                    />
                                    <Paperclip className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload files</p>
                                </div>
                                {newFiles.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {newFiles.map((file, i) => (
                                            <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                <Paperclip size={12} /> {file.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreateTask}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TASK MODAL */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-0 shadow-2xl h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                             <div className="flex-1 pr-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded border uppercase flex items-center gap-1 ${getStatusColor(editingTask.status)}`}>
                                        {editingTask.status}
                                    </span>
                                    {isGlobalView && getTaskProject(editingTask) && (
                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-400 font-medium">
                                            {getTaskProject(editingTask)?.name}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    value={editingTask.title}
                                    onChange={(e) => canEditTask(editingTask) && setEditingTask({...editingTask, title: e.target.value})}
                                    className="text-xl font-bold text-slate-900 dark:text-white w-full bg-transparent outline-none focus:border-b-2 focus:border-indigo-500 border-b-2 border-transparent"
                                    readOnly={!canEditTask(editingTask)}
                                />
                             </div>
                             <div className="flex gap-2">
                                {canDelete && (
                                    <button 
                                        onClick={handleDeleteTaskAction}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete Task"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleSaveEdit()}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea 
                                        value={editingTask.description}
                                        onChange={(e) => canEditTask(editingTask) && setEditingTask({...editingTask, description: e.target.value})}
                                        className="w-full min-h-[100px] border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                        placeholder="Add a more detailed description..."
                                        readOnly={!canEditTask(editingTask)}
                                    />
                                </div>

                                {/* Checklist Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <CheckSquare size={16} /> Checklist
                                        </h3>
                                        {renderProgress(editingTask.checklist)}
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        {editingTask.checklist?.map(item => (
                                            <div key={item.id} className="group bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-start gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={item.isCompleted}
                                                        onChange={() => canEditTask(editingTask) && handleToggleChecklistItem(item.id)}
                                                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        disabled={!canEditTask(editingTask)}
                                                    />
                                                    <div className="flex-1">
                                                        <span className={`text-sm ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {item.text}
                                                        </span>
                                                        
                                                        {item.attachments && item.attachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {item.attachments.map(att => (
                                                                    <a 
                                                                        key={att.id} 
                                                                        href={att.url} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                                                    >
                                                                        <Paperclip size={10} /> {att.name}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {canEditTask(editingTask) && (
                                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => triggerChecklistFileUpload(item.id)}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                                title="Attach file to item"
                                                            >
                                                                <Paperclip size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteChecklistItem(item.id)}
                                                                className="p-1 text-slate-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {canEditTask(editingTask) && (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={editingItemText}
                                                onChange={(e) => setEditingItemText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItemEdit()}
                                                placeholder="Add an item"
                                                className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                            />
                                            <button 
                                                onClick={handleAddChecklistItemEdit}
                                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Attachments Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                        <Paperclip size={16} /> Attachments
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {editingTask.attachments.map(att => (
                                            <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                                        <Paperclip size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{att.name}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{att.size}</span>
                                                    </div>
                                                </div>
                                                {canEditTask(editingTask) && (
                                                    <button 
                                                        onClick={() => handleRemoveAttachment(att.id)}
                                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {canEditTask(editingTask) && (
                                        <button 
                                            onClick={() => editFileInputRef.current?.click()}
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Attachment
                                        </button>
                                    )}
                                    <input 
                                        type="file" 
                                        multiple 
                                        ref={editFileInputRef} 
                                        className="hidden" 
                                        onChange={handleEditFileChange} 
                                    />
                                </div>

                                {/* Comments Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} /> Activity
                                    </h3>
                                    <div className="space-y-4 mb-4 max-h-[200px] overflow-y-auto pr-2">
                                        {editingTask.comments?.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <img src={comment.avatar} alt={comment.senderName} className="w-8 h-8 rounded-full mt-1" />
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg rounded-tl-none border border-slate-100 dark:border-slate-700">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{comment.senderName}</span>
                                                        <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={commentsEndRef} />
                                    </div>
                                    <div className="flex gap-3">
                                        <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                placeholder="Write a comment..."
                                                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Details</label>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Assignees</span>
                                            <div className="flex flex-wrap gap-2">
                                                {editingTask.assignees.map(a => (
                                                    <div key={a.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full pl-1 pr-3 py-1 border border-slate-200 dark:border-slate-600">
                                                        <img src={a.avatar} className="w-5 h-5 rounded-full" alt="" />
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.name}</span>
                                                        {canEditTask(editingTask) && (
                                                            <button 
                                                                onClick={() => toggleEditTaskAssignee(a.id)}
                                                                className="text-slate-400 hover:text-red-500"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {canEditTask(editingTask) && (
                                                    <div className="relative group">
                                                        <button className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-500 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400">
                                                            <Plus size={14} />
                                                        </button>
                                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 hidden group-hover:block z-20 overflow-hidden">
                                                            {/* Show members from task project */}
                                                            {(getTaskProject(editingTask)?.members || project.members).map(m => (
                                                                <button 
                                                                    key={m.id}
                                                                    onClick={() => toggleEditTaskAssignee(m.id)}
                                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                                >
                                                                    <img src={m.avatar} className="w-5 h-5 rounded-full" alt="" />
                                                                    <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                                                                    {editingTask.assignees.some(a => a.id === m.id) && <CheckCircle size={12} className="text-indigo-600 ml-auto" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Status</span>
                                            <select 
                                                value={editingTask.status}
                                                onChange={(e) => canEditTask(editingTask) && setEditingTask({...editingTask, status: e.target.value as TaskStatus})}
                                                disabled={!canEditTask(editingTask)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {Object.values(TaskStatus).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Priority</span>
                                            <select 
                                                value={editingTask.priority}
                                                onChange={(e) => canEditTask(editingTask) && setEditingTask({...editingTask, priority: e.target.value as Priority})}
                                                disabled={!canEditTask(editingTask)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {Object.values(Priority).map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Category</span>
                                            <select 
                                                value={editingTask.category || TaskCategory.OTHER}
                                                onChange={(e) => canEditTask(editingTask) && setEditingTask({...editingTask, category: e.target.value as TaskCategory})}
                                                disabled={!canEditTask(editingTask)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {Object.values(TaskCategory).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button 
                                onClick={() => handleSaveEdit()}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;