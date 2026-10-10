package pe.lunaventas.api.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

// cliente de la API oficial de WhatsApp (Meta Cloud API)
@Service
public class WhatsappService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);

    private final String proveedor;
    private final String token;
    private final String phoneId;
    private final String plantilla;
    private final String idioma;
    private final RestClient http;

    public WhatsappService(@Value("${whatsapp.proveedor:meta}") String proveedor,
                           @Value("${whatsapp.token:}") String token,
                           @Value("${whatsapp.phone-id:}") String phoneId,
                           @Value("${whatsapp.plantilla:oferta_luna}") String plantilla,
                           @Value("${whatsapp.idioma:es}") String idioma,
                           @Value("${whatsapp.api-version:v23.0}") String version) {
        this.proveedor = proveedor.trim().toLowerCase();
        this.token = token;
        this.phoneId = phoneId;
        this.plantilla = plantilla;
        this.idioma = idioma;
        // 360dialog usa el mismo formato que la Cloud API de Meta, solo cambia la dirección y la clave
        this.http = RestClient.builder()
                .baseUrl(es360() ? "https://waba-v2.360dialog.io" : "https://graph.facebook.com/" + version)
                .build();
    }

    private boolean es360() {
        return "360dialog".equals(proveedor);
    }

    public boolean conectado() {
        return !token.isBlank() && (es360() || !phoneId.isBlank());
    }

    // las ofertas tienen que salir con una plantilla aprobada por Meta
    public String enviarPlantilla(String telefono, String nombre, String texto) {
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", telefono,
                "type", "template",
                "template", Map.of(
                        "name", plantilla,
                        "language", Map.of("code", idioma),
                        "components", List.of(Map.of(
                                "type", "body",
                                "parameters", List.of(
                                        Map.of("type", "text", "text", limpiar(nombre == null || nombre.isBlank() ? "cliente" : nombre)),
                                        Map.of("type", "text", "text", limpiar(texto))
                                )))));
        return enviar(body);
    }

    // texto libre: solo se puede dentro de las 24 h desde que el cliente escribió
    public String enviarTexto(String telefono, String texto) {
        return enviar(Map.of(
                "messaging_product", "whatsapp",
                "to", telefono,
                "type", "text",
                "text", Map.of("body", texto)));
    }

    private String enviar(Map<String, Object> body) {
        if (!conectado()) throw new IllegalStateException("WhatsApp no está conectado");
        try {
            var req = es360()
                    ? http.post().uri("/messages").header("D360-API-KEY", token)
                    : http.post().uri("/{id}/messages", phoneId).header("Authorization", "Bearer " + token);
            JsonNode res = req
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return res == null ? null : res.path("messages").path(0).path("id").asText(null);
        } catch (RestClientResponseException e) {
            log.warn("WhatsApp respondió {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalStateException("WhatsApp rechazó el mensaje: " + resumir(e.getResponseBodyAsString()));
        }
    }

    // Meta no acepta saltos de línea ni muchos espacios seguidos dentro de los parámetros
    static String limpiar(String s) {
        if (s == null) return "";
        String t = s.replaceAll("\\s*\\R+\\s*", " · ").replaceAll(" {4,}", "   ").trim();
        return t.length() > 900 ? t.substring(0, 900) : t;
    }

    private static String resumir(String s) {
        return s == null ? "" : s.length() > 250 ? s.substring(0, 250) : s;
    }
}
