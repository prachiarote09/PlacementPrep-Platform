package com.example.placementprep.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "coding_results")
public class CodingResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    private String topic;         // DSA, Java, SQL etc.
    private String difficulty;    // Easy, Medium, Hard
    private String problemTitle;
    private int score;
    private int correctness;
    private int optimization;
    private int readability;
    private int edgeCases;
    private LocalDateTime attemptedAt;

    @PrePersist
    public void prePersist() {
        this.attemptedAt = LocalDateTime.now();
    }
}