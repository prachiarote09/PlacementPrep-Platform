package com.example.placementprep.service;

import com.example.placementprep.dto.*;
import com.example.placementprep.model.*;
import com.example.placementprep.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AptitudeResultRepository aptitudeRepo;
    private final CodingResultRepository codingRepo;
    private final InterviewResultRepository interviewRepo;
    private final UserRepository userRepository;

    // ── SAVE APTITUDE ──
    public void saveAptitudeResult(Users user, AptitudeResultRequest req) {
        AptitudeResult result = new AptitudeResult();
        result.setUser(user);
        result.setCategory(req.getCategory());
        result.setTopic(req.getTopic());
        result.setScore(req.getScore());
        result.setTotalQuestions(req.getTotalQuestions());
        result.setCorrectAnswers(req.getCorrectAnswers());
        aptitudeRepo.save(result);
    }

    // ── SAVE CODING ──
    public void saveCodingResult(Users user, CodingResultRequest req) {
        CodingResult result = new CodingResult();
        result.setUser(user);
        result.setTopic(req.getTopic());
        result.setDifficulty(req.getDifficulty());
        result.setProblemTitle(req.getProblemTitle());
        result.setScore(req.getScore());
        result.setCorrectness(req.getCorrectness());
        result.setOptimization(req.getOptimization());
        result.setReadability(req.getReadability());
        result.setEdgeCases(req.getEdgeCases());
        codingRepo.save(result);
    }

    // ── SAVE INTERVIEW ──
    public void saveInterviewResult(Users user, InterviewResultRequest req) {
        InterviewResult result = new InterviewResult();
        result.setUser(user);
        result.setInterviewType(req.getInterviewType());
        result.setDifficulty(req.getDifficulty());
        result.setTotalQuestions(req.getTotalQuestions());
        result.setAverageScore(req.getAverageScore());
        result.setPerformance(req.getPerformance());
        interviewRepo.save(result);
    }

    // ── DASHBOARD ──
    public DashboardResponse getDashboard(Users user) {

        // Aptitude stats
        long aptitudeSessions = aptitudeRepo.countByUser(user);
        Double aptitudeAvg    = aptitudeRepo.findAvgScoreByUser(user);
        List<AptitudeResult> recentApt = aptitudeRepo
            .findByUserOrderByAttemptedAtDesc(user)
            .stream().limit(5).collect(Collectors.toList());

        // Coding stats
        long codingSessions = codingRepo.countByUser(user);
        Double codingAvg    = codingRepo.findAvgScoreByUser(user);
        List<CodingResult> recentCode = codingRepo
            .findByUserOrderByAttemptedAtDesc(user)
            .stream().limit(5).collect(Collectors.toList());

        // Interview stats
        long interviewSessions = interviewRepo.countByUser(user);
        Double interviewAvg    = interviewRepo.findAvgScoreByUser(user);
        List<InterviewResult> recentInt = interviewRepo
            .findByUserOrderByAttemptedAtDesc(user)
            .stream().limit(5).collect(Collectors.toList());

        // Overall avg
        double totalSessions = aptitudeSessions + codingSessions + interviewSessions;
        double overallAvg = 0;
        int count = 0;
        if (aptitudeAvg != null)  { overallAvg += aptitudeAvg;  count++; }
        if (codingAvg != null)    { overallAvg += codingAvg;    count++; }
        if (interviewAvg != null) { overallAvg += interviewAvg; count++; }
        if (count > 0) overallAvg = overallAvg / count;

        // Recent activity (combined)
        List<Map<String, Object>> activity = new ArrayList<>();

        recentApt.forEach(a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("module", "Aptitude");
            map.put("topic", a.getTopic());
            map.put("score", a.getScore());
            map.put("date", a.getAttemptedAt());
            activity.add(map);
        });

        recentCode.forEach(c -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("module", "Coding");
            map.put("topic", c.getTopic() + " - " + c.getDifficulty());
            map.put("score", c.getScore());
            map.put("date", c.getAttemptedAt());
            activity.add(map);
        });

        recentInt.forEach(i -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("module", "Interview");
            map.put("topic", i.getInterviewType() + " - " + i.getDifficulty());
            map.put("score", i.getAverageScore());
            map.put("date", i.getAttemptedAt());
            activity.add(map);
        });

        // Sort by date desc
        activity.sort((a, b) -> {
            java.time.LocalDateTime da = (java.time.LocalDateTime) a.get("date");
            java.time.LocalDateTime db = (java.time.LocalDateTime) b.get("date");
            return db.compareTo(da);
        });

        return DashboardResponse.builder()
            .overallAvgScore(Math.round(overallAvg * 10.0) / 10.0)
            .totalSessions((long) totalSessions)
            .aptitudeSessions(aptitudeSessions)
            .aptitudeAvgScore(aptitudeAvg != null ? Math.round(aptitudeAvg * 10.0) / 10.0 : 0)
            .codingSessions(codingSessions)
            .codingAvgScore(codingAvg != null ? Math.round(codingAvg * 10.0) / 10.0 : 0)
            .interviewSessions(interviewSessions)
            .interviewAvgScore(interviewAvg != null ? Math.round(interviewAvg * 10.0) / 10.0 : 0)
            .recentActivity(activity.stream().limit(10).collect(Collectors.toList()))
            .build();
    }
}