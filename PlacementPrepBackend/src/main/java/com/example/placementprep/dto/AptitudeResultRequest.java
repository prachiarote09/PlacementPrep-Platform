package com.example.placementprep.dto;

import lombok.Data;

@Data
public class AptitudeResultRequest {
    private String category;
    private String topic;
    private int score;
    private int totalQuestions;
    private int correctAnswers;
}