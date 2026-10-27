#!/usr/bin/env bash

show_help() {
    cat << EOF
Usage: $(basename "$0") [PR] [PLATFORM] [OPTIONS]
       $(basename "$0") [PLATFORM] [OPTIONS]

Generate a Slack-formatted PR message with stats and copy it to clipboard.
The line and file counts ignore whitespace-only changes, unlike the GitHub UI.

PR:
    GitHub pull request number or URL. Uses the current branch when omitted.

PLATFORM options:
    mobile, m       Use mobile icon (:iphone:)
    common, c       Use common icon (:commie:)
    desktop, d      Use desktop icon (:desktop_computer:) [default]
    yanas, y        Use Yanas TM icon (:typical-yanas:)

OPTIONS:
    -i, --icon NAME Add an extra emoji (repeatable). NAME may be with or
                    without colons (cherries or :cherries:).
    -h, --help      Show this help message

Environment variables:
    DEFAULT_SLACK_PR_ICON    Override the default icon (e.g., ":rocket:")

Examples:
    $(basename "$0")
    $(basename "$0") mobile
    $(basename "$0") 12345
    $(basename "$0") 12345 mobile
    $(basename "$0") 12345 mobile -i cherries
    $(basename "$0") 12345 mobile -i cherries -i rocket
    $(basename "$0") https://github.com/trezor/trezor-suite/pull/12345 m
    DEFAULT_SLACK_PR_ICON=":bug:" $(basename "$0") 12345

Requirements:
    - GitHub CLI (gh) must be installed and authenticated
    - Must run inside the PR's repository, with the PR branch on the remote 'origin'
    - When PR is omitted, the current branch must have a pull request

EOF
}

check_jq_available() {
    if ! command -v jq &> /dev/null; then
        echo -e "\033[0;31mError: Missing required dependency: jq\033[0m" >&2
        echo -e "Please install it before running this script." >&2
        return 1
    fi
}

install_gh_with_homebrew() {
    echo -e "\033[0;33mHomebrew detected. Would you like to install GitHub CLI now? (y/n)\033[0m"
    read -r response

    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "Please install it manually: https://cli.github.com/" >&2
        exit 1
    fi

    echo "Installing GitHub CLI..."
    if ! brew install gh; then
        echo -e "\033[0;31mInstallation failed.\033[0m" >&2
        exit 1
    fi

    echo -e "\033[0;32m✓ GitHub CLI installed successfully!\033[0m"
    echo -e "\033[0;33mAuthentication required. Running 'gh auth login'...\033[0m"

    if ! gh auth login; then
        echo -e "\033[0;31mAuthentication failed. Please run 'gh auth login' manually.\033[0m" >&2
        exit 1
    fi

    echo -e "\033[0;32m✓ Authentication successful! Please re-run the script.\033[0m"
    exit 0
}

check_gh_available() {
    if command -v gh &> /dev/null; then
        return 0
    fi

    echo -e "\033[0;31mError: GitHub CLI (gh) is not installed or not in PATH.\033[0m" >&2

    if command -v brew &> /dev/null; then
        install_gh_with_homebrew
    fi

    echo -e "Please install it: https://cli.github.com/" >&2
    return 1
}

is_platform() {
    case "$1" in
        mobile | m | common | c | desktop | d | yanas | y) return 0 ;;
        *) return 1 ;;
    esac
}

format_emoji() {
    local name="$1"

    if [[ -z "$name" ]]; then
        return 1
    fi

    if [[ "$name" == :* && "$name" == *: ]]; then
        echo "$name"
    else
        echo ":${name}:"
    fi
}

# Parses CLI args into globals:
#   PARSED_PR_REFERENCE, PARSED_PLATFORM, PARSED_EXTRA_EMOJIS (space-separated)
parse_arguments() {
    PARSED_PR_REFERENCE=""
    PARSED_PLATFORM=""
    PARSED_EXTRA_EMOJIS=""

    local positional=()
    local emoji

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h | --help)
                show_help
                return 2
                ;;
            -i | --icon)
                if [[ -z "${2:-}" || "$2" == -* ]]; then
                    echo -e "\033[0;31mError: $1 requires an emoji name.\033[0m
Use -h option for more info." >&2
                    return 1
                fi
                if ! emoji=$(format_emoji "$2"); then
                    echo -e "\033[0;31mError: Invalid emoji name for $1.\033[0m
Use -h option for more info." >&2
                    return 1
                fi
                PARSED_EXTRA_EMOJIS="${PARSED_EXTRA_EMOJIS}${PARSED_EXTRA_EMOJIS:+ }$emoji"
                shift 2
                ;;
            --icon=*)
                if ! emoji=$(format_emoji "${1#*=}"); then
                    echo -e "\033[0;31mError: Invalid emoji name for --icon.\033[0m
Use -h option for more info." >&2
                    return 1
                fi
                PARSED_EXTRA_EMOJIS="${PARSED_EXTRA_EMOJIS}${PARSED_EXTRA_EMOJIS:+ }$emoji"
                shift
                ;;
            --)
                shift
                positional+=("$@")
                break
                ;;
            -*)
                echo -e "\033[0;31mError: Unknown option '$1'.\033[0m
