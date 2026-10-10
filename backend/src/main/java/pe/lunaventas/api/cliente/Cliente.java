package pe.lunaventas.api.cliente;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String telefono;
    private String distrito;
    private String origen;

    @Column(name = "acepta_ofertas")
    private boolean aceptaOfertas;

    @Column(name = "acepta_en")
    private OffsetDateTime aceptaEn;

    @Column(name = "baja_en")
    private OffsetDateTime bajaEn;

    private String intereses = "";

    @Column(name = "total_pedidos")
    private int totalPedidos;

    @Column(name = "total_gastado")
    private BigDecimal totalGastado = BigDecimal.ZERO;

    @Column(name = "ultimo_contacto")
    private OffsetDateTime ultimoContacto;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private OffsetDateTime creadoEn;

    public void darConsentimiento() {
        if (!aceptaOfertas) {
            aceptaOfertas = true;
            aceptaEn = OffsetDateTime.now();
            bajaEn = null;
        }
    }

    public void darDeBaja() {
        aceptaOfertas = false;
        bajaEn = OffsetDateTime.now();
    }

    public void agregarInteres(String categoria) {
        if (categoria == null || categoria.isBlank()) return;
        Set<String> set = new LinkedHashSet<>(Arrays.asList(intereses.isBlank() ? new String[0] : intereses.split(",")));
        set.add(categoria);
        intereses = String.join(",", set);
    }

    public boolean tieneInteres(String categoria) {
        return categoria == null || Arrays.asList(intereses.split(",")).contains(categoria);
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDistrito() { return distrito; }
    public void setDistrito(String distrito) { this.distrito = distrito; }
    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }
    public boolean isAceptaOfertas() { return aceptaOfertas; }
    public OffsetDateTime getAceptaEn() { return aceptaEn; }
    public OffsetDateTime getBajaEn() { return bajaEn; }
    public String getIntereses() { return intereses; }
    public int getTotalPedidos() { return totalPedidos; }
    public void setTotalPedidos(int totalPedidos) { this.totalPedidos = totalPedidos; }
    public BigDecimal getTotalGastado() { return totalGastado; }
    public void setTotalGastado(BigDecimal totalGastado) { this.totalGastado = totalGastado; }
    public OffsetDateTime getUltimoContacto() { return ultimoContacto; }
    public void setUltimoContacto(OffsetDateTime ultimoContacto) { this.ultimoContacto = ultimoContacto; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
