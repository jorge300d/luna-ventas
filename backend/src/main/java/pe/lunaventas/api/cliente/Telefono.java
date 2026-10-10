package pe.lunaventas.api.cliente;

// deja los celulares en formato 51XXXXXXXXX para que no se dupliquen
public final class Telefono {

    private Telefono() {}

    public static String normalizar(String valor) {
        if (valor == null) return null;
        String d = valor.replaceAll("\\D", "");
        if (d.startsWith("00")) d = d.substring(2);
        if (d.length() == 9 && d.startsWith("9")) d = "51" + d;
        if (d.length() < 9 || d.length() > 15) return null;
        return d;
    }
}
