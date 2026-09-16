import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AdminPortal } from './components/AdminPortal';
import { HodPortal } from './components/HodPortal';
import { StaffPortal } from './components/StaffPortal';
import { StudentPortal } from './components/StudentPortal';
import { ResetModal } from './components/ResetModal';

function MainApp() {
  const { user, loading } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-stone-600">Verifying secure credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 flex flex-col">
      <Navbar onOpenResetModal={() => setShowResetModal(true)} />

      <main className="flex-1">
        {!user ? (
          <LoginModal />
        ) : (
          <>
            {user.role === 'ADMIN' && (
              <AdminPortal onOpenResetModal={() => setShowResetModal(true)} />
            )}
            {user.role === 'HOD' && <HodPortal />}
            {user.role === 'STAFF' && <StaffPortal />}
            {user.role === 'STUDENT' && <StudentPortal />}
          </>
        )}
      </main>

      {/* Admin Reset Modal */}
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetComplete={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
