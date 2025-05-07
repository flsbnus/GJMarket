// websocket-handler.js
// 웹소켓 연결을 직접 관리하는 유틸리티 함수들

// 전역 웹소켓 객체
let webSocket = null;
let messageListeners = [];
let isConnected = false;
let reconnectTimeout = null;
let currentChatRoomId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// 백엔드 서버 URL (포트 8080으로 고정)
const BACKEND_WS_URL = 'ws://localhost:8080';

// 웹소켓 연결 함수
export const connectWebSocket = (roomId, token) => {
  // 재연결 시도 횟수 초기화 (새 연결 시)
  if (currentChatRoomId !== roomId) {
    reconnectAttempts = 0;
  }
  
  // 이미 같은 채팅방에 연결된 경우 처리
  if (webSocket && webSocket.readyState === WebSocket.OPEN && currentChatRoomId === roomId) {
    console.log('이미 웹소켓이 연결되어 있습니다.');
    return true;
  }
  
  // 기존 연결 종료
  if (webSocket) {
    console.log('기존 웹소켓 연결 종료');
    webSocket.close();
    webSocket = null;
  }
  
  // 재연결 타이머 제거
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  currentChatRoomId = roomId;
  
  try {
    // 웹소켓 URL 설정 - localhost 사용
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}`;
    console.log('웹소켓 연결 URL:', wsUrl);
    
    // 웹소켓 객체 생성
    webSocket = new WebSocket(wsUrl);
    
    // 웹소켓 이벤트 핸들러
    webSocket.onopen = () => {
      console.log('웹소켓 연결 성공!');
      isConnected = false; // 인증 전까지는 연결 상태를 false로 유지
      
      // 연결 성공 시 인증 메시지 전송
      if (token) {
        try {
          // 토큰에서 'Bearer ' 접두사 제거
          const cleanToken = token.replace('Bearer ', '');
          webSocket.send(`Bearer ${cleanToken}`);
          console.log('인증 메시지 전송 완료');
        } catch (error) {
          console.error('인증 메시지 전송 오류:', error);
          webSocket.close();
        }
      }
    };
    
    webSocket.onmessage = (event) => {
      try {
        // 인증 성공 메시지 처리
        if (event.data === "Authentication successful!") {
          console.log('인증 성공');
          isConnected = true;
          reconnectAttempts = 0; // 연결 성공 시 재시도 횟수 초기화
          triggerConnectionStatusChange(true);
          return;
        }
        
        // 일반 메시지 처리
        const data = JSON.parse(event.data);
        console.log('웹소켓 메시지 수신:', data);
        
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
    
    webSocket.onclose = (event) => {
      console.log('웹소켓 연결 종료:', event.code, event.reason);
      isConnected = false;
      
      // 연결 종료 이벤트 발생
      triggerConnectionStatusChange(false);
      
      // 비정상 종료인 경우 재연결 시도 (최대 시도 횟수 제한)
      if (event.code !== 1000) {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`웹소켓 연결이 의도치 않게 종료되었습니다. 재연결 시도...`);
          console.log(`재연결 시도 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          
          // 지수 백오프 시간 계산 (1초, 2초, 4초)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 4000);
          reconnectTimeout = setTimeout(() => {
            if (token) {
              connectWebSocket(roomId, token);
            }
          }, delay);
        } else {
          console.log('최대 재연결 시도 횟수에 도달했습니다.');
          // 최대 시도 횟수 도달 시 사용자에게 알림
          const event = new CustomEvent('websocketMaxRetriesReached');
          window.dispatchEvent(event);
        }
      }
    };
    
    webSocket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      isConnected = false;
      triggerConnectionStatusChange(false);
    };
    
    return true;
  } catch (error) {
    console.error('웹소켓 연결 오류:', error);
    isConnected = false;
    triggerConnectionStatusChange(false);
    return false;
  }
};

// 메시지 전송 함수
export const sendMessage = (message) => {
  if (webSocket && webSocket.readyState === WebSocket.OPEN) {
    try {
      webSocket.send(message);
      return true;
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      return false;
    }
  }
  return false;
};

// JSON 메시지 전송 함수
export const sendJsonMessage = (messageObj) => {
  if (webSocket && webSocket.readyState === WebSocket.OPEN) {
    try {
      webSocket.send(JSON.stringify(messageObj));
      return true;
    } catch (error) {
      console.error('JSON 메시지 전송 오류:', error);
      return false;
    }
  }
  return false;
};

// 메시지 리스너 등록 함수
export const addMessageListener = (callback) => {
  if (typeof callback === 'function') {
    messageListeners.push(callback);
  }
  
  // 리스너 제거 함수 반환
  return () => {
    messageListeners = messageListeners.filter(listener => listener !== callback);
  };
};

// 연결 상태 변경 이벤트 발생 함수
const triggerConnectionStatusChange = (status) => {
  // 커스텀 이벤트를 발생시켜 다른 컴포넌트에서 감지할 수 있게 함
  const event = new CustomEvent('websocketStatusChange', { detail: { connected: status } });
  window.dispatchEvent(event);
};

// 연결 상태 확인 함수
export const isWebSocketConnected = () => {
  return isConnected;
};

// 현재 연결된 채팅방 ID 확인 함수
export const getCurrentChatRoomId = () => {
  return currentChatRoomId;
};

// 연결 종료 함수
export const disconnectWebSocket = () => {
  if (webSocket) {
    webSocket.close();
    webSocket = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  isConnected = false;
  currentChatRoomId = null;
  triggerConnectionStatusChange(false);
};