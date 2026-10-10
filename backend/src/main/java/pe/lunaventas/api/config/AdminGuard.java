package pe.lunaventas.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

// protección simple para las rutas de administración
@Component
public class AdminGuard {

    private final String clave;

    public AdminGuard(@Value("${app.admin-key:}") String clave) {
        this.clave = clave;
    }

    public void verificar(String recibida) {
        if (clave.isBlank() || recibida == null
                || !MessageDigest.isEqual(clave.getBytes(StandardCharsets.UTF_8), recibida.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clave de administración inválida");
        }
    }
}
