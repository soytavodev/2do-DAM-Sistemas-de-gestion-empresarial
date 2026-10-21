# REDKYBER · Unidad 3: Organización y consulta de la información

ERP para una empresa fabricante de aviones (clientes = aerolíneas). Parte de la versión de la unidad 2
(CRUD genérico sobre cualquier tabla SQLite + instalador a partir de un modelo de datos) y añade
herramientas de **consulta, análisis, exportación y monitorización** de la información.

## Puesta en marcha

```bash
cd REDKYBER
php -S localhost:8000
```

Abrir `http://localhost:8000`. Requiere PHP con la extensión SQLite3 (`sudo apt install php-cli php-sqlite3`).

Para regenerar la base de datos de demostración:

```bash
rm data/redkyber.db
php -r '$db=new SQLite3("data/redkyber.db"); $db->exec(file_get_contents("data/schema.sql")); $db->exec(file_get_contents("data/demo.sql"));'
```

## Novedades de la unidad 3

### Extensiones visuales

| Elemento | Archivo | Descripción |
|---|---|---|
| Librería de gráficas | `nucleo/graficas.js` | 7 tipos en SVG puro: barras, horizontal, líneas, área, tarta, anillo y radar. Con tooltip y leyenda |
| Dashboard | `nucleo/dashboard.js` | 5 KPI y 7 gráficas con **datos reales** calculados en SQL (no simulados) |
| Informes | `nucleo/informes.js` | Todas las tablas en un documento imprimible, con filtros por columna, ordenación, totales (suma, media, mín., máx.) y gráfica configurable (campo + tipo) |
| Rendimiento | `nucleo/rendimiento.js` | Tiempo de respuesta de la API, tiempo por tabla, tamaño de la BD y memoria |

### Extensiones funcionales

| Elemento | Archivo | Descripción |
|---|---|---|
| Exportación | `nucleo/exportar.js` | 5 formatos: **CSV, JSON, HTML, Markdown y XML**. Disponible en entidades, informes y consola |
| Consola SQL | `nucleo/consola.js` + `ruta=consulta` | Consultas `SELECT` con `JOIN`, `GROUP BY`… sobre una conexión **de solo lectura**. Incluye consultas de ejemplo y gráfica automática del resultado |
| Indicadores | `api/superapi.php` `ruta=indicadores` | Agregaciones SQL (SUM, AVG, COUNT, GROUP BY, JOIN) para el dashboard |
| Formularios mejorados | `codigo.js` `campoFormulario()` | Cada campo usa el control adecuado (número, fecha, email, teléfono) y las claves ajenas (`cliente_id`, `producto_id`…) se eligen en un desplegable con el nombre del registro relacionado |
| Extracción automática | `servicios/extraccion.php` | Script para `cron` que guarda una copia CSV de cada tabla + `resumen.json` con indicadores en `data/extracciones/AAAA-MM-DD_HHMMSS/` y lo anota en `registro.log` |

### Programar la extracción con cron

```bash
crontab -e
# Todos los días a las 02:00
0 2 * * * cd /ruta/a/REDKYBER && php servicios/extraccion.php >> data/extracciones/cron.log 2>&1
```

## Rutas de la API (`api/superapi.php`)

| Ruta | Método | Devuelve |
|---|---|---|
| `modulos`, `entidades` | GET | Menús |
| `estructura&tabla=` | GET | Columnas, clave primaria y opciones de las claves ajenas |
| `tabla&tabla=` | GET | Columnas y registros |
| `crear`, `actualizar`, `eliminar` | POST | CRUD |
| `indicadores` | GET | KPI y series para gráficas |
| `consulta` | POST `{sql}` | Resultado de un SELECT (solo lectura, máx. 1000 filas) |
| `rendimiento` | GET | Tiempos por tabla, tamaño de BD, versiones |

## Incidencias y soluciones

| Incidencia | Causa | Solución |
|---|---|---|
| La base de datos solo tenía 2 clientes de prueba | El `redkyber.db` se creó con el instalador (modelo sencillo) y nunca se cargaron `schema.sql` y `demo.sql` | Regenerar la BD con el esquema aeronáutico y los datos de demostración |
| `FOREIGN KEY constraint failed` al cargar los datos | Una línea de pedido apuntaba al producto 9, que no existe (solo hay 8) | Corregir la línea. Las claves ajenas activadas (`PRAGMA foreign_keys = ON`) detectaron el error |
| Totales de pedidos que no cuadraban con sus líneas | Datos de demo escritos a mano | Consulta de verificación `SUM(cantidad*precio_unitario)` agrupada por pedido y corrección de los totales |
| Las extracciones salían con 2 horas de diferencia | PHP CLI usa UTC por defecto | `date_default_timezone_set('Europe/Madrid')` |
| La gráfica de informes salía por defecto con "Nº por fecha" (sin información útil) | Se elegía la primera columna de texto | Ordenar las columnas por número de valores distintos y empezar por la más agrupable (estado, tipo, departamento) |
| Riesgo: la consola SQL permitiría borrar datos | Ejecutar SQL escrito por el usuario | Abrir una conexión `SQLITE3_OPEN_READONLY`, aceptar solo `SELECT`/`WITH` y una única sentencia. Probado: `DELETE` y `DROP` se rechazan |
| `extraccion.php` accesible desde el navegador | Está dentro de la carpeta pública | Responde 403 si no se ejecuta desde la terminal (`php_sapi_name()`) |

## Cómo se ha desarrollado

El historial de cambios está en git (repositorio `2do-DAM-Sistemas-de-gestion-empresarial`), un commit por incremento.
La base es mi versión de la unidad 2. Las ampliaciones de esta unidad se han hecho con ayuda de IA (Claude),
siguiendo como referencia lo trabajado en clase (gráficas SVG, exportación CSV, reporting, monitorización y extracción).
