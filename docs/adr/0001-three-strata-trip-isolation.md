# ADR-0001 — Trois strates et projection non jointive

**Date :** 2026-08-07
**Statut :** Accepté
**Contexte amont :** `docs/specs/2026-08-07-travel-agent-phases.md` §1

## Contexte

Le design initial pose une frontière entre la logique de raisonnement et les faits
d'une ville. Cette frontière est nécessaire — elle rend l'ajout d'une ville additif —
mais elle ne dit rien de la donnée du voyageur.

Or ce dépôt est public, et son premier utilisateur est identifiable : les commits
portent une identité réelle. Une fenêtre de séjour publiée dans cet arbre énonce
qu'un domicile précis est vide entre deux dates précises, à l'avance. Le logement,
s'il y figurait, dirait en plus où se trouve son occupant.

L'audit d'ouverture a trouvé cette donnée dans trois des quatre fichiers destinés
au commit initial, dont le pack de ville — le fichier dont la vocation est d'être
reversé aux communs.

## Décision

**Trois strates, pas deux.**

| Strate       | Emplacement    | Vocation                |
| ------------ | -------------- | ----------------------- |
| Raisonnement | `prompts/`     | publique                |
| Faits        | `data/cities/` | publique par obligation |
| Instance     | hors du dépôt  | jamais publique         |

Trois mécanismes la tiennent, du plus faible au plus fort :

1. **Ignorance de version** — `trips/` ne tracke que les démonstrations fictives.
2. **Dé-singularisation** — un pack liste les événements structurants de l'année,
   pas ceux qui recouvrent un séjour. Un calendrier restreint à une fenêtre est
   lui-même une divulgation : il désigne son auteur sans porter aucune date de
   séjour.
3. **Aveuglement structurel** — les modules de calcul et de veto n'importent pas
   le contrat d'instance. Un test d'architecture le prouve. Ces modules sont
   incapables de fuiter, quelle que soit la vigilance de qui les modifie.

**La projection est non jointive.** Une première version du squelette portait les
décalages relatifs aux événements du calendrier. Elle fuit : « événement
structurant à J−5 », joint au pack public qui date cet événement, reconstitue la
date exacte en une opération. Le squelette ne porte donc que des propriétés de
journée — forte affluence, rues fermées, transport perturbé — jamais l'identité de
l'événement qui les cause. L'optimiseur n'a besoin que de l'effet.

## Conséquences

- Un chemin d'instance est toujours fourni explicitement à l'exécution. Aucun
  emplacement par défaut : un défaut dans le dépôt invite à y déposer un fichier,
  un défaut sur une machine est un chemin machine-local dans un fichier tracké.
- Le gate d'isolation est **structurel avant d'être lexical**. Mesuré avant
  écriture : un gate qui recherche des dates produit trois faux positifs sur
  quatre sur un pack réel, tous sur des dates d'événements publics. Un gate
  bruyant est désarmé au troisième contournement.
- Les fragments littéraux de l'instance connue sont stockés encodés. Un gate qui
  contiendrait en clair ce qu'il protège le publierait dans le fichier que tout
  le monde lit en premier.
- L'hébergement se scinde : fourchettes de prix par quartier dans le pack (fait de
  ville), logement retenu dans l'instance.

## Alternatives écartées

**Dépôt privé jusqu'au retour, puis bascule publique.** Reporte le problème sans
le résoudre : la bascule exigerait la même purge, sur un historique cette fois.

**Deux dépôts, moteur public et instances privé.** Frontière garantie par la forge
plutôt que par la discipline, mais deux déployables pour un produit et une seule
instance ; le coût de coordination excède le gain.

**Décalage des dates dans le dépôt public.** Rend faux le calcul de fenêtre de
pass, la partition en actes et les jours de fermeture. Fabrique des faits
justes-mais-mal-datés : exactement le mode d'échec que le projet combat.
