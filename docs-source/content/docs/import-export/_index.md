---
weight: 3
title: "Export and import settings"
---

# **Export and import settings**

If you want to export and import all settings at once you can use dconf.

Export: `dconf dump /org/gnome/shell/extensions/executor/ > executor-settings.dconf`

Import: `dconf load /org/gnome/shell/extensions/executor/ < executor-settings.dconf`