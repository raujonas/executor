#!/usr/bin/env bash

echo "compile settings schema"
glib-compile-schemas ./schemas
echo "set version:"
./set-version.bash $1
echo "create zip"
zip -r executor@raujonas.github.io schemas/ extension.js metadata.json prefs.js 
echo "done"