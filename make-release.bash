#!/usr/bin/env bash
echo "compile settings schema"
glib-compile-schemas ./schemas
echo "create zip"
#zip -r executor@raujonas.github.io schemas/ extension.js metadata.json prefs.js custom.css stylesheet.css
gnome-extensions pack --podir=po --force
unzip -o executor@raujonas.github.io.shell-extension.zip -d zip
rm -rf locale/
mv zip/locale/ .
rm -rf zip/
mv executor@raujonas.github.io.shell-extension.zip executor@raujonas.github.io
echo "done"
