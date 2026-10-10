package pe.lunaventas.api.contacto;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.lunaventas.api.cliente.Cliente;
import pe.lunaventas.api.cliente.ClienteService;
import pe.lunaventas.api.config.AdminGuard;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contactos")
public class ContactoController {

    private final ContactoRepository repo;
    private final AdminGuard admin;
    private final ClienteService clientes;

    public ContactoController(ContactoRepository repo, AdminGuard admin, ClienteService clientes) {
        this.repo = repo;
        this.admin = admin;
        this.clientes = clientes;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> crear(@Valid @RequestBody ContactoRequest req) {
        Contacto c = new Contacto();
        c.setNombre(req.nombre().trim());
        c.setTelefono(req.telefono());
        c.setMensaje(req.mensaje().trim());
        Cliente cliente = clientes.registrar(req.nombre(), req.telefono(), null, "web_contacto", req.aceptaOfertas());
        if (cliente != null) c.setClienteId(cliente.getId());
        return Map.of("id", repo.save(c).getId());
    }

    @GetMapping
    public List<Contacto> listar(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return repo.findTop100ByOrderByIdDesc();
    }
}
