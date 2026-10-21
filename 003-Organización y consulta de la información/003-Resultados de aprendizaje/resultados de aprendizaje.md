# Resultado de aprendizaje 3

## Resultado de aprendizaje

Realiza operaciones de gestión, consulta y análisis de la información siguiendo las especificaciones de diseño y utilizando las herramientas proporcionadas por los sistemas ERP-CRM.

## Criterios de evaluación

### a) Se han utilizado herramientas y lenguajes de consulta y manipulación de datos proporcionados por los sistemas ERP-CRM.

Se ha trabajado con SQL sobre SQLite desde PHP. En los ejercicios se crearon tablas a partir de un esquema (006-esquema.php), se guardaron y listaron registros (010-guardar.php y 011-listar.php) y se definió el modelo de datos por entidades y campos (001-Definición de campos). En REDKYBER la API (api/superapi.php) hace el CRUD completo con sentencias preparadas (INSERT, UPDATE, DELETE) y calcula los indicadores con consultas de agregación (SUM, AVG, COUNT, GROUP BY y JOIN entre pedidos, clientes, líneas de pedido y productos). Además se ha añadido una consola SQL que permite lanzar consultas SELECT sobre una conexión de solo lectura, con consultas de ejemplo como "facturación por cliente" o "componentes con poco stock".

### b) Se han generado formularios.

En los ejercicios se trabajaron los controles de formulario, las etiquetas, las plantillas y la recogida de datos con JavaScript (001 a 012 de Interfaces de entrada de datos). En REDKYBER los formularios se generan automáticamente a partir de la estructura de cada tabla (PRAGMA table_info), así que sirven para cualquier modelo de datos. En esta unidad se han mejorado: cada campo usa el control adecuado según su tipo (número, fecha, email o teléfono) y las claves ajenas, como cliente_id o producto_id, se eligen en un desplegable que muestra el nombre del registro relacionado en lugar del número.

### c) Se han generado informes.

En los ejercicios se construyó un modelo de informe con tablas, cabeceras generadas con JavaScript, reordenación, filtros y sumatorios (004-Informes y listados). En REDKYBER se ha creado el módulo Informes (nucleo/informes.js), que reúne todas las tablas en un documento con fecha, filtros por columna, ordenación al pulsar la cabecera, fila de totales (suma, media, mínimo y máximo) y una gráfica configurable para cada tabla. El informe tiene estilos de impresión para guardarlo como PDF.

### d) Se han exportado datos e informes.

El profesor exportaba a CSV. En REDKYBER se ha creado nucleo/exportar.js, que exporta a cinco formatos: CSV (con BOM para Excel y protección contra fórmulas), JSON, HTML, Markdown y XML. La exportación está disponible en cada entidad, en cada tabla del informe (solo las filas filtradas y en el orden visible) y en los resultados de la consola SQL. Los informes completos se exportan también a PDF desde el botón Imprimir.

### e) Se han automatizado las extracciones de datos mediante procesos.

En los ejercicios se preparó un script en Python para ejecutarlo con cron (008-preparo dos cosas para el cron.py y 009-mi comando de cron.sh) y se guardaron datos en CSV y SQLite desde PHP (009-Procesos de extracción). En REDKYBER se ha creado servicios/extraccion.php, que se programa con cron (por ejemplo, todos los días a las 02:00). En cada ejecución crea una carpeta con la fecha y la hora, guarda un CSV por tabla y un resumen.json con los indicadores del momento, y añade una línea en registro.log. Así se va formando un pequeño almacén de datos histórico. El script solo se puede ejecutar desde la terminal.

### f) Se ha verificado el rendimiento del sistema ERP-CRM.

En los ejercicios se recorrieron carpetas con os.walk para medir tamaños y se guardaron registros periódicos del sistema (007-Herramientas de monitorización). En REDKYBER se ha añadido el módulo Rendimiento, que mide el tiempo de respuesta de la API desde el navegador, el tiempo de lectura de cada tabla y el de cálculo de los indicadores en el servidor (con hrtime), el tamaño de la base de datos, la memoria usada por PHP y las versiones de PHP y SQLite. En las pruebas la API responde en unos 7 ms y cada tabla se lee en menos de 0,1 ms con 73 registros en total.

### g) Se han documentado las operaciones realizadas y las incidencias observadas.

Las operaciones están documentadas en el README.md del proyecto: cómo ponerlo en marcha, cómo regenerar la base de datos, las rutas de la API y cómo programar la extracción con cron. También hay una tabla de incidencias con su causa y su solución. Por ejemplo, la base de datos solo tenía datos de prueba porque no se habían cargado schema.sql y demo.sql; al cargarlos falló una clave ajena (una línea apuntaba a un producto que no existía); y las extracciones salían con dos horas de diferencia porque PHP usa UTC por defecto. Cada cambio queda registrado como un commit en git.

### h) Se ha obtenido información relevante a partir de los datos procesados.

El dashboard muestra indicadores reales calculados en SQL: facturación total (5.724 M€), número de pedidos (14), ticket medio (unos 409 M€) y pedidos sin entregar (11). Las gráficas muestran la evolución de la facturación por mes (con el máximo en septiembre), los pedidos por estado, los mejores clientes, las ventas por país, los aviones vendidos por tipo, el salario medio por departamento y el stock de componentes. Con la consola SQL se pueden detectar, por ejemplo, los componentes con stock bajo y su proveedor, para planificar compras.
