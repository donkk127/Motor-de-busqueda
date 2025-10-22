const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8'); // Usa este driver para Windows Authentication
const app = express();
const PORT = 3000;


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de conexión a SQL Server
const config = {
  server: 'DESKTOP-NAV45OG\\SQLEXPRESS',
  database: 'MOTORDB',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
  driver: 'msnodesqlv8',
};


app.get('/opciones', async (req, res) => {
  console.log('Petición GET recibida en /opciones');

  try {
    await sql.connect(config);
    console.log('Conectado correctamente a la base de datos');

    const agencias = await sql.query`SELECT DISTINCT agencia FROM Transmisiones ORDER BY agencia`;
    const nombres = await sql.query`SELECT DISTINCT nombre FROM Transmisiones ORDER BY nombre`;

    console.log('Agencias y nombres obtenidos:', agencias.recordset, nombres.recordset);

    res.json({
      agencias: agencias.recordset.map(r => r.agencia),
      nombres: nombres.recordset.map(r => r.nombre)
    });

  } catch (error) {
    console.error('Error al obtener opciones:', error);
    res.status(500).json({ error: 'Error al obtener opciones desde la base de datos' });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


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


console.log('Ruta absoluta a /public:', path.join(__dirname, 'public'));


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
