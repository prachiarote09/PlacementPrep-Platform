package com.example.placementprep.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // 🔐 Secret key (at least 32 chars for HS256)
    private static final String SECRET_KEY = "YOUR_SECRET_KEY";

    // ⏳ Token validity (1 day)
    private static final long EXPIRATION_TIME = 86400000;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // 🔹 Generate JWT Token
    public String generateToken(String email, String role,String name) {
        return Jwts.builder()
                .setSubject(email) // user identifier
                .claim("role", role) 
                .claim("name", name)// store role
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 🔹 Extract Email
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }
    public String extractName(String token) {
        return extractAllClaims(token).get("name", String.class); 
    }

    // 🔹 Extract Role
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // 🔹 Validate Token (NEW ⭐)
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token); // will throw error if invalid
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // 🔹 Extract all claims (Reusable method ⭐)
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}