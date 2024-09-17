#!/bin/bash

script_directory="$(dirname "${BASH_SOURCE[0]}")"

domains=("common" "connect" "mission" "mobile" "qa" "trends" "usability")
valid_arguments_hint="Valid values are: ${domains[*]}."

# Check if an argument was provided
if [ "$#" -ne 1 ]; then
  echo "The script requires 1 argument, but $# were provided."
  echo "$valid_arguments_hint"
  exit 1
fi

# Function to check if a value is in an array
contains() {
  local value="$1"
  shift
  local array=("$@")
  for item in "${array[@]}"; do
    if [ "$item" == "$value" ]; then
      return 0
    fi
  done
  return 1
}

# Check if the provided argument is valid
if ! contains "$1" "${domains[@]}"; then
  echo "Invalid argument '$1'."
  echo "$valid_arguments_hint"
  exit 1
fi

# Run yarn outdated on target dependencies
tr '\n' ' ' < "$script_directory/$1-dependencies.txt" | xargs yarn outdated