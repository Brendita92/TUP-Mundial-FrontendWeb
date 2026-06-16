const btnLogin = document.getElementById("btnLogin");
const btnModoLogin = document.getElementById("btnModoLogin");

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
    const msg = dataRegistro.mensaje || dataRegistro.message || "Error de Registro";
    const err = new Error(msg);
    err.status = responseRegistro.status;
    throw err;
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

  // Guardar token
      const token = dataLogin.Token || dataLogin.token;
      if (token) {
        localStorage.setItem("jwt_token", token);
      }

      // Guardar datos del usuario
      const usuarioId = dataLogin.Id || dataLogin.id;
      if (usuarioId) {
        localStorage.setItem("usuarioId", usuarioId);
      }

      localStorage.setItem(
        "usuarioEmail",
        dataLogin.Email || dataLogin.email || ""
      );

      localStorage.setItem(
        "roles",
        JSON.stringify(dataLogin.roles || dataLogin.Roles || [])
      );

      return dataLogin;
      }

function setupLoginFlow() {
  // En este HTML se está usando el mismo formulario para Registro/Ingreso.
  // El cambio de modo será controlado por el texto del botón.

  if (!btnLogin) return;

  const isRegistroMode = () => {
    const txt = (btnLogin.textContent || "").trim().toLowerCase();
    return txt.includes("registr");
  };

  const setModoLogin = () => {
    btnLogin.textContent = "Ingresar";
    if (btnModoLogin) btnModoLogin.style.display = "none";
    const titulo = document.querySelector("header h1");

      if (titulo) {
        titulo.textContent = "Iniciar Sesión";
      }

    // Ocultamos campos que no aplican en Login.
    const nombreEl = document.getElementById("nombre");
    const apellidoEl = document.getElementById("apellido");
    const mailEl = document.getElementById("mail");
    const passEl = document.getElementById("password");

      const labelNombre = document.querySelector('label[for="nombre"]');
      const labelApellido = document.querySelector('label[for="apellido"]');

      if (nombreEl) nombreEl.style.display = "none";
      if (apellidoEl) apellidoEl.style.display = "none";

      if (labelNombre) labelNombre.style.display = "none";
      if (labelApellido) labelApellido.style.display = "none";

    // Mensaje de bienvenida debajo del título (si existe contenedor).
    const card = document.querySelector(".form-card");
    if (card) {
      let msg = document.getElementById("authMensaje");
      if (!msg) {
        msg = document.createElement("div");
        msg.id = "authMensaje";
        msg.style.margin = "0.75rem 0 0";
        msg.style.padding = "0.75rem";
        msg.style.borderRadius = "10px";
        msg.style.background = "#ecfdf5";
        msg.style.color = "#047857";
        msg.style.fontWeight = "700";
        card.appendChild(msg);
      }
     msg.textContent =
  "✓ Registro exitoso. Ahora iniciá sesión con tu correo y contraseña.";
    }

    // Autocompletar mail/llenar password si se guardó.
    if (mailEl) mailEl.value = localStorage.getItem("auth_mail") || mailEl.value;
    if (passEl) passEl.focus();
  };

  const toast = window.mostrarToast || ((tipo, mensaje) => alert(`${tipo}: ${mensaje}`));

  btnLogin.addEventListener("click", async () => {
    const nombre = getValue("nombre");
    const apellido = getValue("apellido");
    const mail = getValue("mail");
    const contrasena = getValue("password");

    try {
      if (isRegistroMode()) {
        if (!nombre || !apellido || !mail || !contrasena) {
          toast("error", "Complete nombre, apellido, correo y contraseña");
          return;
        }

        const dataRegistro = await authRegistrar({ nombre, apellido, mail, contrasena });
        // Guardamos mail para autocompletar después del cambio de modo.
        localStorage.setItem("auth_mail", mail);

        toast("success", dataRegistro.mensaje || "✓ Registro exitoso");
        // Importante: transformar el formulario a login inmediatamente (sin modal extra).
        setModoLogin();
        return;
      }

      // Modo login
      if (!mail || !contrasena) {
        toast("error", "Ingresar email y contraseña");
        return;
      }

      await authLogin({ mail, contrasena });
      localStorage.setItem("isLoggedIn", "true");
      toast("success", "✓ Inicio de sesión exitoso");

      const partidoId = localStorage.getItem("partidoPendiente");
      window.location.href = partidoId ? `compra.html?id=${partidoId}` : "compra.html";
    } catch (e) {
      console.error(e);

      const mensaje = (e.message || "").toLowerCase();
      const usuarioExistente =
        e.status === 409 ||
        mensaje.includes("ya existe") ||
        mensaje.includes("registrad") ||
        mensaje.includes("existente");

      if (usuarioExistente) {
        toast("error", "Ya se encuentra registrada");
        setModoLogin();
        return;
      }

      toast("error", e.message || "Error en autenticación");
    }
  });
}

function initPasswordToggle() {
  const input = document.getElementById("password");
  if (!input) return;

  let wrapper = input.parentElement;
  if (!wrapper) return;

  // Creamos un botón ojo dentro del wrapper si no existe.
  const existing = document.getElementById("togglePassword");
  if (existing) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "togglePassword";
  btn.setAttribute("aria-label", "Mostrar/Ocultar contraseña");
  btn.innerHTML = "\u{1F441}"; // 👁
  btn.style.position = "absolute";
  btn.style.right = "12px";
  btn.style.top = "50%";
  btn.style.transform = "translateY(-50%)";
  btn.style.border = "none";
  btn.style.background = "transparent";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "1.1rem";

  wrapper.style.position = "relative";
  wrapper.appendChild(btn);

  btn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.innerHTML = isHidden ? "\u{1F441}" : "\u{1F576}"; // ojo vs ojo tachado (aprox)
  });
}


if (btnModoLogin) {
  btnModoLogin.addEventListener("click", () => {

    const nombreInput = document.getElementById("nombre");
    const apellidoInput = document.getElementById("apellido");

    const labelNombre = document.querySelector('label[for="nombre"]');
    const labelApellido = document.querySelector('label[for="apellido"]');

    if (nombreInput) nombreInput.style.display = "none";
    if (apellidoInput) apellidoInput.style.display = "none";

    if (labelNombre) labelNombre.style.display = "none";
    if (labelApellido) labelApellido.style.display = "none";

    const titulo = document.querySelector("header h1");

    if (titulo) {
      titulo.textContent = "Iniciar Sesión";
    }

    btnLogin.textContent = "Ingresar";
    btnModoLogin.style.display = "none";
  });
}


setupLoginFlow();
initPasswordToggle();



