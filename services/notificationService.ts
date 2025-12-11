
import { Task, User } from '../types';

// Request permission for Desktop Notifications
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Simulate sending an email (since we don't have a backend SMTP server)
const sendEmail = (toUser: User, subject: string, body: string) => {
  console.log(`%c[EMAIL SIMULATION] To: ${toUser.name} | Subject: ${subject}`, 'color: #4f46e5; font-weight: bold;');
  console.log(`Body: ${body}`);
  // In a real app, this would call an API endpoint
};

// Send Desktop Notification
const sendDesktop = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/vite.svg', // Assuming vite default or any public asset
    });
  }
};

export const notifyUser = (user: User, title: string, body: string) => {
  const prefs = user.preferences || { email: true, desktop: true };

  if (prefs.desktop) {
    sendDesktop(title, body);
  }

  if (prefs.email) {
    sendEmail(user, title, body);
  }
};

export const notifyTaskAssignment = (task: Task, assignee: User, assignedBy: User) => {
  // Don't notify if assigning to self (optional, but usually preferred)
  // For demo purposes, we allow it so you can see the effect immediately
  
  const title = `New Task Assigned: ${task.title}`;
  const body = `${assignedBy.name} assigned you to a task in workspace. Due: ${task.dueDate}`;
  
  notifyUser(assignee, title, body);
};

export const checkDeadlines = (tasks: Task[], currentUser: User) => {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  tasks.forEach(task => {
    // Only check tasks assigned to current user
    if (!task.assignees.some(u => u.id === currentUser.id)) return;
    if (task.status === 'Done') return;

    const dueDate = new Date(task.dueDate);
    
    // Check if due date is close (e.g., tomorrow or today)
    // Normalize dates to ignore time
    const cleanToday = new Date(today.toDateString());
    const cleanDueDate = new Date(dueDate.toDateString());
    
    const diffTime = cleanDueDate.getTime() - cleanToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 0) {
      // Due Today
      // Use sessionStorage to prevent spamming notification on every render/reload within same session
      const key = `notified_due_today_${task.id}`;
      if (!sessionStorage.getItem(key)) {
        notifyUser(currentUser, 'Task Due Today!', `Task "${task.title}" is due today. Please complete it.`);
        sessionStorage.setItem(key, 'true');
      }
    } else if (diffDays === 1) {
      // Due Tomorrow
      const key = `notified_due_soon_${task.id}`;
      if (!sessionStorage.getItem(key)) {
        notifyUser(currentUser, 'Task Due Tomorrow', `Task "${task.title}" is due tomorrow.`);
        sessionStorage.setItem(key, 'true');
      }
    } else if (diffDays < 0) {
       // Overdue
       const key = `notified_overdue_${task.id}`;
       if (!sessionStorage.getItem(key)) {
         notifyUser(currentUser, 'Task Overdue', `Task "${task.title}" was due on ${task.dueDate}.`);
         sessionStorage.setItem(key, 'true');
       }
    }
  });
};
