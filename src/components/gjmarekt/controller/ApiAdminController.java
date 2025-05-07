package kr.ac.hansung.cse.gjmarekt.controller;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@ResponseBody
public class ApiAdminController {
    @GetMapping("/api/admin")
    public String admin() {
        return "admin";
    }
}
