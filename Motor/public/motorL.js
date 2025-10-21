// 👉 Cargar opciones desde la base de datos al iniciar la página
async function cargarOpciones() {
  try {
    const resp = await fetch('/opciones');
    const data = await resp.json();

    if (!Array.isArray(data)) {
      console.error('Respuesta inesperada de /opciones:', data);
      return;
    }

    // Obtener referencias a los selects
    const agenciaSelect = document.getElementById('agencia');
    const nombreSelect = document.getElementById('nombre');
    const cambiosSelect = document.getElementById('cambios');
    const cilindrosSelect = document.getElementById('cilindros');
    const motorSelect = document.getElementById('motor');

    // Limpiar y agregar opción por defecto
    const limpiarSelect = (select) => {
      select.innerHTML = '<option value="">-- cualquiera --</option>';
    };
    limpiarSelect(agenciaSelect);
    limpiarSelect(nombreSelect);
    limpiarSelect(cambiosSelect);
    limpiarSelect(cilindrosSelect);
    limpiarSelect(motorSelect);

    // Usar Set para evitar duplicados
    const agencias = new Set();
    const nombres = new Set();
    const cambios = new Set();
    const cilindros = new Set();
    const motores = new Set();

    data.forEach(row => {
      if (row.agencia) agencias.add(row.agencia);
      if (row.nombre) nombres.add(row.nombre);
      if (row.cambios) cambios.add(row.cambios);
      if (row.cilindros) cilindros.add(row.cilindros);
      if (row.motor) motores.add(row.motor);
    });

    // Función auxiliar para llenar select
    const llenarSelect = (select, valores) => {
      [...valores].forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
    };

    llenarSelect(agenciaSelect, agencias);
    llenarSelect(nombreSelect, nombres);
    llenarSelect(cambiosSelect, cambios);
    llenarSelect(cilindrosSelect, cilindros);
    llenarSelect(motorSelect, motores);

  } catch (err) {
    console.error('Error cargando opciones:', err);
  }
}

// 👉 Evento del botón "Buscar"
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
      if (!data.resultados || data.resultados.length === 0) {
        resDiv.innerHTML = '<div class="resultado"><strong>No se encontraron coincidencias</strong></div>';
      } else {
        const rows = data.resultados.map(r =>
          `<div class="resultado">
            <strong>Clave:</strong> ${r.clave} <br>
            <strong>Agencia:</strong> ${r.agencia} ; 
            <strong>Modelo:</strong> ${r.nombre} ; 
            <strong>Cambios:</strong> ${r.cambios} ; 
            <strong>Años:</strong> ${r.años_min}-${r.años_max} ; 
            <strong>Cilindros:</strong> ${r.cilindros} ; 
            <strong>Motor:</strong> ${r.motor}
          </div>`
        ).join('');
        resDiv.innerHTML = rows;
      }
    } else {
      resDiv.innerHTML = '<div class="resultado"><strong>Error al buscar</strong></div>';
      console.error('Respuesta con error:', data);
    }
  } catch (err) {
    resDiv.innerHTML = '<div class="resultado"><strong>Error de conexión con el servidor</strong></div>';
    console.error('Error de red:', err);
  }
});

window.addEventListener('DOMContentLoaded', cargarOpciones);
