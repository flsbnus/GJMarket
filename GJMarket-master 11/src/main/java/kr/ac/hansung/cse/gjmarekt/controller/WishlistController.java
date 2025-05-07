package kr.ac.hansung.cse.gjmarekt.controller;

import kr.ac.hansung.cse.gjmarekt.entity.Wishlist;
import kr.ac.hansung.cse.gjmarekt.jwt.JWTUtil;
import kr.ac.hansung.cse.gjmarekt.service.WishlistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@ResponseBody
public class WishlistController {

    private final WishlistService wishlistService;
    private final JWTUtil jwtUtil;

    public WishlistController(WishlistService wishlistService, JWTUtil jwtUtil) {
        this.wishlistService = wishlistService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/api/wishlist/{postId}")
    public ResponseEntity<Wishlist> addWishlist(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization) {

        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        Wishlist wishlist = wishlistService.addToWishlist(userId, postId);
        return ResponseEntity.ok(wishlist);
    }

    @DeleteMapping("/api/wishlist/{postId}")
    public ResponseEntity<Void> deleteWishlist(
            @PathVariable Integer postId,
            @RequestHeader("Authorization") String authorization
    ){
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        wishlistService.removeFromWishlist(userId, postId);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/api/wishlist/getmywishlist")
    public ResponseEntity<List<Wishlist>> getMyWishlist(
            @RequestHeader("Authorization") String authorization) {


        System.out.println(authorization.split(" ")[1]);
        String token = authorization.split(" ")[1];
        Integer userId = jwtUtil.getUserId(token);

        System.out.println("userid="+userId);

        List<Wishlist> wishlist = wishlistService.getWishlistByUserId(userId);
        return new ResponseEntity<>(wishlist, HttpStatus.OK);
    }
}
