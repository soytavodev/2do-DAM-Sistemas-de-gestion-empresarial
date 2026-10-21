let tablaActual = "";
let clavePrimaria = "";
let datosActuales = null;

fetch("data/config.php")
.then(respuesta => respuesta.json())
.then(datos => {
  document.querySelector("h1").textContent = datos.nombre;
  document.documentElement.style.setProperty('--color_corporativo', datos.color);
});

fetch("api/superapi.php?ruta=modulos")
.then(respuesta => respuesta.json())
.then(datos => {
  let menu = document.querySelector("#modulos");
  datos.forEach(dato => menu.innerHTML += '<a href="#">'+escapar(dato)+'</a>');
});

fetch("api/superapi.php?ruta=entidades")
.then(respuesta => respuesta.json())
.then(datos => {
  let menu = document.querySelector("#entidades");
  datos.forEach(dato => {
    let enlace = document.createElement("a");
    enlace.href = "#";
    enlace.textContent = dato;
    enlace.onclick = function(evento){
      evento.preventDefault();
      document.querySelectorAll("#entidades a, #sistema button").forEach(a => a.classList.remove("activo"));
      enlace.classList.add("activo");
      cargarTabla(dato);
    };
    menu.appendChild(enlace);
  });
});

function cargarTabla(tabla){
  tablaActual = tabla;
  fetch("api/superapi.php?ruta=tabla&tabla="+encodeURIComponent(tabla))
  .then(respuesta => respuesta.json())
  .then(datos => {
    clavePrimaria = datos.clavePrimaria;
    datosActuales = datos;
    pintarTabla(datos);
  });
}

function pintarTabla(datos){
  let seccion = document.querySelector("section");
  let html = '<div class="barra"><div><small>ENTIDAD</small><h2>'+escapar(tablaActual)+'</h2></div><div class="acciones-barra"><button onclick="nuevoRegistro()">+ Nuevo registro</button></div></div>';

  if(datos.columnas.length == 0){ seccion.innerHTML = html + '<p>No hay columnas.</p>'; return; }

  html += '<div class="tabla-contenedor"><table><thead><tr>';
  datos.columnas.forEach(columna => html += '<th>'+escapar(columna.name)+'</th>');
  html += '<th class="acciones">Acciones</th></tr></thead><tbody>';

  datos.registros.forEach(registro => {
    html += '<tr>';
    datos.columnas.forEach(columna => html += '<td>'+escapar(registro[columna.name] ?? '')+'</td>');
    let id = registro[datos.clavePrimaria];
    html += '<td class="acciones"><button class="editar" onclick=\'editarRegistro('+JSON.stringify(JSON.stringify(registro))+')\'>Editar</button> ';
    html += '<button class="eliminar" onclick=\'eliminarRegistro('+JSON.stringify(id)+')\'>Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div>';
  if(datos.registros.length == 0) html += '<p class="vacio">Todavía no hay registros.</p>';
  seccion.innerHTML = html;
  seccion.querySelector(".acciones-barra").prepend(RedkyberExportar.selector(formato => RedkyberExportar.descargar(formato, tablaActual, datosActuales.columnas, datosActuales.registros)));
}

function nuevoRegistro(){ cargarFormulario(null); }
function editarRegistro(registroJSON){ cargarFormulario(JSON.parse(registroJSON)); }

function cargarFormulario(registro){
  fetch("api/superapi.php?ruta=estructura&tabla="+encodeURIComponent(tablaActual))
  .then(respuesta => respuesta.json())
  .then(datos => {
    let editando = registro !== null;
    let html = '<div class="barra"><div><small>'+ (editando?'EDITAR':'CREAR') +'</small><h2>'+escapar(tablaActual)+'</h2></div><button class="secundario" onclick="cargarTabla(tablaActual)">← Volver</button></div>';
    html += '<form id="formulario">';
    datos.columnas.forEach(columna => {
      if(columna.pk) return;
      let valor = editando ? (registro[columna.name] ?? '') : '';
      html += '<label>'+escapar(columna.name)+campoFormulario(columna, valor, datos.ajenas?.[columna.name])+'</label>';
    });
    html += '<button type="submit">'+(editando?'Guardar cambios':'Crear registro')+'</button></form>';
    document.querySelector("section").innerHTML = html;
    document.querySelector("#formulario").onsubmit = function(evento){
      evento.preventDefault();
      guardarRegistro(new FormData(this), editando ? registro[datos.clavePrimaria] : null);
    };
  });
}

function guardarRegistro(formData,id){
  let datos = Object.fromEntries(formData.entries());
  fetch("api/superapi.php?ruta="+(id===null?'crear':'actualizar'),{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({tabla:tablaActual,id:id,datos:datos})
  }).then(r => r.json()).then(respuesta => {
    if(!respuesta.ok) return alert(respuesta.error || "Error");
    cargarTabla(tablaActual);
  });
}

function eliminarRegistro(id){
  if(!confirm("¿Eliminar este registro?")) return;
  fetch("api/superapi.php?ruta=eliminar",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({tabla:tablaActual,id:id})
  }).then(r => r.json()).then(respuesta => {
    if(!respuesta.ok) return alert(respuesta.error || "Error");
    cargarTabla(tablaActual);
  });
}

// Elige el control adecuado según el tipo de la columna
function campoFormulario(columna, valor, opciones){
  let nombre = 'name="'+escaparAtributo(columna.name)+'"';
  let requerido = columna.notnull ? ' required' : '';
  if(opciones){
    let html = '<select '+nombre+requerido+'><option value="">— Selecciona —</option>';
    opciones.forEach(o => html += '<option value="'+escaparAtributo(o.valor)+'"'+(String(o.valor)===String(valor)?' selected':'')+'>'+escapar(o.texto)+'</option>');
    return html + '</select>';
  }
  let tipo = (columna.type || '').toUpperCase();
  let n = columna.name.toLowerCase();
  let atributos = 'type="text"';
  if(tipo.includes('INT')) atributos = 'type="number" step="1"';
  else if(tipo.includes('REAL') || tipo.includes('NUM')) atributos = 'type="number" step="any"';
  else if(n.includes('fecha')) atributos = 'type="date"';
  else if(n.includes('email')) atributos = 'type="email"';
  else if(n.includes('telefono')) atributos = 'type="tel"';
  return '<input '+atributos+' '+nombre+' value="'+escaparAtributo(valor)+'"'+requerido+'>';
}

// Módulos de sistema: dashboard, informes, consola SQL y rendimiento
const vistas = {
  dashboard: () => new RedkyberDashboard().render(),
  informes: () => new RedkyberInformes().render(),
  consola: () => new RedkyberConsola().render(),
  rendimiento: () => new RedkyberRendimiento().render()
};
document.querySelectorAll("#sistema button").forEach(boton => {
  boton.onclick = function(){
    document.querySelectorAll("#entidades a, #sistema button").forEach(x => x.classList.remove("activo"));
    boton.classList.add("activo");
    vistas[boton.dataset.vista]();
  };
});
document.querySelector('#sistema [data-vista="dashboard"]').click();

function escapar(valor){ let d=document.createElement('div'); d.textContent=String(valor); return d.innerHTML; }
function escaparAtributo(valor){ return escapar(valor).replaceAll('"','&quot;'); }
