/* =========================================================================
   threads.js — simulateur d'entrelacement.

   Plusieurs fils d'execution, une memoire partagee, des verrous. C'est le
   LECTEUR qui decide quel fil avance : c'est tout l'interet, l'ordonnanceur
   n'est plus une boite noire.

   Une instruction est une donnee, pas du code :
     {k:"incr",   v:"c"}             c++ en une seule etape (fiction pedagogique)
     {k:"load",   r:"r1", v:"c"}     r1 <- c
     {k:"add",    r:"r1"}            r1 <- r1 + 1
     {k:"store",  v:"c", r:"r1"}     c  <- r1
     {k:"lock",   l:"A"}             bloque tant que le verrou est pris
     {k:"unlock", l:"A"}
     {k:"spin",   v:"val", seuil:1}  attente active : tourne a vide SANS lacher
                                     le verrou, tant que mem[v] < seuil
     {k:"wait",   l:"A"}             lache le verrou et s'endort
     {k:"notify", l:"A", tous:true}  reveille un dormeur, ou tous
     {k:"decr",   v:"val"}           val-- en une seule etape atomique
     {k:"sinegatif", v:"val", vers:2}
                                     saute si la case est passee sous zero
     {k:"saut",   vers:0}            saut inconditionnel (une reprise de boucle)
     {k:"cas",    v:"c", r:"r", echec:3}
                                     compare-and-set : si mem[v] vaut le
                                     registre, ecrit r+1 ; sinon saute a
                                     l'instruction "echec" (la relance)
     {k:"note",   txt:"..."}         ligne inerte, pour commenter

   Usage :
     var sim = new CI.ThreadSim(hostEl, {
       threads: [{ name:"Thread 1", code:[...] }, ...],
       mem: { c: 0 },
       locks: ["A"],
       onChange: function (st) { ... }
     });
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  function label(ins) {
    switch (ins.k) {
      case "incr":   return ins.v + "++";
      case "decr":   return ins.v + "--";
      case "sinegatif": return "si (" + ins.v + " < 0)";
      case "saut":   return "recommencer";
      case "load":   return ins.r + " ← " + ins.v;
      case "add":    return ins.r + " ← " + ins.r + " + 1";
      case "store":  return ins.v + " ← " + ins.r;
      case "lock":   return "lock(" + ins.l + ")";
      case "unlock": return "unlock(" + ins.l + ")";
      case "spin":   return "while (" + ins.v + " < " + ins.seuil + ") ;";
      case "wait":   return "wait()";
      case "notify": return ins.tous ? "notifyAll()" : "notify()";
      case "cas":    return "compareAndSet(" + ins.r + ", " + ins.r + "+1)";
      default:       return ins.txt || "";
    }
  }

  function ThreadSim(host, cfg) {
    this.host = host;
    this.cfg = cfg;
    this.onChange = cfg.onChange || function () {};
    this.reset();
  }

  ThreadSim.prototype.reset = function () {
    var cfg = this.cfg;
    this.mem = {};
    Object.keys(cfg.mem || {}).forEach(function (k) { this.mem[k] = cfg.mem[k]; }, this);
    this.locks = {};
    (cfg.locks || []).forEach(function (l) { this.locks[l] = null; }, this);
    this.threads = cfg.threads.map(function (t) {
      return {
        name: t.name, code: t.code, pc: 0, regs: {},
        dort: false,          // endormi sur wait(), hors de la file du verrou
        reprend: false,       // reveille, mais doit rattraper le verrou
        tours: 0              // tours d'attente active brules
      };
    });
    this.history = [];
    this.render();
  };

  ThreadSim.prototype.finished = function (i) {
    return this.threads[i].pc >= this.threads[i].code.length;
  };

  ThreadSim.prototype.allDone = function () {
    return this.threads.every(function (_, i) { return this.finished(i); }, this);
  };

  /** Un fil est bloque s'il dort, s'il attend un verrou, ou s'il le rattrape. */
  ThreadSim.prototype.isBlocked = function (i) {
    if (this.finished(i)) return false;
    var t = this.threads[i];
    if (t.dort) return true;
    if (t.reprend) return this.locks[this.verrouDe(i)] !== null;
    var ins = t.code[t.pc];
    return ins.k === "lock" && this.locks[ins.l] !== null && this.locks[ins.l] !== i;
  };

  /** Le verrou qu'un fil endormi devra reprendre : celui de son wait(). */
  ThreadSim.prototype.verrouDe = function (i) {
    var t = this.threads[i];
    for (var k = t.pc - 1; k >= 0; k--) {
      if (t.code[k].k === "wait") return t.code[k].l;
    }
    return Object.keys(this.locks)[0];
  };

  /** Un fil qui tourne a vide avance sans jamais progresser. */
  ThreadSim.prototype.tourneAVide = function (i) {
    if (this.finished(i)) return false;
    var ins = this.threads[i].code[this.threads[i].pc];
    return ins.k === "spin" && (this.mem[ins.v] || 0) < ins.seuil;
  };

  /** Plus personne ne peut avancer, et tout le monde n'a pas fini : interblocage. */
  ThreadSim.prototype.deadlocked = function () {
    if (this.allDone()) return false;
    return this.threads.every(function (_, i) {
      return this.finished(i) || this.isBlocked(i);
    }, this);
  };

  /**
   * Blocage de fait : plus aucun fil ne peut progresser, meme si l'un d'eux
   * continue de consommer du processeur. Un fil qui tourne a vide n'est pas
   * "bloque" au sens de l'ordonnanceur — mais il n'avancera jamais, et il
   * garde son verrou. C'est la situation du semaphore naif.
   */
  ThreadSim.prototype.bloqueDeFait = function () {
    if (this.allDone()) return false;
    var vide = false;
    var fige = this.threads.every(function (_, i) {
      if (this.finished(i) || this.isBlocked(i)) return true;
      if (this.tourneAVide(i)) { vide = true; return true; }
      return false;
    }, this);
    return fige && vide;
  };

  /** Fait avancer le fil i d'une instruction. Rend false s'il ne peut pas. */
  ThreadSim.prototype.step = function (i) {
    if (this.finished(i) || this.isBlocked(i)) return false;
    var t = this.threads[i];

    /* Reveille par un notify : le pas suivant sert a reprendre le verrou,
       pas a executer une instruction. */
    if (t.reprend) {
      this.locks[this.verrouDe(i)] = i;
      t.reprend = false;
      this.history.push(i);
      this.render();
      return true;
    }

    var ins = t.code[t.pc];

    switch (ins.k) {
      case "incr":   this.mem[ins.v] = (this.mem[ins.v] || 0) + 1; break;
      case "decr":   this.mem[ins.v] = (this.mem[ins.v] || 0) - 1; break;

      case "sinegatif":
        if ((this.mem[ins.v] || 0) < 0) {
          t.pc = ins.vers;
          this.history.push(i);
          this.render();
          return true;
        }
        break;

      case "saut":
        t.pc = ins.vers;
        this.history.push(i);
        this.render();
        return true;
      case "load":   t.regs[ins.r] = this.mem[ins.v]; break;
      case "add":    t.regs[ins.r] = (t.regs[ins.r] || 0) + 1; break;
      case "store":  this.mem[ins.v] = t.regs[ins.r]; break;
      case "lock":   this.locks[ins.l] = i; break;
      case "unlock": if (this.locks[ins.l] === i) this.locks[ins.l] = null; break;

      case "spin":
        /* Attente active : la condition n'est pas remplie, donc on ne bouge
           pas — et surtout on garde le verrou. C'est tout le drame. */
        if ((this.mem[ins.v] || 0) < ins.seuil) {
          t.tours++;
          this.history.push(i);
          this.render();
          return true;
        }
        break;

      case "wait":
        if (this.locks[ins.l] === i) this.locks[ins.l] = null;
        t.dort = true;
        break;

      case "notify":
        var dormeurs = [];
        this.threads.forEach(function (autre, j) { if (autre.dort) dormeurs.push(j); });
        if (ins.tous) {
          dormeurs.forEach(function (j) {
            this.threads[j].dort = false;
            this.threads[j].reprend = true;
          }, this);
        } else if (dormeurs.length) {
          var choisi = dormeurs[0];
          this.threads[choisi].dort = false;
          this.threads[choisi].reprend = true;
        }
        break;

      case "cas":
        /* Reussite seulement si la case vaut encore ce qu'on avait lu. */
        if (this.mem[ins.v] === t.regs[ins.r]) {
          this.mem[ins.v] = t.regs[ins.r] + 1;
        } else {
          t.pc = ins.echec;
          this.history.push(i);
          this.render();
          return true;
        }
        break;

      default: break;
    }
    t.pc++;
    this.history.push(i);
    this.render();
    return true;
  };

  /** Ordonnancement aleatoire jusqu'au bout (ou jusqu'a l'interblocage). */
  ThreadSim.prototype.runRandom = function () {
    var garde = 0;
    while (!this.allDone() && !this.deadlocked() && !this.bloqueDeFait() && garde++ < 10000) {
      var libres = [];
      this.threads.forEach(function (_, i) {
        if (!this.finished(i) && !this.isBlocked(i)) libres.push(i);
      }, this);
      if (!libres.length) break;
      this.step(libres[Math.floor(Math.random() * libres.length)]);
    }
  };

  ThreadSim.prototype.render = function () {
    var self = this;
    var host = CI.clear(this.host);

    var grid = CI.h("div", { "class": "simgrid" });
    this.threads.forEach(function (t, i) {
      var bloque = self.isBlocked(i), fini = self.finished(i);
      var dort = t.dort, reprend = t.reprend, vide = self.tourneAVide(i);

      var head = CI.h("div", { "class": "th-head" }, [
        CI.h("span", { "class": "th-name", text: t.name }),
        CI.h("span", {
          "class": "th-state" + (bloque || vide ? " blocked" : (fini ? " done" : "")),
          text: dort ? "endormi"
              : reprend ? "réveillé, reprend le verrou"
              : vide ? "tourne à vide (" + t.tours + ")"
              : bloque ? "bloqué"
              : fini ? "terminé" : "prêt"
        })
      ]);

      var list = CI.h("div", { "class": "th-code" });
      t.code.forEach(function (ins, k) {
        var cls = "ins";
        if (k < t.pc) cls += " done";
        else if (k === t.pc) cls += bloque ? " cur blocked" : " cur";
        if (ins.k === "note") cls += " note";
        list.appendChild(CI.h("div", { "class": cls, text: label(ins) }));
      });

      var col = CI.h("div", { "class": "th" + (bloque ? " is-blocked" : "") }, [head, list]);

      var btn = CI.h("button", {
        "class": (!fini && !bloque) ? "primary" : "",
        text: fini ? "terminé"
            : dort ? "endormi"
            : bloque ? "bloqué"
            : "avancer " + t.name
      });
      btn.disabled = fini || bloque;
      btn.onclick = function () { self.step(i); self.onChange(self); };
      col.appendChild(btn);

      grid.appendChild(col);
    });
    host.appendChild(grid);

    // --- memoire partagee, registres, verrous
    var state = CI.h("div", { "class": "simstate" });
    Object.keys(this.mem).forEach(function (v) {
      state.appendChild(CI.h("span", { "class": "slot mem" }, [
        CI.h("span", { "class": "k", text: v }),
        CI.h("span", { "class": "val", text: String(self.mem[v]) })
      ]));
    });
    this.threads.forEach(function (t) {
      Object.keys(t.regs).forEach(function (r) {
        state.appendChild(CI.h("span", { "class": "slot reg" }, [
          CI.h("span", { "class": "k", text: t.name.replace(/[^0-9]/g, "") + "." + r }),
          CI.h("span", { "class": "val", text: String(t.regs[r]) })
        ]));
      });
    });
    Object.keys(this.locks).forEach(function (l) {
      var owner = self.locks[l];
      state.appendChild(CI.h("span", { "class": "slot lock" + (owner === null ? "" : " held") }, [
        CI.h("span", { "class": "k", text: "lock " + l }),
        CI.h("span", { "class": "val", text: owner === null ? "libre" : self.threads[owner].name })
      ]));
    });
    host.appendChild(state);
  };

  CI.ThreadSim = ThreadSim;
  CI.insLabel = label;

  /* --------------------------------------------------------------------
     Raccourcis pour ecrire un fil qui incremente une variable partagee.
     -------------------------------------------------------------------- */
  CI.incrAtomique = function (v, n) {
    var out = [];
    for (var i = 0; i < (n || 1); i++) out.push({ k: "incr", v: v });
    return out;
  };

  CI.incrDetaille = function (v, reg, n) {
    var out = [];
    for (var i = 0; i < (n || 1); i++) {
      out.push({ k: "load", r: reg, v: v });
      out.push({ k: "add", r: reg });
      out.push({ k: "store", v: v, r: reg });
    }
    return out;
  };
})(window.CI);
