package kr.ac.hansung.cse.gjmarekt.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PostDTO {
    private Integer id;
    private String title;
    private String content;
    private Integer userId;
    private Integer price;
    private Integer status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int viewCount;
    private int wishlistCount;

    private Integer chatRoomId;
}
