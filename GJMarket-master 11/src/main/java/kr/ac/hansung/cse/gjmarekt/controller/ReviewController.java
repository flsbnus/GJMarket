package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.dto.ReviewRequestDTO;
import kr.ac.hansung.cse.gjmarekt.entity.Review;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@ResponseBody
public class ReviewController {
    private final ReviewService reviewService;
    private final JWTUtil jwtUtil;

    @Autowired
    public ReviewController(ReviewService reviewService, JWTUtil jwtUtil) {
        this.reviewService = reviewService;
        this.jwtUtil = jwtUtil;
    }

    // 리뷰 남기기
    @PostMapping("api/posts/{postId}/reviews/{revieweeId}")
    public ResponseEntity<Review> createReview(
            @PathVariable Integer postId,
            @PathVariable Integer revieweeId,
            ReviewRequestDTO reviewRequestDTO,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer reviewerId = jwtUtil.getUserId(token);

        try {
            Review review = reviewService.createReview(postId, reviewerId, revieweeId, reviewRequestDTO.getRating(), reviewRequestDTO.getComment());
            return new ResponseEntity<>(review, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

    }

    // 내가 보낸 리뷰
    @GetMapping("/api/reviews/sent")
    public ResponseEntity<List<Review>> getSentReviews(
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);


        List<Review> reviews = reviewService.getReviewsByReviewerId(userId);
        return ResponseEntity.ok(reviews);
    }

    // 내가 받은 리뷰
    @GetMapping("/api/reviews/received")
    public ResponseEntity<List<Review>> getReceivedReviews(
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        List<Review> reviews = reviewService.getReviewsByRevieweeId(userId);
        return ResponseEntity.ok(reviews);
    }

    // 특정 유저가 받은 리뷰 목록 보기
    @GetMapping("/api/users/{userId}/reviews")
    public ResponseEntity<List<Review>> getReviewsByUser(
            @PathVariable Integer userId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer requesterId = jwtUtil.getUserId(token);


        List<Review> reviews = reviewService.getReviewsByRevieweeId(userId);
        return ResponseEntity.ok(reviews);
    }

    // 리뷰 수정
    @PutMapping("/api/reviews/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable Integer reviewId,
            ReviewRequestDTO reviewRequestDTO,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer reviewerId = jwtUtil.getUserId(token);

        Review updatedReview = reviewService.updateReview(reviewId, reviewerId, reviewRequestDTO.getRating(), reviewRequestDTO.getComment());
        return ResponseEntity.ok(updatedReview);
    }

    // 리뷰 일부 수정
    @PatchMapping("/api/reviews/{reviewId}")
    public ResponseEntity<Review> patchReview(
            @PathVariable Integer reviewId,
            ReviewRequestDTO reviewRequestDTO,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer reviewerId = jwtUtil.getUserId(token);

        Review patchedReview = reviewService.patchReview(reviewId, reviewerId, reviewRequestDTO.getRating(), reviewRequestDTO.getComment());
        return ResponseEntity.ok(patchedReview);
    }

    // 리뷰 삭제
    @DeleteMapping("/api/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Integer reviewId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer reviewerId = jwtUtil.getUserId(token);

        reviewService.deleteReview(reviewId, reviewerId);
        return ResponseEntity.ok().build();
    }
}
