package com.skyshield.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyshield.entity.SecurityAlert;

@Repository
public interface SecurityAlertRepository
        extends JpaRepository<SecurityAlert, Long> {

}