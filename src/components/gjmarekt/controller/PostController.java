package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.dto.ChatMessageDTO;
import kr.ac.hansung.cse.gjmarekt.dto.PostDTO;
import kr.ac.hansung.cse.gjmarekt.dto.PostImageDTO;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ChatRoomService;
import kr.ac.hansung.cse.gjmarekt.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Controller
@ResponseBody
public class PostController {

    private final PostService postService;
    private final JWTUtil jwtUtil;
    private final ChatRoomService chatRoomService;

    public PostController(PostService postService, JWTUtil jwtUtil, ChatRoomService chatRoomService) {
        this.postService = postService;
        this.jwtUtil = jwtUtil;
        this.chatRoomService = chatRoomService;
    }

    @PostMapping("/api/post")
    public ResponseEntity<Post> post(
            @RequestHeader("Authorization") String authorization,
            PostDTO postDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        System.out.println("sadfadsfdafsdasf");

        System.out.println(authorization);
        String token = authorization.split(" ")[1];
        // jwt를 이용해 userId를 찾는다
        // 다른사람 글로 위조하는 것을 막기 위함
        Integer userId = jwtUtil.getUserId(token);

        List<PostImageDTO> imageDTOs = new ArrayList<>();
        if (images != null && !images.isEmpty()) { // images가 null이 아니고 비어있지 않은 경우에만 처리
            for (MultipartFile image : images) {
                PostImageDTO postImageDTO = new PostImageDTO();
                postImageDTO.setImage(image);
                imageDTOs.add(postImageDTO);
            }
        }

        Post savedPost = postService.createPost(postDTO, userId, imageDTOs);
        return ResponseEntity.ok(savedPost);
    }


    // 상품 수정
    @PutMapping("/api/post/{postId}")
    public ResponseEntity<Post> updatePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization,
            PostDTO postDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        List<PostImageDTO> imageDTOs = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                PostImageDTO postImageDTO = new PostImageDTO();
                postImageDTO.setImage(image);
                imageDTOs.add(postImageDTO);
            }
        }

        Post updatedPost = postService.updatePost(postId, postDTO, userId, imageDTOs);
        return ResponseEntity.ok(updatedPost);
    }

    // PATCH로 상품 일부 수정
    @PatchMapping("/api/post/{postId}")
    public ResponseEntity<Post> partialUpdatePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization,
            PostDTO postDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        List<PostImageDTO> imageDTOs = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                PostImageDTO postImageDTO = new PostImageDTO();
                postImageDTO.setImage(image);
                imageDTOs.add(postImageDTO);
            }
        }

        Post updatedPost = postService.partialUpdatePost(postId, postDTO, userId, imageDTOs);
        return ResponseEntity.ok(updatedPost);
    }

    // 상품 삭제 요청
    @DeleteMapping("/api/post/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        postService.deletePost(postId, userId);
        return ResponseEntity.noContent().build();
    }


    // 상품 정보 요청
    @GetMapping("/api/post/{postId}")
    public ResponseEntity<Post> getPost(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        System.out.println("postId: " + postId);
        return postService.findPostById(postId);
    }

    // 내가 참여한 채팅방이 있는지 확인
    @GetMapping("/api/posts/{postId}/chatroom")
    public ResponseEntity<Integer> getChatRoomIdByPostIdAndUserId(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        Integer chatRoomId = chatRoomService.getChatRoomIdByPostIdAndBuyerId(postId, userId);
        return ResponseEntity.ok(chatRoomId);
    }

    // 페이지로 상품 정보 요청
    @GetMapping("/api/posts")
    public ResponseEntity<Page<Post>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<Post> posts = postService.getPosts(page, size);
        return new ResponseEntity<>(posts, HttpStatus.OK);
    }

    // 처음 상품 화면 들어왔을 때
    @GetMapping("/api/posts/recent")
    public ResponseEntity<List<Post>> getRecentPosts(
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);


        List<Post> posts = postService.getRecentPosts(size);
        return ResponseEntity.ok(posts);
    }

    // 특정 postid이전의 게시물들을 볼 때 클라이언트에서 스크롤시 사용
    @GetMapping("/api/posts/before/{cursor}")
    public ResponseEntity<List<Post>> getPostsBeforeCursor(
            @PathVariable Integer cursor,
            @RequestParam(defaultValue = "20") int size) {


        List<Post> posts = postService.getPostsBeforeCursor(cursor, size);
        return ResponseEntity.ok(posts);
    }
}
