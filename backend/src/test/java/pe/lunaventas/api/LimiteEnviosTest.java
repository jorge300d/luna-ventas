package pe.lunaventas.api;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import pe.lunaventas.api.config.LimiteEnvios;

import static org.assertj.core.api.Assertions.assertThat;

class LimiteEnviosTest {

    @Test
    void bloqueaDespuesDelMaximoPorIp() throws Exception {
        LimiteEnvios filtro = new LimiteEnvios(3);
        int ultimo = 0;
        for (int i = 0; i < 4; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/reclamos");
            req.addHeader("X-Forwarded-For", "200.1.1.1");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filtro.doFilter(req, res, new MockFilterChain());
            ultimo = res.getStatus();
        }
        assertThat(ultimo).isEqualTo(429);

        // otra IP y las lecturas no se ven afectadas
        MockHttpServletRequest otra = new MockHttpServletRequest("POST", "/api/reclamos");
        otra.addHeader("X-Forwarded-For", "200.2.2.2");
        MockHttpServletResponse r2 = new MockHttpServletResponse();
        filtro.doFilter(otra, r2, new MockFilterChain());
        assertThat(r2.getStatus()).isEqualTo(200);

        MockHttpServletRequest get = new MockHttpServletRequest("GET", "/api/productos");
        get.addHeader("X-Forwarded-For", "200.1.1.1");
        MockHttpServletResponse r3 = new MockHttpServletResponse();
        filtro.doFilter(get, r3, new MockFilterChain());
        assertThat(r3.getStatus()).isEqualTo(200);
    }
}
