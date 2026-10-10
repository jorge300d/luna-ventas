package pe.lunaventas.api.legal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReclamoRepository extends JpaRepository<Reclamo, Long> {
    List<Reclamo> findAllByOrderByIdDesc();
}
