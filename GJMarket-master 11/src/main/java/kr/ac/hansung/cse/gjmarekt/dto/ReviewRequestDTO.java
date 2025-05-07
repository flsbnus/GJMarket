package kr.ac.hansung.cse.gjmarekt.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequestDTO {
    private Integer rating;
    private String comment;
}
