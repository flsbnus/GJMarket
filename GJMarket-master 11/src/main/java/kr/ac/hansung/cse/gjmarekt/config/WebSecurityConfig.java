package kr.ac.hansung.cse.gjmarekt.config;


import com.fasterxml.jackson.databind.ObjectMapper;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTFilter;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.jwt.SignInFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HttpBasicConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JWTUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public WebSecurityConfig(AuthenticationConfiguration authenticationConfiguration, JWTUtil jwtUtil, ObjectMapper objectMapper) {
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Autowired
    private UserDetailsService customUserDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static final String[] PUBLIC_MATCHERS = {
            "/webjars/**",
            "/css/**",
            "/js/**",
            "/images/**",
            "/about/**",
            "/contact/**",
            "/error/**",
            "/console/**",

            "/static/**" // React 정적 파일 경로 추가
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // CORS 설정 적용
                .authorizeHttpRequests((auth) -> auth
                        .requestMatchers(PUBLIC_MATCHERS).permitAll()
                        //.requestMatchers("/", "/home", "/signup", "/login").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        //.requestMatchers("/api/user/**").hasRole("USER")
                        // 로그인 엔드포인트 허용
                        //.requestMatchers("/api/signup", "/api/signin", "/api/updateuser", "/api/user", "/images/**", "/api/post/**").permitAll()
//                        .anyRequest().authenticated()
                                .anyRequest().permitAll() // 나머지 모든 요청은 허용

                )
//                .formLogin(formLogin -> formLogin
//                        .loginPage("/login")
//                        .defaultSuccessUrl("/home")
//                        .failureUrl("/login?error")
//                        .permitAll()
//                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .permitAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .accessDeniedPage("/accessDenied")
                )
                .userDetailsService(customUserDetailsService)
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                // JWTFilter 등록
                .addFilterBefore(new JWTFilter(jwtUtil), SignInFilter.class)
                // 로그인 필터 등록
                .addFilterAt(new SignInFilter(authenticationManager(authenticationConfiguration), jwtUtil, objectMapper), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 모든 Origin 허용 (개발 환경) - 실제 운영 환경에서는 명시적으로 Origin을 지정해야 합니다.
        // configuration.setAllowedOrigins(List.of("http://localhost:3000")); // 예시
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); // 명시적으로 localhost:3000 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); // 허용할 HTTP 메서드
        configuration.setAllowedHeaders(Arrays.asList("*")); // 모든 헤더 허용
        configuration.setAllowCredentials(true); // 쿠키 허용 (필요한 경우)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 경로에 CORS 설정 적용

        return source;
    }
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                .csrf(csrf -> csrf.disable())
//                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                .authorizeHttpRequests((auth) -> auth
//                        .requestMatchers(PUBLIC_MATCHERS).permitAll()
//                        .requestMatchers("/api/signup", "/api/signin", "/api/updateuser", "/api/user", "/images/**", "/api/post/**").permitAll()
//                        // 인증이 필요한 API 엔드포인트만 명시적으로 설정
//                        .requestMatchers("/api/protected/**").authenticated() // 예시: /api/protected/ 경로는 인증 필요
//                        .requestMatchers("/api/admin/**").hasRole("ADMIN") // 예시: /api/admin/ 경로는 ADMIN 역할 필요
//                        .anyRequest().permitAll() // 나머지 모든 요청은 허용
//                )
//                .logout(logout -> logout.disable())
//                .exceptionHandling(exceptions -> exceptions
//                        .accessDeniedPage("/accessDenied")
//                )
//                .userDetailsService(customUserDetailsService)
//                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);
//
//        return http.build();
//    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration configuration = new CorsConfiguration();
//        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
//        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//        configuration.setAllowedHeaders(Arrays.asList("*"));
//        configuration.setAllowCredentials(true);
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration);
//
//        return source;
//    }
}
