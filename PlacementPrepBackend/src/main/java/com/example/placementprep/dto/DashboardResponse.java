package com.example.placementprep.dto;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {

    // Overview
    private double overallAvgScore;
    private long totalSessions;

    // Aptitude
    private long aptitudeSessions;
    private double aptitudeAvgScore;
    private List<Map<String, Object>> recentAptitude;

    // Coding
    private long codingSessions;
    private double codingAvgScore;
    private List<Map<String, Object>> recentCoding;

    // Interview
    private long interviewSessions;
    private double interviewAvgScore;
    private List<Map<String, Object>> recentInterview;

    // Recent activity (combined, last 10)
    private List<Map<String, Object>> recentActivity;
}