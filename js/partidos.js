const contenedor = document.getElementById("partidos");

function textoNormalizado(valor) {
  return normalizarNombreEquipo(valor || "");
}
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
    contenedor.classList.add("mostrar-todos");

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
  filtroEquipo.addEventListener("change", () => {
    if (!filtroEquipo.value) {
      // "Todos los equipos" debe resetear toda la combinación de filtros
      seleccionSeleccionada = "";
      torneoSeleccionado = "";
      faseSeleccionada = "";
      estadioSeleccionado = "";
      if (filtroFecha) filtroFecha.value = "";
      if (buscador) buscador.value = "";
    }
    aplicarFiltros();
  });

});

function cargarFiltroEquipos() {
  filtroEquipo.innerHTML = '<option value="">Todos los equipos</option>';

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


function extraerCodigoEquipo(valor) {
  if (!valor) return null;

  const texto = String(valor).trim();

  const matchParentesis = texto.match(/\(([A-Za-z]{3})\)/);
  if (matchParentesis) return matchParentesis[1].toUpperCase();

  const matchCodigoSuelto = texto.match(/\b([A-Za-z]{3})\b/);
  if (matchCodigoSuelto) return matchCodigoSuelto[1].toUpperCase();

  return obtenerCodigoEquipo(texto);
}

function aplicarFiltros() {

  const texto = normalizarNombreEquipo(buscador.value || "");
  const fechaSeleccionada = filtroFecha.value;
  const equipoSeleccionado = filtroEquipo.value;

  if (
    !texto &&
    !fechaSeleccionada &&
    !equipoSeleccionado &&
    !torneoSeleccionado &&
    !faseSeleccionada &&
    !estadioSeleccionado &&
    !seleccionSeleccionada
  ) {
    contenedor.classList.add("mostrar-todos");
    mostrarPartidos(partidosGlobal, contenedor);
    return;
  }

  contenedor.classList.remove("mostrar-todos");
 
  const filtrados = partidosGlobal.filter(p => {

    const nombrePartidoNormalizado = normalizarNombreEquipo(nombrePartido(p));
    const estadioNormalizado = normalizarNombreEquipo(p.estadio ?? "");

    const coincideBuscador =
      !texto ||
      nombrePartidoNormalizado.includes(texto) ||
      estadioNormalizado.includes(texto);

    const coincideFecha =
      !fechaSeleccionada ||
      p.fecha === fechaSeleccionada;

    const codigoLocal = extraerCodigoEquipo(p.local);
    const codigoVisitante = extraerCodigoEquipo(p.visitante);

    const nombreLocalNormalizado = normalizarNombreEquipo(p.local || "");
    const nombreVisitanteNormalizado = normalizarNombreEquipo(p.visitante || "");
    const nombreEquipoSeleccionado = normalizarNombreEquipo(
      CODIGOS_EQUIPOS[equipoSeleccionado] || ""
    );

    const coincideEquipo =
      !equipoSeleccionado ||
      codigoLocal === equipoSeleccionado ||
      codigoVisitante === equipoSeleccionado ||
      (nombreEquipoSeleccionado &&
        (nombreLocalNormalizado.includes(nombreEquipoSeleccionado) ||
          nombreVisitanteNormalizado.includes(nombreEquipoSeleccionado)));

      const coincideTorneo =
  !torneoSeleccionado ||
  p.torneo === torneoSeleccionado;

const coincideFase =
  !faseSeleccionada ||
  p.fase === faseSeleccionada;

const coincideEstadio =
  !estadioSeleccionado ||
  textoNormalizado(p.estadio) === textoNormalizado(estadioSeleccionado);

const codigoSeleccionSidebar = extraerCodigoEquipo(seleccionSeleccionada);
const codigoLocalSidebar = extraerCodigoEquipo(p.local);
const codigoVisitanteSidebar = extraerCodigoEquipo(p.visitante);

const coincideSeleccion =
  !seleccionSeleccionada ||
  textoNormalizado(p.local).includes(textoNormalizado(seleccionSeleccionada)) ||
  textoNormalizado(p.visitante).includes(textoNormalizado(seleccionSeleccionada)) ||
  textoNormalizado(seleccionSeleccionada).includes(textoNormalizado(p.local)) ||
  textoNormalizado(seleccionSeleccionada).includes(textoNormalizado(p.visitante)) ||
  (codigoSeleccionSidebar &&
    (codigoLocalSidebar === codigoSeleccionSidebar ||
      codigoVisitanteSidebar === codigoSeleccionSidebar));

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
  contenedor.classList.remove("mostrar-todos");

}