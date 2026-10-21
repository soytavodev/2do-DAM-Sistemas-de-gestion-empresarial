// REDKYBER · Dashboard con indicadores reales calculados en la API (ruta=indicadores)
class RedkyberDashboard {
  constructor(contenedor = "section") {
    this.zona = document.querySelector(contenedor);
  }

  euros(v) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);
  }

  async render() {
    this.zona.innerHTML = '<div class="vacio">Cargando dashboard…</div>';
    try {
      const { kpi, series } = await fetch("api/superapi.php?ruta=indicadores").then(r => r.json());
      this.zona.innerHTML = `
        <div class="barra"><div><small>VISIÓN GENERAL</small><h2>Dashboard</h2></div></div>
        <div class="kpis">
          <div><small>Facturación total</small><strong>${this.euros(kpi.facturacion)}</strong></div>
          <div><small>Pedidos</small><strong>${kpi.pedidos ?? "—"}</strong></div>
          <div><small>Ticket medio</small><strong>${this.euros(kpi.ticket_medio)}</strong></div>
          <div><small>Pedidos sin entregar</small><strong>${kpi.pendientes ?? "—"}</strong></div>
          <div><small>Plantilla</small><strong>${kpi.empleados ?? "—"}</strong></div>
        </div>
        <div class="rejilla-graficas" id="graficas-dashboard"></div>`;

      // [serie, tipo de gráfica, título]
      const paneles = [
        ["ventas_mes", "area", "Facturación por mes"],
        ["pedidos_estado", "anillo", "Pedidos por estado"],
        ["clientes_top", "horizontal", "Mejores clientes (€)"],
        ["ventas_pais", "tarta", "Ventas por país"],
        ["unidades_tipo", "barras", "Aviones vendidos por tipo"],
        ["salario_departamento", "radar", "Salario medio por departamento"],
        ["stock_tipo", "lineas", "Stock de componentes por tipo"]
      ];
      const rejilla = this.zona.querySelector("#graficas-dashboard");
      paneles.filter(([clave]) => series[clave]?.length).forEach(([clave, tipo, titulo]) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-grafica";
        rejilla.appendChild(tarjeta);
        RedkyberGraficas.crear(tarjeta, tipo, series[clave].map(s => s.etiqueta), series[clave].map(s => s.valor), titulo);
      });
    } catch (e) {
      this.zona.innerHTML = '<p class="vacio">No se pudo cargar el dashboard: ' + escapar(e.message) + "</p>";
    }
  }
}
