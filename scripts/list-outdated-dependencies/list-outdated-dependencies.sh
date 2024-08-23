#!/bin/bash

valid_argument_values=("common" "connect" "mission" "mobile" "qa" "trends" "usability")
valid_arguments_hint="Valid values are: ${valid_argument_values[*]}."

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
if ! contains "$1" "${valid_argument_values[@]}"; then
  echo "Invalid argument '$1'."
  echo "$valid_arguments_hint"
  exit 1
fi

# Run yarn outdated on target dependencies
yarn outdated $(tr '\n' ' ' < "$(dirname "${BASH_SOURCE[0]}")/$1-dependencies.txt")