import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import WishlistManagement from './components/WishlistManagement';
import RatingManagement from './components/rating/RatingManagement';
import TransactionManagement from './components/TransactionManagement';
import PostsList from './components/post/PostList';
import PostForm from './components/post/PostForm';
import { User, Heart, Star, History, Menu, X, LogIn, LogOut, MessageSquare, MessageCircle } from 'lucide-react';
import './index.css';

import PostDetail from './components/post/PostDetail';
import PostEdit from './components/post/PostEdit';
import ChatRoomList from './components/chat/ChatRoomList';
import ChatRoom from './components/chat/ChatRoom';
import CreateChatRoom from './components/chat/CreateChatRoom';

// 로그인 상태를 앱 전체에서 공유하기 위한 컨텍스트
export const AuthContext = React.createContext();

// 네비게이션 링크 컴포넌트
const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-indigo-50 text-indigo-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'
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
  
  // 프로필 이미지 상태 추가
  const [profileImage, setProfileImage] = React.useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);

  // 환경에 따른 서버 URL 설정
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';
  
  // 기본 프로필 이미지 설정
  const defaultProfileImage = `${SERVER_URL}/images/profile/default-profile.png`;

  // 사용자 프로필 정보 가져오기
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn) return;

      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('jwtToken');

      if (!userId || !token) {
        console.warn('사용자 ID 또는 토큰이 없습니다.');
        return;
      }

      setIsLoadingProfile(true);
      try {
        // 기존 로그인 로직과 일치하는 API 엔드포인트 사용
        const response = await fetch(`/api/user?userid=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('사용자 프로필 정보:', userData);
          
          // 프로필 이미지 URL이 있으면 설정
          if (userData.profileImageUrl) {
            setProfileImage(userData.profileImageUrl);
          }
        } else {
          console.error('프로필 정보를 가져오는데 실패했습니다:', response.statusText);
        }
      } catch (error) {
        console.error('프로필 정보 로딩 오류:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [isLoggedIn]);

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
    
    // 상태 초기화
    setProfileImage(null);
    
    triggerAuthChange(); // 인증 상태 변경 알림
    navigate('/signin');
  };

  const handleLogin = () => {
    navigate('/signin');
  };
  
  // 프로필 이미지 전체 URL 생성 함수
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) {
      return defaultProfileImage;
    }
    
    // 이미 전체 URL인 경우 그대로 반환
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // 확인된 정확한 URL 패턴 사용
    return `${SERVER_URL}/images/profile/${relativePath}`;
  };

  // 이미지 로드 에러 처리 - 단순화
  const handleImageError = (e) => {
    console.warn('이미지 로드 오류, 기본 이미지로 대체합니다.');
    e.target.src = defaultProfileImage;
  };

  return (
    <div className="flex items-center">
      {isLoggedIn ? (
        <>
          {/* 프로필 이미지 */}
          <div className="mr-3">
            <img
              src={getProfileImageUrl(profileImage)}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
              onError={handleImageError}
            />
          </div>
          <span className="text-sm mr-3 hidden md:inline text-gray-600">{username}님</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
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
      className={`fixed top-0 left-0 h-full bg-white w-72 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 z-30`}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-10 text-indigo-600">한루미</h1>
        <nav className="space-y-2">
          <NavLink to="/user" icon={User}>
            회원정보관리
          </NavLink>
          <NavLink to="/wishlist" icon={Heart}>
            찜상품관리
          </NavLink>
          <NavLink to="/posts" icon={MessageSquare}>
            게시판
          </NavLink>
          <NavLink to="/chats" icon={MessageCircle}>
            채팅
          </NavLink>
          <NavLink to="/ratings" icon={Star}>
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
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
          <h1 className="text-xl font-bold text-indigo-600">한루미</h1>
          <AuthButton />
        </div>
      </div>
      
      {/* 데스크톱 헤더 */}
      <div className="hidden lg:flex justify-between items-center bg-white shadow-sm py-4 px-6 pr-8">
        <h1 className="text-2xl font-bold ml-72 text-indigo-600">한루미</h1>
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
      <div className="lg:pl-72 pt-14 lg:pt-4">
        <main className="p-4">
          <Routes>
            <Route path="/" element={<WishlistManagement />} />
            <Route path="/user" element={<UserManagement />} />
            <Route path="/wishlist" element={<WishlistManagement />} />
            <Route path="/ratings" element={<RatingManagement />} />
            <Route path="/transactions" element={<TransactionManagement />} />
            <Route path="/signin" element={<UserManagement />} />
            <Route path="/signup" element={<UserManagement />} />
            <Route path="/update" element={<UserManagement />} />
            <Route path="/delete" element={<UserManagement />} />
            
            {/* 게시판 관련 라우트 추가 */}
            <Route path="/posts" element={<PostsList />} />
            <Route path="/posts/create" element={<PostForm />} />
            <Route path="/posts/:postId" element={<PostDetail />} /> {/* 상세 페이지 */}
            <Route path="/posts/edit/:postId" element={<PostEdit />} /> {/* 수정 페이지 */}
            
            {/* 채팅 관련 라우트 추가 */}
            <Route path="/chats" element={<ChatRoomList />} />
            <Route path="/chatroom/:roomId" element={<ChatRoom />} />
            <Route path="/post/:postId/chat" element={<CreateChatRoom />} />
            <Route path="/new-chat" element={<CreateChatRoom />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

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