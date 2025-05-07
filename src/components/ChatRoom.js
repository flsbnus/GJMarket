import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './ChatRoom.css';

const API_BASE_URL = '/api';

const ChatRoom = () => {
    const { chatRoomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [chatRooms, setChatRooms] = useState([]);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // JWT 토큰 유효성 검사
    const validateToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                throw new Error('토큰이 만료되었습니다');
            }
            return decoded;
        } catch (error) {
            console.error('토큰 검증 실패:', error);
            localStorage.removeItem('token');
            navigate('/signin');
            return null;
        }
    };

    // 채팅방 목록 가져오기
    const fetchChatRooms = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/signin');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/chatrooms`, {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('채팅방 목록을 가져오는데 실패했습니다');
            }
            
            const data = await response.json();
            setChatRooms(data);
        } catch (error) {
            console.error('채팅방 목록 조회 실패:', error);
            setError(error.message);
        }
    };

    // 메시지 저장 함수
    const saveMessage = async (content) => {
        const token = localStorage.getItem('token');
        if (!token || !chatRoomId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/chatroom/${chatRoomId}/message`, {
                method: 'POST',
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content,
                    isRead: false // 기본적으로 읽지 않은 상태로 저장
                })
            });

            if (!response.ok) {
                throw new Error('메시지 저장에 실패했습니다');
            }

            const savedMessage = await response.json();
            setMessages(prev => [...prev, savedMessage]);
            
            // 상대방이 온라인인 경우에만 실시간으로 전송
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'NEW_MESSAGE',
                    message: savedMessage
                }));
            }
        } catch (error) {
            console.error('메시지 저장 실패:', error);
            setError('메시지 저장에 실패했습니다');
        }
    };

    // 메시지 읽음 상태 업데이트
    const updateMessageReadStatus = async (messageId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await fetch(`${API_BASE_URL}/chatroom/${chatRoomId}/message/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('메시지 읽음 상태 업데이트 실패:', error);
        }
    };

    // 읽지 않은 메시지 수 가져오기
    const fetchUnreadCount = async () => {
        const token = localStorage.getItem('token');
        if (!token || !chatRoomId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/chatroom/${chatRoomId}/unread-count`, {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('읽지 않은 메시지 수 조회 실패:', error);
        }
    };

    // 메시지 전송 함수
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            await saveMessage(message);
            setMessage('');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            setError('메시지 전송에 실패했습니다');
        }
    };

    // 메시지 로드 함수
    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!token || !chatRoomId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/chatroom/${chatRoomId}/messages`, {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('메시지 로드에 실패했습니다');
            }

            const loadedMessages = await response.json();
            setMessages(loadedMessages);
        } catch (error) {
            console.error('메시지 로드 실패:', error);
            setError('메시지 로드에 실패했습니다');
        }
    };

    // 웹소켓 연결
    const connectWebSocket = () => {
        const token = localStorage.getItem('token');
        if (!token || !chatRoomId) return;

        try {
            const wsUrl = `ws://localhost:8080/ws/chat/${chatRoomId}?token=${token}`;
            console.log('Connecting to WebSocket:', wsUrl);
            
            ws.current = new WebSocket(wsUrl);
            
            ws.current.onopen = () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
                
                // 연결 시 읽지 않은 메시지 수 확인
                fetchUnreadCount();
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received WebSocket message:', data);

                    if (data.type === 'NEW_MESSAGE') {
                        setMessages(prev => [...prev, data.message]);
                        // 내가 보낸 메시지가 아닌 경우에만 읽음 상태 업데이트
                        if (data.message.sender.id !== user?.id) {
                            updateMessageReadStatus(data.message.id);
                        }
                    } else if (data.type === 'USER_STATUS') {
                        // 상대방의 온라인/오프라인 상태 업데이트
                        console.log('User status changed:', data.status);
                    }
                } catch (error) {
                    console.error('메시지 파싱 실패:', error);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
                
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current += 1;
                    console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
                    setTimeout(connectWebSocket, 3000 * reconnectAttempts.current);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setError('웹소켓 연결 중 오류가 발생했습니다');
            };
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            setError('웹소켓 연결에 실패했습니다');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/signin');
            return;
        }

        const decoded = validateToken(token);
        if (!decoded) return;

        setUser(decoded);
        fetchChatRooms();

        if (chatRoomId) {
            loadMessages();
            connectWebSocket();
            fetchUnreadCount();
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [chatRoomId, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => setError(null)}>닫기</button>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-rooms">
                <h3>채팅방 목록</h3>
                {chatRooms.map(room => (
                    <div 
                        key={room.id} 
                        className={`chat-room-item ${room.id === parseInt(chatRoomId) ? 'active' : ''}`}
                        onClick={() => navigate(`/chat/${room.id}`)}
                    >
                        {room.name || `채팅방 ${room.id}`}
                        {room.unreadCount > 0 && (
                            <span className="unread-badge">{room.unreadCount}</span>
                        )}
                    </div>
                ))}
            </div>
            <div className="chat-room">
                <div className="chat-header">
                    <h3>채팅방</h3>
                    <div className="connection-status">
                        {isConnected ? '연결됨' : '연결 중...'}
                    </div>
                </div>
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender.id === user?.id ? 'sent' : 'received'}`}>
                            <div className="message-sender">{msg.sender.username}</div>
                            <div className="message-content">{msg.content}</div>
                            <div className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                                {!msg.isRead && msg.sender.id === user?.id && (
                                    <span className="unread-indicator">읽지 않음</span>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="chat-input">
                    <input
                        type="text"
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="메시지를 입력하세요..."
                        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
                        전송
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom; 