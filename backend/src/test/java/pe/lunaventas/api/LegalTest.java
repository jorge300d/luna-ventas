package pe.lunaventas.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pe.lunaventas.api.cliente.ClienteRepository;
import pe.lunaventas.api.legal.ConsentimientoRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LegalTest {

    static final String CLAVE = "clave-test";

    @Autowired MockMvc mvc;
    @Autowired ClienteRepository clientes;
    @Autowired ConsentimientoRepository consentimientos;

    @Test
    void sinAceptarLaPoliticaNoSeRegistraElPedido() throws Exception {
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content("""
                {"cliente":"Sin acepto","telefono":"977000111","entrega":"tienda",
                 "items":[{"productoId":17,"talla":"M","cantidad":1}]}
                """)).andExpect(status().isBadRequest());
        assertThat(clientes.findByTelefono("51977000111")).isEmpty();
    }

    @Test
    void guardaLaPruebaDeLosDosConsentimientos() throws Exception {
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content("""
                {"cliente":"Marta","telefono":"977000222","entrega":"tienda","aceptaPolitica":true,"aceptaOfertas":true,
                 "items":[{"productoId":18,"talla":"M","cantidad":1}]}
                """)).andExpect(status().isCreated());
        var c = clientes.findByTelefono("51977000222").orElseThrow();
        assertThat(c.getAceptaPoliticaEn()).isNotNull();
        var lista = consentimientos.findByClienteIdOrderByIdAsc(c.getId());
        assertThat(lista).extracting("tipo").containsExactly("privacidad", "publicidad");
        assertThat(lista.get(0).getVersion()).isNotBlank();
    }

    @Test
    void libroDeReclamacionesNumeraYPideDatosObligatorios() throws Exception {
        String ok = """
            {"tipo":"reclamo","nombre":"Lucía Pérez","tipoDocumento":"DNI","numeroDocumento":"45678912",
             "domicilio":"Av. Arequipa 123, Lince","telefono":"988777666","correo":"lucia@example.com",
             "bienTipo":"producto","monto":69,"descripcionBien":"Vestido midi talla M",
             "detalle":"Llegó con una costura abierta","pedido":"Cambio por otro igual","aceptaPolitica":true}
            """;
        mvc.perform(post("/api/reclamos").contentType(MediaType.APPLICATION_JSON).content(ok))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numero", startsWith("LR-")))
                .andExpect(jsonPath("$.correoEnviado").value(false));

        mvc.perform(post("/api/reclamos").contentType(MediaType.APPLICATION_JSON)
                        .content(ok.replace("\"numeroDocumento\":\"45678912\",", "")))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/reclamos").contentType(MediaType.APPLICATION_JSON)
                        .content(ok.replace("\"bienTipo\"", "\"menorDeEdad\":true,\"bienTipo\"")))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/admin/reclamos").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estado").value("pendiente"));
    }

    @Test
    void solicitudArcoYEliminacionDeDatos() throws Exception {
        mvc.perform(post("/api/derechos").contentType(MediaType.APPLICATION_JSON).content("""
                {"tipo":"cancelacion","nombre":"Pedro","numeroDocumento":"40000001","telefono":"955111222","detalle":"Borren mis datos"}
                """)).andExpect(status().isCreated());

        mvc.perform(post("/api/contactos").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Pedro\",\"telefono\":\"955111222\",\"mensaje\":\"Hola\",\"aceptaPolitica\":true}"))
                .andExpect(status().isCreated());
        Long id = clientes.findByTelefono("51955111222").orElseThrow().getId();

        mvc.perform(get("/api/admin/clientes/" + id + "/datos").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensajes.length()").value(1));

        mvc.perform(delete("/api/admin/clientes/" + id).header("X-Admin-Key", CLAVE))
                .andExpect(status().isNoContent());
        var c = clientes.findById(id).orElseThrow();
        assertThat(c.isEliminado()).isTrue();
        assertThat(c.getNombre()).isNull();
        assertThat(clientes.findByTelefono("51955111222")).isEmpty();
    }

    @Test
    void lasOfertasIncluyenVigencia() throws Exception {
        mvc.perform(post("/api/admin/clientes").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Vigencia\",\"telefono\":\"944000999\",\"aceptaOfertas\":true}"))
                .andExpect(status().isCreated());
        String id = mvc.perform(post("/api/admin/campanas").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Vig\",\"mensaje\":\"20% en blusas.\",\"validoHasta\":\"2026-12-31\"}"))
                .andReturn().getResponse().getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");
        String res = mvc.perform(post("/api/admin/campanas/" + id + "/enviar").header("X-Admin-Key", CLAVE))
                .andReturn().getResponse().getContentAsString();
        assertThat(java.net.URLDecoder.decode(res, java.nio.charset.StandardCharsets.UTF_8)).contains("31/12/2026");
    }
}
