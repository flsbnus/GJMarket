package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {

    Page<Post> findAll(Pageable pageable);


    List<Post> findAllByOrderByIdDesc(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.id < :cursor ORDER BY p.id DESC")
    List<Post> findPostsBeforeCursor(@Param("cursor") Integer cursor, Pageable pageable);
}
