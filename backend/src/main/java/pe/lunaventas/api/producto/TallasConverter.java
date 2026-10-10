package pe.lunaventas.api.producto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Arrays;
import java.util.List;

// guarda las tallas como "S,M,L" en una sola columna
@Converter
public class TallasConverter implements AttributeConverter<List<String>, String> {
    @Override
    public String convertToDatabaseColumn(List<String> tallas) {
        return tallas == null ? "" : String.join(",", tallas);
    }

    @Override
    public List<String> convertToEntityAttribute(String valor) {
        if (valor == null || valor.isBlank()) return List.of();
        return Arrays.stream(valor.split(",")).map(String::trim).toList();
    }
}
