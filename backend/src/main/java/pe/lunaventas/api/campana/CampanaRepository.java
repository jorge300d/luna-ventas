package pe.lunaventas.api.campana;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.List;

public interface CampanaRepository extends JpaRepository<Campana, Long> {
    List<Campana> findTop50ByOrderByIdDesc();
    List<Campana> findByEstadoAndProgramadaEnLessThanEqual(String estado, OffsetDateTime hasta);
}
