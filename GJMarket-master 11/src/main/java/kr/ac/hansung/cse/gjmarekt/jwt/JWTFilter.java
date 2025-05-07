package kr.ac.hansung.cse.gjmarekt.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.ac.hansung.cse.gjmarekt.dto.CustomUserDetails;
import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        //request에서 Authorization 헤더 찾음
        String authorization = request.getHeader("Authorization");

        //Authorization 헤더 검증
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            System.out.println("token null");
            filterChain.doFilter(request, response);

            //조건이 해당되면 메소드 종료 (필수) JWT가 없거나 이상한 경우
            return;
        }

        System.out.println("authorization now");
        //Bearer 부분 제거 후 순수 토큰만 획득
        String token = authorization.split(" ")[1];

        //토큰 소멸 시간 검증
        if (jwtUtil.isExpired(token)) {
            System.out.println("token expired");
            filterChain.doFilter(request, response);
            //조건이 해당되면 메소드 종료 (필수)
            return;
        }


        //토큰에서 email과 role 획득
        String email = jwtUtil.getEmail(token);
        String role = jwtUtil.getRole(token);

        //userEntity를 생성하여 값 set
        GJUser gjUser = new GJUser();
        gjUser.setEmail(email);
        gjUser.setPassword("temppassword");
        // Role 설정
        List<GJRole> userRoles = new ArrayList<>();
        GJRole gjRole = new GJRole();
        gjRole.setRolename(role);
        userRoles.add(gjRole);
        gjUser.setRoles(userRoles);

        CustomUserDetails customUserDetails = new CustomUserDetails(gjUser);

        //스프링 시큐리티 인증 토큰 생성
        Authentication authToken =
                new UsernamePasswordAuthenticationToken(customUserDetails,
                        null, customUserDetails.getAuthorities());

        //세션에 사용자 등록
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}
