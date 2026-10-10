package pe.lunaventas.api.legal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsentimientoRepository extends JpaRepository<Consentimiento, Long> {
    List<Consentimiento> findByClienteIdOrderByIdAsc(Long clienteId);
}
