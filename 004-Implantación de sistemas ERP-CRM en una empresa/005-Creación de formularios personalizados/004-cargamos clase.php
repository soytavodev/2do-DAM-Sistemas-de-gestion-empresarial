<?php

  require_once "formularios.php";

  $json = file_get_contents("formularios.json");

  $formulario = new Formularios($json);

  echo $formulario->generar();

?>
