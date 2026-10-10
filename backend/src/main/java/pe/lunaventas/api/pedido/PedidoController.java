package pe.lunaventas.api.pedido;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.lunaventas.api.config.AdminGuard;
import pe.lunaventas.api.producto.Producto;
import pe.lunaventas.api.producto.ProductoRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoRepository pedidos;
    private final ProductoRepository productos;
    private final AdminGuard admin;

    public PedidoController(PedidoRepository pedidos, ProductoRepository productos, AdminGuard admin) {
        this.pedidos = pedidos;
        this.productos = productos;
        this.admin = admin;
    }

    // el precio se toma de la base, no del navegador
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> crear(@Valid @RequestBody PedidoRequest req) {
        Pedido pedido = new Pedido();
        pedido.setCliente(req.cliente().trim());
        pedido.setTelefono(req.telefono());
        pedido.setDistrito(req.distrito());
        pedido.setEntrega(req.entrega());

        BigDecimal total = BigDecimal.ZERO;
        for (PedidoRequest.Item it : req.items()) {
            Producto p = productos.findById(it.productoId()).filter(Producto::isActivo)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto " + it.productoId() + " no existe"));
            if (!p.getTallas().contains(it.talla())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Talla " + it.talla() + " no disponible para " + p.getNombre());
            }
            PedidoItem item = new PedidoItem();
            item.setProductoId(p.getId());
            item.setNombre(p.getNombre());
            item.setTalla(it.talla());
            item.setCantidad(it.cantidad());
            item.setPrecioUnitario(p.getPrecio());
            pedido.agregar(item);
            total = total.add(p.getPrecio().multiply(BigDecimal.valueOf(it.cantidad())));
        }
        pedido.setTotal(total);
        Pedido guardado = pedidos.save(pedido);
        return Map.of("id", guardado.getId(), "total", total);
    }

    // para la dueña: ver los últimos pedidos
    @GetMapping
    @Transactional(readOnly = true)
    public List<Pedido> listar(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return pedidos.findTop100ByOrderByIdDesc();
    }

    @PatchMapping("/{id}/estado")
    @Transactional
    public Map<String, Object> cambiarEstado(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                             @PathVariable Long id, @RequestBody Map<String, String> body) {
        admin.verificar(clave);
        String estado = body.getOrDefault("estado", "");
        if (!List.of("pendiente", "confirmado", "entregado", "cancelado").contains(estado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado no válido");
        }
        Pedido p = pedidos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        p.setEstado(estado);
        return Map.of("id", p.getId(), "estado", estado);
    }
}
