const contenedor = document.getElementById("partidos");
const buscador = document.getElementById("buscador");
const filtroFecha = document.getElementById("filtro-fecha");
const filtroEquipo = document.getElementById("filtro-equipo");

let partidosGlobal = [];

let torneoSeleccionado = "";
let faseSeleccionada = "";
let estadioSeleccionado = "";
let seleccionSeleccionada = "";

window.addEventListener("DOMContentLoaded", async () => {
  cargarFiltroEquipos();

  try {
    const res = await apiFetch("/Partido/obtenertodos");

    partidosGlobal = Array.isArray(res) ? res : [];
    console.log("[Partidos] response:", res);

   console.log(partidosGlobal[0]);

    if (!Array.isArray(partidosGlobal) || partidosGlobal.length === 0) {

      contenedor.innerHTML = `
        <div class="empty-state">
          <p>No hay partidos para mostrar.</p>
        </div>
      `;

      return;
    }

    mostrarPartidos(partidosGlobal, contenedor);

    setTimeout(() => {
      cargarFechas();
      cargarSidebar();
      }, 0);

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

function cargarFechas() {

  filtroFecha.innerHTML =
    '<option value="">Todas las fechas</option>';

  const fechas = [
    ...new Set(partidosGlobal.map(p => p.fecha))
  ];

  fechas.sort((a, b) =>
    new Date(a) - new Date(b)
  );

  fechas.forEach(fecha => {

    const option = document.createElement("option");

    option.value = fecha;

    option.textContent =
      new Date(fecha).toLocaleDateString("es-AR");

    filtroFecha.appendChild(option);

  });

}

function cargarSidebar() {

 setTimeout(() => {
  cargarTorneos();
  cargarFases();
  cargarEstadios();
  cargarSelecciones();
}, 0);

  const btnSidebar =
    document.getElementById("btnSidebar");

  const sidebar =
    document.getElementById("sidebar");

  btnSidebar.addEventListener("click", () => {

    sidebar.classList.toggle("sidebar-open");
    btnSidebar.classList.toggle("sidebar-open");

  });


 document.querySelectorAll(".sidebar-title").forEach(btn => {
  btn.addEventListener("click", () => {
    const content = btn.nextElementSibling;

      document.querySelectorAll('.sidebar-content').forEach(c => {
      if (c !== content) c.classList.remove("sidebar-expanded");
    });
    content.classList.toggle("sidebar-expanded");
  });
});
  }

  function cargarTorneos() {
    
  const contenedor =
    document.getElementById("sidebar-torneos");

  const torneos = [
    ...new Set(partidosGlobal.map(p => p.torneo).filter(Boolean))
];

  contenedor.innerHTML = "";

  torneos.forEach(torneo => {

    const item = document.createElement("div");

    item.className = "sidebar-item";
    item.textContent = torneo;

    item.addEventListener("click", () => {

      torneoSeleccionado = torneo;

      aplicarFiltros();
    });
    contenedor.appendChild(item);
  });

}

function cargarFases() {
 
  const contenedor = document.getElementById("sidebar-fases");

  const fases = [
    ...new Set(partidosGlobal.map(p => p.fase).filter(Boolean))
];
  console.log("Fases:", fases);

  contenedor.innerHTML = "";

  fases.forEach(fase => {

    const item = document.createElement("div");

    item.className = "sidebar-item";
    item.textContent = fase;

    item.addEventListener("click", () => {

      faseSeleccionada = fase;

      aplicarFiltros();
    });

    contenedor.appendChild(item);
  });
}

function cargarEstadios() {
 
  const contenedor = document.getElementById("sidebar-estadios");

  const estadios = [
    ...new Set(partidosGlobal.map(p => p.estadio).filter(Boolean))
  ];

  contenedor.innerHTML = "";

  estadios.forEach(estadio => {

    const item = document.createElement("div");

    item.className = "sidebar-item";
    item.textContent = estadio;

    item.addEventListener("click", () => {
      estadioSeleccionado = estadio;
      aplicarFiltros();
    });

    contenedor.appendChild(item);
  });
}
function cargarSelecciones() {

  const contenedor = document.getElementById("sidebar-selecciones");

  const selecciones = new Set();

  partidosGlobal.forEach(p => {
    selecciones.add(p.local?.trim());
    selecciones.add(p.visitante?.trim());
  });

  contenedor.innerHTML = "";

  [...selecciones]
    .sort()
    .forEach(seleccion => {

      const item = document.createElement("div");

      item.className = "sidebar-item";
      item.textContent = seleccion;

      item.addEventListener("click", () => {
        seleccionSeleccionada = seleccion;
        aplicarFiltros();
      });

      contenedor.appendChild(item);
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

    const coincideFecha =
      !fechaSeleccionada ||
      p.fecha === fechaSeleccionada;

    const codigoLocal =
      obtenerCodigoEquipo(p.local);

    const codigoVisitante =
      obtenerCodigoEquipo(p.visitante);

    const coincideEquipo =
      !equipoSeleccionado ||
      codigoLocal === equipoSeleccionado ||
      codigoVisitante === equipoSeleccionado;

      const coincideTorneo =
  !torneoSeleccionado ||
  p.torneo === torneoSeleccionado;

const coincideFase =
  !faseSeleccionada ||
  p.fase === faseSeleccionada;

const coincideEstadio =
  !estadioSeleccionado ||
  p.estadio === estadioSeleccionado;

const coincideSeleccion =
  !seleccionSeleccionada ||
  p.local === seleccionSeleccionada ||
  p.visitante === seleccionSeleccionada;

  return (
  coincideBuscador &&
  coincideFecha &&
  coincideEquipo &&
  coincideTorneo &&
  coincideFase &&
  coincideEstadio &&
  coincideSeleccion
);

  });

  mostrarPartidos(filtrados, contenedor);

}