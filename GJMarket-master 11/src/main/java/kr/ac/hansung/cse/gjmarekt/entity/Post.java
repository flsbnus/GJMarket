package kr.ac.hansung.cse.gjmarekt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class) // Auditing 사용
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    // 글 작성자
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private GJUser user;

    // 생성일시, 수정 불가
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 마지막 수정일시
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 가격, 0일경우 나눔
    @Column(nullable = false)
    private int price;

    // 조회수 기본값 0
    @Column(nullable = false, columnDefinition = "integer default 0")
    private int viewCount;

    // 위시리스트수 기본값 0
    @Column(nullable = false, columnDefinition = "integer default 0")
    private int wishlistCount;

    // 판매 상태 (기본값: 판매중)
    private int status = PostStatus.SALE;

    // 상태 0:판매중 1:예약중 2:판매완료
    public static class PostStatus {
        public static final int SALE = 0; // 판매중
        public static final int RESERVED = 1; // 예약중
        public static final int SOLD = 2; // 판매 완료
    }

    // 사진을 저장하기 위한 필드
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<PostImage> images;

    @JsonIgnore
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Wishlist> wishlists = new ArrayList<>();

    // 조회 수 올리기
    public void increaseViewCount() {
        this.viewCount++;
    }
    // 위시리스트 수 올리기
    public void increaseWishlistCount() {
        this.wishlistCount++;
    }

    // 위시리스트 수 줄이기
    public void decreaseWishlistCount() {
        if (this.wishlistCount > 0) {
            this.wishlistCount--;
        } else {
            throw new IllegalStateException("Wishlist count cannot be negative.");
        }
    }
}
