package kr.ac.hansung.cse.gjmarekt.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
    // user정보 전달을 위한 DTO password정보는 없다
    private Integer id;
    private String email;
    private String nickname;
    private String profileImageUrl;
}
