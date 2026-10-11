package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

// agrega las categorías pijamas y niños; se hace en Java porque el nombre
// de la restricción original cambia entre PostgreSQL y la base de pruebas
public class V5__categorias_pijamas_ninos extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        List<String> nombres = new ArrayList<>();
        try (Statement st = context.getConnection().createStatement();
             ResultSet rs = st.executeQuery("""
                     SELECT tc.constraint_name
                     FROM information_schema.table_constraints tc
                     JOIN information_schema.check_constraints cc ON cc.constraint_name = tc.constraint_name
                     WHERE lower(tc.table_name) = 'productos' AND tc.constraint_type = 'CHECK'
                       AND lower(cc.check_clause) LIKE '%categoria%'
                       AND lower(cc.check_clause) NOT LIKE '%is not null%'
                     """)) {
            while (rs.next()) nombres.add(rs.getString(1));
        }
        try (Statement st = context.getConnection().createStatement()) {
            for (String n : nombres) {
                st.execute("ALTER TABLE productos DROP CONSTRAINT \"" + n.replace("\"", "") + "\"");
            }
            st.execute("ALTER TABLE productos ADD CONSTRAINT productos_categoria_valida CHECK (categoria IN "
                    + "('blusas','vestidos','pantalones','conjuntos','casacas','pijamas','ninos'))");
        }
    }
}
