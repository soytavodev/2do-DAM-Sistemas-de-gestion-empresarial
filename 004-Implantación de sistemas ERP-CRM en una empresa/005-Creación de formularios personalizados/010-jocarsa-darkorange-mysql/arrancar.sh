#!/usr/bin/env bash
# Arranca el ejercicio con el usuario MySQL propio (no root).
# Lee las credenciales de .env (archivo local, fuera de git) y se las pasa a
# clases/Conexion.php mediante las variables de entorno JOCARSA_DB_*.
cd "$(dirname "$0")"
if [ ! -f .env ]; then echo "Falta el archivo .env con JOCARSA_DB_USER y JOCARSA_DB_PASSWORD"; exit 1; fi
set -a; . ./.env; set +a
echo "Abre http://localhost:${PUERTO:-8000}/index.html"
php -S "localhost:${PUERTO:-8000}"
