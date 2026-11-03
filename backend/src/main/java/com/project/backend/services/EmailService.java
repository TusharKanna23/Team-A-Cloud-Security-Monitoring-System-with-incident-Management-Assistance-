package com.project.backend.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("your-email@gmail.com");
            message.setTo(toEmail);
            message.setSubject("SkyShield - Verification Code");
            message.setText("Your SkyShield Security Console verification code is: " + otpCode + "\n\nThis code will expire in 10 minutes.");
            
            mailSender.send(message);
            System.out.println(">>> OTP EMAIL SUCCESSFULLY DISPATCHED TO: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            // Fallback for local testing if SMTP fails
            System.out.println("[SkyShield OTP Service Fallback] Sent to " + toEmail + " -> CODE: " + otpCode);
        }
    }
}