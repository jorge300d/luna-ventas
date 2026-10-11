package pe.lunaventas.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// evita que alguien llene la base con envíos masivos desde los formularios públicos
@Component
public class LimiteEnvios extends OncePerRequestFilter {

    private static final Set<String> RUTAS = Set.of("/api/pedidos", "/api/contactos", "/api/reclamos", "/api/derechos");
    private static final long VENTANA_MS = 10 * 60 * 1000;

    private final int maximo;
    private final Map<String, Deque<Long>> envios = new ConcurrentHashMap<>();

    public LimiteEnvios(@Value("${app.max-envios-por-10min:15}") int maximo) {
        this.maximo = maximo;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !"POST".equals(req.getMethod()) || !RUTAS.contains(req.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String ip = ip(req);
        long ahora = System.currentTimeMillis();
        Deque<Long> cola = envios.computeIfAbsent(ip, k -> new ArrayDeque<>());
        boolean permitido;
        synchronized (cola) {
            while (!cola.isEmpty() && ahora - cola.peekFirst() > VENTANA_MS) cola.pollFirst();
            permitido = cola.size() < maximo;
            if (permitido) cola.addLast(ahora);
        }
        if (envios.size() > 10_000) envios.entrySet().removeIf(e -> e.getValue().isEmpty());
        if (!permitido) {
            res.setStatus(429);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"message\":\"Demasiados envíos seguidos. Espera unos minutos o escríbenos por WhatsApp.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    // Render pone la IP real del visitante en X-Forwarded-For
    private static String ip(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
