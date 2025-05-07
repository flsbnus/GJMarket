package kr.ac.hansung.cse.gjmarekt.service;

import jakarta.persistence.EntityNotFoundException;
import kr.ac.hansung.cse.gjmarekt.dto.PostDTO;
import kr.ac.hansung.cse.gjmarekt.dto.PostImageDTO;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.entity.Post;
import kr.ac.hansung.cse.gjmarekt.entity.PostImage;
import kr.ac.hansung.cse.gjmarekt.repository.PostRepository;
import kr.ac.hansung.cse.gjmarekt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.springframework.http.ResponseEntity.ok;

@Service
public class PostService {

    // 이미지 파일이 저장될 경로 (application.properties에서 가져옴)
    @Value("${file.upload.path}")
    private String fileUploadPath;


    private final PostRepository postRepository;
    private final UserService userService;
    private final UserRepository userRepository;


    public PostService(PostRepository postRepository, UserService userService, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Transactional
    public Post createPost(PostDTO postDTO, Integer userId, List<PostImageDTO> imageDTOs) {
        if (imageDTOs != null && imageDTOs.size() > 5) {
            throw new IllegalArgumentException("이미지는 최대 5개까지 첨부할 수 있습니다.");
        }


        GJUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));


        Post post = new Post();
        post.setTitle(postDTO.getTitle());
        post.setContent(postDTO.getContent());
        post.setUser(user);
        post.setPrice(postDTO.getPrice());

        AtomicInteger sequence = new AtomicInteger(0); // 0부터 시작
        List<PostImage> images = imageDTOs.stream()
                .map(dto -> {
                    PostImage postImage = new PostImage();
                    postImage.setPost(post);
                    postImage.setSequence(sequence.getAndIncrement());
                    // 첫 번째 이미지를 썸네일로 설정
                    // 순서가 0번인 이미지를 썸네일로 설정
                    // image.setThumbnail(image.getSequence() == 0);
                    // 썸네일 여부를 저장하지 않으므로, 썸네일 설정 로직 제거
                    MultipartFile file = dto.getImage();
                    if (file != null && !file.isEmpty()) {
                        String originalFilename = file.getOriginalFilename();
                        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                        String uuid = UUID.randomUUID().toString();
                        String filename = uuid + extension;
                        Path filePath = Paths.get(fileUploadPath, filename);

                        try {
                            Files.copy(file.getInputStream(), filePath);
                            postImage.setImageUrl(filename);
                        } catch (IOException e) {
                            throw new RuntimeException("이미지 저장에 실패했습니다.", e);
                        }
                    }

                    return postImage;
                })
                .collect(Collectors.toList());


        post.setImages(images);
        Post savedpost = postRepository.save(post);
        return savedpost;
    }

    @Transactional
    public Post updatePost(Integer postId, PostDTO postDTO, Integer userId, List<PostImageDTO> imageDTOs) {
        GJUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // postId를 통해 수정할 post를 찾는다
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        //post의 userid가 다르면 막아야 한다.
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("User not authorized to update this post");
        }

        post.setTitle(postDTO.getTitle());
        post.setContent(postDTO.getContent());
        post.setPrice(postDTO.getPrice());
        post.setStatus(postDTO.getStatus());

        if (imageDTOs == null || imageDTOs.isEmpty()) {
            // 이미지가 없는 경우 기존 이미지 삭제
            post.getImages().clear();
        }
        // 이미지 수정
        if (imageDTOs != null && !imageDTOs.isEmpty()) {
            // 기존 이미지 삭제
            post.getImages().clear();
            // 새로운 이미지 추가
            AtomicInteger sequence = new AtomicInteger(0);
            List<PostImage> images = imageDTOs.stream()
                    .map(dto -> {
                        PostImage postImage = new PostImage();
                        postImage.setPost(post);
                        postImage.setSequence(sequence.getAndIncrement());

                        MultipartFile file = dto.getImage();
                        if (file != null && !file.isEmpty()) {
                            String filename = saveImage(file);
                            postImage.setImageUrl(filename);
                        }

                        return postImage;
                    })
                    .collect(Collectors.toList());
//            post.setImages(images);
            post.getImages().addAll(images);
        }
        System.out.println("sadasdfsadfasdfasfd");
        return postRepository.save(post);
    }


    @Transactional
    public Post partialUpdatePost(Integer postId, PostDTO postDTO, Integer userId, List<PostImageDTO> imageDTOs) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You do not have permission to update this post.");
        }

        if (postDTO.getTitle() != null) {
            post.setTitle(postDTO.getTitle());
        }
        if (postDTO.getContent() != null) {
            post.setContent(postDTO.getContent());
        }
        if (postDTO.getPrice() != null) {
            post.setPrice(postDTO.getPrice());
        }
        if (postDTO.getStatus() != null) {
            post.setStatus(postDTO.getStatus());
        }
        post.setUpdatedAt(LocalDateTime.now());

        // 이미지 수정 로직 (예시)
        if (imageDTOs != null && !imageDTOs.isEmpty()) {
            // 새로운 이미지 추가
            AtomicInteger sequence = new AtomicInteger(post.getImages().size());
            List<PostImage> images = imageDTOs.stream()
                    .map(dto -> {
                        PostImage postImage = new PostImage();
                        postImage.setPost(post);
                        postImage.setSequence(sequence.getAndIncrement());

                        MultipartFile file = dto.getImage();
                        if (file != null && !file.isEmpty()) {
                            String filename = saveImage(file);
                            postImage.setImageUrl(filename);
                        }

                        return postImage;
                    })
                    .collect(Collectors.toList());
            post.getImages().addAll(images);
        }

        return postRepository.save(post);
    }


    private String saveImage(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uuid = UUID.randomUUID().toString();
        String filename = uuid + extension;
        Path filePath = Paths.get(fileUploadPath, filename);

        try {
            Files.copy(file.getInputStream(), filePath);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("이미지 저장에 실패했습니다.", e);
        }
    }

    public ResponseEntity<Post> findPostById(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // 조회수 증가
        post.increaseViewCount();
        postRepository.save(post);



        return ResponseEntity.ok(post);
    }

    public Post getPostById(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        return post;
    }

    // 페이징
    public Page<Post> getPosts(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return postRepository.findAll(pageRequest);
    }

    // 게시물 삭제
    public void deletePost(Integer postId, Integer userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You do not have permission to delete this post.");
        }

        postRepository.delete(post);
    }


    public List<Post> getRecentPosts(int size) {
        Pageable pageable = PageRequest.of(0, size);
        return postRepository.findAllByOrderByIdDesc(pageable);
    }

    public List<Post> getPostsBeforeCursor(Integer cursor, int size) {
        Pageable pageable = PageRequest.of(0, size);
        return postRepository.findPostsBeforeCursor(cursor, pageable);
    }
}
