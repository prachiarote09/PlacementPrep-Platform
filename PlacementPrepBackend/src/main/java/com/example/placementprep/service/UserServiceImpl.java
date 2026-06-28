package com.example.placementprep.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.placementprep.dto.AuthResponse;
import com.example.placementprep.dto.SignupRequest;
import com.example.placementprep.model.Users;
import com.example.placementprep.repository.UserRepository;

import java.time.LocalDateTime;

@Service
public class UserServiceImpl {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    
    public AuthResponse registerUser(SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse("Email already exists", null, "FAILED");
        }

        Users user = new Users();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);

        return new AuthResponse(
                "User registered successfully",
                user.getEmail(),
                "SUCCESS"
        );
    }
}