package pe.lunaventas.api.producto;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.lunaventas.api.config.AdminGuard;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoRepository repo;
    private final AdminGuard admin;

    public ProductoController(ProductoRepository repo, AdminGuard admin) {
        this.repo = repo;
        this.admin = admin;
    }

    // público: lo que ve la tienda
    @GetMapping
    public List<Producto> listar(@RequestParam(required = false) String categoria) {
        if (categoria == null || categoria.isBlank()) return repo.findByActivoTrueOrderByNuevoDescIdAsc();
        return repo.findByActivoTrueAndCategoriaOrderByNuevoDescIdAsc(categoria);
    }

    @GetMapping("/{id}")
    public Producto obtener(@PathVariable Long id) {
        return repo.findById(id).filter(Producto::isActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    // privado: requiere header X-Admin-Key
    @PostMapping
    public ResponseEntity<Producto> crear(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                          @Valid @RequestBody Producto p) {
        admin.verificar(clave);
        p.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(p));
    }

    @PutMapping("/{id}")
    public Producto actualizar(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                               @PathVariable Long id, @Valid @RequestBody Producto p) {
        admin.verificar(clave);
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        p.setId(id);
        return repo.save(p);
    }

    // no se borra, se oculta para no perder el historial de pedidos
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> ocultar(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                        @PathVariable Long id) {
        admin.verificar(clave);
        Producto p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
        p.setActivo(false);
        repo.save(p);
        return ResponseEntity.noContent().build();
    }
}
