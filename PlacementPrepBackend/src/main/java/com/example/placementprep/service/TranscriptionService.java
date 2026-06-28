package com.example.placementprep.service;

import com.example.placementprep.dto.TranscriptResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class TranscriptionService {

    @Value("${python.stt.url:http://localhost:8000}")
    private String pythonSttUrl;

    private final RestTemplate restTemplate;

    public TranscriptionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public TranscriptResponse transcribe(MultipartFile audioFile) {
        try {
            // Build multipart request to forward to Python
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename() != null
                            ? audioFile.getOriginalFilename()
                            : "recording.wav";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            HttpHeaders partHeaders = new HttpHeaders();
            partHeaders.setContentType(MediaType.parseMediaType("audio/webm"));
            body.add("audio", new HttpEntity<>(audioResource, partHeaders));

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<TranscriptResponse> response = restTemplate.postForEntity(
                    pythonSttUrl + "/transcribe",
                    request,
                    TranscriptResponse.class
            );

            return response.getBody();

        } catch (IOException e) {
            throw new RuntimeException("Failed to read audio file: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("STT service error: " + e.getMessage(), e);
        }
    }

    public String checkPythonHealth() {
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(
                    pythonSttUrl + "/health", String.class);
            return resp.getBody();
        } catch (Exception e) {
            return "{\"status\": \"unreachable\", \"error\": \"" + e.getMessage() + "\"}";
        }
    }
}