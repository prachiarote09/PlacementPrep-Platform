package com.example.placementprep.controllers;

import com.example.placementprep.dto.*;
import com.example.placementprep.model.Users;
import com.example.placementprep.repository.UserRepository;
import com.example.placementprep.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    private Users getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── GET DASHBOARD ──
    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getDashboard(getUser(auth)));
    }

    // ── SAVE APTITUDE RESULT ──
    @PostMapping("/save-aptitude")
    public ResponseEntity<String> saveAptitude(
            @RequestBody AptitudeResultRequest req,
            Authentication auth) {
        dashboardService.saveAptitudeResult(getUser(auth), req);
        return ResponseEntity.ok("Aptitude result saved");
    }

    // ── SAVE CODING RESULT ──
    @PostMapping("/save-coding")
    public ResponseEntity<String> saveCoding(
            @RequestBody CodingResultRequest req,
            Authentication auth) {
        dashboardService.saveCodingResult(getUser(auth), req);
        return ResponseEntity.ok("Coding result saved");
    }

    // ── SAVE INTERVIEW RESULT ──
    @PostMapping("/save-interview")
    public ResponseEntity<String> saveInterview(
            @RequestBody InterviewResultRequest req,
            Authentication auth) {
        dashboardService.saveInterviewResult(getUser(auth), req);
        return ResponseEntity.ok("Interview result saved");
    }
}