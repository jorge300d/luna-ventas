package pe.lunaventas.api.legal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "consentimientos")
public class Consentimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cliente_id")
    private Long clienteId;

    private String tipo;
    private boolean otorgado;
    private String version;
    private String origen;
    private String texto;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private OffsetDateTime creadoEn;

    public Consentimiento() {}

    public Consentimiento(Long clienteId, String tipo, boolean otorgado, String version, String origen, String texto) {
        this.clienteId = clienteId;
        this.tipo = tipo;
        this.otorgado = otorgado;
        this.version = version;
        this.origen = origen;
        this.texto = texto.length() > 500 ? texto.substring(0, 500) : texto;
    }

    public Long getId() { return id; }
    public Long getClienteId() { return clienteId; }
    public String getTipo() { return tipo; }
    public boolean isOtorgado() { return otorgado; }
    public String getVersion() { return version; }
    public String getOrigen() { return origen; }
    public String getTexto() { return texto; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
