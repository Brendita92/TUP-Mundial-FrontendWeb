const btnLogin = document.getElementById("btnLogin");

btnLogin.addEventListener("click", () => {
  const nombre = document.getElementById("nombre").value.trim();
  const mail = document.getElementById("mail").value.trim();
  const contrasena = document.getElementById("password").value;

  if (!nombre || !mail || !contrasena) {
    alert("Complete todos los campos");
    return;
  }

  const usuario = { nombre, mail, password: contrasena };

  // Demo: registro local sin API
  localStorage.setItem("usuarioRegistrado", JSON.stringify(usuario));

  alert("Registro realizado correctamente");

  const partidoId = localStorage.getItem("partidoPendiente");
  window.location.href = partidoId ? `compra.html?id=${partidoId}` : "compra.html";

  // futuro para conectar con API
  // try {
  //   const response = await fetch(API_URL + "/Usuario", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(usuario)
  //   });
  //
  //   if (!response.ok) throw new Error("Error en el registro");
  //
  //   const data = await response.json();
  //   localStorage.setItem("usuarioRegistrado", JSON.stringify(data));
  //
  //   alert("Registro realizado correctamente");
  //   const partidoId = localStorage.getItem("partidoPendiente");
  //   window.location.href = partidoId ? `compra.html?id=${partidoId}` : "compra.html";
  // } catch (error) {
  //   alert("No se pudo registrar: " + error.message);
  // }
});
