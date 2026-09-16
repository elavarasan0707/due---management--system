import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, Building2, UserCheck, LogOut, RefreshCw, KeyRound } from 'lucide-react';
import { UserRole } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onOpenResetModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenResetModal }) => {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Chief Administrator',
          classes: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: Shield,
        };
      case 'HOD':
        return {
          label: 'Head of Department',
          classes: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Building2,
        };
      case 'STAFF':
        return {
          label: 'Department Staff / In-Charge',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: UserCheck,
        };
      case 'STUDENT':
        return {
          label: 'Enrolled Student',
          classes: 'bg-amber-100 text-amber-900 border-amber-200',
          icon: GraduationCap,
        };
      default:
        return {
          label: role,
          classes: 'bg-stone-100 text-stone-800 border-stone-200',
          icon: UserCheck,
        };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;
  const RoleIcon = roleInfo ? roleInfo.icon : Shield;

  return (
    <>
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand / Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                ND
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-stone-900 text-base tracking-tight sm:text-lg">
                    College No Due Clearance Portal
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300">
                    Production
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  Role-Based Authority &amp; Digital Clearance Certificate System
                </p>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user && (
                <>
                  {/* Change Password */}
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition"
                    title="Change Account Password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                    <span className="hidden md:inline">Password</span>
                  </button>

                  {/* Reset System shortcut (For Admin) */}
                  {user.role === 'ADMIN' && onOpenResetModal && (
                    <button
                      id="admin-reset-system-nav-btn"
                      type="button"
                      onClick={onOpenResetModal}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                      title="System Maintenance & Initialization"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">System Reset</span>
                    </button>
                  )}

                  {/* User Role & Name */}
                  <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-stone-200 text-right">
                    <div>
                      <div className="text-xs font-bold text-stone-900 leading-tight">
                        {user.name}
                      </div>
                      <div className="flex items-center justify-end space-x-1 mt-0.5">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleInfo?.classes}`}>
                          <RoleIcon className="w-2.5 h-2.5 mr-1" />
                          {roleInfo?.label}
                        </span>
                        {user.departmentName && (
                          <span className="text-[10px] text-stone-500 truncate max-w-[120px]" title={user.departmentName}>
                            ({user.departmentName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    id="user-logout-btn"
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 transition shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
