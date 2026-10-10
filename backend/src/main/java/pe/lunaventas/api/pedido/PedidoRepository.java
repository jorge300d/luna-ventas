package pe.lunaventas.api.pedido;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    @EntityGraph(attributePaths = "items")
    List<Pedido> findTop100ByOrderByIdDesc();

    @EntityGraph(attributePaths = "items")
    List<Pedido> findByClienteIdOrderByIdAsc(Long clienteId);

    @Modifying
    @Query("update Pedido p set p.cliente = 'Cliente eliminado', p.telefono = null, p.distrito = null where p.clienteId = :id")
    int anonimizar(@Param("id") Long clienteId);
}
