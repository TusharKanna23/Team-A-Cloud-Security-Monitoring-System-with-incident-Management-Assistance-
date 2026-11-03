
package com.project.backend.repository;

import com.project.backend.entity.Playbook;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaybookRepository extends JpaRepository<Playbook, Long> {
}
