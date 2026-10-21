# Resultado de aprendizaje 2

## Resultado de aprendizaje

Implanta sistemas ERP-CRM interpretando la documentación técnica e identificando las diferentes opciones y módulos.

## Criterios de evaluación

### a) Se han identificado los módulos que componen el ERP-CRM.

Se ha separado el núcleo del sistema con respecto a los módulos. En REDKYBER el núcleo lo forman la interfaz (index.html, codigo.js y estilo.css) y la API (api/superapi.php), mientras que los módulos de negocio son ventas, rrhh, facturación y compras. Cada módulo trabaja sobre entidades de la base de datos, como clientes, productos, empleados, proveedores, pedidos, líneas de pedido y componentes.

### b) Se han realizado diferentes tipos de instalaciones.

Se han realizado varias versiones del sistema siguiendo una arquitectura cliente-servidor, con HTML en el cliente y PHP en el servidor conectados mediante fetch. Primero se alimentó la API con datos estáticos en JSON y después con una base de datos SQLite. Para la instalación se han instalado PHP y su extensión SQLite (php-cli y php-sqlite3) y se ha puesto en marcha el sistema en local con el servidor integrado de PHP (php -S localhost:8000). Como alternativa para un entorno de explotación, el mismo proyecto puede desplegarse en un servidor Apache con PHP.

### c) Se han configurado los módulos instalados.

Se ha creado la carpeta data con un archivo de configuración (config.php) que reúne los parámetros del sistema, como el nombre de la aplicación y el color corporativo. La interfaz lee estos parámetros al arrancar y los aplica mediante variables CSS, de modo que el sistema se personaliza sin tocar el código.

### d) Se han realizado instalaciones adaptadas a las necesidades planteadas en diferentes supuestos.

Se ha creado un instalador (instalador.html y api/instalar.php) que recibe un modelo de datos sencillo y genera automáticamente las tablas en la base de datos. Así el mismo sistema se adapta a las necesidades de cada empresa. Como ejemplo se han preparado un modelo básico (data/modelodedatos.txt) y el supuesto de una empresa aeronáutica (data/schema.sql y data/demo.sql).

### e) Se ha verificado el funcionamiento del ERP-CRM.

Se ha comprobado que el sistema carga los módulos y las entidades, muestra los registros de cada tabla y permite crear, editar y eliminar registros (CRUD). También se ha verificado el servicio de acceso servicios/salida.php, que devuelve toda la base de datos en formato JSON.

### f) Se han documentado las operaciones realizadas y las incidencias.

Las operaciones se han documentado con la herramienta jocarsa-documentacion, que genera un informe con la estructura del proyecto, el esquema de la base de datos y el código. Las incidencias se han recogido en un documento de depuración. Por ejemplo, PHP en Ubuntu no trae SQLite instalado, así que hubo que instalar php-sqlite3. Para encontrar errores se activó display_errors en php.ini y se revisaron los registros access.log y error.log de Apache.
