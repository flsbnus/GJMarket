package kr.ac.hansung.cse.gjmarekt.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reviews")
@Getter
@Setter
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "reviewer_id")
    private GJUser reviewer;

    @ManyToOne
    @JoinColumn(name = "reviewee_id")
    private GJUser reviewee;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "comment")
    private String comment;
}
