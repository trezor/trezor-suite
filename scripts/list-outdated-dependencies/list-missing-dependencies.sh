#!/bin/bash

script_directory="$(dirname "${BASH_SOURCE[0]}")"

# shellcheck disable=SC1091
source "$script_directory/config.sh"

dependencies_in_lists=()
dependencies_missing_from_lists=()

read_file_into_array() {
    local file=$1
    # Check if the file exists before trying to read it
    if [[ -f $file ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            dependencies_in_lists+=("$line")
        done < "$file"
    else
        echo "File $file not found, skipping."
    fi
}

# Loop over the domains array to read each file
for domain in "${DOMAINS[@]}"; do
    read_file_into_array "$script_directory/$domain-dependencies.txt"
done


# Get an array of outdated dependencies
IFS=$'\n' read -r -d '' -a outdated_array <<< "$(yarn outdated | grep -E '  +(dependencies|devDependencies)$' | awk '{print $3}' | uniq)"

# Check each outdated package against dependencies in lists
for outdated_package in "${outdated_array[@]}"; do
    found=false
    for listed_package in "${dependencies_in_lists[@]}"; do
        if [[ "$listed_package" == "$outdated_package" ]]; then
            found=true
            break
        fi
    done
    
    if [[ "$found" == false ]]; then
        dependencies_missing_from_lists+=("$outdated_package")
    fi
done


# Output the list of outdated dependencies not included in any of the lists
if [ ${#dependencies_missing_from_lists[@]} -eq 0 ]; then
    tput setaf 2
    echo "All outdated dependencies are listed under their domains."
    tput sgr0
else
    tput setaf 3
    echo "There are outdated dependencies not listed under any domain. Add them to the appropriate .txt file in $script_directory."
    tput sgr0
    printf '%s\n' "${dependencies_missing_from_lists[@]}"
fi
