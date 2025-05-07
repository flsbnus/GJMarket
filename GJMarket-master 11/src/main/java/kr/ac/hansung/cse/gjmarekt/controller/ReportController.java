package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.dto.ReportRequestDTO;
import kr.ac.hansung.cse.gjmarekt.entity.Report;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RestController
public class ReportController {
    private final ReportService reportService;
    private final JWTUtil jwtUtil;

    @Autowired
    public ReportController(ReportService reportService, JWTUtil jwtUtil) {
        this.reportService = reportService;
        this.jwtUtil = jwtUtil;
    }

//    @PostMapping("/api/posts/{postId}/report")
//    public ResponseEntity<Report> createReport(
//            @PathVariable Integer postId,
//            @RequestBody ReportRequestDTO reportRequestDTO,
//            @RequestHeader("Authorization") String authorization) {
//
//        String token = authorization.split(" ")[1];
//        Integer userId = jwtUtil.getUserId(token);
//
//        Report report = reportService.createReport(postId, userId, reportRequestDTO.getReason(), reportRequestDTO.getContent());
//        return new ResponseEntity<>(report, HttpStatus.CREATED);
//    }
@PostMapping("/api/posts/{postId}/report")
public ResponseEntity<Report> createReport(
        @PathVariable Integer postId,
        @RequestParam("reason") String reason,
        @RequestParam("content") String content,
        @RequestHeader("Authorization") String authorization) {

    String token = authorization.split(" ")[1];
    Integer userId = jwtUtil.getUserId(token);

    Report report = reportService.createReport(postId, userId, reason, content);
    return new ResponseEntity<>(report, HttpStatus.CREATED);
}
}
