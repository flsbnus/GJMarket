import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import WishlistManagement from './components/WishlistManagement';
import RatingManagement from './components/RatingManagement';
import TransactionManagement from './components/TransactionManagement';
import { User, Heart, Star, History, Menu, X, LogIn, LogOut } from 'lucide-react';
import './index.css';

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

// 로그인/로그아웃 버튼 컴포넌트
const AuthButton = () => {
  const navigate = useNavigate();
  const { isLoggedIn, username, checkAuth } = React.useContext(AuthContext);

  // 커스텀 이벤트를 발생시키는 함수
  const triggerAuthChange = () => {
    const event = new Event('authChange');
    window.dispatchEvent(event);
    checkAuth(); // 컨텍스트의 상태 업데이트
  };

  const handleLogout = () => {
    // 로컬 스토리지에서 인증 정보 삭제
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userId');
    triggerAuthChange(); // 인증 상태 변경 알림
    navigate('/signin');
  };

  const handleLogin = () => {
    navigate('/signin');
  };

  return (
    <div className="flex items-center">
      {isLoggedIn ? (
        <>
          <span className="text-sm mr-2 hidden md:inline">{username}님</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-red-500 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
        >
          <LogIn className="w-5 h-5" />
          <span className="hidden md:inline">로그인</span>
        </button>
      )}
    </div>
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

// 라우터와 함께 사용하기 위한 메인 앱 컴포넌트
const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { checkAuth } = React.useContext(AuthContext);
  const location = useLocation();
  
  // 페이지 로드마다 인증 상태 확인
  useEffect(() => {
    checkAuth();
    
    // 인증 변경 이벤트 리스너
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [location.pathname, checkAuth]);
  return (
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
          <AuthButton />
        </div>
      </div>
      
      {/* 데스크톱 헤더 */}
      <div className="hidden lg:flex justify-between items-center bg-white shadow-sm py-2 p-4 pr-8">
        <h1 className="text-xl font-bold ml-64">당근마켓 클론</h1>
        <AuthButton />
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
      <div className="lg:pl-64 pt-14 lg:pt-4">
        <main className="p-4">
          <Routes>
            <Route path="/" element={<WishlistManagement />} />
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
  );
};

// 로그인 상태를 앱 전체에서 공유하기 위한 컨텍스트
export const AuthContext = React.createContext();

// 메인 앱 컴포넌트
const App = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    username: '',
    checkAuth: () => {
      const token = localStorage.getItem('jwtToken');
      const userNickname = localStorage.getItem('userNickname');
      
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: !!token,
        username: userNickname || ''
      }));
    }
  });
  
  useEffect(() => {
    // 초기 로그인 상태 확인
    authState.checkAuth();
    
    // 로컬 스토리지 변경 이벤트 리스너
    const handleStorageChange = (e) => {
      if (e.key === 'jwtToken' || e.key === 'userNickname') {
        authState.checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return (
    <Router>
      <AuthContext.Provider value={authState}>
        <AppContent />
      </AuthContext.Provider>
    </Router>
  );
};

export default App;