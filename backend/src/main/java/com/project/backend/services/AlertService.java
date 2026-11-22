
package com.project.backend.services;

import com.project.backend.entities.Alert;
import com.project.backend.repositories.AlertRepository;

import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertService(
            AlertRepository alertRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // Create alert and broadcast it
    public Alert createAlert(Alert alert) {
        Alert savedAlert = alertRepository.save(alert);

        messagingTemplate.convertAndSend(
                "/topic/alerts", savedAlert);

        return savedAlert;
    }

    // Get all alerts
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    // Get alert by ID
    public Alert getAlertById(Long id) {
        return alertRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Alert not found with ID: " + id));
    }

    // Update alert details and broadcast
    public Alert updateAlert(Long id, Alert updatedAlert) {
        Alert existingAlert = getAlertById(id);

        existingAlert.setTitle(updatedAlert.getTitle());
        existingAlert.setDescription(updatedAlert.getDescription());
        existingAlert.setSeverity(updatedAlert.getSeverity());
        existingAlert.setSource(updatedAlert.getSource());
        existingAlert.setSourceIp(updatedAlert.getSourceIp());

        Alert savedAlert = alertRepository.save(existingAlert);

        messagingTemplate.convertAndSend(
                "/topic/alerts", savedAlert);

        return savedAlert;
    }

    // Update status and broadcast
    public Alert updateAlertStatus(Long id, String status) {
        Alert alert = getAlertById(id);

        alert.setStatus(status);

        Alert savedAlert = alertRepository.save(alert);

        messagingTemplate.convertAndSend(
                "/topic/alerts", savedAlert);

        return savedAlert;
    }

    // Delete alert
    public void deleteAlert(Long id) {
        Alert alert = getAlertById(id);

        alertRepository.delete(alert);

        messagingTemplate.convertAndSend(
                "/topic/alerts", alert);
    }
}
