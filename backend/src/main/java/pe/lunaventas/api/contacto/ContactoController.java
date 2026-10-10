package pe.lunaventas.api.contacto;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.lunaventas.api.config.AdminGuard;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contactos")
public class ContactoController {

    private final ContactoRepository repo;
    private final AdminGuard admin;

    public ContactoController(ContactoRepository repo, AdminGuard admin) {
        this.repo = repo;
        this.admin = admin;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> crear(@Valid @RequestBody Contacto c) {
        c.setId(null);
        return Map.of("id", repo.save(c).getId());
    }

    @GetMapping
    public List<Contacto> listar(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return repo.findTop100ByOrderByIdDesc();
    }
}
