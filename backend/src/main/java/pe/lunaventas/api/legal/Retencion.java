package pe.lunaventas.api.legal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.lunaventas.api.cliente.Cliente;
import pe.lunaventas.api.cliente.ClienteRepository;
import pe.lunaventas.api.contacto.ContactoRepository;
import pe.lunaventas.api.pedido.PedidoRepository;

import java.time.OffsetDateTime;

// cumple el plazo de conservación de la Política de Privacidad:
// a los 2 años sin contacto se anonimiza al cliente (los montos de pedidos se mantienen por temas tributarios)
@Service
public class Retencion {

    private static final Logger log = LoggerFactory.getLogger(Retencion.class);

    private final ClienteRepository clientes;
    private final PedidoRepository pedidos;
    private final ContactoRepository contactos;

    public Retencion(ClienteRepository clientes, PedidoRepository pedidos, ContactoRepository contactos) {
        this.clientes = clientes;
        this.pedidos = pedidos;
        this.contactos = contactos;
    }

    @Scheduled(cron = "0 0 3 * * *", zone = "America/Lima")
    @Transactional
    public int anonimizarInactivos() {
        OffsetDateTime limite = OffsetDateTime.now().minusYears(2);
        int n = 0;
        for (Cliente c : clientes.findByEliminadoFalseAndUltimoContactoBefore(limite)) {
            c.anonimizar();
            clientes.save(c);
            pedidos.anonimizar(c.getId());
            contactos.anonimizar(c.getId());
            n++;
        }
        if (n > 0) log.info("Retención: {} clientes anonimizados por 2 años sin contacto", n);
        return n;
    }
}
