#!/usr/bin/env bash
# ============================================================================
# install-hermes.sh
# ----------------------------------------------------------------------------
# Instala hermes-agent (https://github.com/NousResearch/hermes-agent) usando el
# instalador oficial de Nous Research.
#
# hermes-agent es un asistente de IA con capacidad de usar herramientas y de
# crear/mejorar sus propias skills. Se instala a nivel de sistema (no dentro de
# este repo): el codigo queda en /usr/local/lib/hermes-agent y el comando
# `hermes` se enlaza en /usr/local/bin.
#
# Uso:
#   ./scripts/install-hermes.sh              # instala (sin abrir el wizard)
#   ./scripts/install-hermes.sh --setup      # instala y abre el wizard de setup
#   ./scripts/install-hermes.sh --help
#
# Requisitos: bash, curl. El instalador oficial resuelve el resto (uv, Python
# 3.11, Node.js, ripgrep, ffmpeg).
# ============================================================================

set -euo pipefail

INSTALLER_URL="https://hermes-agent.nousresearch.com/install.sh"
RUN_SETUP=false

for arg in "$@"; do
    case "$arg" in
        --setup)
            RUN_SETUP=true
            ;;
        -h|--help)
            grep -E '^#( |$)' "$0" | sed -E 's/^# ?//'
            exit 0
            ;;
        *)
            echo "Argumento desconocido: $arg" >&2
            echo "Usa --help para ver las opciones." >&2
            exit 1
            ;;
    esac
done

if ! command -v curl >/dev/null 2>&1; then
    echo "Error: se requiere 'curl' para descargar el instalador." >&2
    exit 1
fi

if command -v hermes >/dev/null 2>&1; then
    echo "hermes ya esta instalado: $(command -v hermes)"
    hermes --version 2>/dev/null || true
    echo "Para actualizar ejecuta: hermes update"
    exit 0
fi

echo "==> Descargando y ejecutando el instalador oficial de hermes-agent..."
if [ "$RUN_SETUP" = true ]; then
    curl -fsSL "$INSTALLER_URL" | bash
else
    # --skip-setup evita el wizard interactivo (proveedor de LLM + API key).
    curl -fsSL "$INSTALLER_URL" | bash -s -- --skip-setup
fi

echo
echo "==> Instalacion terminada."
echo "    Siguiente paso: configura tu proveedor de LLM y API key con:"
echo "        hermes setup"
echo "    Luego inicia el agente con:"
echo "        hermes"
