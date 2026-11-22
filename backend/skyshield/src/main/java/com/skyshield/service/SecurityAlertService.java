
package com.skyshield.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.skyshield.entity.SecurityAlert;
import com.skyshield.entity.SecurityEvent;
import com.skyshield.repository.SecurityAlertRepository;
import com.skyshield.playbook.PlaybookService;

@Service
public class SecurityAlertService {

    private final SecurityAlertRepository alertRepository;
    private final PlaybookService playbookService;

    public SecurityAlertService(
            SecurityAlertRepository alertRepository,
            PlaybookService playbookService) {

        this.alertRepository = alertRepository;
        this.playbookService = playbookService;
    }

    public SecurityAlert createAlertIfRequired(SecurityEvent event) {

        if (event.getSeverity() == null) {
            return null;
        }

        if (event.getSeverity().equalsIgnoreCase("HIGH")
                || event.getSeverity().equalsIgnoreCase("CRITICAL")) {

            SecurityAlert alert = new SecurityAlert();

            alert.setEventId(event.getId());
            alert.setTitle("Security Threat Detected");
            alert.setMessage(event.getDescription());
            alert.setSeverity(event.getSeverity());
            alert.setStatus("OPEN");
            alert.setCreatedAt(LocalDateTime.now());

            // Save alert in PostgreSQL
            SecurityAlert savedAlert = alertRepository.save(alert);

            // Execute playbook automation
            List<String> actions =
                    playbookService.executePlaybook(event);

            // Display executed actions
            System.out.println("===== PLAYBOOK EXECUTION =====");

            for (String action : actions) {
                System.out.println("ACTION: " + action);
            }

            System.out.println("===== PLAYBOOK COMPLETED =====");

            return savedAlert;
        }

        return null;
    }
}
