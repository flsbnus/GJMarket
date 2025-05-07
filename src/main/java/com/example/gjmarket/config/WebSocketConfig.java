package com.example.gjmarket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat/{roomId}")
                .setAllowedOriginPatterns("*")
                .setAllowedOrigins("*")
                .setAllowedHeaders("*")
                .setHandshakeHandler(new CustomHandshakeHandler())
                .addInterceptors(new WebSocketHandshakeInterceptor());
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(8192) // 메시지 크기 제한
                   .setSendBufferSizeLimit(512 * 1024) // 버퍼 크기 제한
                   .setSendTimeLimit(20 * 1000); // 전송 시간 제한
    }
} 