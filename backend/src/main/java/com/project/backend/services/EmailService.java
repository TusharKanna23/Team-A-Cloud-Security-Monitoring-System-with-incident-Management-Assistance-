package com.project.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@skyshield.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        if (toEmail == null || toEmail.isBlank() || otpCode == null || otpCode.isBlank()) {
            throw new IllegalArgumentException("Recipient email and OTP code are required.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("SkyShield - Verification Code");
            message.setText("Your SkyShield Security Console verification code is: " + otpCode + "\n\nThis code will expire in 10 minutes.");

            mailSender.send(message);
            System.out.println(">>> OTP EMAIL SUCCESSFULLY DISPATCHED TO: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + toEmail + ": " + e.getMessage());
            throw new IllegalStateException("Unable to send OTP email", e);
        }
    }
}