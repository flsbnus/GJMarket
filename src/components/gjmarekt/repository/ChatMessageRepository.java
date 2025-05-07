package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.ChatMessage;
import kr.ac.hansung.cse.gjmarekt.entity.ChatRoom;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Integer chatRoomId);


    // 채팅방 화면에 처음 들어왔을 때 몇개의 채팅 내역을 보여준다
    List<ChatMessage> findByChatRoomIdOrderBySentAtDesc(Integer chatRoomId, Pageable pageable);


    // 특정 id 이전의 채팅을 보여준다.
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatRoom.id = :chatRoomId AND cm.id < :cursor ORDER BY cm.id DESC")
    List<ChatMessage> findByChatRoomIdAndIdBefore(@Param("chatRoomId") Integer chatRoomId, @Param("cursor") Integer cursor, Pageable pageable);
}
