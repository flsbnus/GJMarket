package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.entity.Wishlist;
import kr.ac.hansung.cse.gjmarekt.repository.PostRepository;
import kr.ac.hansung.cse.gjmarekt.repository.UserRepository;
import kr.ac.hansung.cse.gjmarekt.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishlistService {
    @Autowired
    private WishlistRepository wishlistRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PostRepository postRepository;

    // 찜 추가
    @Transactional
    public Wishlist addToWishlist(Integer userId, Integer postId) {
        GJUser user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID: " + userId));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 중복 찜 확인
        if (wishlistRepository.existsByUserAndPost(user, post)) {
            throw new IllegalArgumentException("Already added to wishlist.");
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setPost(post);

        // Post 엔티티의 wishlistCount 증가
        post.increaseWishlistCount();
        postRepository.save(post);

        return wishlistRepository.save(wishlist);
    }

    // userId로 찜목록 찾기
    public List<Wishlist> getWishlistByUserId(Integer userId) {
        return wishlistRepository.findByUserId(userId);
    }

    // 찜 삭제
    @Transactional
    public void removeFromWishlist(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // Post 엔티티의 wishlistCount 감소
        post.decreaseWishlistCount();
        postRepository.save(post); // 변경된 Post 엔티티 저장

//        wishlistRepository.deleteById(wishlistId);
        wishlistRepository.deleteByUserIdAndPostId(userId, postId);
    }
}
