package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface WishlistRepository extends JpaRepository<Wishlist, Integer> {
    List<Wishlist> findByUserId(Integer userId);

    @Transactional
    void deleteByUserIdAndPostId(Integer userId,Integer postId);

    boolean existsByUserAndPost(GJUser user, Post post);
}
