#!/usr/bin/env bash

if [ $# -eq 0 ]
  then
    echo "No version argument given"
  else
    echo "compile settings schema"
    glib-compile-schemas ./schemas
    echo "set version:"
    ./set-version.bash $1
    echo "create zip"
    zip -r executor@raujonas.github.io schemas/ extension.js metadata.json prefs.js custom.css stylesheet.css
    echo "done"
fi

