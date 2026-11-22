package com.skyshield.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/health")
    public String healthCheck() {
        return "SkyShield Backend is Running Successfully!";
    }
}