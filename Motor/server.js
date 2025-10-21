const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());


// Servir los archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la conexión SQL
const config = {
  server: 'DESKTOP-NAV45OG\\SQLEXPRESS',
  database: 'MOTORDB',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
  driver: 'msnodesqlv8'
};

// Ruta para búsqueda
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

// Ruta raíz: devuelve tu index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = 3000;

console.log('Ruta absoluta a /public:', path.join(__dirname, 'public'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
