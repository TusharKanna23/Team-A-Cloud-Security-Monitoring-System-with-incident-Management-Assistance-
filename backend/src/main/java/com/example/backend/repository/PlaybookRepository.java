
package com.example.backend.repository;

import com.example.backend.entity.Playbook;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaybookRepository extends JpaRepository<Playbook, Long> {
}
