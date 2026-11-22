
package com.skyshield.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skyshield.entity.SecurityAlert;
import com.skyshield.repository.SecurityAlertRepository;

@RestController
@RequestMapping("/api/alerts")
public class SecurityAlertController {

    private final SecurityAlertRepository alertRepository;

    public SecurityAlertController(
            SecurityAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public List<SecurityAlert> getAllAlerts() {
        return alertRepository.findAll();
    }
}
