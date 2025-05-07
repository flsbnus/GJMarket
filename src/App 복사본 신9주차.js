import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import WishlistManagement from './components/WishlistManagement';
import RatingManagement from './components/RatingManagement';
import TransactionManagement from './components/TransactionManagement';
import PostsList from './components/post/PostList';  // 게시물 목록 컴포넌트 추가
import PostForm from './components/post/PostForm';    // 게시물 작성 컴포넌트 추가
import { User, Heart, Star, History, Menu, X, LogIn, LogOut, MessageSquare, MessageCircle } from 'lucide-react';
import './index.css';

import PostDetail from './components/post/PostDetail';
import PostEdit from './components/post/PostEdit';
import ChatRoomList from './components/chat/ChatRoomList';
import ChatRoom from './components/chat/ChatRoom';
import CreateChatRoom from './components/chat/CreateChatRoom';

// 로그인 상태를 앱 전체에서 공유하기 위한 컨텍스트
export const AuthContext = React.createContext();

// WebSocket 컨텍스트 생성
export const WebSocketContext = createContext(null);

// WebSocket 컨텍스트 프로바이더 컴포넌트
export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const webSocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [messageListeners, setMessageListeners] = useState([]);

  // 웹소켓 연결 설정
  const setupWebSocket = (chatRoomId) => {
    const token = localStorage.getItem('jwtToken');
    if (!token || !chatRoomId) return null;

    try {
      // 기존 웹소켓 연결 종료
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.close();
      }

      // 웹소켓 URL 설정
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.REACT_APP_SERVER_URL || window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost.replace(/^https?:\/\//, '')}/ws/chat/${chatRoomId}`;
      
      console.log('Connecting to WebSocket URL:', wsUrl);

      // 웹소켓 객체 생성
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket 연결 성공');
        setConnected(true);
        
        // Authorization 헤더를 직접 설정할 수 없으므로, 
        // 웹소켓 핸들러에서 처리할 수 있는 방식으로 토큰 정보 포함
        // 첫 메시지로 인증 정보 전송
        ws.send(JSON.stringify({
          type: 'AUTHENTICATION',
          token: token
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket 메시지 수신:', data);
          
          // 등록된 모든 리스너에게 메시지 전달
          messageListeners.forEach(listener => {
            try {
              listener(data);
            } catch (listenerError) {
              console.error('메시지 리스너 오류:', listenerError);
            }
          });
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket 연결 종료');
        setConnected(false);
        
        // 자동 재연결 시도
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          setupWebSocket(chatRoomId);
        }, 3000); // 3초 후 재연결 시도
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
      };

      webSocketRef.current = ws;
      return ws;
    } catch (error) {
      console.error('WebSocket 설정 오류:', error);
      return null;
    }
  };

  // 메시지 전송 함수
  const sendMessage = (content) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(content);
      return true;
    }
    return false;
  };

  // 메시지 리스너 등록 함수
  const addMessageListener = (listener) => {
    setMessageListeners(prev => [...prev, listener]);
    return () => {
      setMessageListeners(prev => prev.filter(l => l !== listener));
    };
  };

  // 컴포넌트 언마운트 시 웹소켓 연결 종료
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        setupWebSocket,
        sendMessage,
        addMessageListener,
        webSocket: webSocketRef.current
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// 네비게이션 링크 컴포넌트
const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
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
  
  // 프로필 이미지 상태 추가
  const [profileImage, setProfileImage] = React.useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);

  // 환경에 따른 서버 URL 설정
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';
  
  // 기본 프로필 이미지 설정
  const defaultProfileImage = '/default-profile.png';

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
          <div className="mr-2">
            <img
              src={getProfileImageUrl(profileImage)}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
              onError={handleImageError}
            />
          </div>
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
          <NavLink to="/posts" icon={MessageSquare}>
            게시판
          </NavLink>
          <NavLink to="/chats" icon={MessageCircle}>
            채팅
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
      <div className="hidden lg:flex justify-between items-center bg-white shadow-sm py-2 px-4 pr-8">
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
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthContext.Provider>
    </Router>
  );
};

export default App;