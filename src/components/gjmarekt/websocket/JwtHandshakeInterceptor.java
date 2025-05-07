package kr.ac.hansung.cse.gjmarekt.websocket;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
    public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JWTUtil jwtUtil;

    @Autowired
    public JwtHandshakeInterceptor(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        System.out.println("before handshake");
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            HttpSession session = servletRequest.getSession(); // HttpSession 얻기
            String token = extractToken(servletRequest);
            if (token != null) {
                try {
                    Integer userId = jwtUtil.getUserId(token); // jwtUtil을 사용하여 사용자 ID 추출
                    session.setAttribute("userId", userId); // HttpSession에 userId 저장
                    System.out.println("userId : " + session.getAttribute("userId"));
                    return true; // 핸드셰이크 진행
                } catch (Exception e) {
                    System.out.println("Invalid JWT: " + e.getMessage());
                    return false; // 핸드셰이크 거부
                }
            }
            System.out.println("token : " + token);
        }
        System.out.println("No JWT provided");
        return false;   // jwt없으면 거부함
    }


    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {

    }

    private String extractToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }
}
