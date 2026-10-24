package com.sfd.auth;

import com.sfd.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        return authService.login(request, servletRequest.getRemoteAddr());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/mot-de-passe")
    public TokenResponse changerMotDePasse(@AuthenticationPrincipal AuthPrincipal principal,
                                           @Valid @RequestBody ChangerMotDePasseRequest request) {
        return authService.changerMotDePasse(principal, request);
    }
}