Use -h option for more info." >&2
                return 1
                ;;
            *)
                positional+=("$1")
                shift
                ;;
        esac
    done

    local first="${positional[0]:-}"
    local second="${positional[1]:-}"

    if [[ ${#positional[@]} -gt 2 ]]; then
        echo -e "\033[0;31mError: Too many arguments.\033[0m
Use -h option for more info." >&2
        return 1
    fi

    if is_platform "$first"; then
        PARSED_PLATFORM="$first"
    else
        PARSED_PR_REFERENCE="$first"
        PARSED_PLATFORM="$second"
    fi
}

resolve_pr_reference() {
    local pr_reference="$1"

    if [[ -n "$pr_reference" ]]; then
        echo "$pr_reference"
        return 0
    fi

    local current_branch
    current_branch=$(git branch --show-current 2>/dev/null)

    if [[ -z "$current_branch" ]]; then
        echo -e "\033[0;31mError: A PR number or URL is required when no branch is checked out.\033[0m
Use -h option for more info." >&2
        return 1
    fi

    if [[ "$current_branch" == "develop" || "$current_branch" == "main" ]]; then
        echo -e "\033[0;31mError: You are on the '$current_branch' branch.
Provide a PR number or URL, or switch to a feature/PR branch.\033[0m
Use -h option for more info." >&2
        return 1
    fi

    echo "$current_branch"
}

get_platform_icon() {
    local platform="$1"
    local icon=":desktop_computer:"

    if [[ -n "$DEFAULT_SLACK_PR_ICON" ]]; then
        icon="$DEFAULT_SLACK_PR_ICON"
    fi

    case "$platform" in
        mobile | m) icon=":iphone:" ;;
        common | c) icon=":commie:" ;;
        desktop | d) icon=":desktop_computer:" ;;
        yanas | y) icon=":typical-yanas:" ;;
    esac

    echo "$icon"
}

fetch_pr_json() {
    local pr_reference="$1"
    local pr_json

    if ! pr_json=$(gh pr view "$pr_reference" --json title,url,baseRefName,headRefName 2>&1); then
        echo -e "\033[0;31mError: Failed to fetch PR information.
$pr_json
Make sure the PR number or URL is valid.\033[0m
Use -h option for more info" >&2
        return 1
    fi

    echo "$pr_json"
}

# Prints "additions deletions files" of the PR with whitespace-only changes ignored.
# A file counts when it has a non-whitespace line change or is binary.
compute_diff_stats() {
    local pr_json="$1"
    local base_branch head_branch

    base_branch=$(echo "$pr_json" | jq -r ".baseRefName")
    head_branch=$(echo "$pr_json" | jq -r ".headRefName")

    if ! git fetch --quiet origin "$base_branch" "$head_branch"; then
        echo -e "\033[0;31mError: Failed to fetch '$base_branch' and '$head_branch' from origin.\033[0m" >&2
        return 1
    fi

    git diff -w --numstat "origin/$base_branch...origin/$head_branch" | awk '
        { additions += $1; deletions += $2 }
        $1 == "-" || $1 + $2 > 0 { files++ }
        END { print additions + 0, deletions + 0, files + 0 }'
}

build_slack_message() {
    local pr_json="$1"
    local icon="$2"
    local extra_emojis="${3:-}"
    local title url deletions additions changed_files small_pr_emoji icons

    title=$(echo "$pr_json" | jq -r ".title")
    url=$(echo "$pr_json" | jq -r ".url")
    read -r additions deletions changed_files < <(compute_diff_stats "$pr_json") || return 1

    small_pr_emoji=""
    if [[ $((additions + deletions)) -lt 20 ]]; then
        small_pr_emoji=":pinching_hand: "
    fi

    icons="$icon"
    if [[ -n "$extra_emojis" ]]; then
        icons="$icon $extra_emojis"
    fi

    echo ":new-pull-request: $icons ${small_pr_emoji}${title}
$url
:heavy_plus_sign: $additions :heavy_minus_sign: $deletions :file_folder: $changed_files"
}

copy_to_clipboard() {
    local content="$1"

    if command -v pbcopy &> /dev/null; then
        echo -e "$content" | pbcopy
    elif command -v wl-copy &> /dev/null; then
        echo -e "$content" | wl-copy
    elif command -v xsel &> /dev/null; then
        echo -e "$content" | xsel --clipboard --input
    elif command -v xclip &> /dev/null; then
        echo -e "$content" | xclip -selection clipboard
    else
        echo -e "\033[0;33mWarning: No clipboard utility found (pbcopy, wl-copy, xsel, or xclip).\033[0m" >&2
        echo -e "\033[0;33mSkipping clipboard copy. Please copy the message manually.\033[0m" >&2
        return 1
    fi
}

print_result() {
    local result="$1"

    echo -e "
-------------- Generated message -----------------
$result
--------------------------------------------------"
}

main() {
    local parse_status=0
    parse_arguments "$@" || parse_status=$?
    if [[ $parse_status -eq 2 ]]; then
        return 0
    elif [[ $parse_status -ne 0 ]]; then
        return 1
    fi

    check_jq_available || return 1
    check_gh_available || return 1

    local pr_reference platform icon pr_json result
    pr_reference="$PARSED_PR_REFERENCE"
    platform="$PARSED_PLATFORM"

    if ! pr_reference=$(resolve_pr_reference "$pr_reference"); then
        return 1
    fi

    icon=$(get_platform_icon "$platform")

    if ! pr_json=$(fetch_pr_json "$pr_reference"); then
        return 1
    fi

    if ! result=$(build_slack_message "$pr_json" "$icon" "$PARSED_EXTRA_EMOJIS"); then
        return 1
    fi
    print_result "$result"

    if copy_to_clipboard "$result"; then
        echo -e "\n\033[0;32m✓ Copied to clipboard!\033[0m"
    else
        echo -e "\n\033[0;33m✓ Message generated (not copied to clipboard)\033[0m"
    fi
}

main "$@"
