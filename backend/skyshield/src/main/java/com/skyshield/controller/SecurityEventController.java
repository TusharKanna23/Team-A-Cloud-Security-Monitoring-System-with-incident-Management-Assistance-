
package com.skyshield.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.skyshield.entity.SecurityEvent;
import com.skyshield.service.SecurityEventService;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class SecurityEventController {

    private final SecurityEventService service;

    public SecurityEventController(SecurityEventService service) {
        this.service = service;
    }

    // Create a security event
    @PostMapping
    public ResponseEntity<SecurityEvent> createEvent(
            @RequestBody SecurityEvent event) {

        SecurityEvent savedEvent = service.saveEvent(event);

        return new ResponseEntity<>(
                savedEvent, HttpStatus.CREATED);
    }

    // Get all security events
    @GetMapping
    public ResponseEntity<List<SecurityEvent>> getAllEvents() {

        return ResponseEntity.ok(service.getAllEvents());
    }

    // Get a security event by ID
    @GetMapping("/{id}")
    public ResponseEntity<SecurityEvent> getEventById(
            @PathVariable Long id) {

        return service.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a security event
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id) {

        if (service.getEventById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        service.deleteEvent(id);

        return ResponseEntity.noContent().build();
    }

    // Get total number of events
    @GetMapping("/count")
    public ResponseEntity<Long> countEvents() {

        return ResponseEntity.ok(service.countEvents());
    }
}
