
package com.project.backend.services;

import com.project.backend.dtos.AuthDtos.*;
import com.project.backend.entities.User;
import com.project.backend.entities.SecurityEvent;
import com.project.backend.repositories.UserRepository;
import com.project.backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AlertDetectionService alertDetectionService;
    private final DetectionService detectionService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            AlertDetectionService alertDetectionService,
            DetectionService detectionService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.alertDetectionService = alertDetectionService;
        this.detectionService = detectionService;
    }

    private String generateSixDigitOtp() {
        return String.format("%06d",
                new Random().nextInt(900000) + 100000);
    }

    // USER REGISTRATION
    public AuthResponse register(RegisterRequest request) {

        if (!request.getPassword()
                .equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match.");
        }

        if (userRepository.findByEmail(request.getEmail())
                .isPresent()) {
            throw new RuntimeException(
                    "Email is already registered.");
        }

        String otp = generateSixDigitOtp();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(
                        request.getPassword()))
                .role(request.getRole() != null
                        ? request.getRole().toUpperCase()
                        : "ANALYST")
                .verified(false)
                .otpCode(otp)
                .otpExpiry(LocalDateTime.now()
                        .plusMinutes(10))
                .build();

        userRepository.save(user);

        System.out.println(
                "[OTP] Registration OTP generated.");
        System.out.println(
                "[OTP] Calling EmailService for registration...");

        emailService.sendOtpEmail(
                user.getEmail(), otp);

        System.out.println(
                "[OTP] Registration email request completed.");

        return new AuthResponse(
                null,
                null,
                true,
                "Verification code sent to your email.");
    }

    // USER LOGIN
    public AuthResponse login(
            LoginRequest request,
            String sourceIp) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            alertDetectionService.recordFailedLogin(sourceIp);
            throw new RuntimeException("Invalid credentials.");
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            alertDetectionService.recordFailedLogin(sourceIp);
            throw new RuntimeException("Invalid credentials.");
        }

        String otp = generateSixDigitOtp();

        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now()
                .plusMinutes(10));
        user.setVerified(false);

        userRepository.save(user);

        System.out.println("[OTP] Login OTP generated.");
        System.out.println(
                "[OTP] Calling EmailService for login...");

        emailService.sendOtpEmail(
                user.getEmail(), otp);

        System.out.println(
                "[OTP] Login email request completed.");

        return new AuthResponse(
                null,
                null,
                true,
                "OTP code generated and sent to email.");
    }

    // VERIFY OTP
    public AuthResponse verifyOtp(
            VerifyOtpRequest request,
            String sourceIp) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found."));

        // Detect incorrect OTP
        if (user.getOtpCode() == null
                || !user.getOtpCode().equals(
                        request.getOtpCode())) {

            SecurityEvent event = new SecurityEvent();
            event.setEventType("OTP_FAILURE");
            event.setDescription(
                    "Invalid OTP verification attempt");
            event.setUsername(request.getEmail());
            event.setSource("AUTHENTICATION");
            event.setSourceIp(sourceIp);

            detectionService.processEvent(event);

            throw new RuntimeException(
                    "Invalid verification code.");
        }

        // Detect expired OTP
        if (user.getOtpExpiry() == null
                || user.getOtpExpiry()
                        .isBefore(LocalDateTime.now())) {

            SecurityEvent event = new SecurityEvent();
            event.setEventType("OTP_FAILURE");
            event.setDescription(
                    "Expired OTP verification attempt");
            event.setUsername(request.getEmail());
            event.setSource("AUTHENTICATION");
            event.setSourceIp(sourceIp);

            detectionService.processEvent(event);

            throw new RuntimeException(
                    "Verification code has expired.");
        }

        // Successful OTP verification
        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);

        userRepository.save(user);

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole());

        UserDto userDto = new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                true);

        return new AuthResponse(
                token,
                userDto,
                false,
                "Verification successful.");
    }

    // RESEND OTP
    public AuthResponse resendOtp(String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found."));

        String newOtp = generateSixDigitOtp();

        user.setOtpCode(newOtp);
        user.setOtpExpiry(LocalDateTime.now()
                .plusMinutes(10));

        userRepository.save(user);

        System.out.println("[OTP] Resend OTP generated.");
        System.out.println(
                "[OTP] Calling EmailService for resend...");

        emailService.sendOtpEmail(
                user.getEmail(), newOtp);

        System.out.println(
                "[OTP] Resend email request completed.");

        return new AuthResponse(
                null,
                null,
                true,
                "A new verification code has been sent to your email.");
    }
}
