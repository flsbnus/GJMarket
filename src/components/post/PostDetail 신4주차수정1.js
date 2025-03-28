import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Edit, Trash, ArrowLeft, User, MessageCircle, Send, X } from 'lucide-react';
import useWebSocket from 'react-use-websocket';

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

  // 현재 게시물의 찜 상태를 확인하는 함수
  const checkWishlistStatus = async (token, postId) => {
    try {
      // 위시리스트 목록 가져오기
      const response = await fetch('/api/wishlist/getmywishlist', {
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
      
      // 현재 게시물이 위시리스트에 있는지 확인
      const isInWishlist = Array.isArray(wishlistItems) && 
        wishlistItems.some(item => item.post && item.post.id === parseInt(postId));
      
      console.log(`게시물 ${postId}의 찜 상태:`, isInWishlist);
      return isInWishlist;
    } catch (error) {
      console.error('위시리스트 상태 확인 오류:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        // 로그인 확인
        const token = localStorage.getItem('jwtToken');
        const currentUserId = localStorage.getItem('userId');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        setUserId(currentUserId);
        setIsLoading(true);
        const response = await fetch(`/api/post/${postId}`, {
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
        
        // 현재 사용자가 게시물 작성자인지 확인
        setIsOwner(data.user?.id === parseInt(currentUserId));
        
        // 찜 상태 확인
        const wishlistStatus = await checkWishlistStatus(token, postId);
        setIsLiked(wishlistStatus);

        // 사용자의 채팅방 목록 조회
        await fetchUserChatRooms(token);
      } catch (error) {
        console.error('게시물 상세 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId, navigate]);

  // 사용자의 채팅방 목록 조회
  const fetchUserChatRooms = async (token) => {
    try {
      const response = await fetch(`/api/users/${userId}/chatrooms`, {
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
      
      // 현재 게시물에 대한 채팅방이 있는지 확인
      const existingRoom = rooms.find(room => room.post?.id === parseInt(postId));
      if (existingRoom) {
        setChatRoom(existingRoom);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
    }
  };
  
  // 웹소켓 연결 및 메시지 처리
  const setupWebSocket = (roomId) => {
    if (!roomId) return null;
    
    const token = localStorage.getItem('jwtToken');
    const socketUrl = `ws://${window.location.host}/ws/chat/${roomId}?token=${token}`;
    
    return new WebSocket(socketUrl);
  };

  // 채팅방 생성 함수
  const createChatRoom = async () => {
    if (isOwner) {
      alert('자신의 게시물에는 채팅을 시작할 수 없습니다.');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      setIsChatLoading(true);
      
      // 채팅방 생성 API 호출
      const response = await fetch(`/api/post/${postId}/chatroom`, {
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
      
      // 채팅 메시지 로드
      await loadChatMessages(newChatRoom.id);
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      alert(error.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 채팅 메시지 로드 함수
  const loadChatMessages = async (roomId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`/api/chatroom/${roomId}/recent`, {
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
      setMessages(messagesData);
      
      // 스크롤을 최하단으로 이동
      scrollToBottom();
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  };
  
  // 이전 메시지 로드 함수
  const loadMoreMessages = async (roomId, firstMessageId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`/api/chatroom/${roomId}/before/${firstMessageId}`, {
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

  // 새 메시지 전송 함수
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chatRoom || !webSocketRef.current) return;

    try {
      // 웹소켓을 통해 메시지 전송
      const messageObj = {
        type: 'CHAT',
        roomId: chatRoom.id,
        senderId: userId,
        content: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      webSocketRef.current.send(JSON.stringify(messageObj));
      
      // 메시지 전송 후 입력창 초기화
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 채팅창 토글 함수
  const toggleChat = async () => {
    if (!isChatOpen) {
      if (!chatRoom) {
        await createChatRoom();
      } else {
        // 웹소켓 연결
        if (!webSocketRef.current) {
          webSocketRef.current = setupWebSocket(chatRoom.id);
          
          webSocketRef.current.onopen = () => {
            console.log('WebSocket 연결 성공');
          };
          
          webSocketRef.current.onmessage = (event) => {
            try {
              const receivedMessage = JSON.parse(event.data);
              if (receivedMessage.type === 'CHAT') {
                setMessages(prev => [...prev, receivedMessage]);
                scrollToBottom();
              }
            } catch (error) {
              console.error('메시지 파싱 오류:', error);
            }
          };
          
          webSocketRef.current.onerror = (error) => {
            console.error('WebSocket 오류:', error);
          };
          
          webSocketRef.current.onclose = () => {
            console.log('WebSocket 연결 종료');
          };
        }
        
        await loadChatMessages(chatRoom.id);
        setIsChatOpen(true);
      }
    } else {
      setIsChatOpen(false);
    }
  };

  // 스크롤 최하단 이동 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 채팅창이 열려있을 때 메시지가 변경되면 스크롤을 최하단으로 이동
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);
  
  // 채팅방이 변경되면 웹소켓 연결을 재설정
  useEffect(() => {
    if (chatRoom && isChatOpen) {
      // 기존 연결이 있으면 닫기
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      // 새 웹소켓 연결 설정
      webSocketRef.current = setupWebSocket(chatRoom.id);
      
      webSocketRef.current.onopen = () => {
        console.log('WebSocket 연결 성공');
      };
      
      webSocketRef.current.onmessage = (event) => {
        try {
          const receivedMessage = JSON.parse(event.data);
          if (receivedMessage.type === 'CHAT') {
            setMessages(prev => [...prev, receivedMessage]);
          }
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };
      
      webSocketRef.current.onerror = (error) => {
        console.error('WebSocket 오류:', error);
      };
      
      webSocketRef.current.onclose = () => {
        console.log('WebSocket 연결 종료');
      };
      
      // 채팅 메시지 로드
      loadChatMessages(chatRoom.id);
    }
    
    // 컴포넌트가 언마운트되거나 채팅방이 변경될 때 웹소켓 연결 종료
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [chatRoom, isChatOpen]);

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
    const date = new Date(timestamp);
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
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
            <div className="flex items-center justify-center h-full text-gray-500">
              이미지가 없습니다
            </div>
          )}
        </div>

        {/* 게시물 내용 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusLabel.class}`}>
                  {statusLabel.text}
                </span>
                <h1 className="text-2xl font-bold ml-2">{post.title}</h1>
              </div>
              <p className="text-xl font-semibold text-blue-600">
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
          <div className="flex items-center mb-4 text-sm text-gray-500">
            <User className="w-4 h-4 mr-1" />
            <span>{post.user?.nickname || '익명'}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>조회 {post.viewCount}</span>
            <span className="mx-2">•</span>
            <span>찜 {post.wishlistCount}</span>
          </div>
          
          <hr className="my-4" />
          
          {/* 본문 내용 */}
          <div className="whitespace-pre-line mt-4 min-h-48">
            {post.content}
          </div>
          
          <hr className="my-6" />
          
          {/* 수정/삭제 버튼 (작성자만 표시) */}
          {isOwner && (
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <Trash className="w-4 h-4 mr-1" />
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 채팅 창 */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col border border-gray-200">
          {/* 채팅 헤더 */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-500 text-white rounded-t-lg">
            <h3 className="text-sm font-semibold truncate">
              {post.user?.nickname || '판매자'}와의 대화
            </h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
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
                    message.senderId === parseInt(userId) ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <div 
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.senderId === parseInt(userId)
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-gray-300 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                  <div 
                    className={`text-xs text-gray-500 mt-1 ${
                      message.senderId === parseInt(userId) ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatMessageTime(message.timestamp)}
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
              className="bg-blue-500 text-white rounded-r-lg px-3 py-2 hover:bg-blue-600"
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