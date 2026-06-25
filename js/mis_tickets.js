const listado = document.getElementById("mis-entradas-listado");
const token = localStorage.getItem("jwt_token");
const usuarioId = localStorage.getItem("usuarioId");

function formatFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-AR");
}

function getEstadoClass(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("pag") || e.includes("activ") || e.includes("confirm")) {
    return "ticket-badge ticket-badge--vendido";
  }
  if (e.includes("reserv") || e.includes("pend")) {
    return "ticket-badge ticket-badge--reservado";
  }
  if (e.includes("usad")) {
    return "ticket-badge ticket-badge--usado";
  }
  return "ticket-badge";
}

function renderMensaje(msg) {
  if (!listado) return;
  listado.innerHTML = `<p class="mis-entradas-empty">${msg}</p>`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

function renderTicket(compra, ticket) {
  const qrUrl = `${API_URL}/Ticket/${ticket.id}/qr`;
  const estadoClass = getEstadoClass(ticket.estado);

  return `
    <article class="ticket-item">
      <div class="ticket-item-main">
        <p><strong>Partido:</strong> ${ticket.partidoInfo || `Partido ID ${ticket.partidoId || "-"}`}</p>
        <p><strong>Sector:</strong> ${ticket.sector || "-"}</p>
        <p><strong>Fila:</strong> ${ticket.fila || "-"}</p>
        <p><strong>Asiento:</strong> ${ticket.asiento || "-"}</p>
        <p><strong>Precio:</strong> $${ticket.precio ?? "-"}</p>
        <p><strong>Estado:</strong> <span class="${estadoClass}">${ticket.estado || "-"}</span></p>
        <p><strong>Fecha de emisión:</strong> ${formatFecha(ticket.fechaEmision)}</p>
        <p><strong>Compra #:</strong> ${compra.id || "-"}</p>
      </div>
      <div class="ticket-item-qr">
        <p><strong>QR</strong></p>
        <img
          src="${qrUrl}"
          alt="QR Ticket ${ticket.id}"
          class="ticket-qr-img"
          onerror="this.onerror=null;this.src='img/logo.jpg';this.classList.add('ticket-qr-fallback');"
        />
      </div>
    </article>
  `;
}

async function cargarMisEntradas() {
  if (!usuarioId) {
    renderMensaje("Debes iniciar sesión para ver tus entradas.");
    return;
  }

  if (!listado) return;

  listado.innerHTML = "<p>Cargando entradas...</p>";

  try {
    const comprasBasicas = await fetchJson(`${API_URL}/Compra/usuario/${usuarioId}`);
    const compras = Array.isArray(comprasBasicas) ? comprasBasicas : [];

    if (!compras.length) {
      renderMensaje("Todavía no tienes entradas registradas.");
      return;
    }

    const detalles = await Promise.all(
      compras.map(async (compra) => {
        try {
          return await fetchJson(`${API_URL}/Compra/${compra.id ?? compra.Id}`);
        } catch (e) {
          console.error("Error al obtener detalle de compra", compra, e);
          return null;
        }
      })
    );

    const detallesValidos = detalles.filter(Boolean);

    if (!detallesValidos.length) {
      renderMensaje("Todavía no tienes entradas registradas.");
      return;
    }

    const ticketsHtml = [];

    detallesValidos.forEach((compra) => {
      const tickets = compra.tickets || compra.Tickets || [];
      tickets.forEach((ticket) => {
        ticketsHtml.push(
          renderTicket(
            {
              id: compra.id ?? compra.Id,
            },
            {
              id: ticket.id ?? ticket.Id,
              partidoInfo: ticket.partidoInfo ?? ticket.PartidoInfo,
              partidoId: ticket.partidoId ?? ticket.PartidoId,
              sector: ticket.sector ?? ticket.Sector,
              fila: ticket.fila ?? ticket.Fila,
              asiento: ticket.asiento ?? ticket.Asiento,
              precio: ticket.precio ?? ticket.Precio,
              estado: ticket.estado ?? ticket.Estado,
              fechaEmision: ticket.fechaEmision ?? ticket.FechaEmision,
            }
          )
        );
      });
    });

    if (!ticketsHtml.length) {
      renderMensaje("Todavía no tienes entradas registradas.");
      return;
    }

    listado.innerHTML = `<div class="tickets-grid">${ticketsHtml.join("")}</div>`;
  } catch (error) {
    console.error("[Mis Entradas] Error:", error);

    if (error.status === 401 || error.status === 403) {
      renderMensaje("Tu sesión expiró. Iniciá sesión nuevamente.");
      return;
    }

    renderMensaje("No fue posible cargar tus entradas en este momento.");
  }
}

cargarMisEntradas();
