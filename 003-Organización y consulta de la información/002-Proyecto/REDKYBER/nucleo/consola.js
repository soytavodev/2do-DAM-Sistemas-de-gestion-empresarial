// REDKYBER · Consola SQL de solo lectura (ruta=consulta)
// Permite lanzar consultas SELECT, ver el resultado, graficarlo y exportarlo
class RedkyberConsola {
  static ejemplos = {
    "Pedidos con el nombre del cliente": "SELECT p.identificador, p.fecha, c.nombre AS cliente, p.estado, p.total\nFROM pedidos p\nJOIN clientes c ON c.identificador = p.cliente_id\nORDER BY p.fecha DESC",
    "Facturación por cliente": "SELECT c.nombre, COUNT(*) AS pedidos, SUM(p.total) AS facturado\nFROM pedidos p\nJOIN clientes c ON c.identificador = p.cliente_id\nGROUP BY c.nombre\nORDER BY facturado DESC",
    "Aviones más vendidos": "SELECT pr.nombre, SUM(l.cantidad) AS unidades, SUM(l.cantidad * l.precio_unitario) AS importe\nFROM lineaspedido l\nJOIN productos pr ON pr.identificador = l.producto_id\nGROUP BY pr.nombre\nORDER BY unidades DESC",
    "Componentes con poco stock": "SELECT co.nombre, co.stock, pv.nombre AS proveedor\nFROM componentes co\nJOIN proveedores pv ON pv.identificador = co.proveedor_id\nWHERE co.stock < 100\nORDER BY co.stock",
    "Coste salarial por departamento": "SELECT departamento, COUNT(*) AS personas, SUM(salario) AS coste_anual\nFROM empleados\nGROUP BY departamento\nORDER BY coste_anual DESC"
  };

  constructor(contenedor = "section") {
    this.zona = document.querySelector(contenedor);
  }

  render() {
    this.zona.innerHTML = `
      <div class="barra"><div><small>CONSULTAS DE ACCESO A DATOS</small><h2>Consola SQL</h2></div></div>
      <p class="ayuda">Solo lectura: se permite una única sentencia <code>SELECT</code>. Máximo 1000 filas.</p>
      <div class="consola">
        <select id="ejemplos"><option value="">Consultas de ejemplo…</option></select>
        <textarea id="sql" spellcheck="false">SELECT * FROM clientes</textarea>
        <div class="consola-acciones"><button type="button" id="ejecutar">Ejecutar (Ctrl+Enter)</button><span id="estado"></span></div>
      </div>
      <div id="resultado"></div>`;

    const select = this.zona.querySelector("#ejemplos"), area = this.zona.querySelector("#sql");
    Object.keys(RedkyberConsola.ejemplos).forEach(k => select.add(new Option(k, k)));
    select.onchange = () => { if (select.value) { area.value = RedkyberConsola.ejemplos[select.value]; this.ejecutar(); } };
    this.zona.querySelector("#ejecutar").onclick = () => this.ejecutar();
    area.onkeydown = e => { if (e.ctrlKey && e.key === "Enter") this.ejecutar(); };
  }

  async ejecutar() {
    const estado = this.zona.querySelector("#estado"), resultado = this.zona.querySelector("#resultado");
    estado.textContent = "Ejecutando…";
    const respuesta = await fetch("api/superapi.php?ruta=consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: this.zona.querySelector("#sql").value })
    }).then(r => r.json());

    if (respuesta.ok === false) {
      estado.textContent = "";
      resultado.innerHTML = '<p class="error"></p>';
      resultado.querySelector(".error").textContent = "Error: " + respuesta.error;
      return;
    }
    const { columnas, registros, ms } = respuesta;
    estado.textContent = `${registros.length} filas · ${ms} ms`;

    resultado.innerHTML = '<div class="bloque-titulo"><span></span><span class="controles"></span></div><div class="tarjeta-grafica"></div><div class="tabla-contenedor"><table><thead><tr></tr></thead><tbody></tbody></table></div>';
    const thead = resultado.querySelector("thead tr"), tbody = resultado.querySelector("tbody");
    columnas.forEach(c => thead.insertAdjacentHTML("beforeend", "<th>" + escapar(c.name) + "</th>"));
    registros.forEach(r => {
      tbody.insertAdjacentHTML("beforeend", "<tr>" + columnas.map(c => "<td>" + escapar(r[c.name] ?? "") + "</td>").join("") + "</tr>");
    });
    resultado.querySelector(".controles").appendChild(RedkyberExportar.selector(f => RedkyberExportar.descargar(f, "consulta", columnas, registros)));

    // Si la consulta devuelve "texto + número", la representa automáticamente
    const numerica = columnas.slice(1).find(c => registros.length && registros.every(r => r[c.name] !== null && !isNaN(r[c.name])));
    const zonaGrafica = resultado.querySelector(".tarjeta-grafica");
    if (numerica && registros.length > 1) {
      RedkyberGraficas.crear(zonaGrafica, "horizontal", registros.map(r => r[columnas[0].name]), registros.map(r => r[numerica.name]), numerica.name + " por " + columnas[0].name);
    } else {
      zonaGrafica.remove();
    }
  }
}
