const idPartidoCompra =
  new URLSearchParams(window.location.search).get("id") ||
  localStorage.getItem("partidoPendiente");

const infoPartido = document.getElementById("info-partido");
const resumenCompra = document.getElementById("resumen-compra");
const total = document.getElementById("total");
const btnContinuar = document.getElementById("btnContinuar");
const cantidadInput = document.getElementById("cantidad");
const cantidadError = document.getElementById("cantidad-error");
const tarjetaForm = document.getElementById("tarjeta-form");
const tarjetaError = document.getElementById("tarjeta-error");
const btnConfirmarTarjeta = document.getElementById("btnConfirmarTarjeta");
const tarjetaConfirmadaMsg = document.getElementById("tarjeta-confirmada-msg");
const tarjetaNumeroInput = document.getElementById("tarjeta-numero");
const tarjetaTitularInput = document.getElementById("tarjeta-titular");
const tarjetaVencimientoInput = document.getElementById("tarjeta-vencimiento");
const tarjetaCvvInput = document.getElementById("tarjeta-cvv");

let tarjetaConfirmada = false;

const partido =
  JSON.parse(localStorage.getItem("partidoActual")) ||
  buscarPartidoDemo(idPartidoCompra);

const sectorGuardado = JSON.parse(localStorage.getItem("sectorSeleccionado"));
const sectores = obtenerSectoresDemo();

const sectorSeleccionado =
  sectorGuardado || sectores.find((s) => s.id === "popular") || sectores[0];

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

function normalizarCantidad(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

function obtenerMetodoPagoSeleccionado() {
  const seleccionado = document.querySelector('input[name="medioPago"]:checked');
  if (!seleccionado) return null;

  const map = {
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
  };

  return map[seleccionado.value] || null;
}

function validarDatosTarjeta() {
  const numero = (tarjetaNumeroInput?.value || "").replace(/\s+/g, "");
  const titular = (tarjetaTitularInput?.value || "").trim();
  const vencimiento = (tarjetaVencimientoInput?.value || "").trim();
  const cvv = (tarjetaCvvInput?.value || "").trim();

  if (!/^\d{13,19}$/.test(numero)) {
    return "Ingresá un número de tarjeta válido (13 a 19 dígitos).";
  }

  if (titular.length < 3) {
    return "Ingresá el nombre del titular como figura en la tarjeta.";
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) {
    return "Ingresá una fecha de vencimiento válida en formato MM/AA.";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return "Ingresá un CVV válido (3 o 4 dígitos).";
  }

  return null;
}

function resetConfirmacionTarjeta() {
  tarjetaConfirmada = false;
  if (tarjetaConfirmadaMsg) tarjetaConfirmadaMsg.classList.add("hidden");
}

function actualizarResumenYTotal() {
  if (!sectorSeleccionado) return;

  const cantidad = normalizarCantidad(cantidadInput?.value) || 1;
  const totalCalculado = sectorSeleccionado.precio * cantidad;

  if (resumenCompra) {
    resumenCompra.innerHTML = `
      <p><strong>Sector seleccionado:</strong> ${sectorSeleccionado.nombre}</p>
      <p><strong>Cantidad:</strong> ${cantidad}</p>
      <p><strong>Precio unitario:</strong> $${sectorSeleccionado.precio}</p>
      <p><strong>Ubicación:</strong> ${sectorSeleccionado.ubicacion || "Se asigna automáticamente"}</p>
      <p><strong>Asiento:</strong> Asignado aleatoriamente al confirmar</p>
    `;
  }

  if (total) {
    total.textContent = `$${totalCalculado}`;
  }
}

async function crearCompraReal() {
  if (!sectorSeleccionado) {
    mostrarToast("error", "No hay sector seleccionado.");
    return;
  }

  const cantidad = normalizarCantidad(cantidadInput?.value);
  if (!cantidad) {
    if (cantidadError) cantidadError.textContent = "La cantidad debe estar entre 1 y 10.";
    mostrarToast("error", "Cantidad inválida. Debe ser de 1 a 10.");
    return;
  } else if (cantidadError) {
    cantidadError.textContent = "";
  }

  const metodoPago = obtenerMetodoPagoSeleccionado();
  if (!metodoPago) {
    mostrarToast("error", "Seleccioná un medio de pago válido (Tarjeta o Transferencia).");
    return;
  }

  if (metodoPago === "Tarjeta" && !tarjetaConfirmada) {
    mostrarToast("error", "Primero confirmá los datos de la tarjeta.");
    return;
  }

  const usuarioId = Number(localStorage.getItem("usuarioId"));
  if (!usuarioId) {
    mostrarToast("error", "Debés iniciar sesión para continuar.");
    window.location.href = "login.html";
    return;
  }

  const partidoId = Number(idPartidoCompra);
  if (!partidoId) {
    mostrarToast("error", "No se encontró el partido seleccionado.");
    return;
  }

  const precioUnitario = Number(sectorSeleccionado.precio) || 0;
  const monto = precioUnitario * cantidad;

  const baseAsiento = `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const tickets = Array.from({ length: cantidad }, (_, i) => ({
    partidoId,
    sector: sectorSeleccionado.nombre,
    fila: "AUTO",
    asiento: `${baseAsiento}-${i + 1}`,
    precio: precioUnitario,
  }));

  const estadoPago = metodoPago === "Transferencia" ? "Pendiente" : "Aprobado";

  const payload = {
    usuarioId,
    pago: {
      metodoPago: metodoPago,
      estadoPago,
      monto,
    },
    tickets,
  };

  try {
    btnContinuar.disabled = true;

    const token = localStorage.getItem("jwt_token");

    const response = await fetch(`${API_URL}/Compra/crear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = (data?.mensaje || data?.Message || "No se pudo registrar la compra.").toString();
      const msgLower = msg.toLowerCase();

      if (response.status === 401 || response.status === 403) {
        throw new Error("Tu sesión expiró o no estás autorizado. Iniciá sesión nuevamente.");
      }
      if (msgLower.includes("capacidad") || msgLower.includes("disponible")) {
        throw new Error(msg);
      }
      if (msgLower.includes("asiento") && (msgLower.includes("reservado") || msgLower.includes("vendido"))) {
        throw new Error(msg);
      }
      if (msgLower.includes("método") || msgLower.includes("metodo") || msgLower.includes("soportado")) {
        throw new Error("El método de pago seleccionado no está soportado.");
      }

      throw new Error(msg);
    }

    const compraGuardada = {
      compraId: data.id || data.Id || null,
      estado: data.estado || data.Estado || "Confirmada",
      fechaCompra: (data.fecha || data.Fecha || new Date().toISOString()),
      usuarioId,
      email: localStorage.getItem("usuarioEmail") || "",
      partidoId,
      partido: partido ? nombrePartido(partido) : `Partido ${partidoId}`,
      fechaPartido: partido?.fecha ? formatearFecha(partido.fecha) : "",
      estadio: partido?.estadio || "",
      sector: sectorSeleccionado.nombre,
      cantidad,
      precioUnitario,
      total: monto,
      metodoPago,
    };

    localStorage.setItem("ultimaCompra", JSON.stringify(compraGuardada));

    if (metodoPago === "Transferencia") {
      mostrarToast(
        "success",
        "Compra pendiente: tus entradas quedaron reservadas. La ubicación exacta se asigna automáticamente al confirmar la acreditación."
      );
    } else {
      mostrarToast(
        "success",
        "Compra confirmada y pago aprobado. La ubicación exacta se asignó automáticamente."
      );
    }

    window.location.href = "ticket.html";
  } catch (error) {
    console.error("[Compra] Error:", error);
    mostrarToast("error", error.message || "Error al confirmar la compra.");
  } finally {
    btnContinuar.disabled = false;
  }
}

