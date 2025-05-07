package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.Review;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends CrudRepository<Review, Integer> {
    List<Review> findByRevieweeId(Integer revieweeId);

    List<Review> findByReviewerId(Integer reviewerId);

    Optional<Review> findById(Integer id);
}
