package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.dto.ChatMessageDTO;
import kr.ac.hansung.cse.gjmarekt.entity.ChatMessage;
import kr.ac.hansung.cse.gjmarekt.entity.ChatRoom;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomService chatRoomService;
    private final UserService userService;

    @Autowired
    public ChatMessageService(ChatMessageRepository chatMessageRepository, ChatRoomService chatRoomService, UserService userService) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomService = chatRoomService;
        this.userService = userService;
    }

    @Transactional
    public ChatMessage sendMessage(Integer chatRoomId, Integer senderId, String content) {
        System.out.println("ChatMessageService.sendMessage"+chatRoomId);
        GJUser sender = userService.getUserById(senderId);
        ChatRoom chatRoom = chatRoomService.getChatRoomById(chatRoomId);

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setChatRoom(chatRoom);
        chatMessage.setSender(sender);
        chatMessage.setContent(content);
        chatMessage.setSentAt(LocalDateTime.now());
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getMessagesByChatRoomId(Integer chatRoomId) {
        return chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(chatRoomId);
    }

    // 처음 채팅방 접속시 이전 채팅내역 불러오기
    public List<ChatMessageDTO> getRecentMessages(Integer chatRoomId, int size) {
        Pageable pageable = PageRequest.of(0, size);
        List<ChatMessage> chatMessages = chatMessageRepository.findByChatRoomIdOrderBySentAtDesc(chatRoomId, pageable);
        return convertToDTOList(chatMessages);
    }
    // 특정 id이전 채팅내역 불러오기
    public List<ChatMessageDTO> getMessagesBeforeCursor(Integer chatRoomId, Integer cursor, int size) {
        Pageable pageable = PageRequest.of(0, size);
        List<ChatMessage> chatMessages = chatMessageRepository.findByChatRoomIdAndIdBefore(chatRoomId, cursor, pageable);
        return convertToDTOList(chatMessages);
    }

    private List<ChatMessageDTO> convertToDTOList(List<ChatMessage> chatMessages) {
        List<ChatMessageDTO> chatMessageDTOs = new ArrayList<>();
        for (ChatMessage chatMessage : chatMessages) {
            ChatMessageDTO dto = new ChatMessageDTO();
            dto.setId(chatMessage.getId());
            dto.setContent(chatMessage.getContent());
            dto.setSender(chatMessage.getSender());
            dto.setSentAt(chatMessage.getSentAt());
            chatMessageDTOs.add(dto);
        }
        return chatMessageDTOs;
    }
}
