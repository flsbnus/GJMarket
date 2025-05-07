package kr.ac.hansung.cse.gjmarekt.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
@ResponseBody
public class ImageController {

    //사진이 저장되어있는 경로
    @Value("${file.upload.path}")
    private String uploadPath;

    @GetMapping("/images/profile/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
//        System.out.println(filename);
//        try {
//            Path file = Paths.get(uploadPath).resolve(filename);
//            Resource resource = new UrlResource(file.toUri());
//
//            if (resource.exists() || resource.isReadable()) {
//                return ResponseEntity.ok().body(resource);
//            } else {
//                System.out.println("not found");
//                return ResponseEntity.notFound().build();
//            }
//        } catch (MalformedURLException e) {
//            System.out.println("bad request");
//            return ResponseEntity.badRequest().build();
//        }

        try {
            Path file = Paths.get(uploadPath, "profile", filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType != null) {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(contentType));
                    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
                } else {
                    return ResponseEntity.ok().body(resource);
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }


    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getPostImage(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadPath, filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType != null) {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(contentType));
                    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
                } else {
                    return ResponseEntity.ok().body(resource);
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }


    }
}
