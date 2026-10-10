package pe.lunaventas.api.campana;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface EnvioRepository extends JpaRepository<Envio, Long> {

    Optional<Envio> findByCampanaIdAndClienteId(Long campanaId, Long clienteId);

    List<Envio> findByCampanaId(Long campanaId);

    long countByCampanaIdAndEstadoIn(Long campanaId, List<String> estados);

    // no retrocede: si ya está leído no vuelve a "entregado"
    @Modifying
    @Transactional
    @Query("""
        update Envio e set e.estado = :estado, e.actualizadoEn = :ahora
        where e.waMessageId = :wamid and not (e.estado = 'leido' and :estado = 'entregado')
        """)
    int actualizarEstado(@Param("wamid") String wamid, @Param("estado") String estado, @Param("ahora") OffsetDateTime ahora);

    default int actualizarEstado(String wamid, String estado) {
        return actualizarEstado(wamid, estado, OffsetDateTime.now());
    }
}
