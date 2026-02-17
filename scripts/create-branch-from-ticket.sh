#!/bin/bash

show_help() {
    cat << EOF
Usage: $(basename "$0") <TICKET_NUMBER>

Create a new feature branch from the develop branch.

Arguments:
    TICKET_NUMBER   The GitHub issue number (e.g., 1234)

The script will:
    1. Fetch the issue title from GitHub using 'gh' CLI
    2. Verify all changes are committed (fails if there are uncommitted changes)
    3. Switch to the develop branch
    4. Ensure develop is in sync with origin/develop
    5. Create a new branch named: <TICKET_NUMBER>-<sanitized-issue-title>

Sanitization rules:
    - Converts to lowercase
    - Removes quotes and special characters
    - Replaces spaces with hyphens
    - Removes consecutive hyphens
    - Truncates branch name to 50 characters maximum

Examples:
    $(basename "$0") 1234
    # Fetches issue #1234 title and creates branch like: 1234-add-new-feature

Requirements:
    - Git must be installed
    - GitHub CLI (gh) must be installed and authenticated
    - Must be in a git repository
    - No uncommitted changes allowed

EOF
}

check_uncommitted_changes() {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "\033[0;31mError: You have uncommitted changes.\033[0m" >&2
        echo -e "Please commit or stash your changes before creating a new branch." >&2
        git status --short >&2
        exit 1
    fi

    # Also check for untracked files that might be important.
    if [[ -n $(git ls-files --others --exclude-standard) ]]; then
        echo -e "\033[0;33mWarning: You have untracked files.\033[0m" >&2
        git ls-files --others --exclude-standard >&2
        echo -e "\033[0;33mContinuing anyway...\033[0m" >&2
    fi
}

check_git_repository() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo -e "\033[0;31mError: Not inside a git repository.\033[0m" >&2
        exit 1
    fi
}

check_gh_cli() {
    if ! command -v gh &>/dev/null; then
        echo -e "\033[0;31mError: GitHub CLI (gh) is not installed.\033[0m" >&2
        echo -e "Please install it from https://cli.github.com/" >&2
        exit 1
    fi

    if ! gh auth status &>/dev/null; then
        echo -e "\033[0;31mError: GitHub CLI is not authenticated.\033[0m" >&2
        echo -e "Please run 'gh auth login' to authenticate." >&2
        exit 1
    fi
}

fetch_issue_title() {
    local issue_number="$1"

    echo "Fetching issue #$issue_number from GitHub..."

    local title
    if ! title=$(gh issue view "$issue_number" --json title --jq '.title' 2>&1); then
        echo -e "\033[0;31mError: Failed to fetch issue #$issue_number from GitHub.\033[0m" >&2
        echo -e "$title" >&2
        exit 1
    fi

    if [[ -z "$title" ]]; then
        echo -e "\033[0;31mError: Issue #$issue_number not found or has no title.\033[0m" >&2
        exit 1
    fi

    echo -e "\033[0;32m✓ Found issue: $title\033[0m"
    echo "$title"
}

switch_to_develop() {
    echo "Switching to develop branch..."
    if ! git checkout develop 2>&1; then
        echo -e "\033[0;31mError: Failed to switch to develop branch.\033[0m" >&2
        exit 1
    fi
    echo -e "\033[0;32m✓ Switched to develop branch\033[0m"
}

sync_with_origin() {
    echo "Pulling latest changes from origin..."
    if ! git pull 2>&1; then
        echo -e "\033[0;31mError: Failed to pull from origin.\033[0m" >&2
        exit 1
    fi
    echo -e "\033[0;32m✓ Develop branch synced with origin\033[0m"
}

sanitize_ticket_name() {
    local name="$1"

    # Convert to lowercase, remove quotes, replace special chars with hyphens.
    echo "$name" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/["'\''"]//g' | \
        sed 's/[^a-z0-9-]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

create_new_branch() {
    local ticket_number="$1"
    local ticket_name="$2"
    local max_length=50

    local sanitized_name
    sanitized_name=$(sanitize_ticket_name "$ticket_name")

    local branch_name="${ticket_number}-${sanitized_name}"

    # Truncate branch name to max_length characters.
    if [[ ${#branch_name} -gt $max_length ]]; then
        branch_name="${branch_name:0:$max_length}"
        # Remove trailing hyphen if truncation created one.
        branch_name="${branch_name%-}"
    fi

    echo "Creating new branch: $branch_name"

    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        echo -e "\033[0;31mError: Branch '$branch_name' already exists.\033[0m" >&2
        exit 1
    fi

    if ! git checkout -b "$branch_name" 2>&1; then
        echo -e "\033[0;31mError: Failed to create branch '$branch_name'.\033[0m" >&2
        exit 1
    fi

    echo -e "\033[0;32m✓ Created and switched to branch: $branch_name\033[0m"
}

# Handle help flag.
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Validate arguments.
if [[ $# -lt 1 ]]; then
    echo -e "\033[0;31mError: Missing required argument.\033[0m" >&2
    echo -e "Usage: $(basename "$0") <TICKET_NUMBER>" >&2
    echo -e "Use -h option for more info." >&2
    exit 1
fi

TICKET_NUMBER="$1"

# Validate ticket number is numeric.
if ! [[ "$TICKET_NUMBER" =~ ^[0-9]+$ ]]; then
    echo -e "\033[0;31mError: Ticket number must be numeric.\033[0m" >&2
    exit 1
fi

# Run checks and create branch.
check_git_repository
check_uncommitted_changes
check_gh_cli
TICKET_NAME=$(fetch_issue_title "$TICKET_NUMBER" | tail -1)
switch_to_develop
sync_with_origin
create_new_branch "$TICKET_NUMBER" "$TICKET_NAME"

echo -e "\n\033[0;32m✓ Ready to work on ticket #$TICKET_NUMBER!\033[0m"

