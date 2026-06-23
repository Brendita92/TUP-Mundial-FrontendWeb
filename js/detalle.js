const idPartido = new URLSearchParams(window.location.search).get("id");
const contenedorDetalle = document.getElementById("detalle-partido");
const btnComprar = document.getElementById("btnComprar");
const contenedorMapa = document.getElementById("mapa-estadio");
const infoSector = document.getElementById("info-sector");
const leyendaMapa = document.getElementById("mapa-leyenda");
const mapaSection = document.querySelector(".mapa-section");

const sectores = obtenerSectoresDemo();
let sectorActivo = null;
let sectorHover = null;

const ZONAS_ESTADIO = {
  popular: {
    label: { x: 280, y: 78 },
    shapes: [
      { tag: "rect", attrs: { x: 82, y: 36, width: 396, height: 76, rx: 20 } },
      { tag: "rect", attrs: { x: 82, y: 308, width: 396, height: 76, rx: 20 } }
    ]
  },
  platea: {
    label: { x: 92, y: 215 },
    shapes: [
      { tag: "rect", attrs: { x: 38, y: 118, width: 100, height: 184, rx: 14 } },
      { tag: "rect", attrs: { x: 422, y: 118, width: 100, height: 184, rx: 14 } }
    ]
  },
  vip: {
    label: { x: 280, y: 318 },
    shapes: [
      { tag: "path", attrs: { d: "M 168 292 L 392 292 L 365 348 L 195 348 Z" } }
    ]
  }
};

function renderMapa() {
  const defs = `
    <defs>
      <filter id="sector-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#fff" flood-opacity="0.45"/>
      </filter>
    </defs>
  `;

  const campo = `
    <g class="campo" aria-hidden="true">
      <rect x="148" y="128" width="264" height="164" rx="8" fill="#2d6a4f" stroke="#e8f5e9" stroke-width="2"/>
      <line x1="280" y1="128" x2="280" y2="292" stroke="#e8f5e9" stroke-width="1.5" opacity="0.75"/>
      <circle cx="280" cy="210" r="32" fill="none" stroke="#e8f5e9" stroke-width="1.5" opacity="0.75"/>
      <rect x="148" y="168" width="22" height="84" fill="none" stroke="#e8f5e9" stroke-width="1.2" opacity="0.6"/>
      <rect x="390" y="168" width="22" height="84" fill="none" stroke="#e8f5e9" stroke-width="1.2" opacity="0.6"/>
      <text x="280" y="214" text-anchor="middle" fill="#e8f5e9" font-size="13" font-weight="700" opacity="0.85">CAMPO</text>
    </g>
  `;

  const gruposSectores = sectores.map(sector => {
    const zona = ZONAS_ESTADIO[sector.id];
    const shapes = zona.shapes.map(shape => {
      const attrs = Object.entries(shape.attrs)
        .map(([key, val]) => `${key}="${val}"`)
        .join(" ");
      return `<${shape.tag} class="sector-forma" fill="${sector.color}" ${attrs}/>`;
    }).join("");

    const labelExtra = sector.id === "platea"
      ? `<text class="sector-etiqueta" x="488" y="215" text-anchor="middle">${sector.nombre.toUpperCase()}</text>`
      : "";

    const label = sector.id !== "platea"
      ? `<text class="sector-etiqueta" x="${zona.label.x}" y="${zona.label.y}" text-anchor="middle">${sector.nombre.toUpperCase()}</text>`
      : `<text class="sector-etiqueta" x="${zona.label.x}" y="${zona.label.y}" text-anchor="middle">${sector.nombre.toUpperCase()}</text>${labelExtra}`;

    return `
      <g id="${sector.id}" class="sector-mapa" data-sector="${sector.id}"
         role="button" tabindex="0" aria-label="Sector ${sector.nombre}, $${sector.precio}">
        ${shapes}
        ${label}
      </g>
    `;
  }).join("");

  contenedorMapa.innerHTML = `
    <svg class="estadio-svg" viewBox="0 0 560 420" aria-labelledby="mapa-titulo-svg">
      <title id="mapa-titulo-svg">Mapa interactivo del estadio</title>
      <ellipse cx="280" cy="210" rx="268" ry="198" class="estadio-fondo"/>
      ${defs}
      ${gruposSectores}
      ${campo}
    </svg>
  `;

  sectores.forEach(sector => {
    const grupo = document.getElementById(sector.id);

    grupo.addEventListener("mouseenter", () => resaltarHover(sector));
    grupo.addEventListener("mouseleave", () => quitarHover());
    grupo.addEventListener("click", () => seleccionarSector(sector));
    grupo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seleccionarSector(sector);
      }
    });
  });

  if (leyendaMapa) {
    leyendaMapa.innerHTML = sectores.map(s => `
      <button type="button" class="leyenda-item" data-sector="${s.id}" style="--sector-color: ${s.color}">
        <span class="leyenda-color"></span>
        <span>${s.nombre} · $${s.precio}</span>
      </button>
    `).join("");

    leyendaMapa.querySelectorAll(".leyenda-item").forEach(btn => {
      const sector = sectores.find(s => s.id === btn.dataset.sector);
      btn.addEventListener("mouseenter", () => resaltarHover(sector));
      btn.addEventListener("mouseleave", () => quitarHover());
      btn.addEventListener("click", () => seleccionarSector(sector));
    });
  }
}

