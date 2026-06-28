package com.example.placementprep.dto;

import lombok.Data;

@Data
public class CodingResultRequest {
    private String topic;
    private String difficulty;
    private String problemTitle;
    private int score;
    private int correctness;
    private int optimization;
    private int readability;
    private int edgeCases;
}