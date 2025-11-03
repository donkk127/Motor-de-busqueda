console.log("motorL.js cargado correctamente");

// 🔹 Función genérica para llenar selects
async function llenarSelect(url, selectId, placeholder = "-- seleccionar --") {
  const sel = document.getElementById(selectId);
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  sel.disabled = true; // Lo desactivamos momentáneamente mientras carga

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Error HTTP: " + resp.status);
    const data = await resp.json();

    data.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });

    // ✅ Si hay datos, habilitamos el select
    if (data.length > 0) {
      sel.disabled = false;
    }

  } catch (err) {
    console.error(`Error llenando select ${selectId}:`, err);
  }
}


// 🔹 Cargar agencias al inicio
window.addEventListener("DOMContentLoaded", async () => {
  await llenarSelect("/opciones/agencias", "agencia", "-- elige agencia --");
});

// 🔹 Cascada de selects
document.getElementById("agencia").addEventListener("change", async e => {
  const agencia = e.target.value;
  resetSelects(["nombre", "cambios", "cilindros", "motor"]);
  if (agencia) await llenarSelect(`/opciones/nombres?agencia=${agencia}`, "nombre", "-- elige modelo --");
});

document.getElementById("nombre").addEventListener("change", async e => {
  const agencia = document.getElementById("agencia").value;
  const nombre = e.target.value;
  resetSelects(["cambios", "cilindros", "motor"]);
  if (nombre) await llenarSelect(`/opciones/cambios?agencia=${agencia}&nombre=${nombre}`, "cambios", "-- elige cambios --");
});

document.getElementById("cambios").addEventListener("change", async e => {
  const agencia = document.getElementById("agencia").value;
  const nombre = document.getElementById("nombre").value;
  const cambios = e.target.value;
  resetSelects(["cilindros", "motor"]);
  if (cambios) await llenarSelect(`/opciones/cilindros?agencia=${agencia}&nombre=${nombre}&cambios=${cambios}`, "cilindros", "-- elige cilindros --");
});

document.getElementById("cilindros").addEventListener("change", async e => {
  const agencia = document.getElementById("agencia").value;
  const nombre = document.getElementById("nombre").value;
  const cambios = document.getElementById("cambios").value;
  const cilindros = e.target.value;
  resetSelects(["motor"]);
  if (cilindros) await llenarSelect(`/opciones/motores?agencia=${agencia}&nombre=${nombre}&cambios=${cambios}&cilindros=${cilindros}`, "motor", "-- elige motor --");
});

function resetSelects(ids) {
  ids.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">-- seleccionar --</option>`;
  });
}

// ======================================================
// 🔹 BÚSQUEDA DE RESULTADOS
// ======================================================
document.getElementById("buscar").addEventListener("click", async () => {
  const body = {
    agencia: document.getElementById("agencia").value || null,
    nombre: document.getElementById("nombre").value || null,
    cambios: document.getElementById("cambios").value || null,
    cilindros: document.getElementById("cilindros").value || null,
    motor: document.getElementById("motor").value || null,
    año: document.getElementById("año").value || null,
  };

  const resDiv = document.getElementById("resultados");
  resDiv.innerHTML = "Buscando...";

  try {
    const resp = await fetch("/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) throw new Error(data.error || "Error en la búsqueda");

    if (!data.resultados || data.resultados.length === 0) {
      resDiv.innerHTML = "<p><strong>No se encontraron coincidencias.</strong></p>";
    } else {
      const html = data.resultados
        .map(
          r => `
        <div class="resultado">
          <strong>Clave:</strong> ${r.clave} <br>
          <strong>Agencia:</strong> ${r.agencia} ; 
          <strong>Modelo:</strong> ${r.nombre} ; 
          <strong>Cambios:</strong> ${r.cambios} ; 
          <strong>Años:</strong> ${r.años_min}-${r.años_max} ; 
          <strong>Cilindros:</strong> ${r.cilindros} ; 
          <strong>Motor:</strong> ${r.motor}
          <br>
          <button class="btn-feedback" data-clave="${r.clave}">Dar feedback</button>
        </div>`
        )
        .join("");

      resDiv.innerHTML = html;
      document.querySelectorAll(".btn-feedback").forEach(btn =>
        btn.addEventListener("click", e => mostrarFeedback(e.target.dataset.clave))
      );
    }
  } catch (err) {
    resDiv.innerHTML = "<p><strong>Error al conectar con el servidor.</strong></p>";
    console.error("Error de red:", err);
  }
});

// ======================================================
// 🔹 FEEDBACK
// ======================================================
function mostrarFeedback(clave) {
  const resDiv = document.getElementById("resultados");

  const feedbackHTML = `
    <div class="feedback" data-clave="${clave}">
      <p>¿Se vendió algo de la transmisión con clave <strong>${clave}</strong>?</p>
      <button onclick="enviarFeedback('${clave}', 'si_vendido')">Sí, se vendió</button>
      <button onclick="enviarFeedback('${clave}', 'no_vendido')">No, no se vendió</button>
      <button onclick="enviarFeedback('${clave}', 'no_existencia')">No había existencias</button>
    </div>
  `;

  resDiv.insertAdjacentHTML("beforeend", feedbackHTML);
}

async function enviarFeedback(clave, respuesta) {
  try {
    const resp = await fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave, respuesta }),
    });

    const data = await resp.json();

    if (resp.ok) {
      alert("Feedback registrado correctamente.");

      //Elimina los botones de feedback de esa transmisión
      const feedbackDiv = document.querySelector(`.feedback[data-clave='${clave}']`);
      if (feedbackDiv) {
        feedbackDiv.innerHTML = `<p>Feedback registrado para <strong>${clave}</strong>.</p>`;
      }

    } else {
      console.error("Error en feedback:", data);
      alert("Error al enviar feedback.");
    }
  } catch (err) {
    console.error("Error al enviar feedback:", err);
  }
}

