package kr.ac.hansung.cse.gjmarekt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_images")
@Getter
@Setter
public class PostImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post; // 필드 이름: post

    private String imageUrl;

    private Integer sequence;
}
