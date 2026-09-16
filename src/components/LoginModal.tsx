import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Users,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface LoginModalProps {
  initialUsername?: string;
  initialPassword?: string;
}

type UserRoleTab = 'STUDENT' | 'STAFF' | 'HOD' | 'ADMIN';

export const LoginModal: React.FC<LoginModalProps> = ({
  initialUsername = '',
  initialPassword = ''
}) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRoleTab>('STUDENT');
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleConfigs = {
    STUDENT: {
      label: 'Student Register No / Roll No',
      placeholder: 'Enter Register Number / Roll No',
      icon: GraduationCap,
      description: 'Sign in to monitor clearance milestones, settle dues, and print verified certificate.',
      iconColor: 'text-amber-500',
      activeBorder: 'border-amber-500 text-stone-900 bg-amber-50/60',
    },
    STAFF: {
      label: 'Faculty ID / Staff Username',
      placeholder: 'Enter Faculty ID / Staff Username',
      icon: Users,
      description: 'Sign in to review course subject rosters, approve students, or raise lab/library dues.',
      iconColor: 'text-emerald-600',
      activeBorder: 'border-emerald-600 text-stone-900 bg-emerald-50/60',
    },
    HOD: {
      label: 'HOD Identifier / Department Account',
      placeholder: 'Enter Department HOD Username',
      icon: Building,
      description: 'Sign in to allocate department faculty, verify staff clearances, and grant HOD sign-off.',
      iconColor: 'text-indigo-600',
      activeBorder: 'border-indigo-600 text-stone-900 bg-indigo-50/60',
    },
    ADMIN: {
      label: 'Administrator Username',
      placeholder: 'Enter Administrator Username',
      icon: Shield,
      description: 'Sign in to manage academic departments, configure master checkpoints, and issue certificates.',
      iconColor: 'text-stone-900',
      activeBorder: 'border-stone-900 text-stone-900 bg-stone-100',
    },
  };

  const currentRole = roleConfigs[activeTab];
  const CurrentIcon = currentRole.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your institutional identifier and password');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify your credentials or contact the college office.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-stone-100/70">
      {/* Subtle Background Geometric Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Institutional Branding Crest */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-stone-900 text-amber-400 shadow-xl border border-stone-800 mb-3.5 ring-4 ring-amber-400/10">
            <div className="relative">
              <Shield className="w-8 h-8 text-amber-400" />
              <Sparkles className="w-3.5 h-3.5 text-white absolute -top-1 -right-1" />
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-900/5 border border-stone-300 text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
            <span>Autonomous Institution • NAAC &lsquo;A+&rsquo; Accredited</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-900">
            Sri Venkateswara College
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
            Centralized No-Due Verification &amp; Clearance Portal
          </p>
        </div>

        {/* Main Unique Login Container */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden transition-all duration-200">
          {/* Interactive Role Tabs */}
          <div className="bg-stone-50/90 border-b border-stone-200 p-2 sm:p-2.5">
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-center">
              {(Object.keys(roleConfigs) as UserRoleTab[]).map((roleKey) => {
                const config = roleConfigs[roleKey];
                const TabIcon = config.icon;
                const isSelected = activeTab === roleKey;
                return (
                  <button
                    key={roleKey}
                    id={`login-tab-${roleKey.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      setActiveTab(roleKey);
                      setError(null);
                    }}
                    className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? `${config.activeBorder} shadow-xs border`
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/70 border border-transparent'
                    }`}
                  >
                    <TabIcon className={`w-4 h-4 mb-1 ${isSelected ? config.iconColor : 'text-stone-400'}`} />
                    <span className="truncate w-full text-center">
                      {roleKey === 'STUDENT'
                        ? 'Student'
                        : roleKey === 'STAFF'
                        ? 'Faculty'
                        : roleKey === 'HOD'
                        ? 'HOD'
                        : 'Admin'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            {/* Role Context Helper Banner */}
            <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start space-x-3">
              <div className={`p-2 rounded-lg bg-white border border-stone-200 shadow-2xs ${currentRole.iconColor} shrink-0 mt-0.5`}>
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  {activeTab === 'STUDENT'
                    ? 'Student Clearance Access'
                    : activeTab === 'STAFF'
                    ? 'Faculty & Staff Review Desk'
                    : activeTab === 'HOD'
                    ? 'Department HOD Office'
                    : 'Master Administrative Control'}
                </span>
                <span className="text-[11px] text-stone-600 leading-relaxed block mt-0.5">
                  {currentRole.description}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-800 font-medium animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username / Roll No Input */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  {currentRole.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={currentRole.placeholder}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/80 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50/80 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-3 inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 transition shadow-sm cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying Credentials...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <span>Sign In to Clearance Portal</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Subtle Security Footnote */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL Secured Institutional Portal</span>
              </span>
              <span className="font-mono text-[10px] text-stone-400">
                v2.4 Autonomous
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
