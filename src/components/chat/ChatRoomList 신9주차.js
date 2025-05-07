import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, User } from 'lucide-react';

const ChatRoomList = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('jwtToken');
        
        if (!userId || !token) {
          navigate('/signin');
          return;
        }
        
        setLoading(true);
        const response = await fetch(`${SERVER_URL}/api/users/${userId}/chatrooms`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('채팅방 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setChatRooms(data);
      } catch (error) {
        console.error('채팅방 목록 로딩 오류:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatRooms();
  }, [navigate]);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // 오늘 날짜인 경우 시간만 표시
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 일주일 이내인 경우 요일 표시
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString('ko-KR', { weekday: 'short' });
    }
    
    // 그 외의 경우 날짜 표시
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };
  
  // 채팅방 클릭 핸들러
  const handleChatRoomClick = (chatRoomId) => {
    navigate(`/chatroom/${chatRoomId}`);
  };
  
  // 프로필 이미지 URL 생성 함수 - 수정됨
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${SERVER_URL}/images${relativePath}`;
  };

  // 이미지 오류 핸들러 - 수정됨
  const handleImageError = (event) => {
    // 이미 기본 이미지로 설정되어 있다면 추가 변경 방지
    if (event.target.src.includes('default-profile.png')) {
      return;
    }
    event.target.src = '/default-profile.png';
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-4">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">채팅방 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8 p-4">
        <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">채팅</h2>
        <button 
          onClick={() => navigate('/new-chat')}
          className="bg-blue-500 text-white p-2 rounded-full"
        >
          <MessageCircle size={20} />
        </button>
      </div>
      
      {chatRooms.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">진행 중인 채팅이 없습니다.</p>
          <button 
            onClick={() => navigate('/new-chat')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            새 채팅 시작하기
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {chatRooms.map((room) => (
            <li 
              key={room.id} 
              onClick={() => handleChatRoomClick(room.id)}
              className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer border border-gray-100"
            >
              <div className="relative">
                <img 
                  src={getProfileImageUrl(room.otherUserProfileImage)} 
                  alt={room.otherUserNickname || '사용자'} 
                  className="w-12 h-12 rounded-full object-cover mr-3"
                  onError={handleImageError}
                />
                {room.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="font-medium truncate">{room.otherUserNickname || '사용자'}</p>
                  <p className="text-xs text-gray-500">{formatDate(room.lastMessageTime)}</p>
                </div>
                <p className="text-sm text-gray-600 truncate">{room.lastMessage || '새로운 채팅방'}</p>
                {room.postTitle && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {room.postTitle}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatRoomList;