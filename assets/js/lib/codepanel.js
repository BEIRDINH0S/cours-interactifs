/* =========================================================================
   codepanel.js — panneau de code a onglets, avec surlignage d'une ligne.

   files : { cle: { label, note, lines: ["...", "..."] } }
   Les numeros de ligne affiches sont ceux du tableau "lines", pour que
   l'etape d'une trace puisse pointer une ligne precise.

   var cp = new CI.CodePanel({ tabs:…, pre:…, note:… }, FILES);
   cp.show("main", 14);
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  function CodePanel(els, files) {
    var self = this;
    this.els = els;
    this.files = files;
    this.manual = null;   // onglet choisi a la main par le lecteur
    this.auto = null;     // onglet impose par l'etape courante
    this.line = -1;

    CI.clear(els.tabs);
    Object.keys(files).forEach(function (key) {
      var b = CI.h("button", {
        "data-f": key,
        "aria-selected": "false",
        text: files[key].label || key
      });
      b.onclick = function () {
        self.manual = key;
        self.paint();
      };
      els.tabs.appendChild(b);
    });
  }

  /** Affiche le fichier d'une etape ; l'onglet suit, sauf choix manuel. */
  CodePanel.prototype.show = function (file, line) {
    this.auto = file;
    this.line = (line == null ? -1 : line);
    this.manual = null;
    this.paint();
  };

  CodePanel.prototype.paint = function () {
    var key = this.manual || this.auto;
    if (!key || !this.files[key]) return;
    var showLine = (key === this.auto) ? this.line : -1;
    var f = this.files[key];

    var tabs = this.els.tabs.querySelectorAll("button");
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].setAttribute("aria-selected", tabs[t].dataset.f === key ? "true" : "false");
    }

    var pre = CI.clear(this.els.pre);
    f.lines.forEach(function (src, k) {
      var isComment = /^\s*(\/\*|\*|\/\/)/.test(src);
      var cls = "ln" + (k + 1 === showLine ? " hl" : "") + (isComment ? " cm" : "");
      pre.appendChild(CI.h("span", { "class": cls }, [
        CI.h("span", { "class": "n", text: String(k + 1) }),
        document.createTextNode(src)
      ]));
    });

    if (this.els.note) this.els.note.textContent = f.note || "";
  };

  CI.CodePanel = CodePanel;
})(window.CI);
