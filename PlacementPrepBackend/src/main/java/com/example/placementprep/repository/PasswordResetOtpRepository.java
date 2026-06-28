package com.example.placementprep.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.placementprep.model.PasswordResetOtp;

public interface PasswordResetOtpRepository
extends JpaRepository<PasswordResetOtp, Long> {

Optional<PasswordResetOtp> findByEmail(String email);

void deleteByEmail(String email);
}

