package pe.lunaventas.api.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.lunaventas.api.campana.EnvioRepository;
import pe.lunaventas.api.cliente.ClienteRepository;
import pe.lunaventas.api.cliente.ClienteService;
import pe.lunaventas.api.cliente.Telefono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

// Meta avisa aquí cada vez que alguien escribe al WhatsApp del negocio
@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private static final Set<String> ALTA = Set.of("OFERTAS", "OFERTA", "ACEPTO", "QUIERO OFERTAS");
    private static final Set<String> BAJA = Set.of("BAJA", "STOP", "NO MAS", "NO MAS OFERTAS", "CANCELAR");

    private final String verifyToken;
    private final String appSecret;
    private final String webhookClave;
    private final ObjectMapper json;
    private final ClienteRepository clientes;
    private final ClienteService clienteService;
    private final EnvioRepository envios;
    private final WhatsappService whatsapp;

    public WebhookController(@Value("${whatsapp.verify-token:}") String verifyToken,
                             @Value("${whatsapp.app-secret:}") String appSecret,
                             @Value("${whatsapp.webhook-clave:}") String webhookClave,
                             ObjectMapper json, ClienteRepository clientes, ClienteService clienteService,
                             EnvioRepository envios, WhatsappService whatsapp) {
        this.verifyToken = verifyToken;
        this.appSecret = appSecret;
        this.webhookClave = webhookClave;
        this.json = json;
        this.clientes = clientes;
        this.clienteService = clienteService;
        this.envios = envios;
        this.whatsapp = whatsapp;
    }

    // verificación que hace Meta al configurar el webhook
    @GetMapping
    public ResponseEntity<String> verificar(@RequestParam(name = "hub.mode", required = false) String modo,
                                            @RequestParam(name = "hub.verify_token", required = false) String token,
                                            @RequestParam(name = "hub.challenge", required = false) String reto) {
        if ("subscribe".equals(modo) && !verifyToken.isBlank() && verifyToken.equals(token)) {
            return ResponseEntity.ok(reto);
        }
        return ResponseEntity.status(403).build();
    }

    @PostMapping
    public ResponseEntity<Void> recibir(@RequestBody String cuerpo,
                                        @RequestHeader(value = "X-Hub-Signature-256", required = false) String firma,
                                        @RequestParam(name = "clave", required = false) String clave) {
        // Meta firma cada aviso; con un proveedor se usa una clave en la URL del webhook
        if (!firmaValida(cuerpo, firma)) return ResponseEntity.status(401).build();
        if (!webhookClave.isBlank() && !webhookClave.equals(clave)) return ResponseEntity.status(401).build();
        try {
            JsonNode raiz = json.readTree(cuerpo);
            for (JsonNode entry : raiz.path("entry")) {
                for (JsonNode change : entry.path("changes")) {
                    JsonNode v = change.path("value");
                    procesarMensajes(v);
                    procesarEstados(v);
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo procesar el webhook de WhatsApp", e);
        }
        // siempre 200 para que Meta no reintente sin fin
        return ResponseEntity.ok().build();
    }

    private void procesarMensajes(JsonNode v) {
        Map<String, String> nombres = new HashMap<>();
        for (JsonNode c : v.path("contacts")) {
            nombres.put(c.path("wa_id").asText(), c.path("profile").path("name").asText(null));
        }
        for (JsonNode m : v.path("messages")) {
            String tel = Telefono.normalizar(m.path("from").asText());
            if (tel == null) continue;
            boolean nuevo = clientes.findByTelefono(tel).isEmpty();
            var cliente = clienteService.registrar(nombres.get(m.path("from").asText()), tel, null, "whatsapp", false);
            String texto = normalizar(m.path("text").path("body").asText(""));

            String respuesta = null;
            if (ALTA.contains(texto)) {
                clienteService.aceptar(cliente);
                respuesta = "Listo, ya estás en la lista de ofertas de Luna Ventas. Si en algún momento no quieres recibirlas, responde BAJA.";
            } else if (BAJA.contains(texto)) {
                clienteService.darDeBaja(cliente);
                respuesta = "Hecho, ya no te enviaremos ofertas. Si cambias de opinión, responde OFERTAS.";
            } else if (nuevo) {
                respuesta = "¡Hola! Gracias por escribir a Luna Ventas. En un momento te atendemos. "
                        + "Si quieres recibir nuestras ofertas y novedades por aquí, responde OFERTAS.";
            }
            if (respuesta != null && whatsapp.conectado()) {
                try {
                    whatsapp.enviarTexto(tel, respuesta);
                } catch (Exception e) {
                    log.warn("No se pudo responder a {}", tel, e);
                }
            }
        }
    }

    private void procesarEstados(JsonNode v) {
        for (JsonNode s : v.path("statuses")) {
            String id = s.path("id").asText(null);
            String estado = switch (s.path("status").asText("")) {
                case "delivered" -> "entregado";
                case "read" -> "leido";
                case "failed" -> "fallido";
                default -> null;
            };
            if (id != null && estado != null) envios.actualizarEstado(id, estado);
        }
    }

    private boolean firmaValida(String cuerpo, String firma) {
        if (appSecret.isBlank()) return true;
        if (firma == null || !firma.startsWith("sha256=")) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String esperado = HexFormat.of().formatHex(mac.doFinal(cuerpo.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(esperado.getBytes(StandardCharsets.UTF_8),
                    firma.substring(7).getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    // "Ofertas!" -> "OFERTAS", "no más" -> "NO MAS"
    static String normalizar(String s) {
        String t = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return t.replaceAll("[^A-Za-z ]", " ").replaceAll("\\s+", " ").trim().toUpperCase();
    }
}
