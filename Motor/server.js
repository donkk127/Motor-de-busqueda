const express = require("express");
const sql = require("mssql/msnodesqlv8");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ⚙️ Configuración de la conexión a SQL Server
const config = {
  database: "MOTORDB",
  server: "DESKTOP-NAV45OG\\SQLEXPRESS",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
  },
};

// Conexión única
let pool;
(async () => {
  try {
    pool = await sql.connect(config);
    console.log("Conectado a la base de datos.");
  } catch (err) {
    console.error("Error conectando a SQL Server:", err);
  }
})();

//------------------------------------------------------------
// RUTAS DINÁMICAS PARA LOS SELECTS EN CASCADA
//------------------------------------------------------------
// Evitar caché en respuestas dinámicas
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.get("/opciones/agencias", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT DISTINCT agencia FROM Transmisiones ORDER BY agencia`;
    res.json(result.recordset.map(r => r.agencia));
  } catch (err) {
    console.error("Error en /opciones/agencias:", err);
    res.status(500).json({ error: "Error al obtener agencias" });
  }
});

app.get("/opciones/nombres", async (req, res) => {
  const { agencia } = req.query;
  console.log("/opciones/nombres llamada con agencia:", agencia);

  try {
    const q = `
      SELECT DISTINCT nombre
      FROM Transmisiones
      WHERE UPPER(LTRIM(RTRIM(agencia))) = UPPER(LTRIM(RTRIM(@agencia)))
      ORDER BY nombre`;

    const result = await pool.request()
      .input("agencia", sql.VarChar, agencia)
      .query(q);

    console.log("Resultados nombres:", result.recordset);
    res.json(result.recordset.map(r => r.nombre));
  } catch (err) {
    console.error("Error en /opciones/nombres:", err);
    res.status(500).json({ error: "Error cargando nombres" });
  }
});

app.get("/opciones/cambios", async (req, res) => {
  const { agencia, nombre } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT DISTINCT cambios FROM Transmisiones
      WHERE agencia = ${agencia} AND nombre = ${nombre} ORDER BY cambios
    `;
    res.json(result.recordset.map(r => r.cambios));
  } catch (err) {
    console.error("Error en /opciones/cambios:", err);
    res.status(500).json({ error: "Error al obtener cambios" });
  }
});

app.get("/opciones/cilindros", async (req, res) => {
  const { agencia, nombre, cambios } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT DISTINCT cilindros FROM Transmisiones
      WHERE agencia = ${agencia} AND nombre = ${nombre} AND cambios = ${cambios}
      ORDER BY cilindros
    `;
    res.json(result.recordset.map(r => r.cilindros));
  } catch (err) {
    console.error("Error en /opciones/cilindros:", err);
    res.status(500).json({ error: "Error al obtener cilindros" });
  }
});

app.get("/opciones/motores", async (req, res) => {
  const { agencia, nombre, cambios, cilindros } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT DISTINCT motor FROM Transmisiones
      WHERE agencia = ${agencia} AND nombre = ${nombre}
      AND cambios = ${cambios} AND cilindros = ${cilindros}
      ORDER BY motor
    `;
    res.json(result.recordset.map(r => r.motor));
  } catch (err) {
    console.error("Error en /opciones/motores:", err);
    res.status(500).json({ error: "Error al obtener motores" });
  }
});



// ============================================================
// 🔹 ENDPOINT DE BÚSQUEDA
// ============================================================
app.post("/buscar", async (req, res) => {
  const { agencia, nombre, cambios, año, cilindros, motor } = req.body;

  let query = "SELECT * FROM Transmisiones WHERE 1=1";
  const request = pool.request();

  if (agencia) {
    query += " AND agencia = @agencia";
    request.input("agencia", sql.VarChar, agencia);
  }
  if (nombre) {
    query += " AND nombre = @nombre";
    request.input("nombre", sql.VarChar, nombre);
  }
  if (cambios) {
    query += " AND cambios = @cambios";
    request.input("cambios", sql.Int, cambios);
  }
  if (año) {
    query += " AND @año BETWEEN años_min AND años_max";
    request.input("año", sql.Int, año);
  }
  if (cilindros) {
    query += " AND cilindros = @cilindros";
    request.input("cilindros", sql.Int, cilindros);
  }
  if (motor) {
    query += " AND motor = @motor";
    request.input("motor", sql.Float, motor);
  }

  try {
    const result = await request.query(query);
    res.json({ resultados: result.recordset });
  } catch (err) {
    console.error("Error en /buscar:", err);
    res.status(500).json({ error: "Error ejecutando búsqueda" });
  }
});

// ============================================================
// 🔹 ENDPOINT DE FEEDBACK
// ============================================================
app.post("/feedback", async (req, res) => {
  try {
    const { clave, respuesta } = req.body;

    if (!clave || !respuesta) {
      return res.status(400).json({ error: "Faltan datos (clave o respuesta)." });
    }

    await pool.request()
      .input("clave", sql.VarChar, clave)
      .input("respuesta", sql.VarChar, respuesta)
      .query(`
        INSERT INTO Feedback (clave, respuesta)
        VALUES (@clave, @respuesta)
      `);

    res.json({ success: true, message: "Feedback guardado correctamente" });

  } catch (err) {
    console.error("Error al guardar feedback:", err);
    res.status(500).json({ error: "Error al guardar feedback" });
  }
});


// ============================================================
// 🔹 INICIO DEL SERVIDOR
// ============================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
