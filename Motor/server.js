const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8'); // Driver para Windows Authentication
const app = express();
const PORT = 3000;

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

//Endpoint para llenar selects con cascada
app.get('/opciones', async (req, res) => {
  const { agencia, nombre, cambios, cilindros } = req.query;

  try {
    await sql.connect(config);

    let agencias = await sql.query`SELECT DISTINCT agencia FROM Transmisiones ORDER BY agencia`;
    let nombres = await sql.query`SELECT DISTINCT nombre FROM Transmisiones ORDER BY nombre`;
    let cambiosArr = await sql.query`SELECT DISTINCT cambios FROM Transmisiones ORDER BY cambios`;
    let cilindrosArr = await sql.query`SELECT DISTINCT cilindros FROM Transmisiones ORDER BY cilindros`;
    let motorArr = await sql.query`SELECT DISTINCT motor FROM Transmisiones ORDER BY motor`;

    // Filtrado en cascada
    if (agencia) nombres = await sql.query`SELECT DISTINCT nombre FROM Transmisiones WHERE agencia = ${agencia} ORDER BY nombre`;
    if (agencia && nombre) cambiosArr = await sql.query`SELECT DISTINCT cambios FROM Transmisiones WHERE agencia = ${agencia} AND nombre = ${nombre} ORDER BY cambios`;
    if (agencia && nombre && cambios) cilindrosArr = await sql.query`SELECT DISTINCT cilindros FROM Transmisiones WHERE agencia = ${agencia} AND nombre = ${nombre} AND cambios = ${cambios} ORDER BY cilindros`;
    if (agencia && nombre && cambios && cilindros) motorArr = await sql.query`SELECT DISTINCT motor FROM Transmisiones WHERE agencia = ${agencia} AND nombre = ${nombre} AND cambios = ${cambios} AND cilindros = ${cilindros} ORDER BY motor`;

    res.json({
      agencia: agencias.recordset.map(r => r.agencia),
      nombre: nombres.recordset.map(r => r.nombre),
      cambios: cambiosArr.recordset.map(r => r.cambios),
      cilindros: cilindrosArr.recordset.map(r => r.cilindros),
      motor: motorArr.recordset.map(r => r.motor)
    });

  } catch (error) {
    console.error('Error en /opciones:', error);
    res.status(500).json({ error: 'Error obteniendo opciones' });
  }
});

//Endpoint de búsqueda
app.post('/buscar', async (req, res) => {
  const { agencia, nombre, cambios, año, cilindros, motor } = req.body;

  try {
    await sql.connect(config);
    const request = new sql.Request();
    let query = `SELECT * FROM Transmisiones WHERE 1=1`;

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

//Endpoint para recibir feedback
// Ruta para registrar feedback de ventas
app.post('/feedback', async (req, res) => {
  const { clave, respuesta, comentario } = req.body;

  if (!clave || !respuesta) {
    return res.status(400).json({ error: 'Falta la clave o la respuesta' });
  }

  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input('clave', sql.VarChar, clave);
    request.input('respuesta', sql.VarChar, respuesta);  // 'sí_vendido', 'no_vendido', 'no_existencia'
    request.input('comentario', sql.NVarChar, comentario || null);

    await request.query(
      `INSERT INTO Feedback (clave, respuesta, comentario) 
       VALUES (@clave, @respuesta, @comentario)`
    );

    res.json({ mensaje: 'Feedback registrado correctamente' });
  } catch (err) {
    console.error('Error en /feedback:', err);
    res.status(500).json({ error: 'Error al registrar feedback en la base de datos' });
  }
});



// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

console.log('Ruta absoluta a /public:', path.join(__dirname, 'public'));
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
