package com.example.backend.repository;

import com.example.backend.entity.PlaybookExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaybookExecutionRepository
        extends JpaRepository<PlaybookExecution, Long> {

    List<PlaybookExecution> findByPlaybookId(Long playbookId);
}