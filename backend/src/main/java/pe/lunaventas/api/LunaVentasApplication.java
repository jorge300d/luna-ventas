package pe.lunaventas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
@EnableScheduling
public class LunaVentasApplication {

    public static void main(String[] args) {
        usarDatabaseUrl(System.getenv("DATABASE_URL"));
        SpringApplication.run(LunaVentasApplication.class, args);
    }

    // Neon y Render dan la conexión como postgresql://usuario:clave@host/base?sslmode=require
    // aquí se convierte al formato que usa Java
    static void usarDatabaseUrl(String url) {
        if (url == null || url.isBlank() || url.startsWith("jdbc:")) return;
        url = url.trim().replaceAll("^['\"]|['\"]$", "");
        // si solo se pegó la contraseña, el host y el usuario vienen de DB_URL y DB_USER
        if (!url.contains("://")) {
            System.setProperty("spring.datasource.password", url);
            return;
        }
        URI u = URI.create(url.trim().replaceFirst("^postgres(ql)?://", "http://"));
        String[] cred = u.getRawUserInfo() == null ? new String[0] : u.getRawUserInfo().split(":", 2);
        String puerto = u.getPort() > 0 ? ":" + u.getPort() : "";
        String query = u.getRawQuery() == null ? "sslmode=require" : u.getRawQuery().replace("&channel_binding=require", "").replace("channel_binding=require&", "");
        System.setProperty("spring.datasource.url", "jdbc:postgresql://" + u.getHost() + puerto + u.getRawPath() + "?" + query);
        if (cred.length > 0) System.setProperty("spring.datasource.username", URLDecoder.decode(cred[0], StandardCharsets.UTF_8));
        if (cred.length > 1) System.setProperty("spring.datasource.password", URLDecoder.decode(cred[1], StandardCharsets.UTF_8));
    }
}
