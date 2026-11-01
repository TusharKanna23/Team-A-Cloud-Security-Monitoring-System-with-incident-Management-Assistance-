package com.example.backend.controller;

import com.example.backend.entity.Playbook;
import com.example.backend.entity.PlaybookExecution;
import com.example.backend.service.PlaybookService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookController {

    private final PlaybookService playbookService;

    public PlaybookController(PlaybookService playbookService) {
        this.playbookService = playbookService;
    }

    // VIEW ALL
    @GetMapping
    public List<Playbook> getAllPlaybooks() {
        return playbookService.getAllPlaybooks();
    }

    // VIEW ONE
    @GetMapping("/{id}")
    public Playbook getPlaybook(@PathVariable Long id) {
        try {
            return playbookService.getPlaybookById(id);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Playbook createPlaybook(@RequestBody Playbook playbook) {
        try {
            return playbookService.createPlaybook(playbook);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ENABLE / DISABLE
    @PatchMapping("/{id}/status")
    public Playbook updateStatus(
            @PathVariable Long id,
            @RequestParam boolean enabled) {
        try {
            return playbookService.updateStatus(id, enabled);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // EXECUTE
    @PostMapping("/{id}/execute")
    public PlaybookExecution executePlaybook(@PathVariable Long id) {
        try {
            return playbookService.executePlaybook(id);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // VIEW EXECUTION HISTORY
    @GetMapping("/{id}/executions")
    public List<PlaybookExecution> getExecutions(@PathVariable Long id) {
        try {
            return playbookService.getExecutions(id);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlaybook(@PathVariable Long id) {
        try {
            playbookService.deletePlaybook(id);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}