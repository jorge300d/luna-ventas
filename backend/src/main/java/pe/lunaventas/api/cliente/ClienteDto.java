package pe.lunaventas.api.cliente;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ClienteDto(Long id, String nombre, String telefono, String distrito, String origen,
                         boolean aceptaOfertas, OffsetDateTime aceptaEn, String intereses,
                         int totalPedidos, BigDecimal totalGastado, OffsetDateTime ultimoContacto,
                         OffsetDateTime aceptaPoliticaEn) {

    public static ClienteDto de(Cliente c) {
        return new ClienteDto(c.getId(), c.getNombre(), c.getTelefono(), c.getDistrito(), c.getOrigen(),
                c.isAceptaOfertas(), c.getAceptaEn(), c.getIntereses(), c.getTotalPedidos(),
                c.getTotalGastado(), c.getUltimoContacto(), c.getAceptaPoliticaEn());
    }
}
