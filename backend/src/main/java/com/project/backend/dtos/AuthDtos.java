package com.project.backend.dtos;

public class AuthDtos {

    public static class LoginRequest {
        private String email;
        private String password;

        public LoginRequest() {}
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class VerifyOtpRequest {
        private String email;
        private String otpCode;

        public VerifyOtpRequest() {}
        public VerifyOtpRequest(String email, String otpCode) {
            this.email = email;
            this.otpCode = otpCode;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getOtpCode() { return otpCode; }
        public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    }

    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;
        private String confirmPassword;
        private String role;

        public RegisterRequest() {}

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class AuthResponse {
        private String token;
        private UserDto user;
        private boolean otpRequired;
        private String message;

        public AuthResponse() {}

        public AuthResponse(String token, UserDto user, boolean otpRequired, String message) {
            this.token = token;
            this.user = user;
            this.otpRequired = otpRequired;
            this.message = message;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }

        public boolean isOtpRequired() { return otpRequired; }
        public void setOtpRequired(boolean otpRequired) { this.otpRequired = otpRequired; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class UserDto {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private boolean verified;

        public UserDto() {}

        public UserDto(Long id, String fullName, String email, String role, boolean verified) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
            this.verified = verified;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
    }
}