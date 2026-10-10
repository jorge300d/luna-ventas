package pe.lunaventas.api.campana;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.lunaventas.api.cliente.Cliente;
import pe.lunaventas.api.cliente.ClienteRepository;
import pe.lunaventas.api.producto.Producto;
import pe.lunaventas.api.whatsapp.WhatsappService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CampanaService {

    private static final Logger log = LoggerFactory.getLogger(CampanaService.class);
    static final String PIE = "Responde BAJA si no deseas recibir más ofertas.";

    private final CampanaRepository campanas;
    private final EnvioRepository envios;
    private final ClienteRepository clientes;
    private final WhatsappService whatsapp;
    private final boolean ofertasAuto;
    private final String sitioUrl;

    public CampanaService(CampanaRepository campanas, EnvioRepository envios, ClienteRepository clientes,
                          WhatsappService whatsapp,
                          @Value("${app.ofertas-auto:true}") boolean ofertasAuto,
                          @Value("${app.sitio-url:https://lunaventas.vercel.app}") String sitioUrl) {
        this.campanas = campanas;
        this.envios = envios;
        this.clientes = clientes;
        this.whatsapp = whatsapp;
        this.ofertasAuto = ofertasAuto;
        this.sitioUrl = sitioUrl;
    }

    public record Destino(Long clienteId, String nombre, String telefono, String link, String estado) {}

    public record Resultado(Long campanaId, String modo, int total, int enviados, int fallidos, List<Destino> destinos) {}

    @Transactional
    public Campana crear(String titulo, String mensaje, String categoria, OffsetDateTime programadaEn, boolean automatica) {
        Campana c = new Campana();
        c.setTitulo(titulo.trim());
        c.setMensaje(mensaje.trim());
        c.setCategoria(categoria == null || categoria.isBlank() ? null : categoria);
        c.setAutomatica(automatica);
        if (programadaEn != null) {
            c.setProgramadaEn(programadaEn);
            c.setEstado("programada");
        }
        return campanas.save(c);
    }

    // a quiénes les llega: solo los que aceptaron y, si hay categoría, los que compraron esa categoría
    public List<Cliente> destinatarios(Campana c) {
        return clientes.findByAceptaOfertasTrue().stream()
                .filter(cl -> cl.tieneInteres(c.getCategoria()))
                .toList();
    }

    public String textoPara(Campana c, Cliente cl) {
        String nombre = cl.getNombre() == null || cl.getNombre().isBlank() ? "" : " " + primerNombre(cl.getNombre());
        return "Hola" + nombre + ", " + c.getMensaje() + "\n\n" + PIE;
    }

    @Transactional
    public Resultado enviar(Long id) {
        Campana c = campanas.findById(id).orElseThrow(() -> new IllegalArgumentException("Campaña no encontrada"));
        List<Cliente> lista = destinatarios(c);
        boolean api = whatsapp.conectado();
        c.setEstado("enviando");
        campanas.save(c);

        List<Destino> destinos = new ArrayList<>();
        int ok = 0;
        int mal = 0;
        for (Cliente cl : lista) {
            Envio e = envios.findByCampanaIdAndClienteId(c.getId(), cl.getId()).orElseGet(() -> new Envio(c.getId(), cl.getId()));
            // si ya salió por la API no se repite
            if (List.of("enviado", "entregado", "leido").contains(e.getEstado())) {
                ok++;
                destinos.add(destino(c, cl, e.getEstado()));
                continue;
            }
            if (api) {
                try {
                    String wamid = whatsapp.enviarPlantilla(cl.getTelefono(), primerNombre(cl.getNombre()), c.getMensaje());
                    e.setWaMessageId(wamid);
                    e.setEstado("enviado");
                    e.setError(null);
                    ok++;
                } catch (Exception ex) {
                    e.setEstado("fallido");
                    e.setError(recortar(ex.getMessage()));
                    mal++;
                }
            } else {
                // modo gratis: se arma el link y la dueña lo envía con un clic
                e.setEstado("manual");
            }
            envios.save(e);
            destinos.add(destino(c, cl, e.getEstado()));
        }
        c.setEstado("enviada");
        c.setEnviadaEn(OffsetDateTime.now());
        campanas.save(c);
        return new Resultado(c.getId(), api ? "automatico" : "manual", lista.size(), ok, mal, destinos);
    }

    // revisa cada 5 minutos si hay campañas programadas que ya toca enviar
    @Scheduled(fixedDelayString = "${app.revisar-campanas-ms:300000}", initialDelay = 60000)
    public void enviarProgramadas() {
        if (!whatsapp.conectado()) return;
        for (Campana c : campanas.findByEstadoAndProgramadaEnLessThanEqual("programada", OffsetDateTime.now())) {
            try {
                Resultado r = enviar(c.getId());
                log.info("Campaña {} enviada: {} ok, {} fallidos", c.getId(), r.enviados(), r.fallidos());
            } catch (Exception e) {
                log.warn("No se pudo enviar la campaña {}", c.getId(), e);
            }
        }
    }

    // cuando se sube una prenda nueva se arma sola la oferta para quienes compran esa categoría
    @Transactional
    public Campana ofertaProductoNuevo(Producto p) {
        if (!ofertasAuto || !p.isNuevo()) return null;
        String precio = p.getPrecioAntes() != null
                ? "a S/ " + p.getPrecio().stripTrailingZeros().toPlainString() + " (antes S/ " + p.getPrecioAntes().stripTrailingZeros().toPlainString() + ")"
                : "a S/ " + p.getPrecio().stripTrailingZeros().toPlainString();
        String mensaje = "llegó " + p.getNombre() + " " + precio + ". Tallas: " + String.join(", ", p.getTallas())
                + ". Míralo y pídelo aquí: " + sitioUrl;
        // si WhatsApp está conectado sale en 10 minutos (da tiempo de arrepentirse); si no, queda lista en el panel
        OffsetDateTime cuando = whatsapp.conectado() ? OffsetDateTime.now().plusMinutes(10) : null;
        return crear("Nuevo: " + p.getNombre(), mensaje, p.getCategoria(), cuando, true);
    }

    public Map<String, Long> conteo(Long campanaId) {
        return Map.of(
                "enviados", envios.countByCampanaIdAndEstadoIn(campanaId, List.of("enviado", "entregado", "leido")),
                "leidos", envios.countByCampanaIdAndEstadoIn(campanaId, List.of("leido")),
                "fallidos", envios.countByCampanaIdAndEstadoIn(campanaId, List.of("fallido")),
                "manuales", envios.countByCampanaIdAndEstadoIn(campanaId, List.of("manual")));
    }

    private Destino destino(Campana c, Cliente cl, String estado) {
        String link = "https://wa.me/" + cl.getTelefono() + "?text=" + URLEncoder.encode(textoPara(c, cl), StandardCharsets.UTF_8).replace("+", "%20");
        return new Destino(cl.getId(), cl.getNombre(), cl.getTelefono(), link, estado);
    }

    static String primerNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) return "";
        return nombre.trim().split("\\s+")[0];
    }

    private static String recortar(String s) {
        if (s == null) return null;
        return s.length() > 290 ? s.substring(0, 290) : s;
    }
}
