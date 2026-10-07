#!/usr/bin/env python3
"""
Appose une version aux feuilles de style et aux scripts locaux des pages HTML.

Pourquoi : GitHub Pages sert les fichiers avec cache-control max-age=600 et ne
laisse pas regler cet en-tete. Une page fraichement deployee peut donc etre
servie avec une CSS mise en cache dix minutes plus tot, et s'afficher sans
styles. En ajoutant ?v=<version> aux URL, chaque deploiement produit des URL
nouvelles et le cache ne peut plus resservir l'ancien fichier.

Ce script tourne a la publication, pas dans le depot : les fichiers locaux
gardent des liens propres, et l'ouverture directe d'une page continue de
marcher sans rien.

    python3 outils/versionner-assets.py <version> [racine]
"""
import os
import re
import sys

MOTIF = re.compile(r'(?P<attr>href|src)="(?P<url>(?!https?:|//|data:)[^"?#]+\.(?:css|js))"')


def versionner(racine: str, version: str) -> tuple[int, int]:
    pages = fichiers = 0
    for dossier, _, noms in os.walk(racine):
        if ".git" in dossier.split(os.sep):
            continue
        for nom in noms:
            if not nom.endswith(".html"):
                continue
            chemin = os.path.join(dossier, nom)
            with open(chemin, encoding="utf-8") as f:
                avant = f.read()

            compteur = [0]

            def remplace(m):
                compteur[0] += 1
                return '{attr}="{url}?v={v}"'.format(
                    attr=m.group("attr"), url=m.group("url"), v=version
                )

            apres = MOTIF.sub(remplace, avant)
            if apres != avant:
                with open(chemin, "w", encoding="utf-8") as f:
                    f.write(apres)
                pages += 1
                fichiers += compteur[0]
    return pages, fichiers


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage : versionner-assets.py <version> [racine]")
    v = sys.argv[1][:12]
    r = sys.argv[2] if len(sys.argv) > 2 else "."
    p, f = versionner(r, v)
    print("version {} apposee a {} reference(s) dans {} page(s)".format(v, f, p))
