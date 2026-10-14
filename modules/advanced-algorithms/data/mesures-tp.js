/* =========================================================================
   mesures-tp.js — les releves du TP1 « coupe minimum », tels que mesures.

   Produit par un script depuis les sorties du programme C ; ne pas editer a
   la main. Les memes nombres alimentent la note de TP du vault.

   t_iter  cout marginal d'une iteration, en secondes, obtenu par difference
           entre deux runs de tailles differentes (le demarrage du processus,
           ~16 ms, noie tout le reste sur les petits graphes)
   freq    atteintes / N : l'estimation de la probabilite de succes d'UNE
           iteration, pour autant que la meilleure coupe trouvee soit bien la
           coupe minimum
   exacte  coupe minimum calculee independamment (flot maximum ou enumeration),
           null quand le calcul exact ne passe pas l'echelle
   ========================================================================= */
window.CI_MESURES_TP = [
  { graphe: "toygraph",      n:         7, m:         9, composantes: 1, degre_min:  1,
    coupe:  1, exacte: 1,    N:       146, atteintes:        55,
    freq: 0.376712, borne: 0.04762, N_conseille: 146, t_iter: 1e-08, complet: true },
  { graphe: "toygraph2",     n:         8, m:         9, composantes: 1, degre_min:  2,
    coupe:  1, exacte: 1,    N:       194, atteintes:        54,
    freq: 0.278351, borne: 0.03571, N_conseille: 194, t_iter: 1e-08, complet: true },
  { graphe: "rand_100_8",    n:       100, m:       400, composantes: 1, degre_min:  4,
    coupe:  4, exacte: 4,    N:     34194, atteintes:      5643,
    freq: 0.165029, borne: 0.000202, N_conseille: 34194, t_iter: 3.23e-06, complet: true },
  { graphe: "rand_500_16",   n:       500, m:      4000, composantes: 1, degre_min:  5,
    coupe:  5, exacte: 5,    N:    861743, atteintes:     62216,
    freq: 0.0721979, borne: 8.016e-06, N_conseille: 861743, t_iter: 3.42e-05, complet: true },
  { graphe: "rand_1000_16",  n:      1000, m:      8000, composantes: 1, degre_min:  4,
    coupe:  4, exacte: 4,    N:   1680672, atteintes:    284737,
    freq: 0.169419, borne: 2.002e-06, N_conseille: 3.45042e+06, t_iter: 7.14e-05, complet: false },
  { graphe: "foodweb",       n:       183, m:      2434, composantes: 1, degre_min:  1,
    coupe:  1, exacte: 1,    N:    115035, atteintes:     38681,
    freq: 0.336254, borne: 6.005e-05, N_conseille: 115035, t_iter: 2.02e-05, complet: true },
  { graphe: "figeys",        n:      2217, m:      6418, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:   1570680, atteintes:   1569570,
    freq: 0.999293, borne: 4.071e-07, N_conseille: 1.69685e+07, t_iter: 7.64e-05, complet: false },
  { graphe: "ca-GrQc",       n:      4158, m:     13422, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:    689655, atteintes:    687331,
    freq: 0.99663, borne: 1.157e-07, N_conseille: 5.96996e+07, t_iter: 0.000174, complet: false },
  { graphe: "as2000",        n:      6474, m:     12572, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:    576923, atteintes:    576439,
    freq: 0.999161, borne: 4.773e-08, N_conseille: 1.44739e+08, t_iter: 0.000208, complet: false },
  { graphe: "p2p-Gnutella",  n:     62561, m:    147878, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:     39344, atteintes:     39344,
    freq: 1, borne: 5.11e-10, N_conseille: 1.35178e+10, t_iter: 0.00305, complet: false },
  { graphe: "youtube",       n:   1134890, m:   2987624, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:       295, atteintes:       295,
    freq: 1, borne: 1.553e-12, N_conseille: 4.44851e+12, t_iter: 0.406, complet: false },
  { graphe: "roadNet-TX",    n:   1351137, m:   1879201, composantes: 1, degre_min:  1,
    coupe:  1, exacte: null, N:       359, atteintes:       359,
    freq: 1, borne: 1.096e-12, N_conseille: 6.30529e+12, t_iter: 0.334, complet: false },
];
