package com.example.placementprep.dto;

public class AuthResponse {

    private String message;
    private String email;
    private String status;

    public AuthResponse(String message, String email, String status) {
        this.message = message;
        this.email = email;
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public String getEmail() {
        return email;
    }

    public String getStatus() {
        return status;
    }
}