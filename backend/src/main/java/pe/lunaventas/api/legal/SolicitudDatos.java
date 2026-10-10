package pe.lunaventas.api.legal;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "solicitudes_datos")
public class SolicitudDatos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    private String nombre;
    @Column(name = "numero_documento") private String numeroDocumento;
    private String telefono;
    private String correo;
    private String detalle;
    private String estado = "pendiente";
    private String nota;
    @Column(name = "atendida_en") private OffsetDateTime atendidaEn;
    @Column(name = "creado_en", insertable = false, updatable = false) private OffsetDateTime creadoEn;

    public Long getId() { return id; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getNota() { return nota; }
    public void setNota(String nota) { this.nota = nota; }
    public OffsetDateTime getAtendidaEn() { return atendidaEn; }
    public void setAtendidaEn(OffsetDateTime atendidaEn) { this.atendidaEn = atendidaEn; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
