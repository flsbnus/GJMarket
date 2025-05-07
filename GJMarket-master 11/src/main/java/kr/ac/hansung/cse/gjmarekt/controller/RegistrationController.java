package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.ArrayList;
import java.util.List;

@Controller
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    @RequestMapping(value = "/signup", method = RequestMethod.GET)
    public String signup(Model model) {

        GJUser user = new GJUser();
        model.addAttribute("user", user);

        return "signup";
    }

    @RequestMapping(value = "/signup", method = RequestMethod.POST)
    public String signupPost(@ModelAttribute("user") GJUser user, Model model) {

        if (registrationService.checkEmailExists(user.getEmail())) {
            model.addAttribute("emailExists", true);
            return "signup";
        }
        else {
            List<GJRole> userRoles = new ArrayList<>();

            GJRole role = registrationService.findByRolename("ROLE_USER");
            userRoles.add(role);

            // 특정 이메일 주소인 경우 ADMIN 역할 추가
            if ("admin@hansung.ac.kr".equals(user.getEmail())) {
                GJRole roleAdmin = registrationService.findByRolename("ROLE_ADMIN");
                userRoles.add(roleAdmin);
            }

            registrationService.createUser(user, userRoles);

            return "redirect:/";
        }
    }
}