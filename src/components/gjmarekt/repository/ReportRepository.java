package kr.ac.hansung.cse.gjmarekt.repository;

import kr.ac.hansung.cse.gjmarekt.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Integer> {
}