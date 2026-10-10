package pe.lunaventas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LunaVentasApplication {
    public static void main(String[] args) {
        SpringApplication.run(LunaVentasApplication.class, args);
    }
}
