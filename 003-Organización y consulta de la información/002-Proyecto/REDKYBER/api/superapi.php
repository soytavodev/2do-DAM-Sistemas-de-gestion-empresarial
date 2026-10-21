<?php
header('Content-Type: application/json; charset=utf-8');
$db = new SQLite3('../data/redkyber.db');
$db->enableExceptions(true);

function tablasPermitidas($db){
  $resultado=$db->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  $tablas=[]; while($fila=$resultado->fetchArray(SQLITE3_ASSOC)) $tablas[]=$fila['name'];
  return $tablas;
}
function validarTabla($db,$tabla){ if(!in_array($tabla,tablasPermitidas($db),true)) throw new Exception('Tabla no válida'); return '"'.str_replace('"','""',$tabla).'"'; }
function estructura($db,$tabla){
  $segura=validarTabla($db,$tabla); $r=$db->query("PRAGMA table_info($segura)"); $columnas=[]; $pk=null;
  while($f=$r->fetchArray(SQLITE3_ASSOC)){ $columnas[]=$f; if($f['pk']) $pk=$f['name']; }
  if(!$pk) throw new Exception('La tabla no tiene clave primaria');
  return [$columnas,$pk];
}
function entrada(){ return json_decode(file_get_contents('php://input'),true) ?: []; }
function filas($db,$sql){ $r=$db->query($sql); $filas=[]; while($f=$r->fetchArray(SQLITE3_ASSOC)) $filas[]=$f; return $filas; }

// Indicadores de negocio calculados con SQL (agregaciones y JOIN) para el dashboard
function indicadores($db){
  $tablas=tablasPermitidas($db);
  $hay=fn(...$t)=>!array_diff($t,$tablas);
  $kpi=[]; $series=[];
  if($hay('pedidos')){
    $kpi['facturacion']=$db->querySingle("SELECT IFNULL(SUM(total),0) FROM pedidos");
    $kpi['pedidos']=$db->querySingle("SELECT COUNT(*) FROM pedidos");
    $kpi['ticket_medio']=$db->querySingle("SELECT IFNULL(AVG(total),0) FROM pedidos");
    $kpi['pendientes']=$db->querySingle("SELECT COUNT(*) FROM pedidos WHERE estado<>'Entregado'");
    $series['ventas_mes']=filas($db,"SELECT substr(fecha,1,7) AS etiqueta, SUM(total) AS valor FROM pedidos GROUP BY etiqueta ORDER BY etiqueta");
    $series['pedidos_estado']=filas($db,"SELECT estado AS etiqueta, COUNT(*) AS valor FROM pedidos GROUP BY estado ORDER BY valor DESC");
  }
  if($hay('pedidos','clientes')){
    $series['clientes_top']=filas($db,"SELECT c.nombre AS etiqueta, SUM(p.total) AS valor FROM pedidos p JOIN clientes c ON c.identificador=p.cliente_id GROUP BY c.identificador ORDER BY valor DESC LIMIT 6");
    $series['ventas_pais']=filas($db,"SELECT c.pais AS etiqueta, SUM(p.total) AS valor FROM pedidos p JOIN clientes c ON c.identificador=p.cliente_id GROUP BY c.pais ORDER BY valor DESC");
  }
  if($hay('lineaspedido','productos')){
    $series['unidades_tipo']=filas($db,"SELECT pr.tipo AS etiqueta, SUM(l.cantidad) AS valor FROM lineaspedido l JOIN productos pr ON pr.identificador=l.producto_id GROUP BY pr.tipo ORDER BY valor DESC");
  }
  if($hay('empleados')){
    $kpi['empleados']=$db->querySingle("SELECT COUNT(*) FROM empleados");
    $series['salario_departamento']=filas($db,"SELECT departamento AS etiqueta, ROUND(AVG(salario)) AS valor FROM empleados GROUP BY departamento ORDER BY valor DESC");
  }
  if($hay('componentes')){
    $series['stock_tipo']=filas($db,"SELECT tipo AS etiqueta, SUM(stock) AS valor FROM componentes GROUP BY tipo ORDER BY valor DESC");
  }
  return ['kpi'=>$kpi,'series'=>$series];
}

// Mide cuánto tarda cada consulta y el tamaño de la base de datos
function rendimiento($db){
  $ruta=realpath(__DIR__.'/../data/redkyber.db');
  $tablas=[];
  foreach(tablasPermitidas($db) as $t){
    $inicio=hrtime(true);
    $n=$db->querySingle('SELECT COUNT(*) FROM "'.str_replace('"','""',$t).'"');
    filas($db,'SELECT * FROM "'.str_replace('"','""',$t).'"');
    $tablas[]=['tabla'=>$t,'registros'=>$n,'ms'=>round((hrtime(true)-$inicio)/1e6,3)];
  }
  $inicio=hrtime(true); indicadores($db); $msIndicadores=round((hrtime(true)-$inicio)/1e6,3);
  return [
    'php'=>PHP_VERSION,
    'sqlite'=>SQLite3::version()['versionString'],
    'tamano_bytes'=>filesize($ruta),
    'memoria_pico_kb'=>round(memory_get_peak_usage()/1024),
    'ms_indicadores'=>$msIndicadores,
    'tablas'=>$tablas
  ];
}

