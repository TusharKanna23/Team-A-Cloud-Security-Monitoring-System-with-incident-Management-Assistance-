
package com.skyshield.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.skyshield.entity.PlaybookExecution;
import com.skyshield.entity.SecurityEvent;
import com.skyshield.repository.PlaybookExecutionRepository;
import com.skyshield.repository.SecurityEventRepository;
import com.skyshield.playbook.PlaybookService;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookExecutionController {

    private final PlaybookExecutionRepository executionRepository;
    private final SecurityEventRepository eventRepository;
    private final PlaybookService playbookService;

    public PlaybookExecutionController(
            PlaybookExecutionRepository executionRepository,
            SecurityEventRepository eventRepository,
            PlaybookService playbookService) {

        this.executionRepository = executionRepository;
        this.eventRepository = eventRepository;
        this.playbookService = playbookService;
    }

    // Get all playbook executions
    @GetMapping
    public List<PlaybookExecution> getAllExecutions() {
        return executionRepository.findAll();
    }

    // Get total execution count
    @GetMapping("/count")
    public long getExecutionCount() {
        return executionRepository.count();
    }

    // Manually execute playbook for a security event
    @PostMapping("/execute/{eventId}")
    public ResponseEntity<?> executePlaybook(
            @PathVariable Long eventId) {

        return eventRepository.findById(eventId)
                .map(event -> {
                    List<String> actions =
                            playbookService.executePlaybook(event);

                    return ResponseEntity.ok(actions);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
