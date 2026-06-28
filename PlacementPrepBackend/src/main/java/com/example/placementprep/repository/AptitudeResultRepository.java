package com.example.placementprep.repository;

import com.example.placementprep.model.AptitudeResult;
import com.example.placementprep.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AptitudeResultRepository extends JpaRepository<AptitudeResult, Long> {

    List<AptitudeResult> findByUserOrderByAttemptedAtDesc(Users user);

    @Query("SELECT AVG(a.score) FROM AptitudeResult a WHERE a.user = :user")
    Double findAvgScoreByUser(Users user);

    long countByUser(Users user);
}