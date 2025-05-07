package kr.ac.hansung.cse.gjmarekt.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class PostImageDTO {
    private MultipartFile image;
//    private Integer sequence;
//    private Boolean thumbnail;
}
