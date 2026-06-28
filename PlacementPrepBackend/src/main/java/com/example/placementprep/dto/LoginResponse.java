package com.example.placementprep.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class LoginResponse {

    private String token;
    private String role;
    private String email;
    private String name;

    public LoginResponse(String token, String role, String email,String name) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.name = name;
    }

    // getters
}
