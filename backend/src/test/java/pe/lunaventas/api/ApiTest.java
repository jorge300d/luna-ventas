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
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(11)));
        mvc.perform(get("/api/productos").param("categoria", "vestidos"))
                .andExpect(jsonPath("$[*].categoria").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("vestidos"))));
    }

    @Test
    void elCatalogoRealTieneFotosYLargo() throws Exception {
        mvc.perform(get("/api/productos/17"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagenUrl").value("/catalogo/vestido-01.webp"))
                .andExpect(jsonPath("$.largo").value("midi"))
                .andExpect(jsonPath("$.stock").value(1));
        // las prendas de ejemplo ya no se muestran
        mvc.perform(get("/api/productos/1")).andExpect(status().isNotFound());
    }

    @Test
    void elTotalSeCalculaConPreciosDeLaBase() throws Exception {
        // producto 17 cuesta 30, se piden 2
        String body = """
            {"cliente":"Rosa","telefono":"999888777","distrito":"Lince","entrega":"tienda","aceptaPolitica":true,
             "items":[{"productoId":17,"talla":"M","cantidad":2}]}
            """;
        mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(60));
    }

    @Test
    void rechazaTallaQueNoExiste() throws Exception {
        String body = """
            {"cliente":"Rosa","entrega":"tienda","aceptaPolitica":true,"items":[{"productoId":17,"talla":"XXL","cantidad":1}]}
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
