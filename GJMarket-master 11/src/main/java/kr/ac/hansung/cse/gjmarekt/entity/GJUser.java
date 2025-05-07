package kr.ac.hansung.cse.gjmarekt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name="users")
@Getter
@Setter
@NoArgsConstructor
public class GJUser {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @Column(nullable=false)
    private String password;

    @Column(nullable=false, unique=true)
    private String email;

    @Column(nullable=false)
    private String nickname;

    // 프로필 사진 경로
    // 프로필 사진은 필수가 아님
    @Column(nullable = true)
    private String profileImageUrl;


    @JsonIgnore
    @ManyToMany(cascade=CascadeType.MERGE)
    @JoinTable(
            name="user_role",
            joinColumns={@JoinColumn(name="USER_ID", referencedColumnName="ID")},
            inverseJoinColumns={@JoinColumn(name="ROLE_ID", referencedColumnName="ID")})
    private List<GJRole>  roles;


    // 사용자 삭제시 게시물도 삭제
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts;


    // 채팅 관련
    @OneToMany(mappedBy = "seller")
    @JsonIgnore
    private List<ChatRoom> sellerChatRooms;

    @OneToMany(mappedBy = "buyer")
    @JsonIgnore
    private List<ChatRoom> buyerChatRooms;


    // 별점
    @Column(name = "rating")
    private Float rating;
}
