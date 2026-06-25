const API_URL = "https://localhost:7103/api"; // ajusta según tu backend

// Código FIFA (nombre del SVG) ↔ nombre del equipo en español
const CODIGOS_EQUIPOS = {
  ALG: "Argelia",
  ARG: "Argentina",
  AUS: "Australia",
  AUT: "Austria",
  BEL: "Belgica",
  BIH: "Bosnia",
  BRA: "Brasil",
  CAN: "Canada",
  CIV: "Costa de Marfil",
  COD: "Congo",
  COL: "Colombia",
  CPV: "Cabo Verde",
  CRO: "Croacia",
  CUR: "Curazao",
  CZE: "Republica Checa",
  ECU: "Ecuador",
  EGY: "Egipto",
  ENG: "Inglaterra",
  ESP: "Espana",
  FRA: "Francia",
  GER: "Alemania",
  GHA: "Ghana",
  HAI: "Haiti",
  IRN: "Iran",
  IRQ: "Irak",
  JAP: "Japon",
  JOR: "Jordania",
  KOR: "Corea del Sur",
  KSA: "Arabia Saudita",
  MAR: "Marruecos",
  MEX: "Mexico",
  NED: "Paises Bajos",
  NOR: "Noruega",
  NZL: "Nueva Zelanda",
  PAN: "Panama",
  PAR: "Paraguay",
  POR: "Portugal",
  QAT: "Catar",
  RSA: "Sudafrica",
  SCO: "Escocia",
  SEN: "Senegal",
  SUI: "Suiza",
  SWE: "Suecia",
  TUN: "Tunez",
  TUR: "Turquia",
  URU: "Uruguay",
  USA: "Estados Unidos",
  UZB: "Uzbekistan"
};

const ALIAS_EQUIPOS = {
  algeria: "ALG",
  alemania: "GER",
  arabia: "KSA",
  "arabia saudita": "KSA",
  "arabia saudí": "KSA",
  argelia: "ALG",
  argentina: "ARG",
  australia: "AUS",
  austria: "AUT",
  belgica: "BEL",
  "bélgica": "BEL",
  bosnia: "BIH",
  brasil: "BRA",
  brazil: "BRA",
  canada: "CAN",
  "canadá": "CAN",
  "cabo verde": "CPV",
  catar: "QAT",
  chequia: "CZE",
  colombia: "COL",
  congo: "COD",
  "corea del sur": "KOR",
  "costa de marfil": "CIV",
  croacia: "CRO",
  curazao: "CUR",
  "curaçao": "CUR",
  ecuador: "ECU",
  egipto: "EGY",
  escocia: "SCO",
  espana: "ESP",
  "españa": "ESP",
  spain: "ESP",
  "estados unidos": "USA",
  usa: "USA",
  eua: "USA",
  francia: "FRA",
  france: "FRA",
  ghana: "GHA",
  haiti: "HAI",
  "haití": "HAI",
  holanda: "NED",
  inglaterra: "ENG",
  england: "ENG",
  irak: "IRQ",
  iran: "IRN",
  "irán": "IRN",
  japon: "JAP",
  "japón": "JAP",
  japan: "JAP",
  jordania: "JOR",
  marruecos: "MAR",
  mexico: "MEX",
  "méxico": "MEX",
  "nueva zelanda": "NZL",
  noruega: "NOR",
  "paises bajos": "NED",
  "países bajos": "NED",
  panama: "PAN",
  "panamá": "PAN",
  paraguay: "PAR",
  portugal: "POR",
  "republica checa": "CZE",
  "república checa": "CZE",
  senegal: "SEN",
  sudafrica: "RSA",
  "sudáfrica": "RSA",
  suiza: "SUI",
  suecia: "SWE",
  tunez: "TUN",
  "túnez": "TUN",
  turquia: "TUR",
  "turquía": "TUR",
  uruguay: "URU",
  uzbekistan: "UZB",
  "uzbekistán": "UZB"
};

const LOGO_FALLBACK = "img/flags/logo-mundial-2026-v3.svg";

