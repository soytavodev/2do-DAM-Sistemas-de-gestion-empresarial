// REDKYBER · Informes: todas las tablas con filtros, ordenación, totales,
// gráfica configurable, exportación en varios formatos e impresión a PDF
class RedkyberInformes {
  constructor(contenedor = "section") {
    this.zona = document.querySelector(contenedor);
  }

  esNumerica(columna, registros) {
    const tipo = (columna.type || "").toUpperCase();
    if (["INT", "REAL", "NUM", "DEC", "FLOA", "DOUB"].some(t => tipo.includes(t))) return true;
    return registros.length > 0 && registros.every(r => r[columna.name] === null || r[columna.name] === "" || !isNaN(r[columna.name]));
  }

  async render() {
    this.zona.innerHTML = '<div class="vacio">Generando informe…</div>';
    const nombres = await fetch("api/superapi.php?ruta=entidades").then(r => r.json());
    const entidades = await Promise.all(nombres.map(n => fetch("api/superapi.php?ruta=tabla&tabla=" + encodeURIComponent(n)).then(r => r.json()).then(d => ({ tabla: n, ...d }))));
    const total = entidades.reduce((a, e) => a + e.registros.length, 0);

    this.zona.innerHTML = `
      <div class="barra no-imprimir">
        <div><small>INFORMES Y LISTADOS</small><h2>Informe general</h2></div>
        <button type="button" id="imprimir">Imprimir / PDF</button>
      </div>
      <article class="documento">
        <header class="documento-cabecera">
          <div><small>REDKYBER · INFORME GENERAL</small><h1>Estado de la base de datos</h1></div>
          <div>${new Date().toLocaleString("es-ES")}<br>${entidades.length} tablas · ${total} registros</div>
        </header>
        <div id="bloques"></div>
      </article>`;
    this.zona.querySelector("#imprimir").onclick = () => window.print();
    const bloques = this.zona.querySelector("#bloques");
    entidades.forEach(e => bloques.appendChild(this.bloque(e)));
  }

