package pe.lunaventas.api.cliente;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByTelefono(String telefono);
    List<Cliente> findByEliminadoFalseOrderByUltimoContactoDesc();
    List<Cliente> findByAceptaOfertasTrueAndEliminadoFalse();
    long countByAceptaOfertasTrue();
}
