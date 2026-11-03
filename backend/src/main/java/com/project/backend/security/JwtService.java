package com.project.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(String email, String role) {
        long now = System.currentTimeMillis();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("role", "ROLE_" + role);
        claims.put("sub", email);
        claims.put("iat", now / 1000);
        claims.put("exp", (now + jwtExpiration) / 1000);
        try {
            String encodedHeader = BASE64_URL_ENCODER.encodeToString(OBJECT_MAPPER.writeValueAsBytes(header));
            String encodedClaims = BASE64_URL_ENCODER.encodeToString(OBJECT_MAPPER.writeValueAsBytes(claims));
            String unsignedToken = encodedHeader + "." + encodedClaims;
            return unsignedToken + "." + BASE64_URL_ENCODER.encodeToString(sign(unsignedToken));
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new IllegalStateException("Unable to create JWT", exception);
        }
    }

    public String extractEmail(String token) {
        return getVerifiedClaims(token).path("sub").asText(null);
    }

    public String extractRole(String token) {
        return getVerifiedClaims(token).path("role").asText(null);
    }

    public boolean isTokenValid(String token, String userEmail) {
        return extractEmail(token).equals(userEmail) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        JsonNode expiration = getVerifiedClaims(token).get("exp");
        return expiration == null || !expiration.canConvertToLong()
                || expiration.asLong() * 1000L <= new Date().getTime();
    }

    private JsonNode getVerifiedClaims(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT");
        }
        try {
            JsonNode header = OBJECT_MAPPER.readTree(BASE64_URL_DECODER.decode(parts[0]));
            if (!"HS256".equals(header.path("alg").asText())) {
                throw new IllegalArgumentException("Unsupported JWT algorithm");
            }
            byte[] suppliedSignature = BASE64_URL_DECODER.decode(parts[2]);
            if (!MessageDigest.isEqual(sign(parts[0] + "." + parts[1]), suppliedSignature)) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }
            return OBJECT_MAPPER.readTree(BASE64_URL_DECODER.decode(parts[1]));
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid JWT", exception);
        }
    }

    private byte[] sign(String value) {
        byte[] key = secretKey.getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 bytes for HS256");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.US_ASCII));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to sign JWT", exception);
        }
    }
}