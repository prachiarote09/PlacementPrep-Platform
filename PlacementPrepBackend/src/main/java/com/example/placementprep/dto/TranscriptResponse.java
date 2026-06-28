package com.example.placementprep.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TranscriptResponse {

    private String transcript;
    private String language;

    @JsonProperty("duration_seconds")
    private double durationSeconds;

    public TranscriptResponse() {}

    public TranscriptResponse(String transcript, String language, double durationSeconds) {
        this.transcript = transcript;
        this.language = language;
        this.durationSeconds = durationSeconds;
    }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public double getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(double durationSeconds) { this.durationSeconds = durationSeconds; }
}