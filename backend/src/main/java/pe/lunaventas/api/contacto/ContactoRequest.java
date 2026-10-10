package pe.lunaventas.api.contacto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactoRequest(
        @NotBlank @Size(max = 80) String nombre,
        @Size(max = 20) String telefono,
        @NotBlank @Size(max = 1000) String mensaje,
        boolean aceptaOfertas,
        @jakarta.validation.constraints.AssertTrue(message = "Debes aceptar la Política de Privacidad") boolean aceptaPolitica
) {}
