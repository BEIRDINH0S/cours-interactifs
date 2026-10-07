/* =========================================================================
   stepper.js — controleur pas a pas generique.

   Donne-lui un nombre d'etapes et une fonction de rendu ; il s'occupe des
   boutons precedent/suivant, du deroule automatique, du curseur et du
   clavier (fleches, espace).

   var s = new CI.Stepper({
     total: trace.length,
     render: function(i){ ... },
     els: { prev:…, next:…, play:…, scrub:…, label:… }
   });
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  function Stepper(cfg) {
    var self = this;
    this.render = cfg.render;
    this.els = cfg.els || {};
    this.delay = cfg.delay || 1100;
    this.labelFmt = cfg.labelFmt || function (i, n) { return "étape " + (i + 1) + " / " + n; };
    this.i = 0;
    this.total = 0;
    this.timer = null;

    if (this.els.prev) this.els.prev.onclick = function () { self.stop(); self.go(-1); };
    if (this.els.next) this.els.next.onclick = function () { self.stop(); self.go(1); };
    if (this.els.play) this.els.play.onclick = function () { self.toggle(); };
    if (this.els.scrub) {
      this.els.scrub.oninput = function (e) { self.stop(); self.seek(+e.target.value); };
    }

    document.addEventListener("keydown", function (e) {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); self.stop(); self.go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); self.stop(); self.go(-1); }
    });

    if (cfg.total) this.reset(cfg.total);
  }

  Stepper.prototype.reset = function (total, at) {
    this.total = total;
    this.i = at || 0;
    if (this.els.scrub) {
      this.els.scrub.max = Math.max(0, total - 1);
      this.els.scrub.value = this.i;
    }
    this.paint();
  };

  Stepper.prototype.seek = function (i) {
    if (i < 0 || i >= this.total) return;
    this.i = i;
    this.paint();
  };

  Stepper.prototype.go = function (d) { this.seek(this.i + d); };

  Stepper.prototype.paint = function () {
    this.render(this.i);
    if (this.els.scrub) this.els.scrub.value = this.i;
    if (this.els.label) this.els.label.textContent = this.labelFmt(this.i, this.total);
    if (this.els.prev) this.els.prev.disabled = (this.i === 0);
    if (this.els.next) this.els.next.disabled = (this.i >= this.total - 1);
  };

  Stepper.prototype.stop = function () {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    if (this.els.play) this.els.play.textContent = "Dérouler";
  };

  Stepper.prototype.toggle = function () {
    var self = this;
    if (this.timer) { this.stop(); return; }
    if (this.i >= this.total - 1) this.seek(0);
    if (this.els.play) this.els.play.textContent = "Pause";
    this.timer = setInterval(function () {
      if (self.i >= self.total - 1) { self.stop(); return; }
      self.go(1);
    }, this.delay);
  };

  CI.Stepper = Stepper;
})(window.CI);
