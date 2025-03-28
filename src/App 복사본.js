import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import WishlistManagement from './components/WishlistManagement';
import RatingManagement from './components/RatingManagement';
import TransactionManagement from './components/TransactionManagement';
import { User, Heart, Star, History, Menu, X } from 'lucide-react';
import './index.css';

import PostDetail from './components/post/PostDetail';
import PostEdit from './components/post/PostEdit';

// 네비게이션 링크 컴포넌트
const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
};

// 사이드바 컴포넌트
const Sidebar = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white w-64 shadow-lg transform transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 z-30`}
    >
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">당근마켓 클론</h1>
        <nav className="space-y-2">
          <NavLink to="/user" icon={User}>
            회원정보관리
          </NavLink>
          <NavLink to="/wishlist" icon={Heart}>
            찜상품관리
          </NavLink>
          <NavLink to="/rating" icon={Star}>
            별점관리
          </NavLink>
          <NavLink to="/transactions" icon={History}>
            거래내역관리
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

// 메인 앱 컴포넌트
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 모바일 헤더 */}
        <div className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-lg font-bold">당근마켓 클론</h1>
            <div className="w-8" /> {/* 균형을 위한 더미 div */}
          </div>
        </div>

        {/* 사이드바 오버레이 */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 사이드바 */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* 메인 컨텐츠 */}
        <div className="lg:pl-64 pt-16 lg:pt-0">
          <main className="p-4">
            <Routes>
              <Route path="/" element={<UserManagement />} />
              <Route path="/user" element={<UserManagement />} />
              <Route path="/wishlist" element={<WishlistManagement />} />
              <Route path="/rating" element={<RatingManagement />} />
              <Route path="/transactions" element={<TransactionManagement />} />
              <Route path="/signin" element={<UserManagement />} />
              <Route path="/signup" element={<UserManagement />} />
              <Route path="/update" element={<UserManagement />} />
              <Route path="/delete" element={<UserManagement />} />
              
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
