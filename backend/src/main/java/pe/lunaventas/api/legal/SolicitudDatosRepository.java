package pe.lunaventas.api.legal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SolicitudDatosRepository extends JpaRepository<SolicitudDatos, Long> {
    List<SolicitudDatos> findAllByOrderByIdDesc();
}
