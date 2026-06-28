package com.example.placementprep.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.placementprep.dto.LoginRequest;
import com.example.placementprep.dto.LoginResponse;
import com.example.placementprep.dto.AuthResponse;
import com.example.placementprep.dto.SignupRequest;
import com.example.placementprep.service.AuthService;
import com.example.placementprep.service.UserServiceImpl;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserServiceImpl userService;
    
    @Autowired
    private AuthService service;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {

        AuthResponse response = userService.registerUser(request);

        if (response.getStatus().equals("FAILED")) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return service.login(request);
    }
}