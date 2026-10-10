package pe.lunaventas.api.legal;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "reclamos")
public class Reclamo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;
    private String tipo;
    private String nombre;
    @Column(name = "tipo_documento") private String tipoDocumento;
    @Column(name = "numero_documento") private String numeroDocumento;
    private String domicilio;
    private String telefono;
    private String correo;
    @Column(name = "menor_de_edad") private boolean menorDeEdad;
    private String apoderado;
    @Column(name = "bien_tipo") private String bienTipo;
    private BigDecimal monto;
    @Column(name = "descripcion_bien") private String descripcionBien;
    private String detalle;
    private String pedido;
    private String estado = "pendiente";
    private String respuesta;
    @Column(name = "respondido_en") private OffsetDateTime respondidoEn;
    @Column(name = "correo_enviado") private boolean correoEnviado;
    @Column(name = "creado_en", insertable = false, updatable = false) private OffsetDateTime creadoEn;

    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }
    public String getDomicilio() { return domicilio; }
    public void setDomicilio(String domicilio) { this.domicilio = domicilio; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public boolean isMenorDeEdad() { return menorDeEdad; }
    public void setMenorDeEdad(boolean menorDeEdad) { this.menorDeEdad = menorDeEdad; }
    public String getApoderado() { return apoderado; }
    public void setApoderado(String apoderado) { this.apoderado = apoderado; }
    public String getBienTipo() { return bienTipo; }
    public void setBienTipo(String bienTipo) { this.bienTipo = bienTipo; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getDescripcionBien() { return descripcionBien; }
    public void setDescripcionBien(String descripcionBien) { this.descripcionBien = descripcionBien; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getPedido() { return pedido; }
    public void setPedido(String pedido) { this.pedido = pedido; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getRespuesta() { return respuesta; }
    public void setRespuesta(String respuesta) { this.respuesta = respuesta; }
    public OffsetDateTime getRespondidoEn() { return respondidoEn; }
    public void setRespondidoEn(OffsetDateTime respondidoEn) { this.respondidoEn = respondidoEn; }
    public boolean isCorreoEnviado() { return correoEnviado; }
    public void setCorreoEnviado(boolean correoEnviado) { this.correoEnviado = correoEnviado; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
