
package com.project.backend.services;

import com.project.backend.entities.Incident;
import com.project.backend.entities.User;
import com.project.backend.repositories.IncidentRepository;
import com.project.backend.repositories.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public IncidentService(
            IncidentRepository incidentRepository,
            UserRepository userRepository) {

        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    // Create incident
    public Incident createIncident(Incident incident) {
        return incidentRepository.save(incident);
    }

    // Get all incidents
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    // Get incident by ID
    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }

    // Update incident
    public Incident updateIncident(Long id, Incident updatedIncident) {

        Incident existing = incidentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Incident not found"));

        existing.setTitle(updatedIncident.getTitle());
        existing.setDescription(updatedIncident.getDescription());
        existing.setSeverity(updatedIncident.getSeverity());
        existing.setStatus(updatedIncident.getStatus());
        existing.setAlertId(updatedIncident.getAlertId());

        return incidentRepository.save(existing);
    }

    // Update incident status
    public Incident updateStatus(Long id, String status) {

        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Incident not found"));

        incident.setStatus(status);

        return incidentRepository.save(incident);
    }

    // Assign incident to an existing user
    public Incident assignIncident(Long incidentId, Long userId) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() ->
                        new RuntimeException("Incident not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        incident.setAssignedTo(user);

        return incidentRepository.save(incident);
    }

    // Delete incident
    public void deleteIncident(Long id) {

        if (!incidentRepository.existsById(id)) {
            throw new RuntimeException("Incident not found");
        }

        incidentRepository.deleteById(id);
    }
}
