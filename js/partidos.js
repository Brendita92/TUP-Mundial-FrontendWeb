const contenedor = document.getElementById("partidos");
const buscador = document.getElementById("buscador");
const filtroFecha = document.getElementById("filtro-fecha");
const filtroEquipo = document.getElementById("filtro-equipo");

let partidosGlobal = [];

window.addEventListener("DOMContentLoaded", () => {
  cargarFiltroEquipos();
  partidosGlobal = obtenerPartidosDemo();
  mostrarPartidos(partidosGlobal, contenedor);

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
      (p.estadio?.nombre ?? "").toLowerCase().includes(texto);

    const coincideFecha = !fechaSeleccionada || p.fecha === fechaSeleccionada;

    const codigoLocal = obtenerCodigoEquipo(p.local.nombre);
    const codigoVisitante = obtenerCodigoEquipo(p.visitante.nombre);
    const coincideEquipo = !equipoSeleccionado ||
      codigoLocal === equipoSeleccionado ||
      codigoVisitante === equipoSeleccionado;

    return coincideBuscador && coincideFecha && coincideEquipo;
  });

  mostrarPartidos(filtrados, contenedor);
}


