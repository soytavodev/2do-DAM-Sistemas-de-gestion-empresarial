# Nota sobre los dos paquetes de esta carpeta

En clase se subieron dos versiones de Universo + Darkorange. Las copio tal como están en el repositorio del profesor.

- **`jocarsa-universo-darkorange-CODIGO-COMPLETO/`**: es la versión que funciona. Probada el 04/11/2026 con `php -S`: Universo carga sus proyectos y Darkorange muestra el dashboard y las entidades del proyecto.
- **`jocarsa-fusion-reempaquetado-20261028/`**: no arranca tal como está empaquetado.
  - El `index.html` de Darkorange está dentro de `darkorange/data/`, no en `darkorange/`.
  - Los archivos de Universo están dentro de `universo/api/` y no hay `universo/data/application.sqlite`, así que la API de Darkorange responde «No hay proyectos en Universo».

  Lo dejo como referencia; la versión corregida es la de `CODIGO-COMPLETO`, que el profesor volvió a subir en `005-Creación de formularios personalizados/008-…`.

Cómo probarlo: desde la carpeta `jocarsa-universo-darkorange-CODIGO-COMPLETO`, ejecutar `php -S localhost:8000` y abrir `http://localhost:8000/universo/index.html` y `http://localhost:8000/darkorange/index.html`.
