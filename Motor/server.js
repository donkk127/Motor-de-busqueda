const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // sirve index.html

const config = {
  server: 'localhost\SQLEXPRESS',
  database: 'MOTORDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },

  authentication: {
    type: 'default'
  }
};

let pool;

sql.connect(config)
  .then(p=> {
    pool=p;
    console.log('Conexión exitosa')
  })
  .catch(err=> console.error('Error de conexión: ', err))

app.post('/buscar', async (req, res) => {
  if (!pool) return res.status(500).send('Conexión no disponible.');

  try {
    const pool = await sql.connect(config);
    const { agencia, nombre, cambios, año, cilindros, motor } = req.body;

    let query = `SELECT * FROM Transmisiones WHERE 1=1`;
    const request = pool.request();

    if (agencia) {
      query += ` AND agencia = @agencia`;
      request.input('agencia', sql.VarChar, agencia);
    }
    if (nombre) {
      query += ` AND nombre = @nombre`;
      request.input('nombre', sql.VarChar, nombre);
    }
    if (cambios) {
      query += ` AND cambios = @cambios`;
      request.input('cambios', sql.Int, cambios);
    }
    if (año) {
      query += ` AND @año BETWEEN años_min AND años_max`;
      request.input('año', sql.Int, año);
    }
    if (cilindros) {
      query += ` AND cilindros = @cilindros`;
      request.input('cilindros', sql.Int, cilindros);
    }
    if (motor) {
      query += ` AND motor = @motor`;
      request.input('motor', sql.Float, motor);
    }

    const result = await request.query(query);
    res.json({ resultados: result.recordset });
  } catch (err) {
    console.error('Error en la consulta:', err);
    res.status(500).send('Error en el servidor');
  }
});


app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
