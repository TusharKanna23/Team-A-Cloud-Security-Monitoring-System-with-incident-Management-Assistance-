
package com.skyshield.playbook;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.skyshield.entity.SecurityEvent;
import com.skyshield.entity.PlaybookExecution;
import com.skyshield.repository.PlaybookExecutionRepository;

@Service
public class PlaybookService {

    private final PlaybookExecutionRepository executionRepository;

    public PlaybookService(
            PlaybookExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    public List<String> executePlaybook(SecurityEvent event) {

        List<String> actions = new ArrayList<>();

        if (event.getEventType() == null) {
            actions.add("Event type is missing. Manual review required.");
        } else {

            switch (event.getEventType().toUpperCase()) {

                case "FAILED_LOGIN":
                    actions.add("Failed login activity detected.");
                    actions.add("Flagged suspicious IP: " + event.getIpAddress());
                    actions.add("Administrator notification generated.");
                    actions.add("Security incident marked for investigation.");
                    break;

                default:
                    actions.add("Unknown security event detected.");
                    actions.add("Manual investigation required.");
                    break;
            }
        }

        // Save playbook execution in PostgreSQL
        PlaybookExecution execution = new PlaybookExecution();

        execution.setEventId(event.getId());
        execution.setEventType(event.getEventType());
        execution.setActions(String.join(" | ", actions));
        execution.setStatus("SUCCESS");
        execution.setExecutedAt(LocalDateTime.now());

        executionRepository.save(execution);

        return actions;
    }
}
