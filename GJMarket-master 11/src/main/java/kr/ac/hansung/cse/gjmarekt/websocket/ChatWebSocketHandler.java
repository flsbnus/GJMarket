package kr.ac.hansung.cse.gjmarekt.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import kr.ac.hansung.cse.gjmarekt.dto.ChatMessageDTO;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ChatMessageService;
import kr.ac.hansung.cse.gjmarekt.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatMessageService chatMessageService;
    private final ObjectMapper objectMapper;
    private final JWTUtil jwtUtil;
    private final UserService userService;

    private final Map<Integer, Map<WebSocketSession, Integer>> chatRoomSessions = new ConcurrentHashMap<>(); // 채팅방별 세션 관리

    @Autowired
    public ChatWebSocketHandler(ChatMessageService chatMessageService, ObjectMapper objectMapper, JWTUtil jwtUtil, UserService userService) {
        this.chatMessageService = chatMessageService;
        this.objectMapper = objectMapper;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 연결은 수립되었지만 아직 인증되지 않은 상태
//        String token = session.getHandshakeHeaders().getFirst("Authorization").split(" ")[1];
//        Integer userId = jwtUtil.getUserId(token);
//        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
//
//        chatRoomSessions.computeIfAbsent(chatRoomId, k -> new ConcurrentHashMap<>()).put(session, userId); // 세션 저장
//
//        System.out.println("WebSocket opened: " + session.getId() + ", chatRoomId: " + chatRoomId + ", userId: " + userId);

        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
        Integer userId = null; // userId는 Authorization 헤더가 있을 경우에만 설정

        // 세션의 Attributes에 chatRoomId 저장 (인증 상태와 관계없이 필요)
        session.getAttributes().put("chatRoomId", chatRoomId);

        String authHeader = session.getHandshakeHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // Authorization 헤더가 있고 "Bearer "로 시작하는 경우 (앱 으로 접속하면 여기로 옴)
            String token = authHeader.split(" ")[1];
            userId = jwtUtil.getUserId(token);

            // 세션의 Attributes에 userId와 인증 상태 저장
            session.getAttributes().put("userId", userId);
            session.getAttributes().put("authenticated", true);

            // 세션을 userId와 함께 저장
            chatRoomSessions.computeIfAbsent(chatRoomId, k -> new ConcurrentHashMap<>()).put(session, userId); //세션 저장

            System.out.println("WebSocket opened (App/Authenticated): " + session.getId() + ", chatRoomId: " + chatRoomId + ", userId: " + userId);

        } else {
            // Authorization 헤더가 없거나 형식이 다른 경우 (브라우저 또는 인증되지 않음)
            session.getAttributes().put("authenticated", false);
            System.out.println("WebSocket opened (Unauthenticated - waiting for auth message): "
                    + session.getId() + ", chatRoomId: " + chatRoomId);
            // 이 시점에는 chatRoomSessions에 추가하지 않습니다.
            // 첫 인증 메시지 수신 후 handleTextMessage에서 추가할 것입니다.
        }
    }


    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 세션의 Attributes에서 정보 가져오기
        Integer chatRoomId = (Integer) session.getAttributes().get("chatRoomId");
        Boolean isAuthenticated = (Boolean) session.getAttributes().get("authenticated");

        if (chatRoomId == null) {
            // chatRoomId가 없는 비정상적인 세션이므로 닫습니다.
            System.err.println("handleTextMessage received message from session without chatRoomId: " + session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if (isAuthenticated != null && !isAuthenticated) {
            // 아직 인증되지 않은 세션의 첫 메시지 (인증 시도)

            // 메시지 페이로드를 토큰으로 간주
            String fullPayload = message.getPayload();
            String token = fullPayload.split(" ")[1]; // "Bearer " 뒤의 실제 토큰 부분만 추출
            Integer userId = jwtUtil.getUserId(token);

            // 인증 성공
            session.getAttributes().put("userId", userId);
            session.getAttributes().put("authenticated", true);

            // 세션을 chatRoomId와 userId로 chatRoomSessions에 저장
            chatRoomSessions.computeIfAbsent(chatRoomId, k -> new ConcurrentHashMap<>()).put(session, userId);

            System.out.println("Session authenticated successfully: " + session.getId() + ", userId: " + userId);

            // 클라이언트에 인증 성공 메시지 전송 (선택 사항)
            session.sendMessage(new TextMessage("Authentication successful!"));

            // 이제 이 세션은 인증되었으므로, 이후 메시지는 일반 채팅 메시지로 처리됩니다.

        } else if (isAuthenticated != null && isAuthenticated) {
            // 이미 인증된 세션의 일반 채팅 메시지
            Integer userId = (Integer) session.getAttributes().get("userId");
//            Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
            System.out.println("chatRoomId: " + chatRoomId + ", userId: " + userId);
            String content = message.getPayload(); // 클라이언트에서 보낸 메시지 (채팅 글)
            System.out.println("Chat Message: " + content);

            GJUser sender = userService.getUserById(userId);
            ChatMessageDTO chatMessageDTO = new ChatMessageDTO();
            chatMessageDTO.setContent(content);
            chatMessageDTO.setSender(sender);

            chatMessageService.sendMessage(chatRoomId, userId, content); // 사용자 ID는 JWT에서 추출

            // 채팅방에 있는 모든 사용자에게 메시지 전송
            Map<WebSocketSession, Integer> sessions = chatRoomSessions.get(chatRoomId);
            if (sessions != null) {
                for (WebSocketSession s : sessions.keySet()) {
                    if (s.isOpen()) {
                        GJUser user = userService.getUserById(userId);
                        ChatMessageDTO chatMessageDto = new ChatMessageDTO();
                        chatMessageDto.setSender(user);
                        chatMessageDto.setContent(content);
                        String jsonMessage = objectMapper.writeValueAsString(chatMessageDto);
                        s.sendMessage(new TextMessage(jsonMessage));
                    }
                }
            }


        } else {
            // isAuthenticated 속성이 설정되지 않은 예상치 못한 상황
            System.err.println("Unexpected session state - isAuthenticated is null: " + session.getId());
            session.close(CloseStatus.SERVER_ERROR);
        }



        /*
        String token = session.getHandshakeHeaders().getFirst("Authorization").split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);
        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
        System.out.println("chatRoomId: " + chatRoomId + ", userId: " + userId);
        String content = message.getPayload(); // 클라이언트에서 보낸 메시지 (채팅 글)
        System.out.println("Chat Message: " + content);

        GJUser sender = userService.getUserById(userId);
        ChatMessageDTO chatMessageDTO = new ChatMessageDTO();
        chatMessageDTO.setContent(content);
        chatMessageDTO.setSender(sender);

        chatMessageService.sendMessage(chatRoomId, userId, content); // 사용자 ID는 JWT에서 추출

        // 채팅방에 있는 모든 사용자에게 메시지 전송
        Map<WebSocketSession, Integer> sessions = chatRoomSessions.get(chatRoomId);
        if (sessions != null) {
            for (WebSocketSession s : sessions.keySet()) {
                if (s.isOpen()) {
                    GJUser user = userService.getUserById(userId);
                    ChatMessageDTO chatMessageDto = new ChatMessageDTO();
                    chatMessageDto.setSender(user);
                    chatMessageDto.setContent(content);
                    String jsonMessage = objectMapper.writeValueAsString(chatMessageDto);
                    s.sendMessage(new TextMessage(jsonMessage));
                }
            }
        }
        */
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
        chatRoomSessions.get(chatRoomId).remove(session); // 세션 제거
        System.out.println("WebSocket closed: " + session.getId() + ", chatRoomId: " + chatRoomId);
    }
}
