package com.project.backend.services;

import com.project.backend.dtos.AuthDtos.*;
import com.project.backend.entities.User;
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
    private final EmailService emailService; // Inject EmailService

    public AuthService(UserRepository userRepository, 
                       PasswordEncoder passwordEncoder, 
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    // Inside register(), login(), and resendOtp(), replace System.out.println with:
    // emailService.sendOtpEmail(user.getEmail(), otp);

    private String generateSixDigitOtp() {
        return String.format("%06d", new Random().nextInt(900000) + 100000);
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered.");
        }

        String otp = generateSixDigitOtp();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole().toUpperCase() : "ANALYST")
                .verified(false)
                .otpCode(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        userRepository.save(user);

        // System output simulating email dispatch
        System.out.println("=================================================");
        System.out.println("[SkyShield OTP Service] Sent to " + user.getEmail() + " -> CODE: " + otp);
        System.out.println("=================================================");

        return new AuthResponse(null, null, true, "Verification OTP code sent to your email.");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials.");
        }

        // Generate fresh OTP on login after logout
        String otp = generateSixDigitOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setVerified(false); // require OTP verification on new login
        userRepository.save(user);

        System.out.println("=================================================");
        System.out.println("[SkyShield OTP Service] Sent to " + user.getEmail() + " -> CODE: " + otp);
        System.out.println("=================================================");

        return new AuthResponse(null, null, true, "OTP code generated and sent to email.");
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new RuntimeException("Invalid verification code.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired.");
        }

        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        UserDto userDto = new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), true);

        return new AuthResponse(token, userDto, false, "Verification successful.");
    }
    public AuthResponse resendOtp(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found."));

    String newOtp = generateSixDigitOtp();
    user.setOtpCode(newOtp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
    userRepository.save(user);

    System.out.println("=================================================");
    System.out.println("[SkyShield OTP Service] RESENT to " + user.getEmail() + " -> CODE: " + newOtp);
    System.out.println("=================================================");

    return new AuthResponse(null, null, true, "A new verification code has been sent to your email.");
}
}