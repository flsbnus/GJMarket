import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Edit, Trash, ArrowLeft, User, MessageCircle, Send, X } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  
  // 채팅 관련 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesContainerRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  // 현재 게시물의 찜 상태를 확인하는 함수
  const checkWishlistStatus = async (token, postId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/wishlist/getmywishlist`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('위시리스트 조회 실패');
        return false;
      }

      const wishlistItems = await response.json();
      return Array.isArray(wishlistItems) && 
        wishlistItems.some(item => item.post && item.post.id === parseInt(postId));
    } catch (error) {
      console.error('위시리스트 상태 확인 오류:', error);
      return false;
    }
  };

  // 게시물 상세 정보 가져오기
  const fetchPostDetail = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const currentUserId = localStorage.getItem('userId');
      
      if (!token) {
        navigate('/signin');
        return;
      }

      setUserId(currentUserId);
      setIsLoading(true);
      
      const response = await fetch(`http://localhost:8080/api/post/${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('게시물을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setPost(data);
      
      const isUserOwner = data.user?.id === parseInt(currentUserId);
      setIsOwner(isUserOwner);
      
      const wishlistStatus = await checkWishlistStatus(token, postId);
      setIsLiked(wishlistStatus);

      await fetchUserChatRooms(token);
    } catch (error) {
      console.error('게시물 상세 조회 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자의 채팅방 목록 조회
  const fetchUserChatRooms = async (token) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/chatrooms`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('채팅방 목록 조회 실패');
        return;
      }

      const rooms = await response.json();
      setChatRooms(rooms);
      
      const existingRoom = rooms.find(room => room.postId === parseInt(postId));
      if (existingRoom) {
        setChatRoom(existingRoom);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
    }
  };

  // 웹소켓 연결 설정
  const setupWebSocket = (roomId) => {
    if (!roomId) {
      console.error('채팅방 ID가 없습니다.');
      return null;
    }
    
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('인증 토큰이 없습니다.');
      setSocketError('로그인이 필요합니다.');
      return null;
    }
    
    const socketUrl = `ws://localhost:8080/ws/chat/${roomId}?token=${token}`;
    
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    
    try {
      const socket = new WebSocket(socketUrl);
      
      // 연결 타임아웃 설정
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.error('웹소켓 연결 타임아웃');
          socket.close();
          setSocketError('서버 연결 시간이 초과되었습니다.');
        }
      }, 10000);
      
      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket 연결 성공');
        setSocketConnected(true);
        setSocketError('');
        setReconnectAttempts(0);
        
        // 연결 직후 인증 메시지 전송
        const authMessage = {
          type: 'AUTH',
          token: token.replace('Bearer ', '')
        };
        socket.send(JSON.stringify(authMessage));
        
        // 인증 후 채팅방 입장 메시지 전송
        const joinMessage = {
          type: 'JOIN',
          chatRoomId: roomId,
          userId: parseInt(userId),
          role: isOwner ? 'SELLER' : 'BUYER'
        };
        socket.send(JSON.stringify(joinMessage));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('메시지 수신:', data);

          switch (data.type) {
            case 'CHAT':
              setMessages(prev => {
                const isDuplicate = prev.some(msg => 
                  msg.id === data.message.id || 
                  (msg.content === data.message.content && 
                   msg.sender?.id === data.message.sender?.id &&
                   msg.timestamp === data.message.timestamp)
                );
                
                if (isDuplicate) return prev;
                return [...prev, data.message];
              });
              scrollToBottom();
              break;
              
            case 'ERROR':
              console.error('서버 오류:', data.message);
              setSocketError(data.message);
              break;
              
            case 'JOIN':
              console.log('사용자 입장:', data);
              break;
              
            case 'LEAVE':
              console.log('사용자 퇴장:', data);
              break;
          }
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket 연결 종료:', event);
        setSocketConnected(false);
        if (event.code !== 1000) {
          setSocketError('연결이 끊어졌습니다. 재연결을 시도합니다...');
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              setupWebSocket(roomId);
            }, RECONNECT_DELAY);
          }
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setSocketConnected(false);
        setSocketError('웹소켓 연결 중 오류가 발생했습니다.');
      };
      
      return socket;
    } catch (error) {
      console.error('WebSocket 생성 오류:', error);
      setSocketError('웹소켓 연결 생성에 실패했습니다.');
      return null;
    }
  };

  // 채팅방 생성
  const createChatRoom = async () => {
    if (isOwner) {
      alert('자신의 게시물에는 채팅을 시작할 수 없습니다.');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      setIsChatLoading(true);
      
      const response = await fetch(`http://localhost:8080/api/post/${postId}/chatroom`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('채팅방 생성에 실패했습니다.');
      }

      const newChatRoom = await response.json();
      setChatRoom(newChatRoom);
      setIsChatOpen(true);
      
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      setTimeout(() => {
        webSocketRef.current = setupWebSocket(newChatRoom.id);
        loadChatMessages(newChatRoom.id);
      }, 500);
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      alert(error.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 채팅 메시지 로드
  const loadChatMessages = async (roomId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      setIsChatLoading(true);
      
      const response = await fetch(`http://localhost:8080/api/chatroom/${roomId}/recent`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('메시지 로드에 실패했습니다.');
      }

      const messagesData = await response.json();
      
      if (Array.isArray(messagesData)) {
        setMessages(messagesData);
      } else {
        console.error('메시지 데이터 형식이 올바르지 않습니다:', messagesData);
        setMessages([]);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      alert('메시지를 불러오는데 실패했습니다.');
    } finally {
      setIsChatLoading(false);
    }
  };
  
  // 이전 메시지 로드
  const loadMoreMessages = async (roomId, firstMessageId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`http://localhost:8080/api/chatroom/${roomId}/before/${firstMessageId}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('이전 메시지 로드에 실패했습니다.');
      }

      const olderMessages = await response.json();
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
      }
    } catch (error) {
      console.error('이전 메시지 로드 오류:', error);
    }
  };

  // 스크롤 최하단 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 메시지 전송
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chatRoom) return;

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender: { 
          id: parseInt(userId),
          nickname: localStorage.getItem('userNickname') || '나'
        },
        content: newMessage.trim(),
        sentAt: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();

      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        const messageObj = {
          type: 'CHAT',
          chatRoomId: chatRoom.id,
          senderId: parseInt(userId),
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          isRead: false
        };
        
        webSocketRef.current.send(JSON.stringify(messageObj));
      } else {
        console.error('웹소켓이 연결되어 있지 않습니다.');
        setSocketError('실시간 연결이 끊어졌습니다. 페이지를 새로고침하여 다시 시도해주세요.');
        
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
      
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    }
  };

  // 채팅창 토글
  const toggleChat = async () => {
    if (!chatRoom) {
      await createChatRoom();
    }
    navigate(`/chatroom/${chatRoom.id}`);
  };

  useEffect(() => {
    fetchPostDetail();
    
    const chatRoomsInterval = setInterval(() => {
      const token = localStorage.getItem('jwtToken');
      if (token && isOwner) {
        fetchUserChatRooms(token);
      }
    }, 30000);
    
    return () => {
      clearInterval(chatRoomsInterval);
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [postId]);

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);
  
  useEffect(() => {
    if (chatRoom && isChatOpen) {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      
      try {
        webSocketRef.current = setupWebSocket(chatRoom.id);
      } catch (error) {
        console.error('웹소켓 설정 오류:', error);
        setSocketError('웹소켓 연결에 실패했습니다.');
      }
      
      loadChatMessages(chatRoom.id);
    }
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, [chatRoom?.id, isChatOpen]);

  const handleLikeToggle = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      console.log(`위시리스트 ${isLiked ? '제거' : '추가'} 요청:`, post.id);
      
      const response = await fetch(`/api/wishlist/${post.id}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 찜하기 상태 토글
        setIsLiked(!isLiked);
        
        // 위시리스트 카운트 업데이트
        setPost(prev => ({
          ...prev,
          wishlistCount: isLiked ? Math.max(0, prev.wishlistCount - 1) : prev.wishlistCount + 1
        }));
        
        console.log(`위시리스트 ${isLiked ? '제거' : '추가'} 성공`);
      } else {
        const errorData = await response.text();
        console.error('위시리스트 처리 실패:', errorData);
      }
    } catch (error) {
      console.error('위시리스트 처리 오류:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/posts/edit/${postId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`/api/post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        alert('게시물이 삭제되었습니다.');
        navigate('/posts');
      } else {
        const errorData = await response.text();
        alert(`삭제 실패: ${errorData}`);
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert(`오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleImageChange = (direction) => {
    if (!post?.images || post.images.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
  };

  const handleGoBack = () => {
    navigate('/posts');
  };

  // 가격 형식화 (1000 -> 1,000원)
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '가격 정보 없음';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  // 판매 상태 표시
  const getStatusLabel = (status) => {
    switch(status) {
      case 0: return { text: '판매중', class: 'bg-green-100 text-green-800' };
      case 1: return { text: '예약중', class: 'bg-yellow-100 text-yellow-800' };
      case 2: return { text: '판매완료', class: 'bg-gray-100 text-gray-800' };
      default: return { text: '상태 불명', class: 'bg-gray-100 text-gray-500' };
    }
  };

  // 메시지 시간 포맷
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
        <button 
          onClick={handleGoBack}
          className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="text-center py-8">게시물을 찾을 수 없습니다.</div>
        <button 
          onClick={handleGoBack}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const statusLabel = getStatusLabel(post.status);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <button 
        onClick={handleGoBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 break-words"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        목록으로 돌아가기
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 이미지 섹션 */}
        <div className="relative h-96 bg-gray-100">
          {post.images && post.images.length > 0 ? (
            <>
              <img
                src={`/images/${post.images[currentImageIndex].imageUrl}`}
                alt={post.title}
                className="w-full h-full object-contain"
              />
              
              {/* 이미지가 여러 개인 경우 좌우 화살표 표시 */}
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageChange('prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={() => handleImageChange('next')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    &gt;
                  </button>
                  
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {post.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 break-words">
              이미지가 없습니다
            </div>
          )}
        </div>

        {/* 게시물 내용 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusLabel.class} break-words`}>
                  {statusLabel.text}
                </span>
                <h1 className="text-2xl font-bold ml-2 break-words">{post.title}</h1>
              </div>
              <p className="text-xl font-semibold text-blue-600 break-words">
                {formatPrice(post.price)}
              </p>
            </div>
            
            <div className="flex items-center">
              {/* 채팅 버튼 */}
              {!isOwner && (
                <button
                  onClick={toggleChat}
                  className="flex items-center p-2 mr-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  disabled={isChatLoading}
                  title="판매자와 채팅하기"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}
              
              {/* 위시리스트(찜) 버튼 */}
              <button
                onClick={handleLikeToggle}
                className={`p-2 rounded-full ${
                  isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
                }`}
                title={isLiked ? '위시리스트에서 제거' : '위시리스트에 추가'}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* 작성자 정보 */}
          <div className="flex items-center mb-4 text-sm text-gray-500 flex-wrap">
            <User className="w-4 h-4 mr-1" />
            <span className="break-words">{post.user?.nickname || '익명'}</span>
            <span className="mx-2">•</span>
            <span className="break-words">{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span className="break-words">조회 {post.viewCount}</span>
            <span className="mx-2">•</span>
            <span className="break-words">찜 {post.wishlistCount}</span>
          </div>
          
          <hr className="my-4" />
          
          {/* 본문 내용 */}
          <div className="whitespace-pre-line mt-4 min-h-48 break-words overflow-wrap-break-word">
            {post.content}
          </div>
          
          <hr className="my-6" />
          
          {/* 수정/삭제 버튼 및 채팅 관리 (작성자만 표시) */}
          {isOwner && (
            <>
              {/* 채팅 요청 목록 (판매자용) */}
              <div className="my-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  채팅 요청 ({chatRooms.filter(room => room.postId === parseInt(postId)).length})
                </h3>
                
                {chatRooms.filter(room => room.postId === parseInt(postId)).length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {chatRooms
                      .filter(room => room.postId === parseInt(postId))
                      .map(room => (
                        <div 
                          key={room.id} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            navigate(`/chatroom/${room.id}`);
                          }}
                        >
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{room.buyer?.nickname || '구매자'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(room.lastMessageTime || room.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    아직 채팅 요청이 없습니다.
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 break-words"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 break-words"
                >
                  <Trash className="w-4 h-4 mr-1" />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 채팅 창 */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col border border-gray-200">
          {/* 채팅 헤더 */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-500 text-white rounded-t-lg">
            <h3 className="text-sm font-semibold truncate">
              {isOwner ? 
                `${chatRoom?.buyer?.nickname || '구매자'}와의 대화` : 
                `${post.user?.nickname || '판매자'}와의 대화`} 
              <span className="text-xs ml-2 text-blue-100">
                {isOwner ? '(판매자 모드)' : '(구매자 모드)'}
              </span>
            </h3>
            <div className="flex items-center">
              {socketConnected ? (
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2" title="연결됨"></span>
              ) : (
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2" title="연결 끊김"></span>
              )}
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {socketError && (
            <div className="bg-red-100 text-red-600 text-xs p-2 text-center">
              {socketError}
              <button 
                onClick={() => {
                  if (webSocketRef.current) webSocketRef.current.close();
                  webSocketRef.current = setupWebSocket(chatRoom.id);
                  setSocketError('');
                }}
                className="ml-2 underline"
              >
                재연결
              </button>
            </div>
          )}
          
          {/* 채팅 메시지 영역 */}
          <div 
            className="flex-1 p-3 overflow-y-auto bg-gray-50"
            ref={messagesContainerRef}
            onScroll={(e) => {
              // 스크롤이 맨 위에 도달하면 이전 메시지 로드
              if (e.target.scrollTop === 0 && messages.length > 0 && !isLoadingMore) {
                setIsLoadingMore(true);
                loadMoreMessages(chatRoom.id, messages[0].id).finally(() => {
                  setIsLoadingMore(false);
                });
              }
            }}
          >
            {isLoadingMore && (
              <div className="text-center text-xs text-gray-500 py-2">
                이전 메시지 로딩 중...
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                메시지가 없습니다. 대화를 시작해보세요!
              </div>
            ) : (
              messages.map((message, index) => (
                                  <div 
                    key={message.id || index}
                    className={`mb-2 max-w-3/4 ${
                      message.sender?.id === parseInt(userId) ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div 
                      className={`px-3 py-2 rounded-lg text-sm ${
                        message.sender?.id === parseInt(userId)
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-300 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div 
                      className={`text-xs text-gray-500 mt-1 ${
                        message.sender?.id === parseInt(userId) ? 'text-right' : 'text-left'
                      }`}
                    >
                      {message.sender?.nickname && (
                        <span className="mr-1">{message.sender.nickname}</span>
                      )}
                      {formatMessageTime(message.sentAt)}
                    </div>
                  </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 메시지 입력 영역 */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className={`text-white rounded-r-lg px-3 py-2 ${
                newMessage.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostDetail;