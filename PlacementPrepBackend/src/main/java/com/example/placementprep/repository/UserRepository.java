package com.example.placementprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.placementprep.model.Users;

import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);

    boolean existsByEmail(String email);
}