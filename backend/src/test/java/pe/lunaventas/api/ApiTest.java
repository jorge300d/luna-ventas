package pe.lunaventas.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    void listaElCatalogoInicial() throws Exception {
        mvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(12)));
        mvc.perform(get("/api/productos").param("categoria", "vestidos"))
                .andExpect(jsonPath("$[*].categoria").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("vestidos"))));
    }

    @Test
    void elTotalSeCalculaConPreciosDeLaBase() throws Exception {
        // producto 1 cuesta 35, se piden 2
        String body = """
            {"cliente":"Rosa","telefono":"999888777","distrito":"Lince","entrega":"tienda","aceptaPolitica":true,
             "items":[{"productoId":1,"talla":"M","cantidad":2}]}
            """;
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(70));
    }

    @Test
    void rechazaTallaQueNoExiste() throws Exception {
        String body = """
            {"cliente":"Rosa","entrega":"tienda","aceptaPolitica":true,"items":[{"productoId":1,"talla":"XXL","cantidad":1}]}
            """;
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rutasDeAdminPidenClave() throws Exception {
        mvc.perform(get("/api/pedidos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/pedidos").header("X-Admin-Key", "clave-test")).andExpect(status().isOk());
    }

    @Test
    void guardaContacto() throws Exception {
        mvc.perform(post("/api/contactos").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ana\",\"mensaje\":\"Busco vestido talla M\",\"aceptaPolitica\":true}"))
                .andExpect(status().isCreated());
    }
}
