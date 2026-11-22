
package com.project.backend.services;

import com.project.backend.entities.Alert;
import com.project.backend.entities.SecurityEvent;
import org.springframework.stereotype.Service;

@Service
public class DetectionService {

    private final AlertService alertService;

    public DetectionService(AlertService alertService) {
        this.alertService = alertService;
    }

    // Process an internal security event
    public void processEvent(SecurityEvent event) {

        if (event == null || event.getEventType() == null) {
            return;
        }

        String eventType = event.getEventType()
                .trim()
                .toUpperCase();

        switch (eventType) {

            case "FAILED_LOGIN":
                generateAlert(event, "MEDIUM",
                        "Failed login event detected");
                break;

            case "OTP_FAILURE":
                generateAlert(event, "MEDIUM",
                        "OTP verification failure detected");
                break;

            case "SYSTEM_ERROR":
                generateAlert(event, "HIGH",
                        "Application system error detected");
                break;

            case "SUSPICIOUS_SCRIPT_ACTIVITY":
                generateAlert(event, "HIGH",
                        "Suspicious script activity reported by monitoring source");
                break;

            case "MALWARE_DETECTED":
                generateAlert(event, "CRITICAL",
                        "Malware detection reported by security monitoring");
                break;

            case "UNAUTHORIZED_ACCESS":
                generateAlert(event, "HIGH",
                        "Unauthorized access event reported");
                break;

            case "SUSPICIOUS_FILE_ACTIVITY":
                generateAlert(event, "HIGH",
                        "Suspicious file activity reported");
                break;

            case "UNUSUAL_NETWORK_ACTIVITY":
                generateAlert(event, "HIGH",
                        "Unusual network activity reported");
                break;

            case "SUCCESSFUL_LOGIN":
                // Normal login does not generate an alert
                break;

            default:
                // Unknown event types are ignored
                break;
        }
    }

    // Generate and save alert
    private void generateAlert(
            SecurityEvent event,
            String severity,
            String message) {

        Alert alert = new Alert();

        alert.setTitle(message);

        alert.setDescription(
                message
                + " | Event: " + safe(event.getEventType())
                + " | User: " + safe(event.getUsername())
                + " | Department: " + safe(event.getDepartment())
                + " | Details: " + safe(event.getDescription())
        );

        alert.setSeverity(severity);
        alert.setSource(safe(event.getSource()));
        alert.setSourceIp(safe(event.getSourceIp()));
        alert.setStatus("NEW");
        alert.setOccurrenceCount(1);

        // Save alert and broadcast through WebSocket
        alertService.createAlert(alert);
    }

    // Handle null or empty values
    private String safe(String value) {
        return value == null || value.isBlank()
                ? "Unknown"
                : value;
    }
}
