
package com.project.backend.controllers;

import com.project.backend.entities.Alert;
import com.project.backend.services.AlertService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    // Create a new alert
    @PostMapping
    public ResponseEntity<Alert> createAlert(@RequestBody Alert alert) {
        return ResponseEntity.ok(alertService.createAlert(alert));
    }

    // Get all alerts
    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    // Get alert by ID
    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getAlertById(id));
    }

    // Update alert details
    @PutMapping("/{id}")
    public ResponseEntity<Alert> updateAlert(
            @PathVariable Long id,
            @RequestBody Alert alert) {

        return ResponseEntity.ok(alertService.updateAlert(id, alert));
    }

    // Update alert status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Alert> updateAlertStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                alertService.updateAlertStatus(id, status));
    }

    // Delete alert
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAlert(@PathVariable Long id) {

        alertService.deleteAlert(id);

        return ResponseEntity.ok("Alert deleted successfully");
    }
}