function normalizarNombreEquipo(nombre) {
  return String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

function obtenerCodigoEquipo(nombre) {
  if (!nombre) return null;

  const limpio = nombre.trim();
  if (/^[A-Za-z]{3}$/.test(limpio)) return limpio.toUpperCase();

  const normalizado = normalizarNombreEquipo(limpio);
  if (ALIAS_EQUIPOS[normalizado]) return ALIAS_EQUIPOS[normalizado];

  for (const [codigo, nombreOficial] of Object.entries(CODIGOS_EQUIPOS)) {
    if (normalizarNombreEquipo(nombreOficial) === normalizado) return codigo;
  }

  return null;
}

function obtenerNombreEquipo(valor) {
  if (!valor) return null;

  const limpio = valor.trim();
  if (/^[A-Za-z]{3}$/.test(limpio)) {
    return CODIGOS_EQUIPOS[limpio.toUpperCase()] || null;
  }

  const codigo = obtenerCodigoEquipo(limpio);
  return codigo ? CODIGOS_EQUIPOS[codigo] : limpio;
}

function obtenerLogoEquipo(nombreEquipo) {
  const codigo = obtenerCodigoEquipo(nombreEquipo);
  return codigo ? `img/flags/${codigo}.svg` : LOGO_FALLBACK;
}

function obtenerEquiposParaFiltro() {
  return Object.entries(CODIGOS_EQUIPOS)
    .map(([codigo, nombre]) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}


function mostrarToast(tipo, mensaje) {
  const toastId = "toast-mundial";
  const existente = document.getElementById(toastId);
  if (existente) existente.remove();

  const toast = document.createElement("div");
  toast.id = toastId;
  toast.textContent = mensaje;
  toast.style.position = "fixed";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.bottom = "20px";
  toast.style.background = tipo === "error" ? "#dc2626" : "#047857";
  toast.style.color = "#fff";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "12px";
  toast.style.fontWeight = "700";
  toast.style.zIndex = "10000";
  toast.style.boxShadow = "0 10px 24px rgba(0,0,0,0.25)";
  toast.style.maxWidth = "90vw";
  toast.style.textAlign = "center";
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// Función maestra para API
async function apiFetch(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error("Error en la respuesta");
    return await response.json();
  } catch (error) {
    console.error("Error al conectar con la API:", error);
    return []; // fallback
  }
}

async function apiFetchAuth(endpoint, options = {}) {
  const token = localStorage.getItem("jwt_token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}


function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR");
}

function nombrePartido(partido) {
  const local = partido.local || "Local";
  const visitante = partido.visitante || "Visitante";
  return `${local} vs ${visitante}`;
}


function buscarPartidoDemo(id) {
  return null;
}

const SECTORES_DEMO = [

  {
    id: "popular",
    nombre: "Popular",
    precio: 50,
    disponibilidad: "Alta",
    color: "#f4a261",
    ubicacion: "Detrás del arco",
    capacidad: 5000,
    beneficios: "Vista general, ambiente popular"
  },
  {
    id: "platea",
    nombre: "Platea",
    precio: 120,
    disponibilidad: "Media",
    color: "#2a9d8f",
    ubicacion: "Lateral del campo",
    capacidad: 3000,
    beneficios: "Asientos numerados, mejor visibilidad"
  },
  {
    id: "vip",
    nombre: "VIP",
    precio: 250,
    disponibilidad: "Baja",
    color: "#e76f51",
    ubicacion: "Centro, frente al campo",
    capacidad: 500,
    beneficios: "Catering, acceso exclusivo"
  }
];

function obtenerSectoresDemo() {
  return SECTORES_DEMO;
}

function mostrarPartidos(partidos, contenedor) {
  contenedor.innerHTML = "";
  partidos.forEach(p => {
    const card = document.createElement("div");
    card.className = "card partido-card";
    const idSeguro = p.id;

    const logoLocal = obtenerLogoEquipo(p.local);
    const logoVisitante = obtenerLogoEquipo(p.visitante);

    card.innerHTML = `
      <div class="equipos">
        <img src="${logoLocal}" alt="${p.local}" class="logo-equipo">
        <span>vs</span>
        <img src="${logoVisitante}" alt="${p.visitante}" class="logo-equipo">
      </div>
      <h3>${nombrePartido(p)}</h3>
      <p>${formatearFecha(p.fecha)} - ${p.hora}</p>
      <p>${p.estadio ?? "Sin Estadio"}</p>
      <a class="button-link" href="detalle.html?id=${idSeguro}">Comprar Entradas</a>
    `;
    contenedor.appendChild(card);
  });
}


function mostrarDetalle(partido, contenedor) {
  if (!partido) return;

  //localStorage.setItem("partidoActual", JSON.stringify(partido));

  const logoLocal = obtenerLogoEquipo(partido.local);
  const logoVisitante = obtenerLogoEquipo(partido.visitante);


contenedor.innerHTML = `
    <div class="detalle-card">

      <div class="equipos">
        <img src="${logoLocal}" alt="${partido.local}" class="logo-equipo">

        <span>vs</span>

        <img src="${logoVisitante}" alt="${partido.visitante}" class="logo-equipo">
      </div>

      <h2>${partido.local} vs ${partido.visitante}</h2>

      <p><strong>Fecha:</strong> ${formatearFecha(partido.fecha)}</p>

      <p><strong>Hora:</strong> ${partido.hora}</p>

      <p><strong>Torneo:</strong> ${partido.torneo}</p>

      <p><strong>Fase:</strong> ${partido.fase}</p>

      <p><strong>Estadio:</strong> ${partido.estadio}</p>

      <p><strong>Zona Horaria:</strong> ${partido.zonaHoraria}</p>

    </div>
  `;
}

function mostrarPartidoCompra(partido, contenedor) {
  if (!partido) return;

  const logoLocal = obtenerLogoEquipo(partido.local);
  const logoVisitante = obtenerLogoEquipo(partido.visitante);

  contenedor.innerHTML = `
    <div class="detalle-card">
      <div class="equipos">
        <img src="${logoLocal}" alt="${partido.local}" class="logo-equipo">
        <span>vs</span>
        <img src="${logoVisitante}" alt="${partido.visitante}" class="logo-equipo">
      </div>
      <h2>${nombrePartido(partido)}</h2>
      <p>${formatearFecha(partido.fecha)} - ${partido.hora}</p>
      <p>${partido.estadio?.nombre || partido.estadio || "Sin estadio"}</p>
    </div>
  `;
}

function calcularTotal(sectorSelector, cantidadInput, totalElem) {
  const sector = document.querySelector(sectorSelector + ":checked");
  if (!sector) {
    totalElem.textContent = "$0";
    return;
  }
  const precio = Number(sector.dataset.precio);
  totalElem.textContent = "$" + (precio * Number(cantidadInput.value));
}

function obtenerRoles() {
  try {
    const raw = localStorage.getItem("roles");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function esAdmin() {
  return obtenerRoles().includes("Administrador");
}

function esUsuario() {
  return obtenerRoles().includes("Usuario");
}

function requireAdminOrRedirect() {
  if (!esAdmin()) {
    alert("Acceso denegado");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

window.mostrarToast = mostrarToast;
window.apiFetchAuth = apiFetchAuth;
window.obtenerRoles = obtenerRoles;
window.esAdmin = esAdmin;
window.esUsuario = esUsuario;
window.requireAdminOrRedirect = requireAdminOrRedirect;

