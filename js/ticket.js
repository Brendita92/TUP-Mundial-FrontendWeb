const ticketInfo = document.getElementById("ticket-info");

const compra = JSON.parse(localStorage.getItem("ultimaCompra") || "null");
const ticketIdGuardado = localStorage.getItem("ticketId");
const codigoQrGuardado = localStorage.getItem("ticketCodigoQr");
const token = localStorage.getItem("jwt_token");

function formatFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-AR");
}

function getEstadoClass(estado) {
  const e = (estado || "").toLowerCase();
  if (e.includes("vend")) return "ticket-badge ticket-badge--vendido";
  if (e.includes("reserv")) return "ticket-badge ticket-badge--reservado";
  if (e.includes("usad")) return "ticket-badge ticket-badge--usado";
  return "ticket-badge";
}

function mostrarMensajeSimple(msg) {
  if (!ticketInfo) return;
  ticketInfo.innerHTML = `<p>${msg}</p>`;
}

function renderFallbackDesdeCompra(reason = "") {
  if (!ticketInfo) return;

  if (!compra) {
    mostrarMensajeSimple("No existe información del ticket.");
    return;
  }

  const codigoTicket = `FIFA-${String(compra.compraId || Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
  const estado = compra.estado || "Confirmada";
  const estadoClass = getEstadoClass(estado);

  ticketInfo.innerHTML = `
    ${reason ? `<p style="color:#b45309;"><strong>Aviso:</strong> ${reason}</p>` : ""}
    <p><strong>Código:</strong> ${codigoTicket}</p>
    <p><strong>Email:</strong> ${compra.email || "-"}</p>
    <p><strong>Partido:</strong> ${compra.partido || `ID ${compra.partidoId || "-"}`}</p>
    <p><strong>Fecha partido:</strong> ${compra.fechaPartido || "-"}</p>
    <p><strong>Estadio:</strong> ${compra.estadio || "-"}</p>
    <p><strong>Sector:</strong> ${compra.sector || "-"}</p>
    <p><strong>Cantidad:</strong> ${compra.cantidad || "-"}</p>
    <p><strong>Total:</strong> $${compra.total ?? "-"}</p>
    <p><strong>Fecha compra:</strong> ${formatFecha(compra.fechaCompra)}</p>
    <p><strong>Estado:</strong> <span class="${estadoClass}">${estado}</span></p>
    ${
      String(estado).toLowerCase().includes("pend")
        ? `<p style="color:#92400e;"><strong>Compra pendiente:</strong> tus entradas están reservadas hasta acreditar la transferencia.</p>`
        : ""
    }
  `;
}

function normalizarTicketApi(data) {
  if (!data || typeof data !== "object") return null;

  return {
    id: data.id ?? data.Id ?? null,
    codigoQr: data.codigoQr ?? data.CodigoQr ?? "",
    estado: data.estado ?? data.Estado ?? "Vendido",
    sector: data.sector ?? data.Sector ?? "-",
    fila: data.fila ?? data.Fila ?? "-",
    asiento: data.asiento ?? data.Asiento ?? "-",
    precio: data.precio ?? data.Precio ?? "-",
    fechaEmision: data.fechaEmision ?? data.FechaEmision ?? null,
    partidoId: data.partidoId ?? data.PartidoId ?? compra?.partidoId ?? null,
    partidoNombre:
      data.partidoNombre ??
      data.PartidoNombre ??
      compra?.partido ??
      (data.partidoId || data.PartidoId ? `ID ${data.partidoId || data.PartidoId}` : "-"),
    email: compra?.email || localStorage.getItem("usuarioEmail") || "-",
    fechaPartido: compra?.fechaPartido || "-",
    estadio: compra?.estadio || "-",
    total: compra?.total ?? data.precio ?? data.Precio ?? "-",
    cantidad: compra?.cantidad ?? 1,
  };
}

function renderTicketApi(ticket) {
  if (!ticketInfo) return;

  const estadoClass = getEstadoClass(ticket.estado);
  const qrUrl = `${API_URL}/Ticket/${ticket.id}/qr`;
  const filaVisible =
    ticket.fila && ticket.fila !== "-" && ticket.fila !== "AUTO"
      ? ticket.fila
      : "Asignada por sistema";
  const asientoVisible =
    ticket.asiento &&
    ticket.asiento !== "-" &&
    !String(ticket.asiento).toUpperCase().startsWith("AUTO-")
      ? ticket.asiento
      : "Asignado aleatoriamente por sistema";

  ticketInfo.innerHTML = `
    <p><strong>Código QR:</strong> ${ticket.codigoQr || "-"}</p>
    <p><strong>Email:</strong> ${ticket.email}</p>
    <p><strong>Partido:</strong> ${ticket.partidoNombre}</p>
    <p><strong>Fecha partido:</strong> ${ticket.fechaPartido}</p>
    <p><strong>Estadio:</strong> ${ticket.estadio}</p>
    <p><strong>Sector:</strong> ${ticket.sector}</p>
    <p><strong>Fila:</strong> ${filaVisible}</p>
    <p><strong>Asiento:</strong> ${asientoVisible}</p>
    <p><strong>Cantidad:</strong> ${ticket.cantidad}</p>
    <p><strong>Total:</strong> $${ticket.total}</p>
    <p><strong>Fecha emisión:</strong> ${formatFecha(ticket.fechaEmision)}</p>
    <p><strong>Estado:</strong> <span class="${estadoClass}">${ticket.estado}</span></p>
    ${
      String(ticket.estado).toLowerCase().includes("reserv")
        ? `<p style="color:#92400e;"><strong>Pendiente de acreditación:</strong> tu entrada está reservada temporalmente.</p>`
        : ""
    }
    <div class="ticket-qr-wrap">
      <p><strong>QR real:</strong></p>
      <img class="ticket-qr-img" src="${qrUrl}" alt="QR Ticket ${ticket.id}" />
    </div>
  `;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

async function obtenerTicketReal() {
  try {
    // 1) Ticket por ID guardado
    if (ticketIdGuardado) {
      const data = await fetchJson(`${API_URL}/Ticket/${ticketIdGuardado}`);
      const ticket = normalizarTicketApi(data);
      if (ticket?.id) return ticket;
    }

    // 2) Ticket por código QR guardado
    if (codigoQrGuardado) {
      const data = await fetchJson(`${API_URL}/Ticket/codigoqr/${encodeURIComponent(codigoQrGuardado)}`);
      const ticket = normalizarTicketApi(data);
      if (ticket?.id) return ticket;
    }

    return null;
  } catch (error) {
    if (error.status === 404) {
      renderFallbackDesdeCompra("Ticket no encontrado en el backend. Se muestra información local.");
      return "__already_rendered__";
    }

    if (error.status === 401 || error.status === 403) {
      renderFallbackDesdeCompra("Tu sesión expiró. Iniciá sesión nuevamente para ver ticket actualizado.");
      return "__already_rendered__";
    }

    console.error("[Ticket] Error al obtener ticket real:", error);
    return null;
  }
}

async function initTicket() {
  if (!ticketInfo) return;

  const ticketReal = await obtenerTicketReal();

  if (ticketReal === "__already_rendered__") {
    return;
  }

  if (ticketReal) {
    renderTicketApi(ticketReal);
    localStorage.setItem("ticketId", String(ticketReal.id));
    if (ticketReal.codigoQr) localStorage.setItem("ticketCodigoQr", ticketReal.codigoQr);
  } else {
    renderFallbackDesdeCompra();
  }
}

function salirDeLaSesion() {
  localStorage.clear();
  sessionStorage.removeItem("flowLoggedIn");
  window.location.href = "index.html";
}

window.salirDeLaSesion = salirDeLaSesion;

initTicket();

localStorage.removeItem("partidoPendiente");
localStorage.removeItem("sectorSeleccionado");
