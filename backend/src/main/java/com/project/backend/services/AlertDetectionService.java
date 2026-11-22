
package com.project.backend.services;

import com.project.backend.entities.Alert;
import com.project.backend.repositories.AlertRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class AlertDetectionService {

    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertDetectionService(
            AlertRepository alertRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // Record a failed login attempt
    @Transactional
    public Alert recordFailedLogin(String sourceIp) {

        // Find an existing unresolved alert for this IP
        Alert existingAlert = alertRepository.findAll()
                .stream()
                .filter(alert ->
                    "Failed Login Attempts".equals(alert.getTitle())
                    && Objects.equals(sourceIp, alert.getSourceIp())
                    && !"RESOLVED".equals(alert.getStatus()))
                .findFirst()
                .orElse(null);

        if (existingAlert != null) {

            // Increase occurrence count
            int count = existingAlert.getOccurrenceCount() == null
                    ? 1 : existingAlert.getOccurrenceCount();

            existingAlert.setOccurrenceCount(count + 1);
            existingAlert.setLastSeenAt(LocalDateTime.now());

            if (count + 1 >= 5) {
                existingAlert.setSeverity("HIGH");
            }

            Alert savedAlert = alertRepository.save(existingAlert);

            // Broadcast updated alert
            messagingTemplate.convertAndSend(
                    "/topic/alerts", savedAlert);

            return savedAlert;
        }

        // Create a new alert
        Alert alert = new Alert();

        alert.setTitle("Failed Login Attempts");
        alert.setDescription(
                "Repeated failed login attempts detected.");
        alert.setSeverity("MEDIUM");
        alert.setSource("AUTHENTICATION");
        alert.setSourceIp(sourceIp);
        alert.setStatus("NEW");
        alert.setOccurrenceCount(1);
        alert.setLastSeenAt(LocalDateTime.now());

        Alert savedAlert = alertRepository.save(alert);

        // Broadcast new alert
        messagingTemplate.convertAndSend(
                "/topic/alerts", savedAlert);

        return savedAlert;
    }
}
