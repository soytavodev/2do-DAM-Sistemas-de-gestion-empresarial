// REDKYBER · Exportación de datos e informes
// Formatos: CSV, JSON, HTML, Markdown y XML (el profesor solo exporta CSV)
class RedkyberExportar {
  static formatos = { csv: "CSV", json: "JSON", html: "HTML", md: "Markdown", xml: "XML" };

  static descargar(formato, nombre, columnas, registros) {
    const campos = columnas.map(c => typeof c === "string" ? c : c.name);
    const generadores = {
      csv:  () => this.csv(campos, registros),
      json: () => JSON.stringify(registros.map(r => Object.fromEntries(campos.map(c => [c, r[c] ?? null]))), null, 2),
      html: () => this.html(nombre, campos, registros),
      md:   () => this.markdown(nombre, campos, registros),
      xml:  () => this.xml(nombre, campos, registros)
    };
    const tipos = { csv: "text/csv", json: "application/json", html: "text/html", md: "text/markdown", xml: "application/xml" };
    const contenido = (formato === "csv" ? "﻿" : "") + generadores[formato]();
    const blob = new Blob([contenido], { type: tipos[formato] + ";charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = this.nombreArchivo(nombre) + "." + formato;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  }

  // Crea un desplegable "Exportar" con todos los formatos
  static selector(alExportar) {
    const select = document.createElement("select");
    select.className = "exportar";
    select.innerHTML = '<option value="">Exportar…</option>' +
      Object.entries(this.formatos).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    select.onchange = () => {
      if (select.value) alExportar(select.value);
      select.value = "";
    };
    return select;
  }

  static nombreArchivo(nombre) {
    const fecha = new Date().toISOString().slice(0, 10);
    return "redkyber_" + String(nombre).replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + fecha;
  }

  static csv(campos, registros) {
    const escapar = valor => {
      let texto = String(valor ?? "");
      // Evita que Excel interprete el contenido como una fórmula
      if (/^[=+@-]/.test(texto) && isNaN(texto)) texto = "'" + texto;
      return '"' + texto.replace(/"/g, '""') + '"';
    };
    return [campos, ...registros.map(r => campos.map(c => r[c]))].map(fila => fila.map(escapar).join(";")).join("\r\n");
  }

  static html(nombre, campos, registros) {
    const e = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>REDKYBER · ${e(nombre)}</title>
<style>body{font-family:Arial,sans-serif;margin:30px}h1{color:#b00020}table{border-collapse:collapse;width:100%}th{background:#b00020;color:#fff}th,td{padding:8px;border:1px solid #ddd;text-align:left}tr:nth-child(even){background:#f7f7f7}</style>
</head><body>
<h1>REDKYBER · ${e(nombre)}</h1>
<p>Exportado el ${new Date().toLocaleString("es-ES")} · ${registros.length} registros</p>
<table><thead><tr>${campos.map(c => `<th>${e(c)}</th>`).join("")}</tr></thead>
<tbody>
${registros.map(r => `<tr>${campos.map(c => `<td>${e(r[c])}</td>`).join("")}</tr>`).join("\n")}
</tbody></table>
</body></html>`;
  }

  static markdown(nombre, campos, registros) {
    const e = v => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    return [
      `# REDKYBER · ${nombre}`,
      "",
      `Exportado el ${new Date().toLocaleString("es-ES")} · ${registros.length} registros`,
      "",
      "| " + campos.map(e).join(" | ") + " |",
      "| " + campos.map(() => "---").join(" | ") + " |",
      ...registros.map(r => "| " + campos.map(c => e(r[c])).join(" | ") + " |")
    ].join("\n");
  }

  static xml(nombre, campos, registros) {
    const e = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const etiqueta = c => /^[a-zA-Z_][\w.-]*$/.test(c) ? c : "campo";
    return `<?xml version="1.0" encoding="UTF-8"?>
<${etiqueta(nombre)} exportado="${new Date().toISOString()}" registros="${registros.length}">
${registros.map(r => "  <registro>\n" + campos.map(c => `    <${etiqueta(c)}>${e(r[c])}</${etiqueta(c)}>`).join("\n") + "\n  </registro>").join("\n")}
</${etiqueta(nombre)}>`;
  }
}
