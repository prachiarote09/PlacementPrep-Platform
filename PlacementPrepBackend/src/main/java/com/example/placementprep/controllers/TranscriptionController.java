package com.example.placementprep.controllers;

import com.example.placementprep.dto.TranscriptResponse;
import com.example.placementprep.service.TranscriptionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user/transcription")
@CrossOrigin(origins = "*") // tighten in production
public class TranscriptionController {

    private final TranscriptionService transcriptionService;

    public TranscriptionController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    /**
     * POST /api/v1/transcription/transcribe
     * Accepts multipart audio file, forwards to Python STT service,
     * returns transcript JSON.
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TranscriptResponse> transcribe(
            @RequestParam("audio") MultipartFile audioFile) {

        if (audioFile.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        TranscriptResponse response = transcriptionService.transcribe(audioFile);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/transcription/health
     * Checks that the Python STT service is reachable.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        String status = transcriptionService.checkPythonHealth();
        return ResponseEntity.ok(status);
    }
}