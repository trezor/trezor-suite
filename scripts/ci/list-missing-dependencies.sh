#!/bin/bash
# List dependencies missing from the domain lists.

domains=("common" "connect" "mission" "mobile" "qa" "trends" "usability")

dependencies_in_lists=()
dependencies_missing_from_lists=()
dependencies_listed_but_unused=()

read_file_into_array() {
    local file=$1
    # Check if the file exists before trying to read it
    if [[ -f $file ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip empty lines and lines starting with #
            if [[ -n "$line" && ! "$line" =~ ^# ]]; then
                dependencies_in_lists+=("$line")
            fi
        done < "$file"
    else
        echo "File $file not found, skipping."
    fi
}

# Loop over the domains array to read each file
for domain in "${domains[@]}"; do
    read_file_into_array "./scripts/list-outdated-dependencies/$domain-dependencies.txt"
done

# Get an array of all direct dependencies
all_packages=$(yarn info --all --json --name-only | grep -E -v '@workspace:' | sed 's/^[^a-zA-Z@]*//; s/@patch:[^ ]*//; s/@npm:[^ ]*//g')

# Convert package names to an array
IFS=$'\n' read -r -d '' -a all_packages_array <<< "$all_packages"

# Check each dependency against domain lists
for installed_package in "${all_packages_array[@]}"; do
    found=false
    for listed_package in "${dependencies_in_lists[@]}"; do
        if [[ "$listed_package" == "$installed_package" ]]; then
            found=true
            break
        fi
    done
    
    if [[ "$found" == false ]]; then
        dependencies_missing_from_lists+=("$installed_package")
    fi
done

# Check each dependency in the domain lists against installed packages
for listed_package in "${dependencies_in_lists[@]}"; do
    found=false
    for installed_package in "${all_packages_array[@]}"; do
        if [[ "$installed_package" == "$listed_package" ]]; then
            found=true
            break
        fi
    done
    
    if [[ "$found" == false ]]; then
        dependencies_listed_but_unused+=("$listed_package")
    fi
done

# Output the results
if [ ${#dependencies_missing_from_lists[@]} -eq 0 ] && [ ${#dependencies_listed_but_unused[@]} -eq 0 ]; then
    echo "All dependencies are correctly listed under their domains."
else
    domain_lists_directory="scripts/list-outdated-dependencies"
    if [ ${#dependencies_missing_from_lists[@]} -ne 0 ]; then
        echo "There are dependencies not listed under any domain:"
        printf '%s\n' "${dependencies_missing_from_lists[@]}"
        echo "Add them to the appropriate .txt files in $domain_lists_directory."
    fi

    if [ ${#dependencies_listed_but_unused[@]} -ne 0 ]; then
        echo -e "\nThere are dependencies in the domain lists that are not installed:"
        printf '%s\n' "${dependencies_listed_but_unused[@]}"
        echo "Remove them from the respective .txt files in $domain_lists_directory."
    fi

    exit 1  # Exit with a non-zero status code to indicate failure
fi