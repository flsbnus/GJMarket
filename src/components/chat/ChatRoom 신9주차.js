import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Image, ChevronUp } from 'lucide-react';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messagesData, setMessagesData] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const webSocketRef = useRef(null);
  
  // 현재 사용자 ID
  const currentUserId = localStorage.getItem('userId');
  
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

  // 웹소켓 연결 설정
  useEffect(() => {
    if (!roomId) return;
    
    // 웹소켓 연결
    const connectWebSocket = () => {
      const token = localStorage.getItem('jwtToken');
      const socket = new WebSocket(`${WS_URL}/ws/chat/${roomId}?token=${token}`);
      
      webSocketRef.current = socket;
      
      // 웹소켓 이벤트 핸들러
      socket.onopen = () => {
        console.log('웹소켓 연결 성공');
        setConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('메시지 수신:', data);
          
          // 수신된 메시지를 메시지 목록에 추가
          setMessagesData(prevMessages => {
            // 이미 같은 ID의 메시지가 있는지 확인
            if (data.id && prevMessages.some(msg => msg.id === data.id)) {
              return prevMessages;
            }
            return [...prevMessages, data];
          });
          
          // 새 메시지가 추가되면 스크롤을 아래로 이동
          scrollToBottom();
        } catch (e) {
          console.error('메시지 파싱 오류:', e);
        }
      };
      
      socket.onclose = (event) => {
        console.log('웹소켓 연결 종료:', event.code, event.reason);
        setConnected(false);
        
        // 비정상 종료인 경우 재연결 시도
        if (event.code !== 1000) {
          console.log('웹소켓 재연결 시도...');
          setTimeout(connectWebSocket, 3000);
        }
      };
      
      socket.onerror = (error) => {
        console.error('웹소켓 오류:', error);
        setConnected(false);
      };
    };
    
    connectWebSocket();
    
    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [roomId, WS_URL]);
  
  // 채팅방 정보 로드
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        
        const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/info`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('채팅방 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setRoomInfo(data);
      } catch (error) {
        console.error('채팅방 정보 로딩 오류:', error);
        setError(error.message);
      }
    };
    
    fetchRoomInfo();
  }, [roomId, SERVER_URL]);
  
  // 최근 메시지 로드
  useEffect(() => {
    const fetchRecentMessages = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        
        setLoading(true);
        const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/recent?size=20`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('채팅 메시지를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setMessagesData(data);
        setHasMore(data.length >= 20); // 서버에서 기본 20개 메시지를 반환하므로
      } catch (error) {
        console.error('채팅 메시지 로딩 오류:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (roomId) {
      fetchRecentMessages();
    }
  }, [roomId, SERVER_URL]);
  
  // 메시지가 로드되면 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (!loading && messagesData.length > 0) {
      scrollToBottom();
    }
  }, [loading, messagesData]);
  
  // 이전 메시지 로드
  const loadPreviousMessages = async () => {
    if (loadingMore || !hasMore || messagesData.length === 0) return;
    
    try {
      const token = localStorage.getItem('jwtToken');
      const oldestMessageId = messagesData[0].id;
      
      setLoadingMore(true);
      const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/before/${oldestMessageId}?size=20`, {
        method: 'GET',
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
        // 스크롤 위치 유지를 위한 현재 스크롤 높이 저장
        const scrollContainer = messagesContainerRef.current;
        const scrollHeight = scrollContainer.scrollHeight;
        
        setMessagesData(prevMessages => [...data, ...prevMessages]);
        
        // 새 메시지가 추가된 후 스크롤 위치 조정
        setTimeout(() => {
          const newScrollHeight = scrollContainer.scrollHeight;
          scrollContainer.scrollTop = newScrollHeight - scrollHeight;
        }, 100);
        
        // 가져온 메시지가 20개 미만이면 더 이상 메시지가 없음
        if (data.length < 20) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('이전 메시지 로딩 오류:', error);
      setError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };
  
  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    const { scrollTop } = messagesContainerRef.current;
    
    // 스크롤이 맨 위에 가까워지면 이전 메시지 로드
    if (scrollTop < 50 && !loadingMore && hasMore) {
      loadPreviousMessages();
    }
  };
  
  // 메시지 전송
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !connected || !webSocketRef.current) return;
    
    try {
      const messageData = {
        content: newMessage,
        senderId: currentUserId,
        chatroomId: roomId,
        timestamp: new Date().toISOString()
      };
      
      // 웹소켓으로 메시지 전송
      webSocketRef.current.send(JSON.stringify(messageData));
      
      // 입력 필드 초기화
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setError('메시지를 전송할 수 없습니다. 다시 시도해주세요.');
    }
  };
  
  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 날짜 포맷팅 함수
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // 날짜 변경 여부 확인 함수
  const isNewDate = (current, previous) => {
    if (!previous) return true;
    
    const currentDate = new Date(current.sentAt || current.timestamp).toLocaleDateString();
    const previousDate = new Date(previous.sentAt || previous.timestamp).toLocaleDateString();
    
    return currentDate !== previousDate;
  };
  
  // 날짜 표시 형식
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };
  
  // 프로필 이미지 URL 생성 함수
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${SERVER_URL}/images${relativePath}`;
  };
  
  // 채팅방 나가기
  const leaveRoom = async () => {
    if (window.confirm('채팅방을 나가시겠습니까?')) {
      try {
        const token = localStorage.getItem('jwtToken');
        
        const response = await fetch(`${SERVER_URL}/api/chatroom/${roomId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': token
          }
        });
        
        if (response.ok) {
          navigate('/chats');
        } else {
          setError('채팅방을 나갈 수 없습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('채팅방 나가기 오류:', error);
        setError('채팅방을 나갈 수 없습니다. 다시 시도해주세요.');
      }
    }
  };

  // 메시지 목록 최적화 (isCurrentUser 미리 계산)
  const messages = useMemo(() => {
    return messagesData.map(message => ({
      ...message,
      isCurrentUser: message.sender && message.sender.id.toString() === currentUserId
    }));
  }, [messagesData, currentUserId]);

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

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center bg-red-100 p-4 rounded-lg max-w-md w-full">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/chats')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            채팅 목록으로 돌아가기
          </button>
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
              <img 
                src={getProfileImageUrl(roomInfo.otherUserProfileImage)} 
                alt={roomInfo.otherUserNickname} 
                className="w-10 h-10 rounded-full object-cover mr-3"
                onError={(e) => { e.target.src = '/default-profile.png' }}
              />
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
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
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
        
        {/* 메시지 목록 */}
        {messages.map((message, index) => {
          const isCurrentUser = message.isCurrentUser;
          const showDate = isNewDate(message, messages[index - 1]);
          
          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.sentAt || message.timestamp)}
                  </span>
                </div>
              )}
              
              <div 
                className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <img 
                    src={getProfileImageUrl(message.sender?.profileImageUrl || roomInfo?.otherUserProfileImage)} 
                    alt={message.sender?.nickname || roomInfo?.otherUserNickname}
                    className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                    onError={(e) => { e.target.src = '/default-profile.png' }}
                  />
                )}
                
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
                    {formatTime(message.sentAt || message.timestamp)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 웹소켓 연결 상태 표시 */}
      {!connected && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1">
          서버에 연결 중... 메시지 전송이 지연될 수 있습니다.
        </div>
      )}
      
      {/* 메시지 입력 */}
      <div className="bg-white p-3 border-t">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-center"
        >
          <button 
            type="button"
            className="p-2 text-gray-500"
            onClick={() => alert('이미지 업로드 기능은 준비 중입니다.')}
          >
            <Image size={20} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          
          <button 
            type="submit"
            className={`p-2 rounded-full ${
              connected ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
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