if (partido) {
  mostrarPartidoCompra(partido, infoPartido);
}

if (cantidadInput) {
  cantidadInput.addEventListener("input", () => {
    const soloDigitos = (cantidadInput.value || "").replace(/[^\d]/g, "");
    cantidadInput.value = soloDigitos;

    const cantidad = normalizarCantidad(cantidadInput.value);
    if (!cantidad && cantidadInput.value !== "") {
      if (cantidadError) cantidadError.textContent = "La cantidad debe estar entre 1 y 10.";
    } else if (cantidadError) {
      cantidadError.textContent = "";
    }
    actualizarResumenYTotal();
  });
}

const mediosPagoInputs = document.querySelectorAll('input[name="medioPago"]');
mediosPagoInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const metodo = obtenerMetodoPagoSeleccionado();
    const esTarjeta = metodo === "Tarjeta";

    if (tarjetaForm) tarjetaForm.classList.toggle("hidden", !esTarjeta);

    if (!esTarjeta) {
      resetConfirmacionTarjeta();
      if (tarjetaError) tarjetaError.textContent = "";
    } else {
      resetConfirmacionTarjeta();
    }
  });
});

btnConfirmarTarjeta?.addEventListener("click", () => {
  const error = validarDatosTarjeta();
  if (error) {
    tarjetaConfirmada = false;
    if (tarjetaError) tarjetaError.textContent = error;
    if (tarjetaConfirmadaMsg) tarjetaConfirmadaMsg.classList.add("hidden");
    mostrarToast("error", error);
    return;
  }

  if (tarjetaError) tarjetaError.textContent = "";
  tarjetaConfirmada = true;
  if (tarjetaConfirmadaMsg) tarjetaConfirmadaMsg.classList.remove("hidden");
  mostrarToast("success", "Tarjeta confirmada. Ahora podés confirmar la compra.");
});

actualizarResumenYTotal();

btnContinuar?.addEventListener("click", crearCompraReal);
