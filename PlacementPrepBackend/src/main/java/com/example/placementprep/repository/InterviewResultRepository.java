package com.example.placementprep.repository;

import com.example.placementprep.model.InterviewResult;
import com.example.placementprep.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface InterviewResultRepository extends JpaRepository<InterviewResult, Long> {

    List<InterviewResult> findByUserOrderByAttemptedAtDesc(Users user);

    @Query("SELECT AVG(i.averageScore) FROM InterviewResult i WHERE i.user = :user")
    Double findAvgScoreByUser(Users user);

    long countByUser(Users user);
}