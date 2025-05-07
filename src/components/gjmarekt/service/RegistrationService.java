package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;

import java.util.List;

public interface RegistrationService {
    GJUser createUser(GJUser user, List<GJRole> userRoles);

    boolean checkEmailExists(String email);

    GJRole findByRolename(String rolename);
}
