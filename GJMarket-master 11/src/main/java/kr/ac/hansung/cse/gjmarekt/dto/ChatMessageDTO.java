package kr.ac.hansung.cse.gjmarekt.dto;

import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ChatMessageDTO {
    private Integer id;
    private GJUser sender;
    private String content;
    private LocalDateTime sentAt;
}
