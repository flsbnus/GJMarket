package kr.ac.hansung.cse.gjmarekt.service;


import kr.ac.hansung.cse.gjmarekt.entity.ChatMessage;
import kr.ac.hansung.cse.gjmarekt.entity.ChatRoom;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.repository.ChatMessageRepository;
import kr.ac.hansung.cse.gjmarekt.repository.ChatRoomRepository;
import kr.ac.hansung.cse.gjmarekt.repository.PostRepository;
import kr.ac.hansung.cse.gjmarekt.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ChatRoomService {
    private ChatRoomRepository chatRoomRepository;
    private PostRepository postRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatRoomService(ChatRoomRepository chatRoomRepository, PostRepository postRepository, UserRepository userRepository, ChatMessageRepository chatMessageRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    // 채팅방 만들기
    @Transactional
    public ChatRoom createChatRoom(Integer postId, Integer buyerId) {
        // post찾기
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // 판매자의 userID찾기
        Integer sellerId = post.getUser().getId();

        GJUser seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GJUser buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (post.getUser().getId().equals(buyerId)) {
            throw new IllegalArgumentException("판매자와 구매자는 동일할 수 없습니다.");
        }

        // 중복 확인
        Optional<ChatRoom> existingChatRoom = chatRoomRepository.findByPostIdAndSellerIdAndBuyerId(postId, sellerId, buyerId);
        if (existingChatRoom.isPresent()) {
            return existingChatRoom.get(); // 이미 존재하면 기존 채팅방 반환
        }

        ChatRoom chatRoom = new ChatRoom();
        chatRoom.setPostId(postId);
        chatRoom.setSeller(seller);
        chatRoom.setBuyer(buyer);
        System.out.println("asfasdfafsd buyid" + buyerId);
        return chatRoomRepository.save(chatRoom);
    }

    @Transactional
    public ChatRoom getChatRoomById(Integer chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));
    }


    public List<ChatRoom> getChatRoomsByUserId(Integer userId) {
        return chatRoomRepository.findChatRoomsByUserId(userId);
    }

    // 특정 유저가 채팅방 내에 있는지 확인
    public boolean isUserInChatRoom(Integer userId, Integer chatRoomId) {
        Optional<ChatRoom> chatRoom = chatRoomRepository.findById(chatRoomId);
        if (chatRoom.isPresent()) {
            return chatRoom.get().getSeller().getId().equals(userId) || chatRoom.get().getBuyer().getId().equals(userId);
        }
        return false;
    }

    // 게시물 조회시 특정 유저가 채팅방이 이미 있는지 확인 할 때 사용
    public Integer getChatRoomIdByPostIdAndBuyerId(Integer postId, Integer buyerId) {
        Optional<ChatRoom> chatRoom = chatRoomRepository.findByPostIdAndBuyerId(postId, buyerId);
        return chatRoom.map(ChatRoom::getId).orElse(null);
    }

}
