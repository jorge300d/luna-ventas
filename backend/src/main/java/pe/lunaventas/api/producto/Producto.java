package pe.lunaventas.api.producto;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 120)
    private String nombre;

    @Size(max = 400)
    private String descripcion;

    @NotBlank
    @Pattern(regexp = "blusas|vestidos|pantalones|conjuntos|casacas|pijamas|ninos")
    private String categoria;

    @NotNull @DecimalMin("0.0")
    private BigDecimal precio;

    @Column(name = "precio_antes")
    private BigDecimal precioAntes;

    @Convert(converter = TallasConverter.class)
    private List<String> tallas = new ArrayList<>();

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    private String color = "#E8738F";

    @Column(name = "imagen_url")
    private String imagenUrl;

    private boolean nuevo;

    @Min(0)
    private int stock;

    private boolean activo = true;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private OffsetDateTime creadoEn;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public BigDecimal getPrecioAntes() { return precioAntes; }
    public void setPrecioAntes(BigDecimal precioAntes) { this.precioAntes = precioAntes; }
    public List<String> getTallas() { return tallas; }
    public void setTallas(List<String> tallas) { this.tallas = tallas; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public boolean isNuevo() { return nuevo; }
    public void setNuevo(boolean nuevo) { this.nuevo = nuevo; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public OffsetDateTime getCreadoEn() { return creadoEn; }
}
