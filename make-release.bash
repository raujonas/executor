#!/usr/bin/env bash

echo "make release and set version to $1"
./set-version.bash $1
zip -r executor@raujonas.github.io schemas/ extension.js metadata.json prefs.js 
echo "done"
