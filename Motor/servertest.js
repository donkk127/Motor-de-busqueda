const sql = require('mssql');

const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'MOTORDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000
  },
  authentication: {
    type: 'default'
  }
};

sql.connect(config)
  .then(pool => {
    console.log('Conexión exitosa');
    return pool.request().query('SELECT TOP 1 * FROM Transmisiones');
  })
  .then(result => {
    console.log('Resultado:', result.recordset);
    sql.close();
  })
  .catch(err => {
    console.error('Error de conexión:', err);
  });
