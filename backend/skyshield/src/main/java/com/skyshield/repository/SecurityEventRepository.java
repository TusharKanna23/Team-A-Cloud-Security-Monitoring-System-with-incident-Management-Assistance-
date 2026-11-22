
package com.skyshield.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skyshield.entity.SecurityEvent;

@Repository
public interface SecurityEventRepository
        extends JpaRepository<SecurityEvent, Long> {

}
