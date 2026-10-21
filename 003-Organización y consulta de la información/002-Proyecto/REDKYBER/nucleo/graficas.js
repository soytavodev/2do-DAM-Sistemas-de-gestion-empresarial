// REDKYBER · Librería de gráficas en SVG (sin librerías externas)
// Tipos: barras, horizontal, lineas, area, tarta, anillo, radar
class RedkyberGraficas {
  static tipos = ["barras", "horizontal", "lineas", "area", "tarta", "anillo", "radar"];
  static colores = ["#b00020", "#e0485e", "#7a0016", "#f08a96", "#4a4a4a", "#9e9e9e", "#d4a017", "#2f6f8f"];

  static crear(contenedor, tipo, etiquetas, valores, titulo = "") {
    const el = typeof contenedor === "string" ? document.querySelector(contenedor) : contenedor;
    if (!el) return;
    el.innerHTML = "";
    if (titulo) {
      const h = document.createElement("h3");
      h.textContent = titulo;
      el.appendChild(h);
    }
    const datos = valores.map((v, i) => ({ etiqueta: String(etiquetas[i] ?? "—"), valor: Math.max(0, Number(v) || 0) }));
    if (!datos.length || !datos.some(d => d.valor)) {
      el.insertAdjacentHTML("beforeend", '<p class="vacio">Sin datos para representar</p>');
      return;
    }
    const svg = this.nodo("svg", { viewBox: "0 0 460 260", role: "img", "aria-label": titulo || tipo });
    svg.classList.add("grafica-svg");
    el.appendChild(svg);

    const metodo = { barras: "barras", horizontal: "horizontal", lineas: "lineas", area: "lineas",
                     tarta: "circular", anillo: "circular", radar: "radar" }[tipo] || "barras";
    this[metodo](svg, datos, tipo);
  }

