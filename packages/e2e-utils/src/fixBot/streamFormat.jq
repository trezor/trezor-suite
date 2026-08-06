# Renders the agent's `--output-format stream-json` NDJSON as a readable
# transcript, one envelope per line, while the run is still going.
#
# Tool inputs are emitted decoded rather than as JSON: GitHub redacts secrets
# from workflow logs by exact match, and JSON escaping would break that match.

def render_result:
    if type == "array" then [.[] | .text] | join("\n") else . end;

# Limit tool results to sustain readability
def MAX_RESULT_LINES: 40;

def cap:
    split("\n")
    | if length > MAX_RESULT_LINES then
        .[:MAX_RESULT_LINES] + ["… (\(length - MAX_RESULT_LINES) more lines)"]
      else . end
    | join("\n");

if .type == "assistant" then
    .message.content[]
    | if .type == "tool_use" then
        "→ \(.name)",
        (.input // {} | to_entries[]
            | "    \(.key): \(if (.value | type) == "string" then .value else (.value | tojson) end)")
      elif .type == "text" then .text
      else empty
      end

elif .type == "user" then
    .message.content[]
    | select(.type == "tool_result")
    | "← \(if .is_error then "error" else "ok" end)", (.content | render_result | cap)

else empty
end
