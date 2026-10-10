package pe.lunaventas.api.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record PedidoRequest(
        @NotBlank @Size(max = 80) String cliente,
        @Size(max = 20) String telefono,
        @Size(max = 80) String distrito,
        @NotBlank @Pattern(regexp = "tienda|delivery") String entrega,
        @NotEmpty @Size(max = 30) List<@Valid Item> items,
        boolean aceptaOfertas
) {
    public record Item(
            @NotNull Long productoId,
            @NotBlank @Size(max = 10) String talla,
            @Min(1) @Max(20) int cantidad
    ) {}
}
