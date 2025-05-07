package kr.ac.hansung.cse.gjmarekt.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.security.Password;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.ac.hansung.cse.gjmarekt.dto.CustomUserDetails;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

public class SignInFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public SignInFilter(AuthenticationManager authenticationManager, JWTUtil jwtUtil, ObjectMapper objectMapper) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;

        //url을 설정한다.
        setFilterProcessesUrl("/api/signin");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request,
                                                HttpServletResponse response)
            throws AuthenticationException {

        // 클라이언트 요청에서 email, password 추출
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        System.out.println("email: " + email);
        System.out.println("password: " + password);

//        String username=obtainUsername(request);
//        String password=obtainPassword(request);
//        System.out.println("username:"+username);

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(email, password, null);

        return authenticationManager.authenticate(authRequest);
    }

    // 로그인 성공시 실행
    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authResult) throws IOException {
        System.out.println("successful authentication");

        CustomUserDetails userDetails = (CustomUserDetails) authResult.getPrincipal();
        String email = userDetails.getUsername();
        Integer id = userDetails.getUserid();

        Collection<? extends GrantedAuthority> authorities = authResult.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();

        String role = auth.getAuthority();

        String token = jwtUtil.createJwt(id, email, role, 60 * 60 * 10L * 100000);

        GJUser user = userDetails.getGjUser(); // 엔티티 객체 가져오기

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String userInfoJson = objectMapper.writeValueAsString(user); // 엔티티를 JSON으로 변환
        response.getWriter().write(userInfoJson);

        response.addHeader("Authorization", "Bearer " + token);
        response.addHeader("id", String.valueOf(id));
    }

    // 로그인 실패시 실행
    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
                                              HttpServletResponse response,
                                              AuthenticationException failed) {
        System.out.println("unsuccessful authentication");

        //401
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
