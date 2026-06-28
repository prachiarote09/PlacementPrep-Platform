package com.example.placementprep.repository;

import com.example.placementprep.model.CodingResult;
import com.example.placementprep.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CodingResultRepository extends JpaRepository<CodingResult, Long> {

    List<CodingResult> findByUserOrderByAttemptedAtDesc(Users user);

    @Query("SELECT AVG(c.score) FROM CodingResult c WHERE c.user = :user")
    Double findAvgScoreByUser(Users user);

    long countByUser(Users user);
}