
package com.project.backend.services;

import com.project.backend.entities.SecurityEvent;
import com.project.backend.repositories.SecurityEventRepository;
import org.springframework.stereotype.Service;

@Service
public class SecurityEventService {

    private final SecurityEventRepository eventRepository;
    private final DetectionService detectionService;

    public SecurityEventService(
            SecurityEventRepository eventRepository,
            DetectionService detectionService) {
        this.eventRepository = eventRepository;
        this.detectionService = detectionService;
    }

    public SecurityEvent recordEvent(
            String eventType,
            String description,
            String source,
            String sourceIp) {

        SecurityEvent event = new SecurityEvent();

        event.setEventType(eventType);
        event.setDescription(description);
        event.setSource(source);
        event.setSourceIp(sourceIp);

        SecurityEvent savedEvent = eventRepository.save(event);

        detectionService.processEvent(event);

        return savedEvent;
    }
}
