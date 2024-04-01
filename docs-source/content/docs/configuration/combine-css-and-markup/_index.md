---
weight: 4
title: "Combine css and markup"
---

# **Configuration**

## **Combine css and markup**

Combination of css and markup is also possible. In this case the setting for markup **`<executor.markup.true>`**  must be located after all css settings. Here is an example:

```
echo " <span font_family='monospace' foreground='blue'>Blue text</span> is <i>cool</i>! <span foreground='red'>Red text</span><executor.css.green><executor.markup.true> is cool too"
```

This produces the following output:

<img src="../../../docs/css-and-markup.png" alt="settings">