package pe.lunaventas.api.campana;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.lunaventas.api.cliente.*;
import pe.lunaventas.api.config.AdminGuard;
import pe.lunaventas.api.pedido.PedidoRepository;
import pe.lunaventas.api.whatsapp.WhatsappService;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// todo lo que usa el panel privado; cada ruta pide la clave X-Admin-Key
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminGuard admin;
    private final ClienteRepository clientes;
    private final ClienteService clienteService;
    private final CampanaRepository campanas;
    private final CampanaService campanaService;
    private final PedidoRepository pedidos;
    private final WhatsappService whatsapp;

    public AdminController(AdminGuard admin, ClienteRepository clientes, ClienteService clienteService,
                           CampanaRepository campanas, CampanaService campanaService,
                           PedidoRepository pedidos, WhatsappService whatsapp) {
        this.admin = admin;
        this.clientes = clientes;
        this.clienteService = clienteService;
        this.campanas = campanas;
        this.campanaService = campanaService;
        this.pedidos = pedidos;
        this.whatsapp = whatsapp;
    }

    public record NuevoCliente(@NotBlank @Size(max = 80) String nombre, @NotBlank String telefono, boolean aceptaOfertas) {}

    public record NuevaCampana(@NotBlank @Size(max = 120) String titulo,
                               @NotBlank @Size(max = 700) String mensaje,
                               @Pattern(regexp = "|blusas|vestidos|pantalones|conjuntos|casacas") String categoria,
                               OffsetDateTime programadaEn) {}

    @GetMapping("/resumen")
    public Map<String, Object> resumen(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        BigDecimal ventas = pedidos.findAll().stream()
                .filter(p -> !"cancelado".equals(p.getEstado()))
                .map(p -> p.getTotal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("clientes", clientes.count());
        r.put("aceptanOfertas", clientes.countByAceptaOfertasTrue());
        r.put("pedidos", pedidos.count());
        r.put("ventas", ventas);
        r.put("campanas", campanas.count());
        r.put("whatsappConectado", whatsapp.conectado());
        return r;
    }

    @GetMapping("/clientes")
    public List<ClienteDto> listarClientes(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return clientes.findAllByOrderByUltimoContactoDesc().stream().map(ClienteDto::de).toList();
    }

    @GetMapping(value = "/clientes.csv")
    public ResponseEntity<byte[]> exportar(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        StringBuilder sb = new StringBuilder("﻿nombre,telefono,distrito,origen,acepta_ofertas,intereses,pedidos,total_gastado\n");
        for (Cliente c : clientes.findAllByOrderByUltimoContactoDesc()) {
            sb.append(csv(c.getNombre())).append(',').append(c.getTelefono()).append(',')
              .append(csv(c.getDistrito())).append(',').append(c.getOrigen()).append(',')
              .append(c.isAceptaOfertas() ? "si" : "no").append(',').append(csv(c.getIntereses())).append(',')
              .append(c.getTotalPedidos()).append(',').append(c.getTotalGastado()).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=clientes-luna-ventas.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    // para registrar a mano a quien aceptó por chat o en la tienda
    @PostMapping("/clientes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteDto agregarCliente(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                     @Valid @RequestBody NuevoCliente req) {
        admin.verificar(clave);
        Cliente c = clienteService.registrar(req.nombre(), req.telefono(), null, "manual", req.aceptaOfertas());
        if (c == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular no es válido");
        return ClienteDto.de(c);
    }

    @PatchMapping("/clientes/{id}/ofertas")
    public ClienteDto cambiarConsentimiento(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                           @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        admin.verificar(clave);
        Cliente c = clientes.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        if (Boolean.TRUE.equals(body.get("acepta"))) clienteService.aceptar(c);
        else clienteService.darDeBaja(c);
        return ClienteDto.de(c);
    }

    @GetMapping("/campanas")
    public List<Map<String, Object>> listarCampanas(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return campanas.findTop50ByOrderByIdDesc().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("titulo", c.getTitulo());
            m.put("mensaje", c.getMensaje());
            m.put("categoria", c.getCategoria());
            m.put("estado", c.getEstado());
            m.put("automatica", c.isAutomatica());
            m.put("programadaEn", c.getProgramadaEn());
            m.put("enviadaEn", c.getEnviadaEn());
            m.put("destinatarios", campanaService.destinatarios(c).size());
            m.putAll(campanaService.conteo(c.getId()));
            return m;
        }).toList();
    }

    @PostMapping("/campanas")
    @ResponseStatus(HttpStatus.CREATED)
    public Campana crearCampana(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                @Valid @RequestBody NuevaCampana req) {
        admin.verificar(clave);
        return campanaService.crear(req.titulo(), req.mensaje(), req.categoria(), req.programadaEn(), false);
    }

    @PostMapping("/campanas/{id}/enviar")
    public CampanaService.Resultado enviar(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                           @PathVariable Long id) {
        admin.verificar(clave);
        try {
            return campanaService.enviar(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @DeleteMapping("/campanas/{id}")
    public ResponseEntity<Void> borrarCampana(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                              @PathVariable Long id) {
        admin.verificar(clave);
        Campana c = campanas.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaña no encontrada"));
        if ("enviada".equals(c.getEstado()) || "enviando".equals(c.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Una campaña ya enviada no se puede borrar");
        }
        campanas.delete(c);
        return ResponseEntity.noContent().build();
    }

    private static String csv(String s) {
        if (s == null) return "";
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
