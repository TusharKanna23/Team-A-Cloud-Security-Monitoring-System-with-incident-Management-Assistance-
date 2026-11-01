package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entity.Playbook;
import com.example.backend.entity.PlaybookExecution;
import com.example.backend.entity.PlaybookStep;
import com.example.backend.repository.PlaybookExecutionRepository;
import com.example.backend.repository.PlaybookRepository;

@Service
public class PlaybookService {

    private final PlaybookRepository playbookRepository;
    private final PlaybookExecutionRepository executionRepository;

    public PlaybookService(
            PlaybookRepository playbookRepository,
            PlaybookExecutionRepository executionRepository) {
        this.playbookRepository = playbookRepository;
        this.executionRepository = executionRepository;
    }

    // VIEW ALL PLAYBOOKS
    @Transactional(readOnly = true)
    public List<Playbook> getAllPlaybooks() {
        return playbookRepository.findAll();
    }

    // VIEW ONE PLAYBOOK
    @Transactional(readOnly = true)
    public Playbook getPlaybookById(Long id) {
        return playbookRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Playbook not found: " + id));
    }

    // CREATE PLAYBOOK WITH STEPS
    @Transactional
    public Playbook createPlaybook(Playbook playbook) {
        if (playbook.getName() == null
                || playbook.getName().isBlank()) {
            throw new IllegalArgumentException(
                    "Playbook name is required");
        }

        playbook.setId(null);

        if (playbook.getSteps() != null) {
            for (int i = 0; i < playbook.getSteps().size(); i++) {
                PlaybookStep step = playbook.getSteps().get(i);
                step.setId(null);
                step.setPlaybook(playbook);

                // Keep the supplied order; otherwise use list position.
                if (step.getStepOrder() <= 0) {
                    step.setStepOrder(i + 1);
                }
            }
        }

        return playbookRepository.save(playbook);
    }

    // ENABLE OR DISABLE PLAYBOOK
    @Transactional
    public Playbook updateStatus(Long id, boolean enabled) {
        Playbook playbook = getPlaybookById(id);
        playbook.setEnabled(enabled);
        return playbookRepository.save(playbook);
    }

    // DELETE PLAYBOOK AND ITS EXECUTION HISTORY
    @Transactional
    public void deletePlaybook(Long id) {
        Playbook playbook = getPlaybookById(id);

        // Execution records reference the playbook, so delete them first.
        List<PlaybookExecution> executions =
                executionRepository.findByPlaybookId(id);

        executionRepository.deleteAll(executions);
        playbookRepository.delete(playbook);
    }

    // RECORD A PLAYBOOK EXECUTION
    @Transactional
    public PlaybookExecution executePlaybook(Long id) {
        Playbook playbook = getPlaybookById(id);

        if (!playbook.isEnabled()) {
            throw new IllegalStateException(
                    "This playbook is disabled. Enable it before executing.");
        }

        PlaybookExecution execution = new PlaybookExecution();
        LocalDateTime now = LocalDateTime.now();

        execution.setPlaybook(playbook);
        execution.setStartedAt(now);
        execution.setStatus("RECORDED");

        StringBuilder report = new StringBuilder();
        report.append("Playbook: ")
                .append(playbook.getName())
                .append("\nExecution record created at: ")
                .append(now)
                .append("\n\nSteps:\n");

        List<PlaybookStep> steps = playbook.getSteps();

        if (steps == null || steps.isEmpty()) {
            report.append("No steps configured.\n");
        } else {
            for (PlaybookStep step : steps) {
                report.append("Step ")
                        .append(step.getStepOrder())
                        .append(": ")
                        .append(step.getName())
                        .append(" - Recorded; action not performed.\n");
            }
        }

        report.append(
                "\nDemo mode: no external security actions were performed."
        );

        execution.setResult(report.toString());
        execution.setCompletedAt(LocalDateTime.now());

        return executionRepository.save(execution);
    }

    // VIEW EXECUTION HISTORY
    @Transactional(readOnly = true)
    public List<PlaybookExecution> getExecutions(Long playbookId) {
        getPlaybookById(playbookId);
        return executionRepository.findByPlaybookId(playbookId);
    }
}