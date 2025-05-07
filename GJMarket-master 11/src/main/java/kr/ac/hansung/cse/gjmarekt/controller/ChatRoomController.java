package kr.ac.hansung.cse.gjmarekt.controller;


import kr.ac.hansung.cse.gjmarekt.entity.ChatRoom;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ChatMessageService;
import kr.ac.hansung.cse.gjmarekt.service.ChatRoomService;
import kr.ac.hansung.cse.gjmarekt.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@ResponseBody
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final PostService postService;
    private final JWTUtil jwtUtil;

    public ChatRoomController(ChatRoomService chatRoomService, ChatMessageService chatMessageService, PostService postService, JWTUtil jwtUtil) {
        this.chatRoomService = chatRoomService;
        this.postService = postService;
        this.jwtUtil = jwtUtil;
    }

    // 채팅방 만들기
    @PostMapping("/api/post/{postId}/chatroom")
    public ResponseEntity<ChatRoom> createChatRoom(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

//        Post post=postService.getPostById(postId);
//        post.getUser().getId().equals(userId);


        ChatRoom chatRoom = chatRoomService.createChatRoom(postId, userId);

        return new ResponseEntity<>(chatRoom, HttpStatus.CREATED);
    }

    // 특정 유저의 채팅방 목록 찾기
    @GetMapping("/api/users/{userId}/chatrooms")
    public ResponseEntity<List<ChatRoom>> getChatRoomsByUserId(
            //@PathVariable Integer userId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        List<ChatRoom> chatRooms = chatRoomService.getChatRoomsByUserId(userId);
        return ResponseEntity.ok(chatRooms);
    }
}
