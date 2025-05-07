package kr.ac.hansung.cse.gjmarekt;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
class GjMarektApplicationTests {

//    @Test
//    void contextLoads() {
//    }
    @Autowired
    private PasswordEncoder encoder;

    @Test
    void generateHashedPassword() {
        String pwd = encoder.encode("alicepw");
        System.out.println(pwd);
    }
}
