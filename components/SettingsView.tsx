import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Bell, Shield, Layers, Save, Check, Globe, Moon, Monitor, Key, LogOut, QrCode, Copy, X, Camera } from 'lucide-react';
import { requestNotificationPermission } from '../services/notificationService';

interface SettingsViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdateUser, theme, onThemeChange, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'notifications' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Settings saved successfully');

  // Local State for Profile
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local State for Preferences (initialized from currentUser)
  const [language, setLanguage] = useState('en');
  const [emailNotifs, setEmailNotifs] = useState(currentUser.preferences?.email ?? true);
  const [desktopNotifs, setDesktopNotifs] = useState(currentUser.preferences?.desktop ?? true);

  // Sync state if currentUser changes
  useEffect(() => {
    setEmailNotifs(currentUser.preferences?.email ?? true);
    setDesktopNotifs(currentUser.preferences?.desktop ?? true);
    setName(currentUser.name);
    setAvatar(currentUser.avatar);
  }, [currentUser]);

  // Local State for Security (2FA)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onUpdateUser({
        ...currentUser,
        name,
        avatar,
        preferences: {
            email: emailNotifs,
            desktop: desktopNotifs
        }
      });
      setIsSaving(false);
      setToastMessage('Settings saved successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File size should be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesktopToggle = async () => {
      const newValue = !desktopNotifs;
      if (newValue) {
          const granted = await requestNotificationPermission();
          if (!granted) {
              setToastMessage('Notification permission denied by browser');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
              return; // Don't toggle if denied
          }
      }
      setDesktopNotifs(newValue);
      // Auto save for better UX or wait for explicit save button? 
      // User expects "Save Changes" button to persist everything in this UI design.
  };

  const handleVerify2FA = () => {
    // Mock verification - accept any 6 digit code
    if (twoFACode.length === 6) {
      setIs2FAEnabled(true);
      setShow2FAModal(false);
      setTwoFACode('');
      setToastMessage('Two-Factor Authentication Enabled');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    setToastMessage('Two-Factor Authentication Disabled');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'workspace', label: 'Workspace', icon: Layers },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto animate-in fade-in duration-500 relative">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        {/* Enforced bg-white and text-slate-900 for Light mode as requested */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto text-slate-900 dark:text-white">
          {activeTab === 'profile' && (
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Public Profile</h2>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="flex flex-col items-center gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-inner overflow-hidden relative group cursor-pointer"
                      >
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={24} className="text-white mb-1" />
                          <span className="text-white text-xs font-medium">Change</span>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                   </div>

                   <div className="flex-1 space-y-6 w-full max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar URL (Optional)</label>
                        <input 
                          type="text" 
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                          placeholder="Or paste an image link here"
                        />
                        <p className="text-xs text-slate-400 mt-1">Upload a photo by clicking the circle on the left, or paste a URL here.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={`${currentUser.name.toLowerCase().replace(' ', '.')}@nexus.co`}
                          disabled
                          className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                   </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="p-8 space-y-8">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Interface Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Theme</label>
                      <div className="grid grid-cols-2 gap-4 max-w-sm">
                         <button 
                           onClick={() => onThemeChange('light')}
                           className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                         >
                            <Monitor size={24} className={theme === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>Light Mode</span>
                         </button>
                         <button 
                           onClick={() => onThemeChange('dark')}
                           className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-slate-800 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                         >
                            <Moon size={24} className={theme === 'dark' ? 'text-white' : 'text-slate-400'} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>Dark Mode</span>
                         </button>
                      </div>
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Language</label>
                       <div className="relative max-w-xs">
                          <Globe className="absolute left-3 top-2.5 text-slate-400" size={18} />
                          <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                             <option value="en">English</option>
                             <option value="id">Bahasa Indonesia</option>
                          </select>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
             <div className="p-8 space-y-8">
                <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Alert Preferences</h2>
                   <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                         <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">Email Notifications</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receive daily digests and major updates via email.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                         <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">Desktop Push Notifications</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get real-time alerts for task assignments and mentions.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={desktopNotifs} 
                                onChange={handleDesktopToggle} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                   </div>
                   
                   <div className="pt-4 flex justify-end">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70"
                    >
                        {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                        <Save size={18} />
                        )}
                        Save Changes
                    </button>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="p-8 space-y-8">
                <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Login & Security</h2>
                   <div className="space-y-6 max-w-2xl">
                      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                         <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Change Password</h3>
                         <div className="space-y-3">
                            <input type="password" placeholder="Current Password" className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                            <input type="password" placeholder="New Password" className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                            <div className="flex justify-end mt-2">
                               <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                                  Update Password
                               </button>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                               <Key size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-slate-200">Two-Factor Authentication</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                            </div>
                         </div>
                         {is2FAEnabled ? (
                           <div className="flex items-center gap-3">
                             <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                               <Check size={14} /> Enabled
                             </span>
                             <button 
                                onClick={handleDisable2FA}
                                className="text-sm text-slate-400 hover:text-red-500 underline"
                             >
                               Disable
                             </button>
                           </div>
                         ) : (
                           <button 
                             onClick={() => setShow2FAModal(true)}
                             className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                           >
                             Enable
                           </button>
                         )}
                      </div>

                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                         <h3 className="font-bold text-red-600 mb-2">Danger Zone</h3>
                         <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl">
                            <div>
                               <p className="font-bold text-slate-800 dark:text-slate-200">Sign out of all devices</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Log out of all active sessions immediately.</p>
                            </div>
                            <button 
                              onClick={onLogout}
                              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                               <LogOut size={16} /> Sign Out
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in z-50">
           <div className="bg-white/20 p-1 rounded-full">
             <Check size={16} />
           </div>
           <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <QrCode size={20} className="text-indigo-600" /> Two-Factor Setup
                </h2>
                <button onClick={() => setShow2FAModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
             </div>

             <div className="space-y-6">
               <div className="text-center">
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                   Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc).
                 </p>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                   {/* Generating a static QR code pointing to a dummy otpauth URL for demo */}
                   <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/NexusManage:${currentUser.name}?secret=JBSWY3DPEHPK3PXP&issuer=NexusManage`} 
                      alt="2FA QR Code" 
                      className="w-40 h-40 mix-blend-multiply"
                   />
                 </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Manual Entry Code</span>
                    <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">JBSW Y3DP EHPK 3PXP</span>
                 </div>
                 <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-2 rounded transition-colors">
                    <Copy size={16} />
                 </button>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Verify Code</label>
                 <input 
                   type="text" 
                   value={twoFACode}
                   onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                   placeholder="Enter 6-digit code"
                   className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-center tracking-widest text-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                 />
               </div>

               <button 
                 onClick={handleVerify2FA}
                 disabled={twoFACode.length !== 6}
                 className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
               >
                 Verify & Activate
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;