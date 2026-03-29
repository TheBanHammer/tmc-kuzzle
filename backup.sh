#!/bin/bash
folder="$(pwd)/dumps/$(date +%Y%m%d-%H%M%S)"
#echo "$folder"
mkdir "$folder"
multielasticdump --direction dump --input http://localhost:9200 --output "$folder" --limit 10000
