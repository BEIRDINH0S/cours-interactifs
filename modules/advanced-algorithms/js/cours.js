/* =========================================================================
   cours.js — les quatre manipulations de la page du module.
     1. la coupe          : cliquer les sommets, lire la valeur
     2. la contraction    : fusionner une arete, voir ce qui survit
     3. la borne          : le produit qui se telescope
     4. l'exponentiation  : la boucle binaire, tour par tour
   ========================================================================= */
(function (CI) {
  "use strict";

  var G = CI.FIL_ROUGE;
  var NAME = G.names, EDGES = G.edges;

  CI.breadcrumb(CI.el("crumb"), [
    { label: "Cours interactifs", href: "../../index.html" },
    { label: "Advanced Algorithms" }
  ]);

  /* ================================================== 1. la coupe */
  var side = [1, 1, 1, 1, 1, 1];   // 0 = U, 1 = U'
  var cutFig = new CI.GraphFig(CI.el("cutfig"), {
    names: NAME, pos: G.pos, edges: EDGES,
    onVertexClick: function (u) { side[u] = 1 - side[u]; drawCut(); }
  });
  var DEG = cutFig.degrees();

  function drawCut() {
    var cross = cutFig.crossing(function (u) { return side[u]; });

    cutFig.draw({
      groupOf: function (u) { return side[u]; },
      blobs: false,
      edgeClass: function (e, k) { return "edge" + (cross.indexOf(k) >= 0 ? " cross" : ""); },
      vertexClass: function (u) { return side[u] === 0 ? "sideA" : "sideB"; }
    });

    var A = [], B = [];
    NAME.forEach(function (n, u) { (side[u] === 0 ? A : B).push(n); });
    CI.el("set-a").textContent = A.length ? A.join(" ") : "∅";
    CI.el("set-b").textContent = B.length ? B.join(" ") : "∅";

    var val = cross.length, vEl = CI.el("cut-val"), say = CI.el("cut-say");
    vEl.textContent = val;
    vEl.className = "big" + (A.length && B.length ? (val === 1 ? " good" : "") : " bad");

    if (!A.length || !B.length) {
      say.innerHTML = "<span class='k-no'>Ce n'est pas une coupe.</span> Un des deux côtés est vide — " +
        "la définition l'interdit, justement pour que « zéro arête traversante » ne soit pas une réponse.";
    } else if (A.length === 1 || B.length === 1) {
      var lone = A.length === 1 ? A[0] : B[0];
      var d = DEG[NAME.indexOf(lone)];
      say.innerHTML = "Tu as isolé <code>" + lone + "</code> : la valeur affichée est " + val +
        ", et c'est exactement son <strong>degré</strong> (" + d + "). Cette coupe est valide, " +
        "donc k ≤ " + d + " — voilà pourquoi tout sommet a un degré ≥ k.";
    } else if (val === 1) {
      say.innerHTML = "<span class='k-ok'>C'est la coupe minimum.</span> Une seule arête traverse : " +
        "le pont <code>c—d</code>. Tout l'enjeu de l'algorithme, c'est de ne jamais contracter celle-là.";
    } else {
      say.innerHTML = val + " arêtes traversent. Il existe mieux — cherche la séparation qui n'en coupe qu'une.";
    }
  }
  CI.el("cut-reset").onclick = function () { side = [1, 1, 1, 1, 1, 1]; drawCut(); };
  CI.el("cut-min").onclick = function () { side = [0, 0, 0, 1, 1, 1]; drawCut(); };
  drawCut();

  /* ================================================== 2. la contraction */
  var grp, nbG, nbC;
  var ctrFig = new CI.GraphFig(CI.el("ctrfig"), { names: NAME, pos: G.pos, edges: EDGES });

  function live() { return ctrFig.crossing(function (u) { return grp[u]; }); }

  function drawCtr(say) {
    ctrFig.draw({ groupOf: function (u) { return grp[u]; } });

    CI.el("ctr-nb").textContent = nbG;
    CI.el("ctr-c").textContent = nbC + " / " + (NAME.length - 2);

    // groupes, dans l'ordre d'apparition, avec la meme couleur que la figure
    var seen = [], byG = {};
    NAME.forEach(function (_, u) {
      if (!(grp[u] in byG)) { byG[grp[u]] = []; seen.push(grp[u]); }
      byG[grp[u]].push(NAME[u]);
    });
    CI.el("ctr-groups").innerHTML = "groupes : " + seen.map(function (g, i) {
      return "<b style='color:var(--g" + (i % 6) + ")'>{" + byG[g].join(",") + "}</b>";
    }).join(" &nbsp; ");

    var sel = CI.clear(CI.el("ctr-pick")), l = live();
    l.forEach(function (k) {
      sel.appendChild(CI.h("option", { value: k, text: CI.edgeName(NAME, EDGES[k]) }));
    });
    var over = (nbG <= 2);
    sel.disabled = over;
    CI.el("ctr-go").disabled = over;
    CI.el("ctr-rand").disabled = over;

    if (say) {
      CI.el("ctr-say").innerHTML = say;
    } else if (over) {
      var val = l.length;
      CI.el("ctr-say").innerHTML = "Deux groupes : l'algorithme s'arrête. La coupe obtenue vaut " +
        "<strong>" + val + "</strong>" + (val === 1
          ? " — c'est la coupe minimum, ce tirage a eu de la chance."
          : " — la coupe minimum vaut 1, ce tirage a contracté le pont.");
    } else {
      CI.el("ctr-say").innerHTML = "Les arêtes en pointillés sont devenues internes à un groupe : " +
        "dans le multigraphe contracté, ce sont des boucles. Le code les rejette sans les compter " +
        "comme contraction.";
    }
  }

  function ctrReset() { grp = [0, 1, 2, 3, 4, 5]; nbG = 6; nbC = 0; drawCtr(); }

  CI.el("ctr-go").onclick = function () {
    var k = +CI.el("ctr-pick").value, e = EDGES[k];
    var ga = grp[e[0]], gb = grp[e[1]];
    if (ga === gb) return;
    var keep = Math.min(ga, gb), drop = Math.max(ga, gb);
    for (var u = 0; u < NAME.length; u++) if (grp[u] === drop) grp[u] = keep;
    nbG--; nbC++;

    var out = [];
    EDGES.forEach(function (e2, k2) {
      if (k2 === k) return;
      if ((grp[e2[0]] === keep) !== (grp[e2[1]] === keep)) out.push(CI.edgeName(NAME, e2));
    });
    drawCtr("On a fusionné <code>" + NAME[e[0]] + "</code> et <code>" + NAME[e[1]] + "</code>. " +
      (out.length
        ? "Les arêtes " + out.join(", ") + " sortent toujours du groupe : <strong>aucune n'est " +
          "supprimée</strong>, même si deux d'entre elles aboutissent au même voisin — ce sont les " +
          "arêtes parallèles du multigraphe."
        : "Le groupe est désormais isolé du reste.") +
      " Seule l'arête contractée disparaît, devenue une boucle.");
  };
  CI.el("ctr-rand").onclick = function () {
    var l = live();
    CI.el("ctr-pick").value = l[Math.floor(Math.random() * l.length)];
    CI.el("ctr-go").click();
  };
  CI.el("ctr-reset").onclick = ctrReset;
  ctrReset();

  /* ================================================== 3. le telescopage */
  var nTel = 6, cut = 0;

  // facteur i = (n-i-1)/(n-i+1), pour i de 1 a n-2
  function terms(n) {
    var num = [], den = [];
    for (var i = 1; i <= n - 2; i++) { num.push(n - i - 1); den.push(n - i + 1); }
    return { num: num, den: den };
  }
  // les valeurs presentes des deux cotes sont 3..n-2 : autant de paires a annuler
  function pairs(n) { return Math.max(0, (n - 2) - 3 + 1); }

  function drawTel() {
    var n = nTel, t = terms(n), box = CI.clear(CI.el("prod")), maxC = pairs(n);
    var gone = [];
    for (var c = 0; c < Math.min(cut, maxC); c++) gone.push(n - 2 - c);

    t.num.forEach(function (_, i) {
      if (i) box.appendChild(CI.h("span", { "class": "x", text: "×" }));
      var nGone = gone.indexOf(t.num[i]) >= 0;
      var dGone = gone.indexOf(t.den[i]) >= 0;
      box.appendChild(CI.h("span", { "class": "frac" }, [
        CI.h("span", { "class": "n" + (nGone ? " gone" : (cut >= maxC ? " keep" : "")), text: String(t.num[i]) }),
        CI.h("span", { "class": "d" + (dGone ? " gone" : (cut >= maxC ? " keep" : "")), text: String(t.den[i]) })
      ]));
    });

    var res = CI.el("tel-res");
    if (cut >= maxC) {
      res.innerHTML = "2 / " + n + "·" + (n - 1) + " = 2/" + (n * (n - 1));
      res.className = "big sm good";
    } else {
      res.textContent = "…";
      res.className = "big sm";
    }
    CI.el("tel-pct").textContent = CI.pct(2 / (n * (n - 1)));
    CI.el("tel-step").disabled = (cut >= maxC);
    CI.el("n-val").textContent = n;
  }
  CI.el("n-slider").oninput = function (e) { nTel = +e.target.value; cut = 0; drawTel(); };
  CI.el("tel-step").onclick = function () { cut++; drawTel(); };
  CI.el("tel-all").onclick = function () { cut = pairs(nTel); drawTel(); };
  CI.el("tel-reset").onclick = function () { cut = 0; drawTel(); };
  drawTel();

  /* ================================================== 4. exponentiation rapide */
  var expN = 13, rows = [], shown = 1;

  /* La boucle de la note de cours :
       result = 1;
       while (n > 0) { if (n%2==1) result *= a;  a = a*a;  n /= 2; }
     Les multiplications comptees : une par bit a 1, plus une mise au carre
     par tour — sauf la derniere, qui calcule une puissance jamais utilisee. */
  function buildExp(n) {
    var out = [], pow = 1, tour = 0, mul = 0, n0 = n;
    while (n > 0) {
      var bit = n % 2;
      if (bit === 1) mul++;
      out.push({
        tour: tour, n: n, bit: bit,
        result: bit === 1 ? "× a^" + pow : "inchangé",
        a: "a^" + (pow * 2)
      });
      mul++;
      pow *= 2; n = Math.floor(n / 2); tour++;
    }
    return { rows: out, mul: Math.max(0, mul - 1), naive: Math.max(0, n0 - 1) };
  }

  function drawExp() {
    var r = buildExp(expN);
    rows = r.rows;
    if (shown > rows.length) shown = rows.length;

    CI.el("exp-nv").textContent = expN;

    var bits = expN.toString(2).split("");
    var bb = CI.clear(CI.el("exp-bits"));
    bits.forEach(function (b, i) {
      var fromLow = bits.length - 1 - i;
      bb.appendChild(CI.h("div", {
        "class": "bit" + (b === "1" ? " one" : "") + (fromLow === shown - 1 ? " cur" : ""),
        text: b
      }));
    });

    var tb = CI.clear(CI.el("exp-table").querySelector("tbody"));
    rows.slice(0, shown).forEach(function (row, i) {
      var tr = CI.h("tr", i === shown - 1 ? { "class": "hl" } : {});
      [row.tour, row.n, row.bit, row.result, row.a].forEach(function (c) {
        tr.appendChild(CI.h("td", { text: String(c) }));
      });
      tb.appendChild(tr);
    });

    var mul = rows.slice(0, shown).reduce(function (s, row) { return s + (row.bit === 1 ? 1 : 0) + 1; }, 0);
    if (shown === rows.length) mul = r.mul;
    CI.el("exp-mul").textContent = mul;
    CI.el("exp-naive").textContent = r.naive;
    CI.el("exp-step").disabled = (shown >= rows.length);
  }
  CI.el("exp-n").oninput = function (e) { expN = +e.target.value; shown = 1; drawExp(); };
  CI.el("exp-step").onclick = function () { shown++; drawExp(); };
  CI.el("exp-all").onclick = function () { shown = rows.length; drawExp(); };
  CI.el("exp-reset").onclick = function () { shown = 1; drawExp(); };
  drawExp();
})(window.CI);
