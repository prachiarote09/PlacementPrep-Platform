package com.example.placementprep.dto;

import lombok.Data;

@Data
public class InterviewResultRequest {
    private String interviewType;
    private String difficulty;
    private int totalQuestions;
    private double averageScore;
    private String performance;
}