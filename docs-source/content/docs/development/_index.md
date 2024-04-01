---
weight: 6
title: "Development notes"
--- 

# **Development**

Please feel free to contribute and suggest ideas or report bugs!
 
<br/><br/>

### **Compile settings schema**
`glib-compile-schemas ./schemas`
### **Update example.pot**
`xgettext --from-code=UTF-8 --output=po/example.pot *.js`
### **Update example.pot**
It's possible to use a symlink between your project folder (the folder where you have cloned the code to) and the extension folder in `~/.local/share/gnome-shell/extensions/executor@raujonas.github.io`.