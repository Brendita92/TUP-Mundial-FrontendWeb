const contenedor = document.getElementById("partidos");
const buscador = document.getElementById("buscador");
const filtroFecha = document.getElementById("filtro-fecha");
const filtroEquipo = document.getElementById("filtro-equipo");

let partidosGlobal = [];

window.addEventListener("DOMContentLoaded", async () => {
  cargarFiltroEquipos();

  // Cargar partidos desde API
  try {
    const res = await apiFetch("/Partido/obtenertodos");
    partidosGlobal = res || [];

    // Debug visible (para detectar por qué queda vacío)
    console.log("[Partidos] response:", res);

    if (!Array.isArray(partidosGlobal) || partidosGlobal.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <p>No hay partidos para mostrar.</p>
        </div>
      `;
      return;
    }

    mostrarPartidos(partidosGlobal, contenedor);
  } catch (e) {
    console.error("[Partidos] Error cargando partidos:", e);
    contenedor.innerHTML = `
      <div class="empty-state">
        <p>Error al cargar partidos.</p>
        <small>Revisá consola.</small>
      </div>
    `;
  }


  buscador.addEventListener("input", aplicarFiltros);
  filtroFecha.addEventListener("change", aplicarFiltros);
  filtroEquipo.addEventListener("change", aplicarFiltros);
});


function cargarFiltroEquipos() {
  obtenerEquiposParaFiltro().forEach(({ codigo, nombre }) => {
    const option = document.createElement("option");
    option.value = codigo;
    option.textContent = nombre;
    filtroEquipo.appendChild(option);
  });
}

function aplicarFiltros() {
  const texto = buscador.value.toLowerCase();
  const fechaSeleccionada = filtroFecha.value;
  const equipoSeleccionado = filtroEquipo.value;

  const filtrados = partidosGlobal.filter(p => {
    const coincideBuscador =
      nombrePartido(p).toLowerCase().includes(texto) ||
      (p.estadio ?? "").toLowerCase().includes(texto);


    const coincideFecha = !fechaSeleccionada || p.fecha === fechaSeleccionada;

    const codigoLocal = obtenerCodigoEquipo(p.local);
    const codigoVisitante = obtenerCodigoEquipo(p.visitante);

    const coincideEquipo = !equipoSeleccionado ||
      codigoLocal === equipoSeleccionado ||
      codigoVisitante === equipoSeleccionado;

    return coincideBuscador && coincideFecha && coincideEquipo;
  });

  mostrarPartidos(filtrados, contenedor);
}


