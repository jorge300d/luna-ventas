package pe.lunaventas.api.legal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.lunaventas.api.config.AdminGuard;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LegalController {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ReclamoRepository reclamos;
    private final SolicitudDatosRepository solicitudes;
    private final Correo correo;
    private final AdminGuard admin;
    private final String proveedor;
    private final String ruc;
    private final String domicilio;

    public LegalController(ReclamoRepository reclamos, SolicitudDatosRepository solicitudes, Correo correo, AdminGuard admin,
                           @Value("${app.proveedor-nombre:Luna Ventas}") String proveedor,
                           @Value("${app.proveedor-ruc:}") String ruc,
                           @Value("${app.proveedor-domicilio:}") String domicilio) {
        this.reclamos = reclamos;
        this.solicitudes = solicitudes;
        this.correo = correo;
        this.admin = admin;
        this.proveedor = proveedor;
        this.ruc = ruc;
        this.domicilio = domicilio;
    }

    public record NuevoReclamo(
            @NotBlank @Pattern(regexp = "reclamo|queja") String tipo,
            @NotBlank @Size(max = 120) String nombre,
            @NotBlank @Pattern(regexp = "DNI|CE|PASAPORTE|RUC") String tipoDocumento,
            @NotBlank @Size(min = 6, max = 20) String numeroDocumento,
            @NotBlank @Size(max = 200) String domicilio,
            @Size(max = 20) String telefono,
            @NotBlank @Email @Size(max = 120) String correo,
            boolean menorDeEdad,
            @Size(max = 120) String apoderado,
            @NotBlank @Pattern(regexp = "producto|servicio") String bienTipo,
            @DecimalMin("0") BigDecimal monto,
            @NotBlank @Size(max = 300) String descripcionBien,
            @NotBlank @Size(max = 2000) String detalle,
            @NotBlank @Size(max = 1000) String pedido,
            @AssertTrue boolean aceptaPolitica) {}

    public record NuevaSolicitud(
            @NotBlank @Pattern(regexp = "acceso|rectificacion|cancelacion|oposicion|portabilidad|revocacion") String tipo,
            @NotBlank @Size(max = 120) String nombre,
            @NotBlank @Size(min = 6, max = 20) String numeroDocumento,
            @Size(max = 20) String telefono,
            @Email @Size(max = 120) String correo,
            @NotBlank @Size(max = 1000) String detalle) {}

    // ---------- Libro de Reclamaciones (público) ----------

    @PostMapping("/reclamos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> registrarReclamo(@Valid @RequestBody NuevoReclamo r) {
        if (r.menorDeEdad() && (r.apoderado() == null || r.apoderado().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Si eres menor de edad, indica el nombre de tu padre, madre o apoderado");
        }
        Reclamo x = new Reclamo();
        x.setNumero("TMP-" + System.nanoTime());
        x.setTipo(r.tipo());
        x.setNombre(r.nombre().trim());
        x.setTipoDocumento(r.tipoDocumento());
        x.setNumeroDocumento(r.numeroDocumento().trim());
        x.setDomicilio(r.domicilio().trim());
        x.setTelefono(r.telefono());
        x.setCorreo(r.correo().trim());
        x.setMenorDeEdad(r.menorDeEdad());
        x.setApoderado(r.apoderado());
        x.setBienTipo(r.bienTipo());
        x.setMonto(r.monto());
        x.setDescripcionBien(r.descripcionBien().trim());
        x.setDetalle(r.detalle().trim());
        x.setPedido(r.pedido().trim());
        x = reclamos.saveAndFlush(x);
        // numeración correlativa: LR-año-000001
        x.setNumero("LR-" + OffsetDateTime.now(LIMA).getYear() + "-" + String.format("%06d", x.getId()));
        x = reclamos.saveAndFlush(x);

        // constancia al consumidor por correo, como pide el reglamento
        boolean enviado = correo.enviar(x.getCorreo(), "Constancia de tu " + x.getTipo() + " " + x.getNumero() + " · " + proveedor, hoja(x));
        x.setCorreoEnviado(enviado);
        reclamos.save(x);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("numero", x.getNumero());
        res.put("fecha", OffsetDateTime.now(LIMA).format(FECHA));
        res.put("correoEnviado", enviado);
        res.put("hoja", hoja(x));
        return res;
    }

    // ---------- Derechos ARCO (público) ----------

    @PostMapping("/derechos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registrarSolicitud(@Valid @RequestBody NuevaSolicitud s) {
        if ((s.telefono() == null || s.telefono().isBlank()) && (s.correo() == null || s.correo().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica un celular o un correo para responderte");
        }
        SolicitudDatos x = new SolicitudDatos();
        x.setTipo(s.tipo());
        x.setNombre(s.nombre().trim());
        x.setNumeroDocumento(s.numeroDocumento().trim());
        x.setTelefono(s.telefono());
        x.setCorreo(s.correo());
        x.setDetalle(s.detalle().trim());
        x = solicitudes.save(x);
        return Map.of("id", x.getId(), "fecha", OffsetDateTime.now(LIMA).format(FECHA));
    }

    // ---------- Panel ----------

    @GetMapping("/admin/reclamos")
    public List<Reclamo> listarReclamos(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return reclamos.findAllByOrderByIdDesc();
    }

    @PatchMapping("/admin/reclamos/{id}")
    @Transactional
    public Reclamo responder(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                             @PathVariable Long id, @RequestBody Map<String, String> body) {
        admin.verificar(clave);
        String respuesta = body.getOrDefault("respuesta", "").trim();
        if (respuesta.length() < 10) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe la respuesta al consumidor");
        Reclamo r = reclamos.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reclamo no encontrado"));
        r.setRespuesta(respuesta.length() > 2000 ? respuesta.substring(0, 2000) : respuesta);
        r.setEstado("respondido");
        r.setRespondidoEn(OffsetDateTime.now());
        correo.enviar(r.getCorreo(), "Respuesta a tu " + r.getTipo() + " " + r.getNumero() + " · " + proveedor,
                "Hola " + r.getNombre() + ",\n\nEn atención a tu " + r.getTipo() + " N° " + r.getNumero() + ", te respondemos:\n\n"
                        + r.getRespuesta() + "\n\n" + proveedor + (ruc.isBlank() ? "" : " · RUC " + ruc));
        return reclamos.save(r);
    }

    @GetMapping("/admin/derechos")
    public List<SolicitudDatos> listarSolicitudes(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return solicitudes.findAllByOrderByIdDesc();
    }

    @PatchMapping("/admin/derechos/{id}")
    public SolicitudDatos atender(@RequestHeader(value = "X-Admin-Key", required = false) String clave,
                                  @PathVariable Long id, @RequestBody Map<String, String> body) {
        admin.verificar(clave);
        SolicitudDatos s = solicitudes.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
        s.setEstado("atendida");
        s.setNota(body.getOrDefault("nota", ""));
        s.setAtendidaEn(OffsetDateTime.now());
        return solicitudes.save(s);
    }

    @GetMapping("/admin/correo")
    public Map<String, Boolean> estadoCorreo(@RequestHeader(value = "X-Admin-Key", required = false) String clave) {
        admin.verificar(clave);
        return Map.of("configurado", correo.configurado());
    }

    private String hoja(Reclamo x) {
        String fecha = (x.getCreadoEn() != null ? x.getCreadoEn() : OffsetDateTime.now()).atZoneSameInstant(LIMA).format(FECHA);
        return """
                HOJA DE RECLAMACIÓN N° %s
                Fecha: %s

                PROVEEDOR
                %s%s%s

                1. IDENTIFICACIÓN DEL CONSUMIDOR
                Nombre: %s
                Documento: %s %s
                Domicilio: %s
                Teléfono: %s
                Correo: %s%s

                2. IDENTIFICACIÓN DEL BIEN CONTRATADO
                Tipo: %s
                Monto reclamado: %s
                Descripción: %s

                3. DETALLE DE LA RECLAMACIÓN
                Tipo: %s
                Detalle: %s
                Pedido: %s

                Reclamo: disconformidad relacionada a los productos o servicios.
                Queja: disconformidad no relacionada a los productos o servicios, o malestar respecto a la atención al público.

                El proveedor responderá en un plazo no mayor a quince (15) días hábiles.
                La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
                """.formatted(
                x.getNumero(), fecha,
                proveedor, ruc.isBlank() ? "" : "\nRUC: " + ruc, domicilio.isBlank() ? "" : "\nDomicilio: " + domicilio,
                x.getNombre(), x.getTipoDocumento(), x.getNumeroDocumento(), x.getDomicilio(),
                x.getTelefono() == null || x.getTelefono().isBlank() ? "—" : x.getTelefono(), x.getCorreo(),
                x.isMenorDeEdad() ? "\nPadre, madre o apoderado: " + x.getApoderado() : "",
                x.getBienTipo(), x.getMonto() == null ? "—" : "S/ " + x.getMonto().toPlainString(), x.getDescripcionBien(),
                x.getTipo(), x.getDetalle(), x.getPedido());
    }
}
