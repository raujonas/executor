#!/usr/bin/env bash
echo "compile settings schema"
glib-compile-schemas ./schemas
echo "create zip"
zip -r executor@raujonas.github.io schemas/ extension.js metadata.json prefs.js custom.css stylesheet.css
echo "done"
