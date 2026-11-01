
package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playbooks")
public class Playbook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private boolean enabled = true;

    // Manually selected risk severity
    @Column(nullable = false)
    private String riskSeverity = "LOW";

    // Date and time when the playbook was created
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Date and time when the playbook was last updated
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(
        mappedBy = "playbook",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @OrderBy("stepOrder ASC")
    private List<PlaybookStep> steps = new ArrayList<>();

    public Playbook() {}

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getRiskSeverity() {
        return riskSeverity;
    }

    public void setRiskSeverity(String riskSeverity) {
        this.riskSeverity = riskSeverity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<PlaybookStep> getSteps() {
        return steps;
    }

    public void setSteps(List<PlaybookStep> steps) {
        this.steps = steps;
    }
}
