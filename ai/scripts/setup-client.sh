#!/usr/bin/env bash
set -euo pipefail

# ── AI Memory Gateway – Client Setup ─────────────────────────
#
# Configures your editor to connect to the Memory Gateway MCP server.
# Run:  ./ai/scripts/setup-client.sh
#
# Environment variables:
#   GATEWAY_URL  – override the default gateway URL
#   GATEWAY_TOKEN – JWT bearer token (optional in dev)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

GATEWAY_URL="${GATEWAY_URL:-http://memory-gateway.internal:8080/mcp}"
GATEWAY_TOKEN="${GATEWAY_TOKEN:-}"

# ── Helpers ────────────────────────────────────────────────────

info()  { printf '\033[1;34m[info]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[1;32m[ok]\033[0m    %s\n' "$*"; }
warn()  { printf '\033[1;33m[warn]\033[0m  %s\n' "$*"; }
err()   { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; }

write_json() {
    local file="$1" content="$2"
    mkdir -p "$(dirname "$file")"
    printf '%s\n' "$content" > "$file"
    ok "Wrote $file"
}

prompt_choice() {
    local prompt="$1" default="$2"
    read -rp "$prompt [$default]: " answer
    printf '%s' "${answer:-$default}"
}

# ── Build JSON snippet ────────────────────────────────────────

mcp_json_block() {
    if [ -n "$GATEWAY_TOKEN" ]; then
        cat <<EOF
{
    "mcpServers": {
        "memory-gateway": {
            "type": "url",
            "url": "$GATEWAY_URL",
            "headers": {
                "Authorization": "Bearer $GATEWAY_TOKEN"
            }
        }
    }
}
EOF
    else
        cat <<EOF
{
    "mcpServers": {
        "memory-gateway": {
            "type": "url",
            "url": "$GATEWAY_URL"
        }
    }
}
EOF
    fi
}

vscode_mcp_json() {
    if [ -n "$GATEWAY_TOKEN" ]; then
        cat <<EOF
{
    "servers": {
        "memory-gateway": {
            "type": "http",
            "url": "$GATEWAY_URL",
            "headers": {
                "Authorization": "Bearer $GATEWAY_TOKEN"
            }
        }
    }
}
EOF
    else
        cat <<EOF
{
    "servers": {
        "memory-gateway": {
            "type": "http",
            "url": "$GATEWAY_URL"
        }
    }
}
EOF
    fi
}

# ── Editor setup functions ────────────────────────────────────

setup_claude_code() {
    local target="$REPO_ROOT/.mcp.json"
    if [ -f "$target" ]; then
        warn "$target already exists – skipping (delete it first to regenerate)"
        return
    fi
    write_json "$target" "$(mcp_json_block)"
}

setup_vscode() {
    local target="$REPO_ROOT/.vscode/mcp.json"
    if [ -f "$target" ]; then
        warn "$target already exists – skipping"
        return
    fi
    write_json "$target" "$(vscode_mcp_json)"
}

setup_cursor() {
    local target="$REPO_ROOT/.cursor/mcp.json"
    if [ -f "$target" ]; then
        warn "$target already exists – skipping"
        return
    fi
    write_json "$target" "$(mcp_json_block)"
}

setup_windsurf() {
    local target="$HOME/.codeium/windsurf/mcp_config.json"
    if [ -f "$target" ]; then
        warn "$target already exists – skipping"
        return
    fi
    if [ -n "$GATEWAY_TOKEN" ]; then
        write_json "$target" "$(cat <<EOF
{
    "mcpServers": {
        "memory-gateway": {
            "serverUrl": "$GATEWAY_URL",
            "headers": {
                "Authorization": "Bearer $GATEWAY_TOKEN"
            }
        }
    }
}
EOF
)"
    else
        write_json "$target" "$(cat <<EOF
{
    "mcpServers": {
        "memory-gateway": {
            "serverUrl": "$GATEWAY_URL"
        }
    }
}
EOF
)"
    fi
}

setup_zed() {
    local target="$HOME/.config/zed/settings.json"
    if [ -f "$target" ]; then
        warn "$target already exists – merge manually:"
        printf '  "context_servers": { "memory-gateway": { "settings": { "url": "%s" } } }\n' "$GATEWAY_URL"
        return
    fi
    write_json "$target" "$(cat <<EOF
{
    "context_servers": {
        "memory-gateway": {
            "settings": {
                "url": "$GATEWAY_URL"
            }
        }
    }
}
EOF
)"
}

# ── Main ──────────────────────────────────────────────────────

echo ""
info "AI Memory Gateway – Client Setup"
info "Gateway URL: $GATEWAY_URL"
[ -n "$GATEWAY_TOKEN" ] && info "Token: ${GATEWAY_TOKEN:0:8}…" || warn "No GATEWAY_TOKEN set (auth will be skipped in dev mode)"
echo ""

PS3="Select your editor (number): "
select editor in "Claude Code" "VS Code" "Cursor" "Windsurf" "Zed" "All project configs" "Quit"; do
    case $editor in
        "Claude Code")   setup_claude_code; break ;;
        "VS Code")       setup_vscode;      break ;;
        "Cursor")        setup_cursor;       break ;;
        "Windsurf")      setup_windsurf;     break ;;
        "Zed")           setup_zed;          break ;;
        "All project configs")
            setup_claude_code
            setup_vscode
            setup_cursor
            break
            ;;
        "Quit") exit 0 ;;
        *) err "Invalid choice – pick a number from the list." ;;
    esac
done

echo ""
ok "Done! Restart your editor to pick up the MCP server."
