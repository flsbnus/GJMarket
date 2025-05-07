package com.example.gjmarket.service;

import com.example.gjmarket.entity.Post;
import com.example.gjmarket.repository.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public ResponseEntity<Post> findPostById(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // 조회수 증가
        post.increaseViewCount();
        postRepository.save(post);

        return ResponseEntity.ok(post);
    }
} 