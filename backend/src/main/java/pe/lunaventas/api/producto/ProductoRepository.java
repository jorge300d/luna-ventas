package pe.lunaventas.api.producto;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrueOrderByNuevoDescIdAsc();
    List<Producto> findByActivoTrueAndCategoriaOrderByNuevoDescIdAsc(String categoria);
}
