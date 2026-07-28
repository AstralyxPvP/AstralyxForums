import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import CategoriesPage from './pages/CategoriesPage';
import SubcategoryPage from './pages/SubcategoryPage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AuthModal from './components/modals/AuthModal';
import ProfileModal from './components/modals/ProfileModal';
import StaffModal from './components/modals/StaffModal';
import ReportModal from './components/modals/ReportModal';
import EditPostModal from './components/modals/EditPostModal';
import { CreateCategoryModal, CreateSubcategoryModal, CreateThreadModal } from './components/modals/CreateModals';
import './App.css';

function MainLayout() {
  const { currentUser, logout, isStaff } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'auth', 'profile', 'staff', 'report', 'edit', 'category', 'subcategory', 'thread'
  const [modalData, setModalData] = useState({});

  if (currentUser && !currentUser.emailVerified) {
    return <VerifyEmailPage />;
  }

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <header className="navbar">
        <Link to="/" className="brand">
          <i className="fa-solid fa-planet"></i> <span>ASTRAL</span>FORUM
        </Link>
        <div className="nav-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {isStaff() && (
                <button className="btn btn-warning btn-sm" onClick={() => setActiveModal('staff')}>
                  <i className="fa-solid fa-user-shield"></i> Staff Panel
                </button>
              )}
              <img
                className="avatar"
                style={{ width: '38px', height: '38px', cursor: 'pointer' }}
                src={currentUser.avatarUrl || 'https://via.placeholder.com/38'}
                onClick={() => setActiveModal('profile')}
                alt="avatar"
              />
              <div style={{ cursor: 'pointer' }} onClick={() => setActiveModal('profile')}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentUser.displayName}</div>
                <span className={`role-badge role-${currentUser.role}`}>{currentUser.roleTag || currentUser.role}</span>
              </div>
              <button className="btn btn-sm" onClick={() => setActiveModal('profile')}>
                <i className="fa-solid fa-gear"></i>
              </button>
              <button className="btn btn-sm btn-danger" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <>
              <button className="btn" onClick={() => { setModalData({ tab: 'login' }); setActiveModal('auth'); }}>
                <i className="fa-solid fa-right-to-bracket"></i> Log In
              </button>
              <button className="btn btn-primary" onClick={() => { setModalData({ tab: 'register' }); setActiveModal('auth'); }}>
                <i className="fa-solid fa-user-plus"></i> Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="hero">
        <h1><i className="fa-solid fa-comments"></i> Welcome to AstralForum</h1>
        <p>Join community discussions, check updates, and connect with players.</p>
      </div>

      {/* ROUTED CONTENT */}
      <div className="container">
        <Routes>
          <Route path="/" element={
            <CategoriesPage
              onOpenCategoryModal={() => setActiveModal('category')}
              onOpenSubcategoryModal={(catId) => { setModalData({ parentCatId: catId }); setActiveModal('subcategory'); }}
            />
          } />
          <Route path="/forum/:subcategoryId" element={
            <SubcategoryPage
              onOpenThreadModal={(subId) => { setModalData({ subcategoryId: subId }); setActiveModal('thread'); }}
            />
          } />
          <Route path="/thread/:threadId" element={
            <ThreadDetailPage
              onOpenEditModal={(threadId, postId, content) => { setModalData({ threadId, postId, content }); setActiveModal('edit'); }}
              onOpenReportModal={(threadId, postId) => { setModalData({ threadId, postId }); setActiveModal('report'); }}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* MODALS */}
      {activeModal === 'auth' && <AuthModal initialTab={modalData.tab} onClose={() => setActiveModal(null)} />}
      {activeModal === 'profile' && <ProfileModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'staff' && <StaffModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'report' && <ReportModal data={modalData} onClose={() => setActiveModal(null)} />}
      {activeModal === 'edit' && <EditPostModal data={modalData} onClose={() => setActiveModal(null)} />}
      {activeModal === 'category' && <CreateCategoryModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'subcategory' && <CreateSubcategoryModal parentCategoryId={modalData.parentCatId} onClose={() => setActiveModal(null)} />}
      {activeModal === 'thread' && <CreateThreadModal subcategoryId={modalData.subcategoryId} onClose={() => setActiveModal(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
