package com.sfd.dashboard;

import com.sfd.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Tableau de bord")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public DashboardDto tableauDeBord(@AuthenticationPrincipal AuthPrincipal principal,
                                      @RequestParam(required = false) Long agenceId) {
        return dashboardService.tableauDeBord(principal, agenceId);
    }
}
