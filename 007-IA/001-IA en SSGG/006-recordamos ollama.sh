# En clase se usa granite4.1:8b; en mi equipo (sin GPU, 11 GB de RAM) uso qwen2.5:1.5b, que ya está instalado.

https://ollama.com/download

curl -fsSL https://ollama.com/install.sh | sh

ollama list

ollama run qwen2.5:1.5b "Quien es Jose Vicente Carratala"

ollama run qwen2.5:1.5b "Dame la consulta SQL para seleccionar los clientes que sean de Valencia-. Solo quiero el codigo SQL. No me des nada de markdown ni fences."

ollama run qwen2.5:1.5b "Dame la consulta SQL para contar los clientes que sean de Valencia-. Solo quiero el codigo SQL. No me des nada de markdown ni fences. El schema de la tabla es: CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellidos TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    fecha_nacimiento TEXT,
    fecha_registro TEXT,
    activo INTEGER DEFAULT 1
)"