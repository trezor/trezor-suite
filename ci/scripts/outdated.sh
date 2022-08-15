#!/bin/bash
treshold=180

number=$(yarn outdated | wc -l)

echo outdated packages treshold $treshold

if [ "$number" -gt "$treshold" ]
then
    echo number of outdated packages [$number] is over treshold [$treshold]. consider updating.
    exit 1
fi

echo number of outdated packages [$number] is below treshold [$treshold]
exit 0