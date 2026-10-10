package pe.lunaventas.api.contacto;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactoRepository extends JpaRepository<Contacto, Long> {
    List<Contacto> findTop100ByOrderByIdDesc();
}