  // ---------- utilidades ----------
  static nodo(tag, atributos = {}) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(atributos).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }
  static texto(svg, x, y, contenido, atributos = {}) {
    const t = this.nodo("text", { x, y, "font-size": 10, fill: "#555", ...atributos });
    t.textContent = contenido;
    svg.appendChild(t);
    return t;
  }
  static numero(v) {
    return new Intl.NumberFormat("es-ES", { notation: v >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(v);
  }
  static color(i) { return this.colores[i % this.colores.length]; }

  static tooltip(figura, d, total) {
    let caja = document.querySelector("#grafica-tooltip");
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "grafica-tooltip";
      document.body.appendChild(caja);
    }
    figura.addEventListener("mousemove", e => {
      const pct = total ? ` (${(d.valor / total * 100).toFixed(1)}%)` : "";
      caja.textContent = `${d.etiqueta}: ${new Intl.NumberFormat("es-ES").format(d.valor)}${pct}`;
      caja.style.display = "block";
      caja.style.left = Math.min(e.clientX + 12, innerWidth - caja.offsetWidth - 8) + "px";
      caja.style.top = (e.clientY + 12) + "px";
    });
    figura.addEventListener("mouseleave", () => caja.style.display = "none");
  }

  static ejes(svg, max, x0, y0, ancho, alto) {
    for (let i = 0; i <= 4; i++) {
      const y = y0 - alto * i / 4;
      svg.appendChild(this.nodo("line", { x1: x0, y1: y, x2: x0 + ancho, y2: y, stroke: "#eee" }));
      this.texto(svg, x0 - 6, y + 3, this.numero(max * i / 4), { "text-anchor": "end", "font-size": 9 });
    }
  }

  // ---------- tipos ----------
  static barras(svg, datos) {
    const lista = datos.slice(0, 12), max = Math.max(...lista.map(d => d.valor));
    const x0 = 50, y0 = 220, ancho = 395, alto = 190, hueco = 8, w = ancho / lista.length - hueco;
    this.ejes(svg, max, x0, y0, ancho, alto);
    lista.forEach((d, i) => {
      const h = d.valor / max * alto, x = x0 + i * (w + hueco) + hueco / 2;
      const r = this.nodo("rect", { x, y: y0 - h, width: w, height: h, rx: 3, fill: this.color(i) });
      svg.appendChild(r);
      this.tooltip(r, d);
      this.texto(svg, x + w / 2, y0 + 14, d.etiqueta.slice(0, Math.max(4, Math.floor(w / 6))), { "text-anchor": "middle" });
    });
  }

  static horizontal(svg, datos) {
    const lista = datos.slice(0, 8), max = Math.max(...lista.map(d => d.valor));
    const x0 = 130, ancho = 280, alto = 26;
    lista.forEach((d, i) => {
      const y = 12 + i * (alto + 4), w = d.valor / max * ancho;
      this.texto(svg, x0 - 8, y + 17, d.etiqueta.slice(0, 20), { "text-anchor": "end", "font-size": 11 });
      const r = this.nodo("rect", { x: x0, y, width: w, height: alto, rx: 3, fill: this.color(i) });
      svg.appendChild(r);
      this.tooltip(r, d);
      this.texto(svg, x0 + w + 5, y + 17, this.numero(d.valor), { "font-size": 10 });
    });
  }

  static lineas(svg, datos, tipo) {
    const lista = datos.slice(0, 24), max = Math.max(...lista.map(d => d.valor));
    const x0 = 50, y0 = 220, ancho = 390, alto = 190;
    const paso = lista.length > 1 ? ancho / (lista.length - 1) : 0;
    const puntos = lista.map((d, i) => [x0 + i * paso, y0 - d.valor / max * alto]);
    this.ejes(svg, max, x0, y0, ancho, alto);
    const camino = puntos.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
    if (tipo === "area") {
      svg.appendChild(this.nodo("path", { d: `${camino} L ${puntos.at(-1)[0]} ${y0} L ${x0} ${y0} Z`, fill: this.colores[0], opacity: .18 }));
    }
    svg.appendChild(this.nodo("path", { d: camino, fill: "none", stroke: this.colores[0], "stroke-width": 2.5 }));
    puntos.forEach((p, i) => {
      const c = this.nodo("circle", { cx: p[0], cy: p[1], r: 4.5, fill: "#fff", stroke: this.colores[0], "stroke-width": 2 });
      svg.appendChild(c);
      this.tooltip(c, lista[i]);
      if (lista.length <= 12 || i % 2 === 0) this.texto(svg, p[0], y0 + 14, lista[i].etiqueta.slice(0, 7), { "text-anchor": "middle", "font-size": 9 });
    });
  }

  static circular(svg, datos, tipo) {
    const lista = datos.slice(0, 8), total = lista.reduce((a, d) => a + d.valor, 0);
    const cx = 130, cy = 130, r = 105, ri = tipo === "anillo" ? 60 : 0;
    const punto = (radio, a) => [cx + radio * Math.cos(a), cy + radio * Math.sin(a)];
    let angulo = -Math.PI / 2;
    lista.forEach((d, i) => {
      if (!d.valor) return;
      const delta = Math.min(d.valor / total * Math.PI * 2, Math.PI * 2 - 1e-4), fin = angulo + delta, grande = delta > Math.PI ? 1 : 0;
      const [x1, y1] = punto(r, angulo), [x2, y2] = punto(r, fin);
      let d_;
      if (ri) {
        const [x3, y3] = punto(ri, fin), [x4, y4] = punto(ri, angulo);
        d_ = `M ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${grande} 0 ${x4} ${y4} Z`;
      } else {
        d_ = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2} Z`;
      }
      const sector = this.nodo("path", { d: d_, fill: this.color(i), stroke: "#fff", "stroke-width": 2 });
      svg.appendChild(sector);
      this.tooltip(sector, d, total);
      angulo = fin;
    });
    if (ri) this.texto(svg, cx, cy + 7, this.numero(total), { "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: "#222" });
    lista.forEach((d, i) => {
      const y = 30 + i * 26;
      svg.appendChild(this.nodo("rect", { x: 260, y: y - 10, width: 12, height: 12, rx: 3, fill: this.color(i) }));
      this.texto(svg, 278, y, `${d.etiqueta.slice(0, 16)} · ${(d.valor / total * 100).toFixed(0)}%`, { "font-size": 11, fill: "#333" });
    });
  }

  static radar(svg, datos) {
    const lista = datos.slice(0, 8);
    if (lista.length < 3) return this.barras(svg, datos);
    const max = Math.max(...lista.map(d => d.valor)), cx = 230, cy = 130, r = 100, n = lista.length;
    const punto = (i, radio) => [cx + radio * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), cy + radio * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)];
    for (let nivel = 1; nivel <= 4; nivel++) {
      const anillo = lista.map((_, i) => punto(i, r * nivel / 4).join(",")).join(" ");
      svg.appendChild(this.nodo("polygon", { points: anillo, fill: "none", stroke: "#e5e5e5" }));
    }
    lista.forEach((d, i) => {
      const [x, y] = punto(i, r), [tx, ty] = punto(i, r + 16);
      svg.appendChild(this.nodo("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: "#e5e5e5" }));
      this.texto(svg, tx, ty + 3, d.etiqueta.slice(0, 14), { "text-anchor": tx < cx - 5 ? "end" : tx > cx + 5 ? "start" : "middle" });
    });
    const forma = lista.map((d, i) => punto(i, d.valor / max * r).join(",")).join(" ");
    svg.appendChild(this.nodo("polygon", { points: forma, fill: this.colores[0], "fill-opacity": .25, stroke: this.colores[0], "stroke-width": 2 }));
    lista.forEach((d, i) => {
      const [x, y] = punto(i, d.valor / max * r);
      const c = this.nodo("circle", { cx: x, cy: y, r: 4, fill: this.colores[0] });
      svg.appendChild(c);
      this.tooltip(c, d);
    });
  }

  // Cuenta cuántas veces aparece cada valor de una columna
  static frecuencia(registros, columna) {
    const mapa = new Map();
    registros.forEach(r => {
      const k = String(r[columna] ?? "(vacío)");
      mapa.set(k, (mapa.get(k) || 0) + 1);
    });
    return [...mapa].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }
}
