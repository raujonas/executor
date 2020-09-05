#!/usr/bin/env bash

echo "set version to $1"
mv metadata.json temp.json
jq -r --argjson V $1 '.version |= $V' temp.json > metadata.json
rm temp.json
echo "done"