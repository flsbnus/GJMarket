package kr.ac.hansung.cse.gjmarekt.dto;

import kr.ac.hansung.cse.gjmarekt.entity.GJRole;
import kr.ac.hansung.cse.gjmarekt.entity.GJUser;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {

    private final GJUser gjUser;

    public CustomUserDetails(GJUser gjUser) {
        this.gjUser = gjUser;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>();

//        for (GJRole role : gjUser.getRoles()) {
//            authorities.add(new GrantedAuthority() {
//                @Override
//                public String getAuthority() {
//                    return role.getRolename();
//                }
//            });
//        }

//        gjUser.getRoles().forEach(role -> {
//            authorities.add(new GrantedAuthority() {
//                @Override
//                public String getAuthority() {
//                    return role.getRolename();
//                }
//            });
//        });
        authorities.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return "ROLE_USER";
            }
        });
        return authorities;
    }

    @Override
    public String getPassword() {
        return gjUser.getPassword();
    }

    @Override
    public String getUsername() {
        return gjUser.getEmail();
    }

    public Integer getUserid(){
        return gjUser.getId();
    }

    @Override
    public boolean isAccountNonExpired() {
//        return UserDetails.super.isAccountNonExpired();
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
//        return UserDetails.super.isAccountNonLocked();
        return true;

    }

    @Override
    public boolean isCredentialsNonExpired() {
//        return UserDetails.super.isCredentialsNonExpired();
        return true;
    }


    @Override
    public boolean isEnabled() {
//        return UserDetails.super.isEnabled();
        return true;
    }
}
