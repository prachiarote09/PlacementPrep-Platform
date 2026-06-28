package com.example.placementprep.controllers;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.placementprep.dto.ResetPasswordRequest;
import com.example.placementprep.model.PasswordResetOtp;
import com.example.placementprep.model.Users;
import com.example.placementprep.repository.PasswordResetOtpRepository;
import com.example.placementprep.repository.UserRepository;
import com.example.placementprep.service.EmailService;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder encoder;

    public PasswordResetController(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            EmailService emailService,
            BCryptPasswordEncoder encoder
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.emailService = emailService;
        this.encoder = encoder;
    }

    // =========================
    // 1️⃣ SEND OTP
    // =========================
    @PostMapping("/forgot-password")
    @Transactional
    public String forgotPassword(@RequestBody Map<String, String> request) {

        String email = request.get("email");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required"
            );
        }

        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Email not registered"
                ));

        otpRepository.deleteByEmail(email);

        String otp = generateOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        PasswordResetOtp otpEntity = new PasswordResetOtp();
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setExpiryTime(expiryTime);

        otpRepository.save(otpEntity);
        emailService.sendOtpEmail(email, otp);

        return "OTP sent to email";
    }

    // =========================
    // 2️⃣ VERIFY OTP
    // =========================
    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");

        PasswordResetOtp otpEntity = otpRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "OTP not found"
                ));

        if (!otpEntity.getOtp().equals(otp)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP"
            );
        }

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired"
            );
        }

        return "OTP verified";
    }

    // =========================
    // 3️⃣ RESET PASSWORD
    // =========================
    @PostMapping("/reset-password")
    @Transactional
    public String resetPassword(@RequestBody ResetPasswordRequest request) {

        PasswordResetOtp otpEntity = otpRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "OTP not found"
                ));

        if (!otpEntity.getOtp().equals(request.getOtp())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP"
            );
        }

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired"
            );
        }

        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (request.getNewPassword().length() < 6) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must be at least 6 characters"
            );
        }

        if (encoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password cannot be same as old password"
            );
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpRepository.deleteByEmail(request.getEmail());

        return "Password reset successful";
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }
}
