package pe.lunaventas.api;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlTest {

    @AfterEach
    void limpiar() {
        System.clearProperty("spring.datasource.url");
        System.clearProperty("spring.datasource.username");
        System.clearProperty("spring.datasource.password");
    }

    @Test
    void convierteLaUrlDeNeon() {
        LunaVentasApplication.usarDatabaseUrl(
                "postgresql://neondb_owner:abc%40123@ep-cool-1.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
        assertThat(System.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://ep-cool-1.us-east-1.aws.neon.tech/neondb?sslmode=require");
        assertThat(System.getProperty("spring.datasource.username")).isEqualTo("neondb_owner");
        assertThat(System.getProperty("spring.datasource.password")).isEqualTo("abc@123");
    }

    @Test
    void aceptaSoloLaContrasena() {
        LunaVentasApplication.usarDatabaseUrl("npg_ejemplo123");
        assertThat(System.getProperty("spring.datasource.password")).isEqualTo("npg_ejemplo123");
        assertThat(System.getProperty("spring.datasource.url")).isNull();
    }

    @Test
    void ignoraUrlsJdbc() {
        LunaVentasApplication.usarDatabaseUrl("jdbc:postgresql://localhost/x");
        assertThat(System.getProperty("spring.datasource.url")).isNull();
    }
}
