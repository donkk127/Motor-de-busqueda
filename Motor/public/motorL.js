console.log('motorL.js cargado correctamente');

// Elementos del DOM
const agenciaSel = document.getElementById('agencia');
const nombreSel = document.getElementById('nombre');
const cambiosSel = document.getElementById('cambios');
const cilindrosSel = document.getElementById('cilindros');
const motorSel = document.getElementById('motor');
const resDiv = document.getElementById('resultados');
const feedbackDiv = document.getElementById('feedback');

// Inicialización: solo la agencia habilitada al inicio
nombreSel.disabled = true;
cambiosSel.disabled = true;
cilindrosSel.disabled = true;
motorSel.disabled = true;

// Función genérica para llenar un select con fetch desde el servidor
async function llenarSelect(endpoint, selectEl, filtros = {}) {
  try {
    const query = new URLSearchParams(filtros).toString();
    const resp = await fetch(endpoint + (query ? `?${query}` : ''));
    const data = await resp.json();

    selectEl.innerHTML = '<option value="">-- cualquiera --</option>';
    // Cada select recibe su array correspondiente según id
    const arr = data[selectEl.id]; 
    if (arr) arr.forEach(valor => {
      const opt = document.createElement('option');
      opt.value = valor;
      opt.textContent = valor;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    console.error(`Error llenando select ${selectEl.id}:`, err);
  }
}

// Llenar agencias al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  llenarSelect('/opciones', agenciaSel);
});

// Cascada de selects
agenciaSel.addEventListener('change', () => {
  nombreSel.disabled = !agenciaSel.value;
  if (!agenciaSel.value) {
    nombreSel.innerHTML = '<option value="">-- cualquiera --</option>';
    cambiosSel.innerHTML = '<option value="">-- cualquiera --</option>';
    cilindrosSel.innerHTML = '<option value="">-- cualquiera --</option>';
    motorSel.innerHTML = '<option value="">-- cualquiera --</option>';
    cambiosSel.disabled = true;
    cilindrosSel.disabled = true;
    motorSel.disabled = true;
    return;
  }
  llenarSelect('/opciones', nombreSel, { agencia: agenciaSel.value });
});

nombreSel.addEventListener('change', () => {
  cambiosSel.disabled = !nombreSel.value;
  if (!nombreSel.value) {
    cambiosSel.innerHTML = '<option value="">-- cualquiera --</option>';
    cilindrosSel.innerHTML = '<option value="">-- cualquiera --</option>';
    motorSel.innerHTML = '<option value="">-- cualquiera --</option>';
    cilindrosSel.disabled = true;
    motorSel.disabled = true;
    return;
  }
  llenarSelect('/opciones', cambiosSel, { agencia: agenciaSel.value, nombre: nombreSel.value });
});

cambiosSel.addEventListener('change', () => {
  cilindrosSel.disabled = !cambiosSel.value;
  if (!cambiosSel.value) {
    cilindrosSel.innerHTML = '<option value="">-- cualquiera --</option>';
    motorSel.innerHTML = '<option value="">-- cualquiera --</option>';
    motorSel.disabled = true;
    return;
  }
  llenarSelect('/opciones', cilindrosSel, {
    agencia: agenciaSel.value,
    nombre: nombreSel.value,
    cambios: cambiosSel.value
  });
});

cilindrosSel.addEventListener('change', () => {
  motorSel.disabled = !cilindrosSel.value;
  if (!cilindrosSel.value) {
    motorSel.innerHTML = '<option value="">-- cualquiera --</option>';
    return;
  }
  llenarSelect('/opciones', motorSel, {
    agencia: agenciaSel.value,
    nombre: nombreSel.value,
    cambios: cambiosSel.value,
    cilindros: cilindrosSel.value
  });
});

// Botón buscar
document.getElementById('buscar').addEventListener('click', async () => {
  const body = {
    agencia: agenciaSel.value || null,
    nombre: nombreSel.value || null,
    cambios: cambiosSel.value ? parseInt(cambiosSel.value) : null,
    año: document.getElementById('año').value ? parseInt(document.getElementById('año').value) : null,
    cilindros: cilindrosSel.value ? parseInt(cilindrosSel.value) : null,
    motor: motorSel.value ? parseFloat(motorSel.value) : null
  };

  resDiv.innerHTML = 'Buscando...';
  feedbackDiv.innerHTML = ''; // Limpiar feedback previo

  try {
    const resp = await fetch('/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.error || 'Error en la búsqueda');

    if (!data.resultados || data.resultados.length === 0) {
      resDiv.innerHTML = '<div class="resultado"><strong>No se encontraron coincidencias</strong></div>';
      return;
    }

    // Mostrar resultados
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

    // Generar botones de feedback
    feedbackDiv.innerHTML = '<p>¿Se vendió alguna de estas transmisiones?</p>';
    const btns = [
      'Sí, se vendió',
      'No, no se vendió',
      'No había lo que buscaban',
      'No había existencias'
    ];
    btns.forEach(txt => {
      const btn = document.createElement('button');
      btn.textContent = txt;
      btn.addEventListener('click', async () => {
        const feedback = {
          claves: data.resultados.map(r => r.clave),
          tipo: txt
        };
        try {
          await fetch('/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback)
          });
          alert('Feedback enviado');
        } catch (err) {
          console.error('Error enviando feedback:', err);
        }
      });
      feedbackDiv.appendChild(btn);
    });

  } catch (err) {
    resDiv.innerHTML = '<div class="resultado"><strong>Error de conexión con el servidor</strong></div>';
    console.error('Error de búsqueda:', err);
  }
});
