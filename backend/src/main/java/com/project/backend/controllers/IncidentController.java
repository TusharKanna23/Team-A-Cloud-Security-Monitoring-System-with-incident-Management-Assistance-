
package com.project.backend.controllers;

import com.project.backend.entities.Incident;
import com.project.backend.services.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    // Create incident
    @PostMapping
    public ResponseEntity<Incident> createIncident(
            @RequestBody Incident incident) {
        return ResponseEntity.ok(
                incidentService.createIncident(incident));
    }

    // Get all incidents
    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents() {
        return ResponseEntity.ok(
                incidentService.getAllIncidents());
    }

    // Get incident by ID
    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(
            @PathVariable Long id) {

        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update incident
    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(
            @PathVariable Long id,
            @RequestBody Incident incident) {

        try {
            return ResponseEntity.ok(
                    incidentService.updateIncident(id, incident));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update incident status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Incident> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        try {
            return ResponseEntity.ok(
                    incidentService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Assign incident to a user
    @PatchMapping("/{incidentId}/assign/{userId}")
    public ResponseEntity<Map<String, Object>> assignIncident(
            @PathVariable Long incidentId,
            @PathVariable Long userId) {

        try {
            Incident incident =
                    incidentService.assignIncident(incidentId, userId);

            return ResponseEntity.ok(Map.of(
                    "message", "Incident assigned successfully",
                    "incidentId", incident.getId(),
                    "assignedToId", incident.getAssignedTo().getId(),
                    "assignedToName", incident.getAssignedTo().getFullName()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete incident
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(
            @PathVariable Long id) {

        try {
            incidentService.deleteIncident(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
