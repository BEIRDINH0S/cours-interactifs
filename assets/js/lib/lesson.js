/* =========================================================================
   lesson.js — le lecteur de lecon, commun a tous les sujets.

   Une lecon est un tableau d'etapes. Chaque etape declare :
     titre   le titre affiche
     say     deux ou trois phrases, en HTML
     goal    l'objectif a valider (ou null : l'etape se traverse librement)
     mount   installe la manipulation ; recoit l'API ci-dessous

   L'API passee a mount() :
     fig            la figure de graphe, si la lecon en declare une
     host           un conteneur libre, vide a chaque etape
     tools(nodes)   remplit la barre de commandes
     readout(items) affiche des grandeurs lues  [{t, v, cls, small}]
     readoutNode(n) remplace la zone de lecture par un noeud
     figHidden(b)   masque la figure de graphe
     fb(html, kind) retour immediat, kind = "ok" | "ko" | undefined
     solve()        objectif atteint : debloque « Continuer »

   La page doit fournir les identifiants : rail, fig, host, tools, readout,
   st-title, st-say, st-goal, st-goal-text, st-fb, back, cont, foot-note.
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  CI.Lesson = function (opts) {
    var steps = opts.steps;
    var KEY = opts.key;
    var fig = opts.graph ? new CI.GraphFig(CI.el("fig"), opts.graph) : null;
    var cur = 0, furthest = 0;

    CI.__lastFig = fig;   // point d'accroche pour les tests automatises

    try {
      var saved = parseInt(window.localStorage.getItem(KEY), 10);
      if (!isNaN(saved) && saved > 0 && saved < steps.length) { furthest = saved; cur = saved; }
    } catch (e) { /* stockage bloque : on repart de zero, sans rien casser */ }

    function save() {
      try { window.localStorage.setItem(KEY, String(furthest)); } catch (e) { /* sans effet */ }
    }

    var api = {
      fig: fig,
      host: CI.el("host"),

      tools: function (nodes) {
        var box = CI.clear(CI.el("tools"));
        (nodes || []).forEach(function (n) { box.appendChild(n); });
      },

      readout: function (items, before) {
        var box = CI.clear(CI.el("readout"));
        if (before) box.appendChild(before);
        (items || []).forEach(function (it) {
          box.appendChild(CI.h("div", {}, [
            CI.h("span", { "class": "t", text: it.t }),
            CI.h("span", {
              "class": "v " + (it.cls || ""),
              style: it.small ? { fontSize: "17px" } : {},
              text: String(it.v)
            })
          ]));
        });
      },

      readoutNode: function (node) { CI.clear(CI.el("readout")).appendChild(node); },

      figHidden: function (yes) { if (CI.el("fig")) CI.el("fig").hidden = !!yes; },

      fb: function (html, kind) {
        var el = CI.el("st-fb");
        el.className = "fb " + (kind || "");
        el.innerHTML = html;
      },

      solve: function () {
        CI.el("st-goal").className = "goal done";
        CI.el("cont").disabled = false;
        CI.el("foot-note").textContent = "";
      }
    };

    function rail() {
      var box = CI.clear(CI.el("rail"));
      steps.forEach(function (_, i) {
        var b = CI.h("button", {
          "class": "dot" + (i === cur ? " cur" : (i <= furthest ? " seen" : "")),
          "aria-label": "étape " + (i + 1)
        });
        if (i <= furthest) b.onclick = function () { show(i); };
        box.appendChild(b);
      });
      box.appendChild(CI.h("span", { "class": "count", text: (cur + 1) + " / " + steps.length }));
    }

    function show(i) {
      cur = i;
      if (i > furthest) { furthest = i; save(); }
      var s = steps[i];

      if (fig) { fig.onVertexClick = null; fig.onEdgeClick = null; }
      api.figHidden(!fig);
      CI.clear(CI.el("host"));
      CI.clear(CI.el("tools"));
      CI.clear(CI.el("readout"));
      CI.el("st-title").textContent = s.titre;
      CI.el("st-say").innerHTML = s.say;
      api.fb("");

      var goalBox = CI.el("st-goal");
      if (s.goal) {
        goalBox.hidden = false;
        goalBox.className = "goal";
        CI.el("st-goal-text").innerHTML = s.goal;
      } else {
        goalBox.hidden = true;
      }

      CI.el("cont").disabled = !!s.goal;
      CI.el("cont").textContent = (i === steps.length - 1) ? "Revoir le début" : "Continuer ▶";
      CI.el("back").disabled = (i === 0);
      CI.el("foot-note").textContent = s.goal ? "Valide l'objectif pour continuer." : "";

      s.mount(api);
      rail();
    }

    CI.el("cont").onclick = function () {
      if (cur === steps.length - 1) { show(0); window.scrollTo(0, 0); return; }
      show(cur + 1);
    };
    CI.el("back").onclick = function () { if (cur > 0) show(cur - 1); };

    document.addEventListener("keydown", function (e) {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON")) return;
      if (e.key === "ArrowRight" && !CI.el("cont").disabled) CI.el("cont").click();
      if (e.key === "ArrowLeft" && cur > 0) show(cur - 1);
    });

    show(cur);
    return { show: show };
  };
})(window.CI);
