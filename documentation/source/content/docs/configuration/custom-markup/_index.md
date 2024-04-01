---
weight: 3
title: "Use of custom markup"
---

# **Configuration**

## **Use of markup**

**Usage**: To use markup there's another setting **`<executor.markup.true>`** which has to be included somewhere in the output to activate markup. 

**Example**: The following command is an example for using markup with different colors and some italic text, all inside one command. You can find other attributes like `font_family` or `size` [here](https://developer.gnome.org/pygtk/stable/pango-markup-language.html).

```
echo "<executor.markup.true> <span foreground='blue'>Blue text</span> is <i>cool</i>! <span foreground='red'>Red text</span> is cool too"
```
This produces the following output:

<img src="../../../docs/markup.png" alt="settings">

**Note**: Due to a [bug](https://gitlab.gnome.org/GNOME/mutter/-/issues/1324) in ClutterText there is an empty space in front of the first `<span>` tag required 