  bloque(datos) {
    const seccion = document.createElement("section");
    seccion.className = "bloque-informe";
    const numericas = datos.columnas.filter(c => !c.pk && !/_id$/.test(c.name) && this.esNumerica(c, datos.registros)).map(c => c.name);
    // Primero las columnas con menos valores distintos (estado, tipo…), que dan mejores gráficas
    const distintos = c => new Set(datos.registros.map(r => r[c])).size;
    const categoricas = datos.columnas.filter(c => !c.pk && !numericas.includes(c.name)).map(c => c.name)
      .sort((a, b) => (distintos(a) < 2) - (distintos(b) < 2) || distintos(a) - distintos(b));

    seccion.innerHTML = `
      <div class="bloque-titulo">
        <div><small>TABLA</small><h2></h2></div>
        <span class="contador"></span>
        <span class="controles no-imprimir"></span>
      </div>
      <div class="tarjeta-grafica"></div>
      <div class="tabla-contenedor"><table><thead><tr class="filtros no-imprimir"></tr><tr class="nombres"></tr></thead><tbody></tbody><tfoot></tfoot></table></div>`;
    seccion.querySelector("h2").textContent = datos.tabla;

    const thead = seccion.querySelector("thead"), tbody = seccion.querySelector("tbody");
    datos.columnas.forEach((c, i) => {
      const filtro = document.createElement("th");
      filtro.innerHTML = '<input type="search" placeholder="Filtrar">';
      thead.querySelector(".filtros").appendChild(filtro);
      const th = document.createElement("th");
      th.textContent = c.name;
      th.title = "Pulsa para ordenar";
      th.dataset.indice = i;
      thead.querySelector(".nombres").appendChild(th);
    });
    datos.registros.forEach(r => {
      const tr = document.createElement("tr");
      datos.columnas.forEach(c => {
        const td = document.createElement("td");
        td.textContent = r[c.name] ?? "";
        if (numericas.includes(c.name)) td.className = "numero";
        tr.appendChild(td);
      });
      tr.registro = r;
      tbody.appendChild(tr);
    });

    // Controles: campo y tipo de gráfica + exportar
    const controles = seccion.querySelector(".controles");
    const selCampo = document.createElement("select");
    selCampo.innerHTML = [
      ...categoricas.map(c => `<option value="cuenta:${c}">Nº por ${c}</option>`),
      ...categoricas.flatMap(c => numericas.map(n => `<option value="suma:${c}:${n}">Suma de ${n} por ${c}</option>`))
    ].join("");
    const selTipo = document.createElement("select");
    selTipo.innerHTML = RedkyberGraficas.tipos.map(t => `<option>${t}</option>`).join("");
    selTipo.value = "anillo";
    const visibles = () => [...tbody.rows].filter(f => f.style.display !== "none").map(f => f.registro);
    controles.append(selCampo, selTipo, RedkyberExportar.selector(formato => RedkyberExportar.descargar(formato, datos.tabla, datos.columnas, visibles())));

    const grafica = () => {
      const zona = seccion.querySelector(".tarjeta-grafica");
      if (!selCampo.value) { zona.remove(); return; }
      const [modo, campo, valor] = selCampo.value.split(":");
      const grupos = new Map();
      visibles().forEach(r => {
        const k = String(r[campo] ?? "(vacío)");
        grupos.set(k, (grupos.get(k) || 0) + (modo === "suma" ? Number(r[valor]) || 0 : 1));
      });
      const orden = [...grupos].sort((a, b) => b[1] - a[1]).slice(0, 10);
      RedkyberGraficas.crear(zona, selTipo.value, orden.map(o => o[0]), orden.map(o => o[1]), selCampo.selectedOptions[0].textContent);
    };

    const actualizar = () => {
      const filtros = [...thead.querySelectorAll("input")].map(i => i.value.toLowerCase().trim());
      [...tbody.rows].forEach(f => {
        f.style.display = filtros.every((t, i) => !t || f.cells[i].textContent.toLowerCase().includes(t)) ? "" : "none";
      });
      const filas = visibles();
      seccion.querySelector(".contador").textContent = filas.length + " de " + datos.registros.length + " filas";
      this.totales(seccion, datos.columnas, numericas, filas);
      grafica();
    };

    thead.querySelectorAll("input").forEach(i => i.oninput = actualizar);
    selCampo.onchange = selTipo.onchange = grafica;
    thead.querySelectorAll(".nombres th").forEach(th => th.onclick = () => {
      const i = +th.dataset.indice, asc = th.dataset.asc !== "1", c = datos.columnas[i].name;
      [...tbody.rows].sort((a, b) => {
        const A = a.registro[c] ?? "", B = b.registro[c] ?? "";
        const res = numericas.includes(c) ? Number(A) - Number(B) : String(A).localeCompare(String(B), "es", { numeric: true });
        return asc ? res : -res;
      }).forEach(f => tbody.appendChild(f));
      thead.querySelectorAll(".nombres th").forEach(x => x.classList.remove("asc", "desc"));
      th.classList.add(asc ? "asc" : "desc");
      th.dataset.asc = asc ? "1" : "0";
    });
    actualizar();
    return seccion;
  }

  // Fila de suma, media, mínimo y máximo de las columnas numéricas
  totales(seccion, columnas, numericas, filas) {
    const tfoot = seccion.querySelector("tfoot");
    tfoot.innerHTML = "";
    if (!numericas.length || !filas.length) return;
    const formato = v => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(v);
    const calculos = {
      Suma: v => v.reduce((a, b) => a + b, 0),
      Media: v => v.reduce((a, b) => a + b, 0) / v.length,
      Mínimo: v => Math.min(...v),
      Máximo: v => Math.max(...v)
    };
    Object.entries(calculos).forEach(([nombre, calculo]) => {
      const tr = document.createElement("tr");
      columnas.forEach((c, i) => {
        const td = document.createElement("td");
        if (i === 0) td.textContent = nombre;
        if (numericas.includes(c.name)) {
          const valores = filas.map(f => Number(f[c.name])).filter(Number.isFinite);
          td.textContent = valores.length ? formato(calculo(valores)) : "";
          td.className = "numero";
        }
        tr.appendChild(td);
      });
      tfoot.appendChild(tr);
    });
  }
}
