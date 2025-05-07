package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.dto.SignUpDTO;
import kr.ac.hansung.cse.gjmarekt.dto.UserDTO;
import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.repository.RoleRepository;
import kr.ac.hansung.cse.gjmarekt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 이미지 파일이 저장될 경로 (application.properties에서 가져옴)
    @Value("${file.upload.path}")
    private String fileUploadPath;

    @Autowired
    private RoleRepository roleRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public void signUpProcess(SignUpDTO signUpDTO) {
        String email = signUpDTO.getEmail();
        String password = signUpDTO.getPassword();
        String nickname = signUpDTO.getNickname();

        // 유저 중복 확인
        Boolean isExists = userRepository.existsByEmail(email);
        if (isExists) {
            return;
        }

        GJUser gjUser = new GJUser();
        gjUser.setEmail(email);
        gjUser.setPassword(passwordEncoder.encode(password));
        gjUser.setNickname(nickname);

        // 프로필 사진 처리
        String profileImageUrl = null;
        MultipartFile profileImage = signUpDTO.getProfileImage();

        if (profileImage != null && !profileImage.isEmpty()) {
            // 이미지가 없으면 이부분은 실행되지 않습니다.
            try {
                String fileName = UUID.randomUUID().toString() + "."
                        + getFileExtension(profileImage.getOriginalFilename());
                File dest = new File(fileUploadPath + "/profile/" + fileName);
                profileImage.transferTo(dest);

                gjUser.setProfileImageUrl(fileName);

            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }


        // 기본 Role을 "ROLE_USER"로 설정
        List<GJRole> userRoles = new ArrayList<>();
        GJRole role = findByRolename("ROLE_USER");
        userRoles.add(role);
        gjUser.setRoles(userRoles);
        // "ROLE_USER"가 없는 경우 생성
        if (roleRepository.findByRolename("ROLE_ADMIN").isEmpty()) {
            roleRepository.save(role);
        }

        userRepository.save(gjUser);

    }

    public GJRole findByRolename(String rolename) {
        Optional<GJRole> role = roleRepository.findByRolename(rolename);
        return role.orElseGet(() -> new GJRole(rolename));
    }


    // 회원정보 수정
    public void updateUser(GJUser user, SignUpDTO signUpDTO) {
        // 이메일로 기존 user를 찾는다.
        GJUser gjUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        System.out.println(gjUser.getEmail());


        // 닉네임, 비밀번호가 null이면 변경을 하지 않고 기존 정보를 유지함
        if (user.getNickname() != null) {
            gjUser.setNickname(user.getNickname());
        }
        if (user.getPassword() != null) {
            gjUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }


        // 프로필 사진 처리
        String profileImageUrl = null;
        MultipartFile profileImage = signUpDTO.getProfileImage();

        if (profileImage != null && !profileImage.isEmpty()) {
            // 이미지가 없으면 이부분은 실행되지 않습니다.
            try {
                String fileName = UUID.randomUUID().toString() + "."
                        + getFileExtension(profileImage.getOriginalFilename());
                File dest = new File(fileUploadPath + "/profile/" + fileName);
                profileImage.transferTo(dest);

                gjUser.setProfileImageUrl(fileName);

            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }


        userRepository.save(gjUser);
    }

    // 회원 탈퇴
    @Transactional
    public void deleteUser(GJUser user) {

        GJUser gjUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        gjUser.getRoles().clear();
        userRepository.save(gjUser);

        userRepository.delete(gjUser);
    }

    // 회원 조회
    public GJUser findUserById(Integer id) {
        // password를 알려주면 안되니 DTO로 바꾸고 리턴함
        GJUser gjUser = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User Not Found"));
//        return gjUser != null ? convertUserToDTO(gjUser) : null;
        return gjUser;
    }

    // 회원 조회 암호 포함 GJUSER반환 함
    public GJUser getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserDTO convertUserToDTO(GJUser user) {
        // DTO로 변환함
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setNickname(user.getNickname());
        userDTO.setProfileImageUrl("/profile/"+user.getProfileImageUrl());
        return userDTO;
    }

    // 파일 확장자 추출 메서드
    private String getFileExtension(String fileName) {
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }


    // 유저 평점 업데이트
    public void updateUserRating(Integer userId, Float rating) {
        userRepository.updateUserRating(userId, rating);
    }
}