function claseDisponibilidad(disponibilidad) {
  const mapa = { Alta: "disp-alta", Media: "disp-media", Baja: "disp-baja" };
  return mapa[disponibilidad] || "disp-media";
}

function renderSectorCard(sector, { seleccionado = false, preview = false } = {}) {
  return `
    <div class="sector-card ${seleccionado ? "sector-card--activo" : ""} ${preview ? "sector-card--preview" : ""}">
      <div class="sector-card-header" style="--sector-color: ${sector.color}">
        <span class="sector-badge">${sector.nombre}</span>
        <span class="sector-precio">$${sector.precio}</span>
      </div>
      <p class="sector-disponibilidad ${claseDisponibilidad(sector.disponibilidad)}">
        Disponibilidad: ${sector.disponibilidad}
      </p>
      <ul class="sector-detalles">
        <li><strong>Ubicación:</strong> ${sector.ubicacion}</li>
        <li><strong>Capacidad:</strong> ${sector.capacidad.toLocaleString("es-AR")} personas</li>
        <li><strong>Beneficios:</strong> ${sector.beneficios}</li>
      </ul>
      ${seleccionado
        ? `<p class="sector-seleccionado-msg">Sector seleccionado ✔</p>`
        : preview
          ? `<p class="sector-hint">Click para seleccionar este sector</p>`
          : ""}
    </div>
  `;
}

function mostrarPlaceholder() {
  infoSector.innerHTML = `
    <div class="sector-card sector-card--placeholder">
      <p class="placeholder-icon">🏟️</p>
      <h3>Elegí tu sector</h3>
      <p>Pasá el mouse sobre las tribunas del mapa para ver precio, ubicación y beneficios de cada sector.</p>
      <p class="sector-hint">Hacé click en un sector para seleccionarlo antes de comprar.</p>
    </div>
  `;
}

function mostrarInfo(sector, preview = true) {
  infoSector.innerHTML = renderSectorCard(sector, {
    seleccionado: sectorActivo?.id === sector.id,
    preview
  });
}

function actualizarClasesMapa() {
  sectores.forEach(s => {
    const grupo = document.getElementById(s.id);
    if (!grupo) return;

    grupo.classList.toggle("sector-hover", sectorHover?.id === s.id);
    grupo.classList.toggle("sector-activo", sectorActivo?.id === s.id);
  });

  leyendaMapa?.querySelectorAll(".leyenda-item").forEach(btn => {
    btn.classList.toggle("leyenda-activa", sectorActivo?.id === btn.dataset.sector);
    btn.classList.toggle("leyenda-hover", sectorHover?.id === btn.dataset.sector);
  });
}

function resaltarHover(sector) {
  sectorHover = sector;
  actualizarClasesMapa();
  mostrarInfo(sector, true);
}

function quitarHover() {
  sectorHover = null;
  actualizarClasesMapa();

  if (sectorActivo) {
    mostrarInfo(sectorActivo, false);
  } else {
    mostrarPlaceholder();
  }
}

function seleccionarSector(sector) {
  sectorActivo = sector;
  localStorage.setItem("sectorSeleccionado", JSON.stringify(sector));
  actualizarClasesMapa();
  mostrarInfo(sector, false);

  const acciones = document.querySelector(".acciones");
  if (acciones) {
    acciones.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function restaurarSectorGuardado() {
  const guardado = JSON.parse(localStorage.getItem("sectorSeleccionado"));
  if (!guardado) {
    mostrarPlaceholder();
    return;
  }

  const sector = sectores.find(s => s.id === guardado.id) || guardado;
  seleccionarSector(sector);
}

renderMapa();
restaurarSectorGuardado();

window.addEventListener("DOMContentLoaded", async () => {
  if (mapaSection) {
    setTimeout(() => {
      mapaSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }
  const partido = await apiFetch(`/Partido/${idPartido}`);

  if (partido && contenedorDetalle) {
    mostrarDetalle(partido, contenedorDetalle);
    localStorage.setItem("partidoActual", JSON.stringify(partido));
  }
});


btnComprar.addEventListener("click", () => {
  if (!sectorActivo) {
    alert("Seleccione un sector en el mapa antes de continuar");
    return;
  }

  localStorage.setItem("partidoPendiente", idPartido);

  // Requerimiento actual: siempre pasar por login/registro luego de elegir sector.
 const token = localStorage.getItem("jwt_token");
    if (token) {
      // Ya logueado → ir directo a compra/pago
      window.location.href = `compra.html?id=${idPartido}`;
    } else {
      // No logueado → pedir login
      window.location.href = "login.html";
    }

});