try{
  $ruta=$_GET['ruta'] ?? '';
  switch($ruta){
    case 'modulos': echo json_encode(['ventas','rrhh','facturacion','compras']); break;
    case 'entidades': echo json_encode(tablasPermitidas($db),JSON_UNESCAPED_UNICODE); break;
    case 'estructura':
      [$columnas,$pk]=estructura($db,$_GET['tabla'] ?? '');
      // Claves ajenas: el formulario las muestra como desplegables con los registros relacionados
      $ajenas=[];
      foreach(filas($db,"PRAGMA foreign_key_list(".validarTabla($db,$_GET['tabla']).")") as $fk){
        $ref=validarTabla($db,$fk['table']); [$colsRef]=estructura($db,$fk['table']);
        $texto=array_values(array_filter(array_column($colsRef,'name'),fn($c)=>$c!==$fk['to'] && !str_ends_with($c,'_id')))[0] ?? $fk['to'];
        $ajenas[$fk['from']]=filas($db,"SELECT \"".str_replace('"','""',$fk['to'])."\" AS valor, \"".str_replace('"','""',$texto)."\" AS texto FROM $ref ORDER BY texto");
      }
      echo json_encode(['columnas'=>$columnas,'clavePrimaria'=>$pk,'ajenas'=>$ajenas],JSON_UNESCAPED_UNICODE); break;
    case 'tabla':
      $tabla=$_GET['tabla'] ?? ''; $segura=validarTabla($db,$tabla); [$columnas,$pk]=estructura($db,$tabla);
      $r=$db->query("SELECT * FROM $segura ORDER BY \"".str_replace('"','""',$pk)."\" DESC"); $registros=[];
      while($f=$r->fetchArray(SQLITE3_ASSOC)) $registros[]=$f;
      echo json_encode(['columnas'=>$columnas,'clavePrimaria'=>$pk,'registros'=>$registros],JSON_UNESCAPED_UNICODE); break;
    case 'crear':
      $e=entrada(); $tabla=$e['tabla']??''; $datos=$e['datos']??[]; $segura=validarTabla($db,$tabla); [$columnas,$pk]=estructura($db,$tabla);
      $permitidas=array_column(array_filter($columnas,fn($c)=>!$c['pk']),'name'); $datos=array_intersect_key($datos,array_flip($permitidas));
      if(!$datos) throw new Exception('No hay datos para insertar');
      $campos=array_keys($datos); $sql="INSERT INTO $segura (".implode(',',array_map(fn($c)=>'"'.str_replace('"','""',$c).'"',$campos)).") VALUES (".implode(',',array_fill(0,count($campos),'?')).")";
      $stmt=$db->prepare($sql); $i=1; foreach($datos as $v) $stmt->bindValue($i++,$v,SQLITE3_TEXT); $stmt->execute(); echo json_encode(['ok'=>true]); break;
    case 'actualizar':
      $e=entrada(); $tabla=$e['tabla']??''; $id=$e['id']??null; $datos=$e['datos']??[]; $segura=validarTabla($db,$tabla); [$columnas,$pk]=estructura($db,$tabla);
      $permitidas=array_column(array_filter($columnas,fn($c)=>!$c['pk']),'name'); $datos=array_intersect_key($datos,array_flip($permitidas));
      $sets=implode(',',array_map(fn($c)=>'"'.str_replace('"','""',$c).'" = ?',array_keys($datos))); $stmt=$db->prepare("UPDATE $segura SET $sets WHERE \"".str_replace('"','""',$pk)."\" = ?");
      $i=1; foreach($datos as $v) $stmt->bindValue($i++,$v,SQLITE3_TEXT); $stmt->bindValue($i,$id); $stmt->execute(); echo json_encode(['ok'=>true]); break;
    case 'eliminar':
      $e=entrada(); $tabla=$e['tabla']??''; $id=$e['id']??null; $segura=validarTabla($db,$tabla); [, $pk]=estructura($db,$tabla);
      $stmt=$db->prepare("DELETE FROM $segura WHERE \"".str_replace('"','""',$pk)."\" = ?"); $stmt->bindValue(1,$id); $stmt->execute(); echo json_encode(['ok'=>true]); break;
    case 'indicadores': echo json_encode(indicadores($db),JSON_UNESCAPED_UNICODE); break;
    case 'rendimiento': echo json_encode(rendimiento($db),JSON_UNESCAPED_UNICODE); break;
    case 'consulta':
      // Consola SQL: conexión de SOLO LECTURA y una única sentencia SELECT
      $sql=trim(entrada()['sql'] ?? '');
      $sql=rtrim($sql,"; \n\r\t");
      if(!preg_match('/^(SELECT|WITH)\b/i',$sql) || str_contains($sql,';')) throw new Exception('Solo se permite una sentencia SELECT');
      $lectura=new SQLite3(__DIR__.'/../data/redkyber.db',SQLITE3_OPEN_READONLY);
      $lectura->enableExceptions(true);
      $inicio=hrtime(true);
      $r=$lectura->query($sql); $columnas=[]; $registros=[];
      for($i=0;$i<$r->numColumns();$i++) $columnas[]=['name'=>$r->columnName($i)];
      while(($f=$r->fetchArray(SQLITE3_ASSOC)) && count($registros)<1000) $registros[]=$f;
      $ms=round((hrtime(true)-$inicio)/1e6,3);
      $lectura->close();
      echo json_encode(['columnas'=>$columnas,'registros'=>$registros,'ms'=>$ms],JSON_UNESCAPED_UNICODE); break;
    default: throw new Exception('Ruta no válida');
  }
}catch(Throwable $e){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>$e->getMessage()],JSON_UNESCAPED_UNICODE); }
$db->close();
?>
