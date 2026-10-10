package pe.lunaventas.api.legal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.lunaventas.api.cliente.Cliente;

// guarda la prueba de cada consentimiento: se pide al titular demostrar que el cliente aceptó
@Service
public class Consentimientos {

    public static final String TEXTO_PRIVACIDAD =
            "He leído y acepto la Política de Privacidad y los Términos y Condiciones de Luna Ventas.";
    public static final String TEXTO_PUBLICIDAD =
            "Acepto recibir ofertas y novedades de Luna Ventas por WhatsApp. Puedo retirar este consentimiento respondiendo BAJA.";

    private final ConsentimientoRepository repo;
    private final String version;

    public Consentimientos(ConsentimientoRepository repo, @Value("${app.politica-version:2026-10}") String version) {
        this.repo = repo;
        this.version = version;
    }

    public void registrar(Cliente c, String tipo, boolean otorgado, String origen, String texto) {
        repo.save(new Consentimiento(c == null ? null : c.getId(), tipo, otorgado, version, origen, texto));
    }

    public String version() {
        return version;
    }
}
