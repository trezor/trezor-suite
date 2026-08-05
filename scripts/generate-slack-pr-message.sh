#!/usr/bin/env bash

show_help() {
    cat << EOF
Usage: $(basename "$0") [PLATFORM]

Generate a Slack-formatted PR message with stats and copy it to clipboard.

PLATFORM options:
    mobile, m       Use mobile icon (:iphone:)
    common, c       Use common icon (:commie:)
    desktop, d      Use desktop icon (:desktop_computer:) [default]
    yanas, y        Use Yanas TM icon (:typical-yanas:)
    --help, -h      Show this help message

Environment variables:
    DEFAULT_SLACK_PR_ICON    Override the default icon (e.g., ":rocket:")

Examples:
    $(basename "$0")              # Uses desktop icon
    $(basename "$0") mobile       # Uses mobile icon
    $(basename "$0") m            # Uses mobile icon (short form)
    DEFAULT_SLACK_PR_ICON=":bug:" $(basename "$0")  # Custom icon

Requirements:
    - GitHub CLI (gh) must be installed and authenticated
    - Must be run from a feature/PR branch (not develop or main)
    - A pull request must exist for the current branch

EOF
}

check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "\033[0;31mError: Missing required dependency: jq\033[0m" >&2
        echo -e "Please install it before running this script." >&2
        exit 1
    fi
}

copy_to_clipboard() {
    local content="$1"

    if command -v pbcopy &> /dev/null; then
        echo -e "$content" | pbcopy
        return 0
    elif command -v wl-copy &> /dev/null; then
        echo -e "$content" | wl-copy
        return 0
    elif command -v xsel &> /dev/null; then
        echo -e "$content" | xsel --clipboard --input
        return 0
    elif command -v xclip &> /dev/null; then
        echo -e "$content" | xclip -selection clipboard
        return 0
    else
        echo -e "\033[0;33mWarning: No clipboard utility found (pbcopy, wl-copy, xsel, or xclip).\033[0m" >&2
        echo -e "\033[0;33mSkipping clipboard copy. Please copy the message manually.\033[0m" >&2
        return 1
    fi
}

check_gh_available() {
    if ! command -v gh &> /dev/null; then
        echo -e "\033[0;31mError: GitHub CLI (gh) is not installed or not in PATH.\033[0m" >&2

        # Offer to install via Homebrew if available
        if command -v brew &> /dev/null; then
            echo -e "\033[0;33mHomebrew detected. Would you like to install GitHub CLI now? (y/n)\033[0m"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                echo "Installing GitHub CLI..."
                if brew install gh; then
                    echo -e "\033[0;32m✓ GitHub CLI installed successfully!\033[0m"
                    echo -e "\033[0;33mAuthentication required. Running 'gh auth login'...\033[0m"
                    if gh auth login; then
                        echo -e "\033[0;32m✓ Authentication successful! Please re-run the script.\033[0m"
                        exit 0
                    else
                        echo -e "\033[0;31mAuthentication failed. Please run 'gh auth login' manually.\033[0m" >&2
                        exit 1
                    fi
                else
                    echo -e "\033[0;31mInstallation failed.\033[0m" >&2
                    exit 1
                fi
            else
                echo -e "Please install it manually: https://cli.github.com/" >&2
                exit 1
            fi
        else
            echo -e "Please install it: https://cli.github.com/" >&2
            exit 1
        fi
    fi
}

check_branch() {
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" == "develop" || "$CURRENT_BRANCH" == "main" ]]; then
        echo -e "\033[0;31mError: You are on the '$CURRENT_BRANCH' branch.
This script should only be run from a feature/PR branch.\033[0m
Use -h option for more info." >&2
        exit 1
    fi
}

get_platform_icon() {
    local platform="$1"
    local icon=":desktop_computer:"

    # Allow override via environment variable
    if [[ -n "$DEFAULT_SLACK_PR_ICON" ]]; then
        icon="$DEFAULT_SLACK_PR_ICON"
    fi

    if [[ "$platform" == "mobile" || "$platform" == "m" ]]; then
        icon=":iphone:"
    elif [[ "$platform" == "common" || "$platform" == "c" ]]; then
        icon=":commie:"
    elif [[ "$platform" == "desktop" || "$platform" == "d" ]]; then
        icon=":desktop_computer:"
    elif [[ "$platform" == "yanas" || "$platform" == "y" ]]; then
        icon=":typical-yanas:"
    fi

    echo "$icon"
}

# Handle help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Input and environment checks
check_dependencies
check_gh_available
check_branch

# Determine platform icon
ICON=$(get_platform_icon "$1")

# Pass the branch name explicitly. Without it, gh searches for a PR opened from
# the branch's upstream instead, which is develop for branches created from
# origin/develop, so no PR is found.
if ! PR_JSON=$(gh pr view "$CURRENT_BRANCH" --json title,changedFiles,additions,deletions,url 2>&1); then
    echo -e "\033[0;31mError: Failed to fetch PR information.
$PR_JSON
Make sure you have a PR open for the current branch.\033[0m
Use -h option for more info" >&2
    exit 1
fi

NAME=$(echo "$PR_JSON" | jq -r ".title")
URL=$(echo "$PR_JSON" | jq -r ".url")
MINUS=$(echo "$PR_JSON" | jq -r ".deletions")
PLUS=$(echo "$PR_JSON" | jq -r ".additions")
FILES=$(echo "$PR_JSON" | jq -r ".changedFiles")

# Add small PR indicator if total changes < 20
SMALL_PR_EMOJI=""
TOTAL_CHANGES=$((PLUS + MINUS))
if [[ $TOTAL_CHANGES -lt 20 ]]; then
    SMALL_PR_EMOJI=":pinching_hand: "
fi

# Construct the final Slack message
RESULT=":new-pull-request: $ICON ${SMALL_PR_EMOJI}${NAME}
$URL
:heavy_plus_sign: $PLUS :heavy_minus_sign: $MINUS :file_folder: $FILES"

# Output to terminal and copy to clipboard
echo -e "
-------------- Generated message -----------------
$RESULT
--------------------------------------------------"

if copy_to_clipboard "$RESULT"; then
    echo -e "\n\033[0;32m✓ Copied to clipboard!\033[0m"
else
    echo -e "\n\033[0;33m✓ Message generated (not copied to clipboard)\033[0m"
fi
