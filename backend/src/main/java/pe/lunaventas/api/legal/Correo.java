package pe.lunaventas.api.legal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// envía correos si se configuró MAIL_HOST; si no, avisa que no se pudo
@Service
public class Correo {

    private static final Logger log = LoggerFactory.getLogger(Correo.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final String host;
    private final String remitente;
    private final String copiaA;

    public Correo(ObjectProvider<JavaMailSender> sender,
                  @Value("${spring.mail.host:}") String host,
                  @Value("${app.correo-remitente:}") String remitente,
                  @Value("${app.correo-negocio:}") String copiaA) {
        this.sender = sender;
        this.host = host;
        this.remitente = remitente;
        this.copiaA = copiaA;
    }

    public boolean configurado() {
        return !host.isBlank() && !remitente.isBlank() && sender.getIfAvailable() != null;
    }

    public boolean enviar(String para, String asunto, String texto) {
        if (!configurado() || para == null || para.isBlank()) return false;
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(remitente);
            m.setTo(para);
            if (!copiaA.isBlank()) m.setBcc(copiaA);
            m.setSubject(asunto);
            m.setText(texto);
            sender.getObject().send(m);
            return true;
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo: {}", e.getMessage());
            return false;
        }
    }
}
