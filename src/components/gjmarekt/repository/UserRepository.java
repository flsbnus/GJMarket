package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<GJUser, Integer> {
    Optional<GJUser> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE GJUser u SET u.rating = :rating WHERE u.id = :userId")
    void updateUserRating(@Param("userId") Integer userId, @Param("rating") Float rating);
}
