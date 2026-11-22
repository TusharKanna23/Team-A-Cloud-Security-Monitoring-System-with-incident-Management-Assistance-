
package com.skyshield.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.skyshield.entity.SecurityEvent;
import com.skyshield.repository.SecurityEventRepository;

@Service
public class SecurityEventService {

    private final SecurityEventRepository repository;
    private final SecurityAlertService alertService;

    public SecurityEventService(
            SecurityEventRepository repository,
            SecurityAlertService alertService) {

        this.repository = repository;
        this.alertService = alertService;
    }

    // Save event and automatically generate alert if required
    public SecurityEvent saveEvent(SecurityEvent event) {

        if (event.getStatus() == null || event.getStatus().isBlank()) {
            event.setStatus("NEW");
        }

        if (event.getSeverity() == null || event.getSeverity().isBlank()) {
            event.setSeverity("MEDIUM");
        }

        SecurityEvent savedEvent = repository.save(event);

        // Generate alert and execute playbook for HIGH/CRITICAL events
        alertService.createAlertIfRequired(savedEvent);

        return savedEvent;
    }

    // Get all security events
    public List<SecurityEvent> getAllEvents() {
        return repository.findAll();
    }

    // Get event by ID
    public Optional<SecurityEvent> getEventById(Long id) {
        return repository.findById(id);
    }

    // Delete event
    public void deleteEvent(Long id) {
        repository.deleteById(id);
    }

    // Count all security events
    public long countEvents() {
        return repository.count();
    }
}
