const idPartidoCompra = new URLSearchParams(window.location.search).get("id")
  || localStorage.getItem("partidoPendiente");
const infoPartido = document.getElementById("info-partido");
const sectoresContainer = document.getElementById("sectores-container");
const cantidad = document.getElementById("cantidad");
const total = document.getElementById("total");
const btnContinuar = document.getElementById("btnContinuar");

const partido = JSON.parse(localStorage.getItem("partidoActual"))
  || buscarPartidoDemo(idPartidoCompra);
const sectorGuardado = JSON.parse(localStorage.getItem("sectorSeleccionado"));
const sectores = obtenerSectoresDemo();

function renderSectores() {
  const sectorPreseleccionado = sectorGuardado?.id || sectores[0]?.id;

  sectoresContainer.innerHTML = sectores.map(s => `
    <label class="radio-line">
      <input type="radio" name="sector" value="${s.nombre}" data-precio="${s.precio}"
        ${s.id === sectorPreseleccionado ? "checked" : ""}>
      ${s.nombre} - $${s.precio}
    </label>
  `).join("");

  document.querySelectorAll("input[name='sector']").forEach(radio =>
    radio.addEventListener("change", () => {
      calcularTotal("input[name='sector']", cantidad, total);
      const seleccionado = sectores.find(s => s.nombre === radio.value);
      if (seleccionado) {
        localStorage.setItem("sectorSeleccionado", JSON.stringify(seleccionado));
      }
    })
  );
}

if (partido) {
  mostrarPartidoCompra(partido, infoPartido);
}

renderSectores();
calcularTotal("input[name='sector']", cantidad, total);

cantidad.addEventListener("input", () =>
  calcularTotal("input[name='sector']", cantidad, total)
);

btnContinuar.addEventListener("click", () => {
  const sector = document.querySelector("input[name='sector']:checked");
  if (!sector) return alert("Seleccione un sector");

  const compra = {
    partidoId: idPartidoCompra,
    sector: sector.value,
    cantidad: Number(cantidad.value),
    total: total.textContent
  };

  localStorage.setItem("ultimaCompra", JSON.stringify(compra));
  alert("Compra registrada");
  window.location.href = "index.html";
});
