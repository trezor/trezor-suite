#!/bin/bash
# Shared utilities — sourced by analyze.sh and fix.sh.

_commas() {
    local n result="" i
    n=$(printf "%d" "${1:-0}")
    local len=${#n}
    for (( i = 0; i < len; i++ )); do
        result="${result}${n:$i:1}"
        local remaining=$(( len - i - 1 ))
        if (( remaining > 0 && remaining % 3 == 0 )); then
            result="${result},"
        fi
    done
    printf "%s" "$result"
}

# Append one token-usage line to a log file and echo it to stdout.
# Usage: report_usage <claude-json-output> <token-log-file> <agent-name>
report_usage() {
    local json_file="$1" log_file="$2" agent="$3"

    local d
    d=$(jq 'if type == "array"
            then (map(select(.type == "result")) | first // {})
            else .
            end' "$json_file")

    local turns inp out cw cr cost dur_ms
    IFS=$'\t' read -r turns inp out cw cr cost dur_ms < <(
        printf "%s" "$d" | jq -r '[
            (.num_turns // "N/A" | tostring),
            (.usage.input_tokens // 0 | tostring),
            (.usage.output_tokens // 0 | tostring),
            (.usage.cache_creation_input_tokens // 0 | tostring),
            (.usage.cache_read_input_tokens // 0 | tostring),
            (.total_cost_usd // "" | tostring),
            (.duration_ms // "" | tostring)
        ] | @tsv'
    )

    local turns_f
    [ "$turns" = "N/A" ] && turns_f="N/A" || turns_f=$(printf "%3d" "$turns")

    local inp_f out_f cw_f cr_f
    inp_f=$(printf "%9s" "$(_commas "$inp")")
    out_f=$(printf "%9s" "$(_commas "$out")")
    cw_f=$(printf "%9s"  "$(_commas "$cw")")
    cr_f=$(printf "%9s"  "$(_commas "$cr")")

    local cost_str
    if [ -n "$cost" ]; then
        cost_str=$(LC_NUMERIC=C printf '$%8.4f' "$cost")
    else
        cost_str="         "  # 9 spaces — same width as a populated cost field
    fi

    local dur_str
    if [ -n "$dur_ms" ]; then
        dur_str=$(printf "%5ds" "$(( dur_ms / 1000 ))")
    else
        dur_str="      "  # 6 spaces
    fi

    local ts entry
    ts=$(date -u +"%Y-%m-%d %H:%MZ")
    entry=$(printf "%s  %-20s  turns=%s  in=%s  out=%s  cache_w=%s  cache_r=%s  %s  %s" \
        "$ts" "$agent" "$turns_f" "$inp_f" "$out_f" "$cw_f" "$cr_f" "$cost_str" "$dur_str")

    printf "%s\n" "$entry"
    printf "%s\n" "$entry" >> "$log_file"
}
