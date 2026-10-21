<?php
// REDKYBER · Extracción automática de datos (almacén de datos sencillo)
//
// Uso manual:   php servicios/extraccion.php
// Uso con cron: crontab -e  y añadir (todos los días a las 02:00):
//   0 2 * * * cd /ruta/a/REDKYBER && php servicios/extraccion.php >> data/extracciones/cron.log 2>&1
//
// Cada ejecución crea data/extracciones/AAAA-MM-DD_HHMMSS/ con un CSV por tabla,
// un resumen.json con los indicadores del momento y añade una línea a registro.log

if (php_sapi_name() !== 'cli') { http_response_code(403); exit("Solo se puede ejecutar desde la terminal\n"); }

date_default_timezone_set('Europe/Madrid');
$base = __DIR__ . '/../data';
$db = new SQLite3($base . '/redkyber.db', SQLITE3_OPEN_READONLY);
$db->enableExceptions(true);

$inicio = hrtime(true);
$carpeta = $base . '/extracciones/' . date('Y-m-d_His');
if (!is_dir($carpeta) && !mkdir($carpeta, 0775, true)) exit("[ERROR] No se pudo crear $carpeta\n");

$tablas = [];
$r = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
while ($f = $r->fetchArray(SQLITE3_ASSOC)) $tablas[] = $f['name'];

$resumen = ['fecha' => date('c'), 'tablas' => []];
foreach ($tablas as $tabla) {
    $consulta = $db->query('SELECT * FROM "' . str_replace('"', '""', $tabla) . '"');
    $archivo = fopen("$carpeta/$tabla.csv", 'w');
    fwrite($archivo, "\xEF\xBB\xBF"); // BOM para que Excel lea bien los acentos
    $columnas = [];
    for ($i = 0; $i < $consulta->numColumns(); $i++) $columnas[] = $consulta->columnName($i);
    fputcsv($archivo, $columnas, ';', '"', '');
    $n = 0;
    while ($fila = $consulta->fetchArray(SQLITE3_ASSOC)) { fputcsv($archivo, $fila, ';', '"', ''); $n++; }
    fclose($archivo);
    $resumen['tablas'][$tabla] = $n;
}

// Indicadores del momento: así se puede comparar la evolución entre extracciones
if (in_array('pedidos', $tablas)) {
    $resumen['facturacion'] = $db->querySingle("SELECT IFNULL(SUM(total),0) FROM pedidos");
    $resumen['pedidos_sin_entregar'] = $db->querySingle("SELECT COUNT(*) FROM pedidos WHERE estado <> 'Entregado'");
}
$resumen['duracion_ms'] = round((hrtime(true) - $inicio) / 1e6, 2);
file_put_contents("$carpeta/resumen.json", json_encode($resumen, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$linea = sprintf("%s | %d tablas | %d registros | %s ms | %s\n",
    date('Y-m-d H:i:s'), count($tablas), array_sum($resumen['tablas']), $resumen['duracion_ms'], basename($carpeta));
file_put_contents($base . '/extracciones/registro.log', $linea, FILE_APPEND);
echo "[OK] " . $linea;
