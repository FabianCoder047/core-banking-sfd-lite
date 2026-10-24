package com.sfd.common.security;

import com.sfd.audit.AuditFilter;
import com.sfd.audit.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MotDePasseTemporaireFilter motDePasseTemporaireFilter;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          MotDePasseTemporaireFilter motDePasseTemporaireFilter,
                          AuditService auditService,
                          ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.motDePasseTemporaireFilter = motDePasseTemporaireFilter;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/refresh",
                                "/swagger-ui.html", "/swagger-ui/**",
                                "/v3/api-docs/**", "/actuator/health", "/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) ->
                                writeProblem(response, HttpServletResponse.SC_UNAUTHORIZED,
                                        "NON_AUTHENTIFIE", "Authentification requise."))
                        .accessDeniedHandler((request, response, ex) ->
                                writeProblem(response, HttpServletResponse.SC_FORBIDDEN,
                                        "ACCES_REFUSE", "Vous n'avez pas les droits pour cette operation.")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(motDePasseTemporaireFilter, JwtAuthenticationFilter.class)
                .addFilterBefore(new AuditFilter(auditService), MotDePasseTemporaireFilter.class);
        return http.build();
    }

    private void writeProblem(HttpServletResponse response, int status, String code, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "type", "urn:sfd:erreur:" + code,
                "title", status == 401 ? "Unauthorized" : "Forbidden",
                "status", status,
                "detail", detail,
                "code", code));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200", "http://127.0.0.1:4200",
                "http://localhost:8081", "http://127.0.0.1:8081"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
