import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Paperclip, Smile, X, Hash, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { User, ChatMessage, Project, Attachment } from '../types';
import { chatWithAI } from '../services/aiService';

interface ChatAreaProps {
  currentUser: User;
  users: User[];
  currentProject: Project;
  messages: ChatMessage[];
  onSendMessage: (text: string, isAi?: boolean, attachments?: Attachment[]) => void;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', 
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', 
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', 
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', 
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', 
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', 
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', 
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '👏', 
  '🙏', '💪', '🧠', '🫀', '👀', '🔥', '✨', '⭐', '🌟', '💥',
  '💯', '💢', '💤', '👋', '🤚', '🖐', '✋', '🖖', '🎉', '🎊'
];

const ChatArea: React.FC<ChatAreaProps> = ({ currentUser, users, currentProject, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // State for image preview modal
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeSelectedFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    const originalInput = input;
    
    // Process files into Attachments
    const attachments: Attachment[] = selectedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + ' KB',
        url: URL.createObjectURL(file)
    }));

    setInput('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);

    // Send user message
    onSendMessage(originalInput, false, attachments);

    // Check if message is for AI
    if (originalInput.toLowerCase().startsWith('@ai') || originalInput.toLowerCase().includes('nexus')) {
      setIsTyping(true);
      
      // Prepare history for context based on current project messages
      const history = messages.slice(-5).map(m => ({
        role: m.senderId === currentUser.id ? 'user' : 'model',
        content: m.text
      }));

      // Add context about the project
      const contextMessage = `Context: We are discussing the project "${currentProject.name}". Description: ${currentProject.description}. User asks: ${originalInput}`;

      const responseText = await chatWithAI(history, contextMessage);
      
      // Send AI response
      onSendMessage(responseText || "I'm thinking...", true);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const getSender = (id: string) => {
    if (id === 'ai') return { name: 'Nexus AI', avatar: '', role: 'Bot' };
    if (id === 'system') return { name: 'System', avatar: '', role: 'Admin' };
    if (id === currentUser.id) return currentUser;
    return users.find(u => u.id === id) || { name: 'Unknown', avatar: '', role: 'Guest' };
  };

  // Generate a channel name based on project name
  const channelName = currentProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelect} 
      />

      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
        <div>
           <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Hash size={18} className="text-slate-400" />
             {channelName}
             <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-normal">
               {currentProject.id === 'all-tasks' ? 'General' : 'Project Chat'}
             </span>
           </h2>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-md">
             {currentProject.description || 'Project discussion channel'}
           </p>
        </div>
        <div className="flex -space-x-2">
            {currentProject.members.slice(0, 5).map(u => (
                <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800" title={u.name} alt={u.name} />
            ))}
            {currentProject.members.length > 5 && (
               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs text-slate-500">
                 +{currentProject.members.length - 5}
               </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                 <Hash size={32} className="opacity-50" />
              </div>
              <p className="text-sm">Welcome to the start of <span className="font-semibold text-slate-600 dark:text-slate-300">#{channelName}</span>!</p>
              <p className="text-xs mt-1">This is the dedicated space for {currentProject.name}.</p>
           </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const sender = getSender(msg.senderId);
            const isAi = msg.senderId === 'ai';

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  isAi ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0">
                      <Bot size={16} />
                    </div>
                  ) : (
                    <img src={sender.avatar || `https://ui-avatars.com/api/?name=${sender.name}`} className="w-8 h-8 rounded-full shrink-0" alt="avatar" />
                  )
                )}
                
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sender.name}</span>
                      <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : isAi 
                          ? 'bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900 text-slate-800 dark:text-white rounded-tl-none shadow-violet-100 dark:shadow-none' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-tl-none'
                  }`}>
                    {/* Render Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`grid gap-2 mb-2 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {msg.attachments.map(att => (
                                <div key={att.id} className="overflow-hidden rounded-lg border border-white/20">
                                    {att.type.startsWith('image/') ? (
                                        <div 
                                            onClick={() => setPreviewImage(att.url)}
                                            className="cursor-pointer relative group"
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10" />
                                            <img src={att.url} alt={att.name} className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                    ) : (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 ${isMe ? 'bg-indigo-700 text-white hover:bg-indigo-800' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>
                                            <FileText size={16} />
                                            <span className="truncate text-xs flex-1">{att.name}</span>
                                            <Download size={14} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0">
               <Bot size={16} />
             </div>
             <div className="bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
               <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 w-72 h-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
           <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Emojis</span>
              <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 grid grid-cols-6 gap-1 custom-scrollbar">
              {EMOJI_LIST.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleAddEmoji(emoji)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
           </div>
        </div>
      )}
      
      {/* Backdrop for closing picker */}
      {showEmojiPicker && (
         <div className="absolute inset-0 z-40 bg-transparent" onClick={() => setShowEmojiPicker(false)}></div>
      )}

      {/* File Selection Preview */}
      {selectedFiles.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex gap-2 overflow-x-auto">
              {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 min-w-[120px] max-w-[150px] flex items-center gap-2">
                      <button 
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <X size={12} />
                      </button>
                      {file.type.startsWith('image/') ? (
                          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <FileText size={24} className="text-indigo-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 z-50 relative">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:border-indigo-300 dark:focus-within:border-indigo-700 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
          />
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Smile size={18} />
          </button>
          <button 
            onClick={handleSend}
            disabled={!input.trim() && selectedFiles.length === 0}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewImage(null)}
        >
            <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-white/20 rounded-full p-2 transition-all"
            >
                <X size={32} />
            </button>
            <div className="p-4 w-full h-full flex items-center justify-center">
                <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-lg"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;