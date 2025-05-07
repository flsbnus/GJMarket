package kr.ac.hansung.cse.gjmarekt.service;

import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import kr.ac.hansung.cse.gjmarekt.repository.RoleRepository;
import kr.ac.hansung.cse.gjmarekt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RegistrationServiceImpl implements RegistrationService {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public GJUser createUser(GJUser user, List<GJRole> userRoles) {
        for (GJRole ur : userRoles) {
            if (roleRepository.findByRolename(ur.getRolename()).isEmpty()) {
                roleRepository.save(ur);
            }
        }

        // generate new Bcrypt hash
        String encryptedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encryptedPassword);

        user.setRoles(userRoles);

        GJUser newUser = userRepository.save(user);

        return newUser;
    }

    public boolean checkEmailExists(String email) {
        if (userRepository.findByEmail(email).isPresent()) {
            return true;
        }

        return false;
    }

    public GJRole findByRolename(String rolename) {
        Optional<GJRole> role = roleRepository.findByRolename(rolename);
        return role.orElseGet(() -> new GJRole(rolename));
    }

}
