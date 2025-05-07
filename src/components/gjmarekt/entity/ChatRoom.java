package kr.ac.hansung.cse.gjmarekt.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_rooms")
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class) // Auditing 사용
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "post_id")
    private Integer postId;

    @ManyToOne
    @JsonManagedReference
    @JoinColumn(name = "seller_id", nullable = false)
    private GJUser seller;

    @ManyToOne
    @JsonManagedReference
    @JoinColumn(name = "buyer_id", nullable = false)
    private GJUser buyer;

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
