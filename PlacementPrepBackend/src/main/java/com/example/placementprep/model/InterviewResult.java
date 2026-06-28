package com.example.placementprep.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "interview_results")
public class InterviewResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    private String interviewType;   // Technical, HR, Mixed
    private String difficulty;      // Easy, Medium, Hard
    private int totalQuestions;
    private double averageScore;
    private String performance;     // Good, Average, Needs Improvement
    private LocalDateTime attemptedAt;

    @PrePersist
    public void prePersist() {
        this.attemptedAt = LocalDateTime.now();
    }
}