#!/bin/bash

# Check if the correct number of arguments is passed
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <stagingPercentage>"
    exit 1
fi

# Get the stagingPercentage value from the argument
stagingPercentage=$1

# List of files to update
files=("latest.yml" "latest-linux.yml" "latest-linux-arm64.yml" "latest-mac.yml")

# Loop through each file and update or append the stagingPercentage
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "stagingPercentage:" "$file"; then
            # If the string exists, replace it
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/stagingPercentage: .*/stagingPercentage: $stagingPercentage/" "$file"
            else
                sed -i "s/stagingPercentage: .*/stagingPercentage: $stagingPercentage/" "$file"
            fi
        else
            # If the string does not exist, check if the file ends with a newline and append accordingly
            if [ "$(tail -c1 "$file")" ]; then
                # If the file does not end with a newline, add one before appending
                echo -e "\nstagingPercentage: $stagingPercentage" >> "$file"
            else
                # If the file ends with a newline, append directly
                echo "stagingPercentage: $stagingPercentage" >> "$file"
            fi
        fi
    else
        echo "File $file does not exist."
    fi
done
