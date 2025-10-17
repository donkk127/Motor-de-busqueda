const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 🔧 CONFIGURACIÓN CORRECTA
const config = {
  database: 'MOTORDB',
  server: 'DESKTOP-NAV45OG\\SQLEXPRESS',  // 👈 una sola barra aquí, no cuatro
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  }
};

// ✅ PRUEBA DE CONEXIÓN INICIAL
sql.connect(config)
  .then(() => console.log('Conectado a MOTORDB correctamente'))
  .catch(err => console.error('Error de conexión:', err));

// 🔍 Ruta para buscar
app.post('/buscar', async (req, res) => {
  const { agencia, nombre, cambios, año, cilindros, motor } = req.body;

  try {
    await sql.connect(config);

    let query = `SELECT * FROM Transmisiones WHERE 1=1`;
    const request = new sql.Request();

    if (agencia) {
      query += ' AND agencia = @agencia';
      request.input('agencia', sql.VarChar, agencia);
    }
    if (nombre) {
      query += ' AND nombre = @nombre';
      request.input('nombre', sql.VarChar, nombre);
    }
    if (cambios) {
      query += ' AND cambios = @cambios';
      request.input('cambios', sql.Int, cambios);
    }
    if (año) {
      query += ' AND @año BETWEEN años_min AND años_max';
      request.input('año', sql.Int, año);
    }
    if (cilindros) {
      query += ' AND cilindros = @cilindros';
      request.input('cilindros', sql.Int, cilindros);
    }
    if (motor) {
      query += ' AND motor = @motor';
      request.input('motor', sql.Float, motor);
    }

    const result = await request.query(query);
    res.json({ resultados: result.recordset });

  } catch (error) {
    console.error('Error en /buscar:', error);
    res.status(500).json({ error: 'Error al buscar en la base de datos' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
