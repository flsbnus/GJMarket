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
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');

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
        const isUserOwner = data.user?.id === parseInt(currentUserId);
        setIsOwner(isUserOwner);
        
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
    
    // 30초마다 채팅방 목록 새로고침 (새 채팅을 확인하기 위해)
    const chatRoomsInterval = setInterval(() => {
      const token = localStorage.getItem('jwtToken');
      if (token && isOwner) {
        fetchUserChatRooms(token);
      }
    }, 30000);
    
    return () => {
      clearInterval(chatRoomsInterval);
    };
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
      console.log('사용자 채팅방 목록:', rooms);
      setChatRooms(rooms);
      
      // 현재 게시물에 대한 채팅방이 있는지 확인
      const existingRoom = rooms.find(room => room.postId === parseInt(postId));
      if (existingRoom) {
        console.log('현재 게시물에 대한 채팅방 찾음:', existingRoom);
        setChatRoom(existingRoom);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
    }
  };
  
  // 웹소켓 연결 및 메시지 처리
  // const setupWebSocket = (roomId) => {
  //   if (!roomId) return null;
    
  //   const token = localStorage.getItem('jwtToken');
  //   // Bearer 접두사 제거 (필요한 경우)
  //   const cleanToken = token.replace('Bearer ', '');
    
  //   // URL에 토큰을 쿼리 파라미터로 추가
  //   const socketUrl = `ws://localhost:8080/ws/chat/${roomId}?token=${encodeURIComponent(cleanToken)}`;
    
  //   console.log('웹소켓 연결 시도:', socketUrl);
    
  //   // 웹소켓 객체 생성
  //   const socket = new WebSocket(socketUrl);
    
  //   socket.onopen = () => {
  //     console.log('WebSocket 연결 성공');
  //     setSocketConnected(true);
  //     setSocketError('');
      
  //     // 연결 직후 초기화 메시지 전송 (필요한 경우)
  //     try {
  //       const initMessage = {
  //         type: 'INIT',
  //         chatRoomId: roomId,
  //         userId: parseInt(userId)
  //       };
  //       socket.send(JSON.stringify(initMessage));
  //     } catch (error) {
  //       console.error('초기화 메시지 전송 오류:', error);
  //     }
  //   };
    
  //   socket.onmessage = (event) => {
  //     try {
  //       console.log('Raw message received:', event.data);
  //       const receivedMessage = JSON.parse(event.data);
  //       console.log('메시지 수신:', receivedMessage);
        
  //       // 수신된 메시지를 상태에 추가
  //       setMessages(prev => {
  //         // 중복 메시지 방지
  //         const isDuplicate = prev.some(msg => 
  //           (msg.id === receivedMessage.id && receivedMessage.id !== null) || 
  //           (msg.content === receivedMessage.content && 
  //            msg.sender?.id === receivedMessage.sender?.id &&
  //            msg.content !== null && msg.content.trim() !== '')
  //         );
          
  //         if (isDuplicate) return prev;
          
  //         return [...prev, receivedMessage];
  //       });
  //       scrollToBottom();
  //     } catch (error) {
  //       console.error('메시지 파싱 오류:', error);
  //     }
  //   };
    
  //   socket.onerror = (error) => {
  //     console.error('WebSocket 오류:', error);
  //     setSocketConnected(false);
  //     setSocketError('웹소켓 연결 중 오류가 발생했습니다.');
  //   };
    
  //   socket.onclose = (event) => {
  //     console.log('WebSocket 연결 종료', event.code, event.reason);
  //     setSocketConnected(false);
      
  //     // 연결이 의도치 않게 끊어진 경우 재연결 시도
  //     if (event.code !== 1000) {
  //       console.log('웹소켓 연결이 의도치 않게 종료되었습니다. 재연결 시도...');
  //       setTimeout(() => {
  //         if (isChatOpen) {
  //           webSocketRef.current = setupWebSocket(roomId);
  //         }
  //       }, 3000);
  //     }
  //   };
    
  //   return socket;
  // };
  const setupWebSocket = (roomId) => {
    // roomId 검증 강화
    if (!roomId) {
        console.error('유효하지 않은 채팅방 ID입니다.');
        return null;
    }

    // 토큰 검증 강화
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        console.error('인증 토큰이 존재하지 않습니다.');
        return null;
    }

    // 사용자 ID 검증 추가
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('사용자 ID가 존재하지 않습니다.');
        return null;
    }

    // Bearer 접두사 제거 및 토큰 트리밍
    const cleanToken = token.replace('Bearer ', '').trim();

    // 안전한 URL 생성
    const socketUrl = `/ws/chat/${roomId}?token=${encodeURIComponent(cleanToken)}`;

    console.log('웹소켓 연결 시도:', socketUrl);

    try {
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log('WebSocket 연결 성공');
            setSocketConnected(true);
            setSocketError('');

            // 안전한 초기화 메시지 전송
            try {
                const initMessage = {
                    type: 'INIT',
                    chatRoomId: roomId,
                    userId: parseInt(userId, 10) // 명시적 기수 지정
                };
                socket.send(JSON.stringify(initMessage));
            } catch (error) {
                console.error('초기화 메시지 전송 오류:', error);
            }
        };

        socket.onmessage = (event) => {
            try {
                console.log('Raw message received:', event.data);
                const receivedMessage = JSON.parse(event.data);
                console.log('메시지 수신:', receivedMessage);

                // 더 엄격한 중복 메시지 검사
                setMessages(prev => {
                    const isDuplicate = prev.some(msg => 
                        (msg.id && receivedMessage.id && msg.id === receivedMessage.id) ||
                        (msg.content === receivedMessage.content && 
                         msg.sender?.id === receivedMessage.sender?.id &&
                         receivedMessage.content?.trim() !== '')
                    );

                    return isDuplicate ? prev : [...prev, receivedMessage];
                });

                scrollToBottom();
            } catch (error) {
                console.error('메시지 파싱 오류:', error);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket 오류:', error);
            setSocketConnected(false);
            setSocketError('웹소켓 연결 중 오류가 발생했습니다.');
        };

        socket.onclose = (event) => {
            console.log('WebSocket 연결 종료', event.code, event.reason);
            setSocketConnected(false);

            // 더 안전한 재연결 로직
            if (event.code !== 1000 && isChatOpen) {
                console.log('웹소켓 연결이 의도치 않게 종료되었습니다. 재연결 시도...');
                
                // 재연결 실패 시 최대 재시도 횟수 제한
                const maxRetries = 3;
                let retryCount = 0;

                const attemptReconnect = () => {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`재연결 시도 (${retryCount}/${maxRetries})`);
                        
                        setTimeout(() => {
                            const newSocket = setupWebSocket(roomId);
                            if (newSocket) {
                                webSocketRef.current = newSocket;
                            } else {
                                attemptReconnect();
                            }
                        }, 3000 * retryCount); // 점진적 대기 시간
                    } else {
                        console.error('최대 재연결 횟수에 도달했습니다.');
                        // 사용자에게 수동 새로고침 요청 등의 처리 가능
                    }
                };

                attemptReconnect();
            }
        };

        return socket;
    } catch (error) {
        console.error('WebSocket 생성 중 예외:', error);
        setSocketError('WebSocket 연결에 실패했습니다.');
        return null;
    }
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
      console.log('생성된 채팅방:', newChatRoom);
      setChatRoom(newChatRoom);
      setIsChatOpen(true);
      
      // 웹소켓 연결을 새로 설정
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      // 약간의 지연 후 웹소켓 연결 및 메시지 로드 (서버 처리 시간 고려)
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
    
    if (!newMessage.trim() || !chatRoom) return;
    
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      alert('채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      // Postman에서 확인된 형식대로 메시지 객체 구성
      const messageObj = {
        chatRoomId: chatRoom.id,
        senderId: parseInt(userId),
        content: newMessage.trim(),
        // 서버에서 sentAt은 자동으로 설정되므로 제외
      };
      
      console.log('메시지 전송:', messageObj);
      webSocketRef.current.send(JSON.stringify(messageObj));
      
      // 메시지 전송 후 입력창 초기화
      setNewMessage('');
      
      // 자신의 메시지를 바로 화면에 표시 (낙관적 UI 업데이트)
      // 서버에서 반환하는 형식과 일치하게 구성
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender: { 
          id: parseInt(userId),
          nickname: localStorage.getItem('userNickname') || '나'
        },
        content: newMessage.trim(),
        sentAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
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
        setIsChatOpen(true);
        
        // 이미 연결된 웹소켓이 없거나 닫혀있는 경우에만 새 연결 시도
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
          try {
            console.log('웹소켓 연결 시도(토글):', chatRoom.id);
            webSocketRef.current = setupWebSocket(chatRoom.id);
          } catch (error) {
            console.error('웹소켓 설정 오류:', error);
            setSocketError('웹소켓 연결에 실패했습니다.');
          }
        }
        
        // 메시지를 로드합니다
        await loadChatMessages(chatRoom.id);
        
        // 화면을 하단으로 스크롤합니다
        setTimeout(scrollToBottom, 300);
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
        webSocketRef.current = null;
      }
      
      try {
        // 새 웹소켓 연결 설정
        webSocketRef.current = setupWebSocket(chatRoom.id);
      } catch (error) {
        console.error('웹소켓 설정 오류:', error);
        setSocketError('웹소켓 연결에 실패했습니다.');
      }
      
      // 채팅 메시지 로드
      loadChatMessages(chatRoom.id);
    }
    
    // 컴포넌트가 언마운트되거나 채팅방이 변경될 때 웹소켓 연결 종료
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
                            console.log('채팅방 선택됨:', room);
                            setChatRoom(room);
                            setIsChatOpen(true);
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
              disabled={!socketConnected}
            />
            <button
              type="submit"
              className={`text-white rounded-r-lg px-3 py-2 ${
                socketConnected ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!socketConnected || !newMessage.trim()}
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