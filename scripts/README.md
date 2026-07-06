# Scripts

Utilidades del repositorio `games`.

## `install-hermes.sh`

Instala [hermes-agent](https://github.com/NousResearch/hermes-agent) de Nous
Research: un asistente de IA con uso de herramientas (tool-calling) y un ciclo
propio de creacion de skills.

### Uso

```bash
# Instalar (sin abrir el wizard interactivo)
./scripts/install-hermes.sh

# Instalar y abrir el wizard de configuracion (proveedor de LLM + API key)
./scripts/install-hermes.sh --setup
```

El script:

1. Verifica que `curl` este disponible.
2. Si `hermes` ya esta instalado, no reinstala (sugiere `hermes update`).
3. Descarga y ejecuta el instalador oficial de Nous Research
   (`https://hermes-agent.nousresearch.com/install.sh`).

### Que instala

- Comando `hermes` enlazado en `/usr/local/bin/hermes`.
- Codigo del agente en `/usr/local/lib/hermes-agent` (venv de Python 3.11
  gestionado por `uv`).
- Config y datos del usuario en `~/.hermes/` (`config.yaml`, `.env`,
  `sessions/`, `logs/`, `cron/`, `skills/`).

> **Nota:** hermes-agent se instala a nivel de sistema, **no** dentro de este
> repositorio. Este script solo automatiza y versiona *como* instalarlo.

### Despues de instalar

```bash
hermes setup    # configurar proveedor de LLM y API key
hermes          # iniciar el agente
hermes doctor   # diagnostico de la instalacion
hermes update   # actualizar a la ultima version
```

### Requisitos

`bash` y `curl`. El instalador oficial resuelve el resto de dependencias
(uv, Python 3.11, Node.js, ripgrep, ffmpeg).
