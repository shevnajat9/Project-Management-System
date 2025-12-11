import React, { useState } from 'react';
import { Command, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, name?: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Simple validation logic for demo
      if (isLogin) {
        if (email === 'admin@nexus.co' && password === 'admin123') {
           onLogin(email);
        } else if (email && password) {
           // Allow other logins for demo purposes, but warn if specific mock users aren't matched in App.tsx
           onLogin(email);
        } else {
           setError('Invalid credentials');
           setIsLoading(false);
           return;
        }
      } else {
        if (email && password && name) {
           onLogin(email, name);
        } else {
           setError('Please fill in all fields');
           setIsLoading(false);
           return;
        }
      }
      // Note: loading state doesn't need to be set to false here as the parent will unmount this component
    }, 800);
  };

  const handleGoogleLogin = () => {
    setError('');
    setIsGoogleLoading(true);

    // Simulate Google Pop-up and Auth flow
    setTimeout(() => {
        // Mock success response
        onLogin('user@gmail.com', 'Google User');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-700">
        
        {/* Left Side - Brand & Info */}
        <div className="md:w-1/2 bg-indigo-600 p-8 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Command className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Nexus Manage</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              {isLogin ? 'Welcome Back!' : 'Join the Team'}
            </h2>
            <p className="text-indigo-100 leading-relaxed">
              Streamline your workflow, collaborate with your team, and achieve your project goals with AI-powered assistance.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3">
             <div className="flex items-center gap-3 text-indigo-100 text-sm">
               <CheckCircle size={16} /> <span>AI Task Generation</span>
             </div>
             <div className="flex items-center gap-3 text-indigo-100 text-sm">
               <CheckCircle size={16} /> <span>Real-time Collaboration</span>
             </div>
             <div className="flex items-center gap-3 text-indigo-100 text-sm">
               <CheckCircle size={16} /> <span>Advanced Analytics</span>
             </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isLogin ? 'Sign In to Account' : 'Create Account'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isLogin ? 'Enter your details below to continue' : 'Get started with Nexus in seconds'}
            </p>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 font-medium py-2.5 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
               <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
                </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-400">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;