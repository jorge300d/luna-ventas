package pe.lunaventas.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pe.lunaventas.api.cliente.ClienteRepository;
import pe.lunaventas.api.cliente.Telefono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ClientesYCampanasTest {

    static final String CLAVE = "clave-test";

    @Autowired
    MockMvc mvc;

    @Autowired
    ClienteRepository clientes;

    @Test
    void normalizaCelularesPeruanos() {
        assertThat(Telefono.normalizar("961 432 705")).isEqualTo("51961432705");
        assertThat(Telefono.normalizar("+51 961-432-705")).isEqualTo("51961432705");
        assertThat(Telefono.normalizar("123")).isNull();
    }

    @Test
    void elPedidoGuardaAlClienteConSuConsentimiento() throws Exception {
        String body = """
            {"cliente":"Carla Ruiz","telefono":"987 111 222","distrito":"Lince","entrega":"tienda",
             "aceptaOfertas":true,"items":[{"productoId":4,"talla":"M","cantidad":1}]}
            """;
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        var c = clientes.findByTelefono("51987111222").orElseThrow();
        assertThat(c.isAceptaOfertas()).isTrue();
        assertThat(c.getIntereses()).contains("vestidos");
        assertThat(c.getTotalPedidos()).isEqualTo(1);
    }

    @Test
    void sinCasillaQuedaGuardadoPeroSinOfertas() throws Exception {
        mvc.perform(post("/api/contactos").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Luis\",\"telefono\":\"955000111\",\"mensaje\":\"Hola\"}"))
                .andExpect(status().isCreated());
        assertThat(clientes.findByTelefono("51955000111").orElseThrow().isAceptaOfertas()).isFalse();
    }

    @Test
    void webhookVerificaYRegistraAQuienEscribe() throws Exception {
        mvc.perform(get("/api/whatsapp/webhook")
                        .param("hub.mode", "subscribe").param("hub.verify_token", "verif-test").param("hub.challenge", "123"))
                .andExpect(status().isOk()).andExpect(content().string("123"));
        mvc.perform(get("/api/whatsapp/webhook")
                        .param("hub.mode", "subscribe").param("hub.verify_token", "otro").param("hub.challenge", "123"))
                .andExpect(status().isForbidden());

        String msg = """
            {"entry":[{"changes":[{"value":{
              "contacts":[{"wa_id":"51944555666","profile":{"name":"Rosa"}}],
              "messages":[{"from":"51944555666","type":"text","text":{"body":"Ofertas!"}}]}}]}]}
            """;
        mvc.perform(post("/api/whatsapp/webhook").contentType(MediaType.APPLICATION_JSON).content(msg))
                .andExpect(status().isOk());
        var c = clientes.findByTelefono("51944555666").orElseThrow();
        assertThat(c.getNombre()).isEqualTo("Rosa");
        assertThat(c.isAceptaOfertas()).isTrue();

        String baja = msg.replace("Ofertas!", "baja");
        mvc.perform(post("/api/whatsapp/webhook").contentType(MediaType.APPLICATION_JSON).content(baja))
                .andExpect(status().isOk());
        assertThat(clientes.findByTelefono("51944555666").orElseThrow().isAceptaOfertas()).isFalse();
    }

    @Test
    void campanaEnModoGratisDevuelveLinks() throws Exception {
        mvc.perform(post("/api/admin/clientes").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ana Torres\",\"telefono\":\"933222111\",\"aceptaOfertas\":true}"))
                .andExpect(status().isCreated());

        String id = mvc.perform(post("/api/admin/campanas").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Fin de semana\",\"mensaje\":\"este sábado todo con 20% de descuento.\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");

        mvc.perform(post("/api/admin/campanas/" + id + "/enviar").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modo").value("manual"))
                .andExpect(jsonPath("$.destinos[?(@.telefono == '51933222111')].link").exists());

        mvc.perform(get("/api/admin/resumen").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.whatsappConectado").value(false));
    }

    @Test
    void productoNuevoArmaOfertaAutomatica() throws Exception {
        mvc.perform(post("/api/productos").header("X-Admin-Key", CLAVE).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nombre":"Vestido lino","descripcion":"Fresco","categoria":"vestidos","precio":75,
                             "tallas":["S","M"],"color":"#E8738F","nuevo":true,"stock":5}
                            """))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/admin/campanas").header("X-Admin-Key", CLAVE))
                .andExpect(jsonPath("$[?(@.titulo == 'Nuevo: Vestido lino')].automatica").value(true));
    }

    @Test
    void panelPideClave() throws Exception {
        mvc.perform(get("/api/admin/clientes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/clientes.csv").header("X-Admin-Key", CLAVE))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("clientes-luna-ventas.csv")));
    }
}
