console.log('motorL.js cargado correctamente');

async function cargarOpciones() {
  try {
    const resp = await fetch('/opciones');
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Error en la respuesta del servidor');

    console.log('Opciones recibidas:', data);

    const selects = ['agencia', 'nombre', 'cambios', 'cilindros', 'motor'];

    // Función para llenar un select
    const llenarSelect = (id, valores) => {
      const sel = document.getElementById(id);
      sel.innerHTML = '<option value="">-- cualquiera --</option>';
      valores.filter(v => v !== null && v !== undefined).forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      });
    };

    // Llenado inicial
    llenarSelect('agencia', data.agencias);
    llenarSelect('nombre', data.nombres);
    llenarSelect('cambios', data.cambios);
    llenarSelect('cilindros', data.cilindros);
    llenarSelect('motor', data.motores);

    const todos = data.todos;

    // Función que actualiza los selects según los filtros activos
    function actualizarFiltros() {
      const filtros = {
        agencia: document.getElementById('agencia').value,
        nombre: document.getElementById('nombre').value,
        cambios: document.getElementById('cambios').value,
        cilindros: document.getElementById('cilindros').value,
        motor: document.getElementById('motor').value
      };

      // Filtrar registros según los valores seleccionados
      const filtrados = todos.filter(r => {
        return (!filtros.agencia || r.agencia === filtros.agencia) &&
               (!filtros.nombre || r.nombre === filtros.nombre) &&
               (!filtros.cambios || r.cambios == filtros.cambios) &&
               (!filtros.cilindros || r.cilindros == filtros.cilindros) &&
               (!filtros.motor || r.motor == filtros.motor);
      });

      // Actualizar opciones según lo que quede disponible
      llenarSelect('agencia', [...new Set(filtrados.map(r => r.agencia))].sort());
      llenarSelect('nombre', [...new Set(filtrados.map(r => r.nombre))].sort());
      llenarSelect('cambios', [...new Set(filtrados.map(r => r.cambios))].sort());
      llenarSelect('cilindros', [...new Set(filtrados.map(r => r.cilindros))].sort());
      llenarSelect('motor', [...new Set(filtrados.map(r => r.motor))].sort());

      // Restaurar selección actual (si todavía existe entre las opciones filtradas)
      for (const [key, val] of Object.entries(filtros)) {
        const sel = document.getElementById(key);
        if (val && [...sel.options].some(o => o.value == val)) {
          sel.value = val;
        }
      }
    }

    // Escuchar cambios en todos los selects
    selects.forEach(id => {
      document.getElementById(id).addEventListener('change', actualizarFiltros);
    });

  } catch (err) {
    console.error('Error cargando opciones:', err);
  }
}

window.addEventListener('DOMContentLoaded', cargarOpciones);

// Botón "Buscar" (igual que antes)
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



