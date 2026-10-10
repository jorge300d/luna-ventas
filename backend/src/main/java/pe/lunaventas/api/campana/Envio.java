package pe.lunaventas.api.campana;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "envios")
public class Envio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campana_id")
    private Long campanaId;

    @Column(name = "cliente_id")
    private Long clienteId;

    private String estado = "pendiente";

    @Column(name = "wa_message_id")
    private String waMessageId;

    private String error;

    @Column(name = "actualizado_en")
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();

    public Envio() {}

    public Envio(Long campanaId, Long clienteId) {
        this.campanaId = campanaId;
        this.clienteId = clienteId;
    }

    public Long getId() { return id; }
    public Long getCampanaId() { return campanaId; }
    public Long getClienteId() { return clienteId; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; this.actualizadoEn = OffsetDateTime.now(); }
    public String getWaMessageId() { return waMessageId; }
    public void setWaMessageId(String waMessageId) { this.waMessageId = waMessageId; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public OffsetDateTime getActualizadoEn() { return actualizadoEn; }
}
