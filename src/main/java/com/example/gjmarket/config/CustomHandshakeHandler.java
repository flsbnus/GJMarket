package com.example.gjmarket.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeHandler;

import java.util.Map;

public class CustomHandshakeHandler implements HandshakeHandler {
    @Override
    public boolean doHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        // 모든 WebSocket 연결을 허용
        return true;
    }
} 