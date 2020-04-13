#!/usr/bin/env bash

if [ $# -eq 0 ]
  then
    echo "No version argument given"
  else
    echo "set version to $1"
    mv metadata.json temp.json
    jq -r --argjson V $1 '.version |= $V' temp.json > metadata.json
    rm temp.json
    echo "done"
fi
