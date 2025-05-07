package kr.ac.hansung.cse.gjmarekt.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Setter
@Getter
public class SignUpDTO {

    private String email;
    private String password;
    private String nickname;
    // 프로필 사진 파일
    private MultipartFile profileImage;
}
