package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {
    Optional<ChatRoom> findByPostIdAndSellerIdAndBuyerId(Integer postId, Integer sellerId, Integer buyerId);

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.seller.id = :userId OR cr.buyer.id = :userId")
    List<ChatRoom> findChatRoomsByUserId(@Param("userId") Integer userId);


    Optional<ChatRoom> findByPostIdAndBuyerId(Integer postId, Integer buyerId);
}
