
package com.skyshield.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skyshield.entity.PlaybookExecution;

public interface PlaybookExecutionRepository
        extends JpaRepository<PlaybookExecution, Long> {
}
