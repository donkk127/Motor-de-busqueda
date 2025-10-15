const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // sirve index.html

const config = {
  server: 'DESKTOP-NAV45OG\\SQLEXPRESS',
  database: 'DATOSTRANSMISION',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  authentication: {
    type: 'ntlm',
    options: {
      userName: 'tu_usuario_windows', // Ej. 'Diego'
      password: 'tu_contraseña_windows',
      domain: 'DESKTOP-NAV45OG'
    }
  }
};
sql.connect(config)
  .then(() => console.log('Conexión exitosa'))
  .catch(err => console.error('Error de conexión:', err));

app.post('/buscar', async (req, res) => {
     console.log('Solicitud recibida:', req.body);
  try {
    await sql.connect(config);
    const { agencia, nombre, cambios, año, cilindros, motor } = req.body;

    let query = `SELECT * FROM Transmisiones WHERE 1=1`;
    if (agencia) query += ` AND agencia = '${agencia}'`;
    if (nombre) query += ` AND nombre = '${nombre}'`;
    if (cambios) query += ` AND cambios = ${cambios}`;
    if (año) query += ` AND ${año} BETWEEN años_min AND años_max`;
    if (cilindros) query += ` AND cilindros = ${cilindros}`;
    if (motor) query += ` AND motor = ${motor}`;
    
    console.log('Consulta SQL:', query);
    const result = await sql.query(query);
    res.json({ resultados: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
