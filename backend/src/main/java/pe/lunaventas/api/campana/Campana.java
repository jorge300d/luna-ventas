package pe.lunaventas.api.campana;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "campanas")
public class Campana {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String mensaje;
    private String categoria;
    private String estado = "borrador";
    private boolean automatica;

    @Column(name = "programada_en")
    private OffsetDateTime programadaEn;

    @Column(name = "enviada_en")
    private OffsetDateTime enviadaEn;

    @Column(name = "valido_hasta")
    private java.time.LocalDate validoHasta;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private OffsetDateTime creadoEn;

    public Long getId() { return id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public boolean isAutomatica() { return automatica; }
    public void setAutomatica(boolean automatica) { this.automatica = automatica; }
    public OffsetDateTime getProgramadaEn() { return programadaEn; }
    public void setProgramadaEn(OffsetDateTime programadaEn) { this.programadaEn = programadaEn; }
    public OffsetDateTime getEnviadaEn() { return enviadaEn; }
    public void setEnviadaEn(OffsetDateTime enviadaEn) { this.enviadaEn = enviadaEn; }
    public java.time.LocalDate getValidoHasta() { return validoHasta; }
    public void setValidoHasta(java.time.LocalDate validoHasta) { this.validoHasta = validoHasta; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
