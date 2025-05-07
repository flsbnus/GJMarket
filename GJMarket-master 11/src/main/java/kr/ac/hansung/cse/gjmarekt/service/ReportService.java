package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.entity.Report;
import kr.ac.hansung.cse.gjmarekt.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private final ReportRepository reportRepository;

    @Autowired
    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public Report createReport(Integer postId, Integer userId, String reason, String content) {
        Report report = new Report();
        report.setPostId(postId);
        report.setUserId(userId);
        report.setReason(reason);
        report.setContent(content);
        return reportRepository.save(report);
    }
}
