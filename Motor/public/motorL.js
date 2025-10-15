document.getElementById('buscar').addEventListener('click', async () => {
  const body = {
    agencia: document.getElementById('agencia').value || null,
    nombre: document.getElementById('nombre').value || null,
    cambios: document.getElementById('cambios').value ? parseInt(document.getElementById('cambios').value) : null,
    año: document.getElementById('año').value ? parseInt(document.getElementById('año').value) : null,
    cilindros: document.getElementById('cilindros').value ? parseInt(document.getElementById('cilindros').value) : null,
    motor: document.getElementById('motor').value ? parseFloat(document.getElementById('motor').value) : null
  };

  const resDiv = document.getElementById('resultados');
  resDiv.innerHTML = 'Buscando...';

  try {
    const resp = await fetch('/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (resp.ok) {
      if (data.resultados.length === 0) {
        resDiv.innerHTML = '<div class="resultado"><strong>No se encontraron coincidencias</strong></div>';
      } else {
        const rows = data.resultados.map(r =>
          `<div class="resultado"><strong>Clave:</strong> ${r.clave} <br>
           <strong>Agencia:</strong> ${r.agencia} ; <strong>Modelo:</strong> ${r.nombre} ; 
           <strong>Cambios:</strong> ${r.cambios} ; <strong>Años:</strong> ${r.años_min}-${r.años_max} ; 
           <strong>Cilindros:</strong> ${r.cilindros} ; <strong>Motor:</strong> ${r.motor}</div>`
        ).join('');
        resDiv.innerHTML = rows;
      }
    } else {
      resDiv.innerHTML = '<div class="resultado"><strong>Error al buscar</strong></div>';
    }
  } catch (err) {
    resDiv.innerHTML = '<div class="resultado"><strong>Error de conexión</strong></div>';
    console.error(err);
  }
});
