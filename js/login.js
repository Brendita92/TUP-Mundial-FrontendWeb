const btnLogin = document.getElementById("btnLogin");

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function authRegistrar({ nombre, apellido, mail, contrasena }) {
  // RegistroRequestDto: (string Nombre, string Apellido, string Email, string Password)
  const registroRequest = {
    nombre,
    apellido,
    email: mail,
    password: contrasena,
  };
  
  const responseRegistro = await fetch(`${API_URL}/auth/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registroRequest),
  });

  const dataRegistro = await responseRegistro.json().catch(() => ({}));

  console.log("Status:", responseRegistro.status, "Respuesta:", dataRegistro);

  if (!responseRegistro.ok) {
    throw new Error(dataRegistro.mensaje || "Error de Registro");
  }

  return dataRegistro;
}

async function authLogin({ mail, contrasena }) {
  const responseLogin = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Email: mail,
      Password: contrasena,
    }),
  });

  const dataLogin = await responseLogin.json().catch(() => ({}));

  if (!responseLogin.ok) {
    throw new Error(dataLogin.mensaje || "Error al iniciar sesión");
  }

  // LoginResponseDto(string Token, string Email, List<string> Roles)
  const token = dataLogin.Token || dataLogin.token;
  if (token) localStorage.setItem("jwt_token", token);

  return dataLogin;
}

btnLogin.addEventListener("click", async () => {
  const nombre = getValue("nombre");
  const apellido = getValue("apellido");
  const mail = getValue("mail");
  const contrasena = getValue("password");

  // Para Login, el backend solo necesita Email/Password.
  // Pero este HTML representa el registro, por eso pedimos todos.
  if (!nombre || !apellido || !mail || !contrasena) {
    alert("Complete nombre, apellido, correo y contraseña");
    return;
  }

  try {
    const dataRegistro = await authRegistrar({ nombre, apellido, mail, contrasena });
    alert(dataRegistro.mensaje || "¡Registro exitoso! Ahora ingresá con tus datos.");

    // Guardar para mostrar el panel (modal)
    mostrarPanelIngreso(mail, contrasena);

  } catch (errorRegistro) {
    console.error("Error de Registro:", errorRegistro);
    alert(errorRegistro.message || "Error de Registro");
  }
});

function mostrarPanelIngreso(mail, contrasena) {
  const idModal = "authIngresoModal";
  const existe = document.getElementById(idModal);
  if (existe) existe.remove();

  const modal = document.createElement("div");
  modal.id = idModal;
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.45)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  const card = document.createElement("div");
  card.style.background = "#fff";
  card.style.borderRadius = "12px";
  card.style.padding = "20px";
  card.style.width = "min(520px, 90vw)";

  card.innerHTML = `
    <h3 style="margin-top:0">Ingresar</h3>
    <p>Se registró correctamente. Para continuar con la compra, ingresá con el correo y contraseña:</p>
    <p><strong>Email:</strong> ${mail}</p>
    <p><strong>Contraseña:</strong> (oculta)</p>
    <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:16px;">
      <button type="button" id="btnCerrarModal" style="padding:10px 14px; border:1px solid #ccc; background:#fff; border-radius:10px; cursor:pointer;">Volver</button>
      <button type="button" id="btnConfirmarIngreso" style="padding:10px 14px; border:none; background:#0b5ed7; color:#fff; border-radius:10px; cursor:pointer;">Ingresar y Confirmar</button>
    </div>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  document.getElementById("btnCerrarModal").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("btnConfirmarIngreso").addEventListener("click", async () => {
    try {
      await authLogin({ mail, contrasena });
      alert("¡Inicio de sesión exitoso!");

      const partidoId = localStorage.getItem("partidoPendiente");
      window.location.href = partidoId ? `compra.html?id=${partidoId}` : "compra.html";
    } catch (errLogin) {
      alert(errLogin.message || "Error al ingresar");
    }
  });
}



