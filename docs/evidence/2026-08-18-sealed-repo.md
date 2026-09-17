# Preuves de sortie de phase — sealed-repo (2026-08-18)

Relevés produits sur l'index du commit initial, avant publication du repository.
Chaque preuve est reproductible avec les commandes citées.

## leak-gate-demonstrated

Le gate d'isolation est prouvé dans les deux sens :

- Sens rouge : un fichier en forme d'instance (`checkin`, `checkout`, `party`,
  `lodging`) stagé de force (`git add -f trips/proof-instance.yaml`, le
  `.gitignore` de `trips/` bloquant déjà tout nom hors `demo-*`) fait échouer
  `bun run check:trip-isolation` — sortie :
  `trips/proof-instance.yaml:1: document shaped like a trip instance (checkin,
checkout, lodging, party) — instances live outside the repository`,
  code de sortie 1.
- Sens vert : le même index sans ce fichier passe —
  `OK: no trip instance in tracked files.`, code 0.
- Non-déclenchement : le calendrier du pack `data/cities/copenhagen.yaml`
  (7 événements publics, dates absolues sourcées) ne déclenche aucune violation.

## no-instance-in-initial-commit

Audit complet des 27 fichiers de l'index initial : aucune fenêtre de séjour,
aucune composition de groupe, aucun budget, aucun hébergement. Les seules dates
absolues du contenu sont les événements publics du pack (chacune portant
`source` + `verified_on`) et leurs reprises en fixtures de test.
`bun run check:secret-scan` et `bun run check:trip-isolation` verts sur l'index.

## fleet-card-valid

`bun tools/ci/check-project-card.ts` →
`OK: project.v1.yaml conforms to libre-ai.project.v1.`
Schéma consommé depuis la git-dep governance épinglée `f767f2fb96c9`.

## dual-licence

`LICENSE` (racine) = Apache License 2.0 ; `data/LICENSE` = Open Data Commons
Open Database License (ODbL) 1.0. Les deux fichiers sont distincts et présents
dans l'index initial ; `package.json` déclare `Apache-2.0`.
