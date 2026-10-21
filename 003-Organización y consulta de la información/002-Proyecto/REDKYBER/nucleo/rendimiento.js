// REDKYBER · Monitor de rendimiento del sistema (ruta=rendimiento)
// Mide el tiempo de respuesta de la API desde el navegador y el de cada consulta en el servidor
class RedkyberRendimiento {
  constructor(contenedor = "section") {
    this.zona = document.querySelector(contenedor);
  }

  async render() {
    this.zona.innerHTML = '<div class="vacio">Midiendo…</div>';
    const inicio = performance.now();
    const datos = await fetch("api/superapi.php?ruta=rendimiento").then(r => r.json());
    const msRed = (performance.now() - inicio).toFixed(1);
    const kb = (datos.tamano_bytes / 1024).toFixed(1);

    this.zona.innerHTML = `
      <div class="barra"><div><small>MONITORIZACIÓN</small><h2>Rendimiento</h2></div><button type="button" id="repetir">Volver a medir</button></div>
      <div class="kpis">
        <div><small>Respuesta de la API</small><strong>${msRed} ms</strong></div>
        <div><small>Cálculo de indicadores</small><strong>${datos.ms_indicadores} ms</strong></div>
        <div><small>Tamaño de la base de datos</small><strong>${kb} KB</strong></div>
        <div><small>Memoria máxima PHP</small><strong>${datos.memoria_pico_kb} KB</strong></div>
        <div><small>Versiones</small><strong class="pequeno">PHP ${escapar(datos.php)}<br>SQLite ${escapar(datos.sqlite)}</strong></div>
      </div>
      <div class="rejilla-graficas">
        <div class="tarjeta-grafica" id="g-ms"></div>
        <div class="tarjeta-grafica" id="g-registros"></div>
      </div>
      <div class="tabla-contenedor"><table>
        <thead><tr><th>Tabla</th><th>Registros</th><th>Tiempo de lectura (ms)</th><th>Estado</th></tr></thead>
        <tbody>${datos.tablas.map(t => `<tr><td>${escapar(t.tabla)}</td><td class="numero">${t.registros}</td><td class="numero">${t.ms}</td><td>${t.ms < 50 ? "✅ Correcto" : "⚠️ Lento"}</td></tr>`).join("")}</tbody>
      </table></div>`;

    RedkyberGraficas.crear("#g-ms", "barras", datos.tablas.map(t => t.tabla), datos.tablas.map(t => t.ms), "Tiempo de lectura por tabla (ms)");
    RedkyberGraficas.crear("#g-registros", "horizontal", datos.tablas.map(t => t.tabla), datos.tablas.map(t => t.registros), "Registros por tabla");
    this.zona.querySelector("#repetir").onclick = () => this.render();
  }
}
