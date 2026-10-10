package pe.lunaventas.api.contacto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ContactoRepository extends JpaRepository<Contacto, Long> {
    List<Contacto> findTop100ByOrderByIdDesc();

    List<Contacto> findByClienteIdOrderByIdAsc(Long clienteId);

    @Modifying
    @Query("update Contacto c set c.nombre = 'Cliente eliminado', c.telefono = null, c.mensaje = '(eliminado a pedido del titular)' where c.clienteId = :id")
    int anonimizar(@Param("id") Long clienteId);
}
