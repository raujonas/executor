---
weight: 8
title: "Documentation"
---
# **Updating the documentation**

The documentation is hosted on `https://raujonas.github.io/executor/` via GitHub Pages.

The framework used is HUGO (https://gohugo.io/).

## Installation of HUGO
https://gohugo.io/installation/linux/

## Summary of basic commands
Please refer to https://gohugo.io/getting-started/quick-start/ as well.
The commands have to be executed in the source folder of the documentation, e.g. `/executor/docs-source/`.

### Add new content page
`hugo new content docs/documentation/_index.md`

The existing pages can be found in `docs-source/content/docs`.

### Run local server with live updates
`hugo server`

### Compile the updated documentation
`hugo`, then push your changes to GitHub and create a new PR to the main branch.