package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.dto.ChatMessageDTO;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ChatMessageService;
import kr.ac.hansung.cse.gjmarekt.service.ChatRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@ResponseBody
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final JWTUtil jwtUtil;
    private final ChatRoomService chatRoomService;


    @Autowired
    public ChatMessageController(ChatMessageService chatMessageService, JWTUtil jwtUtil, ChatRoomService chatRoomService) {
        this.chatMessageService = chatMessageService;
        this.jwtUtil = jwtUtil;
        this.chatRoomService = chatRoomService;
    }

    // 처음 채팅 화면 들어왔을 때 이전 채팅 내역 보여주기
    @GetMapping("/api/chatroom/{chatRoomId}/recent")
    public ResponseEntity<List<ChatMessageDTO>> getRecentMessages(
            @PathVariable Integer chatRoomId, @RequestParam(defaultValue = "20") int size,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        if (!chatRoomService.isUserInChatRoom(userId, chatRoomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ChatMessageDTO> messages = chatMessageService.getRecentMessages(chatRoomId, size);
        return ResponseEntity.ok(messages);
    }

    // 스크롤을 해서 특정 id를 기준으로 더 이전 채팅 내역 보여주기
    @GetMapping("/api/chatroom/{chatRoomId}/before/{chatId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessagesBeforeCursor(
            @PathVariable Integer chatRoomId,
            @PathVariable Integer chatId,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        if (!chatRoomService.isUserInChatRoom(userId, chatRoomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ChatMessageDTO> messages = chatMessageService.getMessagesBeforeCursor(chatRoomId, chatId, size);
        return ResponseEntity.ok(messages);
    }
}
