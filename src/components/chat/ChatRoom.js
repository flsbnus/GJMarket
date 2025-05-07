import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Image, ChevronUp } from 'lucide-react';
import { connectWebSocket, sendMessage, addMessageListener, disconnectWebSocket } from '../../utils/websoket-hendler';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';

  // 웹소켓 연결 설정
  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    // 웹소켓 연결
    const connect = () => {
      console.log('채팅방 연결 시도:', roomId);
      connectWebSocket(roomId, token);
    };

    // 메시지 리스너 설정
    const handleMessage = (data) => {
      console.log('메시지 수신:', data);
      setMessages(prev => {
        // 이미 같은 ID의 메시지가 있는지 확인
        if (data.id && prev.some(msg => msg.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
      scrollToBottom();
    };

    // 연결 상태 변경 리스너
    const handleConnectionChange = (event) => {
      setConnected(event.detail.connected);
      if (!event.detail.connected) {
        setError('연결이 끊어졌습니다. 재연결을 시도합니다...');
      } else {
        setError(null);
      }
    };

    // 이벤트 리스너 등록
    const removeMessageListener = addMessageListener(handleMessage);
    window.addEventListener('websocketStatusChange', handleConnectionChange);

    // 초기 연결
    connect();

    // 컴포넌트 언마운트 시 정리
    return () => {
      removeMessageListener();
      window.removeEventListener('websocketStatusChange', handleConnectionChange);
      disconnectWebSocket();
    };
  }, [roomId, navigate]);

  // 최근 메시지 로드
  useEffect(() => {
    const fetchRecentMessages = async () => {
      if (!roomId) return;

      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          navigate('/signin');
          return;
        }

        setLoading(true);
        const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/recent?size=20`, {
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('채팅 메시지를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        // 메시지를 날짜 최신순으로 정렬
        const sortedMessages = data.sort((a, b) => {
          const dateA = new Date(a.sentAt);
          const dateB = new Date(b.sentAt);
          return dateA - dateB;
        });
        setMessages(sortedMessages);
        setHasMore(data.length >= 20);
        constructRoomInfo(data);
      } catch (error) {
        console.error('채팅 메시지 로딩 오류:', error);
        setError('메시지를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMessages();
  }, [roomId, SERVER_URL, navigate]);

  // 채팅방 정보 구성
  const constructRoomInfo = (messages) => {
    if (!messages || messages.length === 0) {
      setRoomInfo({
        id: roomId,
        otherUserNickname: '상대방',
        postTitle: null
      });
      return;
    }

    try {
      const otherUserMessage = messages.find(msg => 
        msg.sender && msg.sender.id && msg.sender.id.toString() !== currentUserId
      );

      const firstMessage = messages[0];
      const chatRoomInfo = firstMessage.chatRoom || { id: roomId };

      setRoomInfo({
        id: chatRoomInfo.id || roomId,
        postId: chatRoomInfo.postId,
        otherUserNickname: otherUserMessage?.sender?.nickname || '상대방',
        postTitle: chatRoomInfo.postTitle
      });
    } catch (err) {
      console.error('채팅방 정보 구성 오류:', err);
      setRoomInfo({
        id: roomId,
        otherUserNickname: '상대방',
        postTitle: null
      });
    }
  };

  // 이전 메시지 로드
  const loadPreviousMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    try {
      const token = localStorage.getItem('jwtToken');
      const oldestMessageId = messages[0].id;

      setLoadingMore(true);
      const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/before/${oldestMessageId}?size=20`, {
        headers: {
          'Authorization': token,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('이전 메시지를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        // 이전 메시지도 날짜순으로 정렬
        const sortedMessages = data.sort((a, b) => {
          const dateA = new Date(a.sentAt);
          const dateB = new Date(b.sentAt);
          return dateA - dateB;
        });
        
        setMessages(prev => [...sortedMessages, ...prev]);
        setHasMore(data.length >= 20);
      }
    } catch (error) {
      console.error('이전 메시지 로딩 오류:', error);
      setError('이전 메시지를 불러올 수 없습니다.');
    } finally {
      setLoadingMore(false);
    }
  };

  // 스크롤 관련 함수들
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newMessage.trim() || !connected) return;
    
    try {
      sendMessage(newMessage.trim());
      setNewMessage('');
      // 메시지 전송 후 스크롤
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setError('메시지 전송에 실패했습니다.');
    }
  };

  // 날짜 포맷팅 함수들
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  const isNewDate = (current, previous) => {
    if (!previous) return true;
    if (!current.sentAt && !previous.sentAt) return false;
    
    const currentDate = new Date(current.sentAt).toLocaleDateString();
    const previousDate = new Date(previous.sentAt).toLocaleDateString();
    
    return currentDate !== previousDate;
  };

  // 채팅방 나가기
  const leaveRoom = () => {
    if (window.confirm('채팅방을 나가시겠습니까?')) {
      navigate('/chats');
    }
  };

  // 프로필 이미지 URL 생성 함수
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${SERVER_URL}/images/profile/${relativePath}`;
  };

  // 이미지 오류 핸들러
  const handleImageError = (event) => {
    event.target.src = '/default-profile.png';
  };

  // 엔터 키 처리 함수
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">채팅방을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 채팅방 헤더 */}
      <div className="bg-white p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/chats')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </button>
          
          {roomInfo && (
            <div className="flex items-center">
              <div>
                <p className="font-medium">{roomInfo.otherUserNickname}</p>
                {roomInfo.postTitle && (
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{roomInfo.postTitle}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className="p-2"
            onClick={() => {
              const menu = document.getElementById('chat-menu');
              menu.classList.toggle('hidden');
            }}
          >
            <MoreVertical size={20} />
          </button>
          
          <div 
            id="chat-menu"
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden z-10"
          >
            <div className="py-1">
              {roomInfo?.postId && (
                <button 
                  onClick={() => navigate(`/post/${roomInfo.postId}`)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  게시물 보기
                </button>
              )}
              <button 
                onClick={leaveRoom}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                채팅방 나가기
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메시지 목록 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-0"
      >
        {loadingMore && (
          <div className="text-center py-2">
            <div className="animate-spin h-5 w-5 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          </div>
        )}
        
        {hasMore && !loadingMore && messages.length > 0 && (
          <button 
            onClick={loadPreviousMessages}
            className="flex items-center mx-auto mb-4 text-sm text-blue-500 bg-white rounded-full px-3 py-1 shadow-sm"
          >
            <ChevronUp size={16} className="mr-1" />
            이전 메시지 불러오기
          </button>
        )}
        
        {messages.map((message, index) => {
          const isCurrentUser = message.sender?.id?.toString() === currentUserId;
          const showDate = isNewDate(message, messages[index - 1]);
          
          return (
            <React.Fragment key={`${message.id || 'temp'}-${index}-${message.sentAt || Date.now()}`}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.sentAt)}
                  </span>
                </div>
              )}
              
              <div 
                className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}
                >
                  <div 
                    className={`relative px-4 py-2 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  <div 
                    className={`text-xs text-gray-500 mt-1 ${
                      isCurrentUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(message.sentAt)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 연결 상태 표시 */}
      {!connected && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1">
          서버에 연결 중... 메시지 전송이 지연될 수 있습니다.
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-100 text-red-800 text-xs text-center py-1">
          {error}
        </div>
      )}
      
      {/* 메시지 입력 */}
      <div className="bg-white p-3 border-t sticky bottom-0">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-center gap-2"
        >
          <button 
            type="button"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            onClick={() => alert('이미지 업로드 기능은 준비 중입니다.')}
          >
            <Image size={20} />
          </button>
          
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          <button 
            type="submit"
            className={`p-2 rounded-full ${
              connected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
            }`}
            disabled={!newMessage.trim() || !connected}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;