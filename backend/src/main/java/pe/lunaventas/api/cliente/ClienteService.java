package pe.lunaventas.api.cliente;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;

@Service
public class ClienteService {

    private final ClienteRepository repo;

    public ClienteService(ClienteRepository repo) {
        this.repo = repo;
    }

    // crea o actualiza al cliente según su celular; si no hay celular válido no se guarda
    @Transactional
    public Cliente registrar(String nombre, String telefono, String distrito, String origen, boolean acepta) {
        String tel = Telefono.normalizar(telefono);
        if (tel == null) return null;
        Cliente c = repo.findByTelefono(tel).orElseGet(() -> {
            Cliente n = new Cliente();
            n.setTelefono(tel);
            n.setOrigen(origen);
            return n;
        });
        if (nombre != null && !nombre.isBlank()) c.setNombre(nombre.trim());
        if (distrito != null && !distrito.isBlank()) c.setDistrito(distrito.trim());
        // el consentimiento solo se agrega, nunca se quita desde un formulario
        if (acepta) c.darConsentimiento();
        c.setUltimoContacto(OffsetDateTime.now());
        return repo.save(c);
    }

    @Transactional
    public void aceptar(Cliente c) {
        if (c == null) return;
        c.darConsentimiento();
        repo.save(c);
    }

    @Transactional
    public void darDeBaja(Cliente c) {
        if (c == null) return;
        c.darDeBaja();
        repo.save(c);
    }

    @Transactional
    public void sumarCompra(Cliente c, BigDecimal total, Collection<String> categorias) {
        if (c == null) return;
        c.setTotalPedidos(c.getTotalPedidos() + 1);
        c.setTotalGastado(c.getTotalGastado().add(total));
        categorias.forEach(c::agregarInteres);
        repo.save(c);
    }
}
