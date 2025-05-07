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
        String token = session.getHandshakeHeaders().getFirst("Authorization").split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);
        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);

        chatRoomSessions.computeIfAbsent(chatRoomId, k -> new ConcurrentHashMap<>()).put(session, userId); // 세션 저장

        System.out.println("WebSocket opened: " + session.getId() + ", chatRoomId: " + chatRoomId + ", userId: " + userId);
    }


    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
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

    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Integer chatRoomId = Integer.parseInt(session.getUri().getPath().split("/")[3]);
        chatRoomSessions.get(chatRoomId).remove(session); // 세션 제거
        System.out.println("WebSocket closed: " + session.getId() + ", chatRoomId: " + chatRoomId);
    }
}
