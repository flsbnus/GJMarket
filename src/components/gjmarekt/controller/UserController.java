package kr.ac.hansung.cse.gjmarekt.controller;


import kr.ac.hansung.cse.gjmarekt.dto.SignUpDTO;
import kr.ac.hansung.cse.gjmarekt.dto.UserDTO;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@ResponseBody
public class UserController {

    private final UserService userService;
    private final JWTUtil jwtUtil;




    public UserController(UserService userService, JWTUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/api/signup")
    public String signUpProcess(SignUpDTO signUpDTO) {

        userService.signUpProcess(signUpDTO);

        return "ok";
    }

    //회원 정보 수정
    @PutMapping("/api/updateuser")
    public String updateUserProcess(
            @RequestHeader("Authorization") String authorization,
            SignUpDTO signUpDTO) {
        // 본인이 맞는지 확인 필요
        System.out.println(authorization);
        String token = authorization.split(" ")[1];
        GJUser updatedUser = new GJUser();
        // GJUser 객체를 만들어서 보낸다
        // 토큰으로 이메일을 설정한다.
        updatedUser.setEmail(jwtUtil.getEmail(token));

        updatedUser.setPassword(signUpDTO.getPassword());

        updatedUser.setNickname(signUpDTO.getNickname());

        userService.updateUser(updatedUser, signUpDTO);

        return "updated";
    }

    // 회원 탈퇴
    @DeleteMapping("/api/deleteuser")
    public String deleteUserProcess(
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        GJUser deleteUser = new GJUser();
        deleteUser.setEmail(jwtUtil.getEmail(token));

        userService.deleteUser(deleteUser);
        return "deleteduser";
    }

    // 회원 조회
    @GetMapping("/api/user")
    public GJUser getUserProcess(@RequestParam Integer userid) {
        return userService.findUserById(userid);
    }
}
