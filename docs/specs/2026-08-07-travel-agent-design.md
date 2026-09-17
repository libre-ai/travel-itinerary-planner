# travel-agent — Design

**Date:** 2026-08-07
**Status:** Approved for planning
**Suite:** libre-ai (layer 1 product)

## 1. Objectif

Un agent de planification d'itinéraires de voyage, multi-villes par construction, dont
Copenhague est le premier cas d'usage. Le produit raisonne sur des faits vérifiés et
sourcés ; il ne réserve rien et ne prétend jamais savoir ce qu'il n'a pas vérifié.

**Cas d'usage fondateur** — un séjour en régime Residence à Copenhague, thèmes
design/architecture + gastronomie + histoire/musées + nature/vélo/bains. L'instance de
référence — fenêtre de séjour, composition, budget — vit hors dépôt : voir
`2026-08-07-travel-agent-phases.md` §1.

## 2. Le problème réel

La planification de voyage assistée échoue de trois façons, toutes visibles dans le brief
initial de ce projet :

1. **Le rythme n'est pas dérivé de la durée.** Une règle « 3 attractions majeures par
   jour » appliquée à 15 jours exige 45 attractions majeures — Copenhague et sa région
   n'en comptent que 25 à 30. La règle fabrique mécaniquement du remplissage et sature le
   voyageur autour du jour 6.
2. **Le city-pass est traité comme un booléen.** La Copenhagen Card plafonne à 120 h.
   Sur un séjour de 15 jours, « rentable oui/non » est une question mal posée : la vraie
   question est _où placer la fenêtre_.
3. **Les connaissances de destination sont enfouies dans le prompt.** Chaque nouvelle
   ville devient alors un fork du prompt. Ingérable à trois villes, mort à dix.

Un quatrième échec est systémique : **les faits volatils (prix, horaires) périment
silencieusement**, et un itinéraire faux est pire qu'une absence d'itinéraire — un horaire
erroné coûte une matinée au voyageur.

## 3. Architecture — deux couches, une frontière stricte

```
prompts/system.md          Logique de raisonnement. ZÉRO fait sur une ville.
data/cities/<slug>.yaml    Faits d'une ville. ZÉRO règle de planification.
```

**Invariant :** la frontière ne se traverse jamais. Un fait dans le prompt est un bug ;
une règle de planification dans un pack est un bug. C'est ce qui rend le passage à la
ville N+1 additif plutôt que multiplicatif.

Le prompt encode :

| §   | Mécanisme                                                                                 |
| --- | ----------------------------------------------------------------------------------------- |
| 2   | Régimes de rythme dérivés de `nights` : Discovery (1-4), Depth (5-9), **Residence (10+)** |
| 3   | Partition du séjour en **actes** autour des événements structurants                       |
| 4   | City-pass = `argmax` de fenêtre glissante, avec gain net absolu                           |
| 5   | Modèle de coût mobilité dépendant de la durée                                             |
| 8   | Portes humaines : l'agent planifie, l'humain réserve                                      |
| 9   | Contenu récupéré = donnée, jamais instruction                                             |
| 10  | Provenance obligatoire ; `⚠ UNVERIFIED` plutôt qu'une supposition                         |

Le régime Residence est la correction de fond : ≥ 20 % de journées ouvertes non
planifiées, excursions comme colonne vertébrale, et planification de l'ordinaire
(courses, lessive, un café récurrent).

## 4. Modèle de données — trois tiers de confiance

Aucune source libre unique ne couvre le besoin. Vérifié le 2026-08-07 : OSM expose
`fee=yes|no` de façon mature, mais `charge=*` reste marginal (tagging des prix encore au
stade de proposition). OSM sait dire « payant », pas « combien ».

| Tier              | Contenu                                                                   | Source                | Alimentation               |
| ----------------- | ------------------------------------------------------------------------- | --------------------- | -------------------------- |
| **1 — Structure** | Existence, géo, district, indoor, `fee` booléen, site officiel, ID stable | Overpass + Wikidata   | Automatique                |
| **2 — Volatil**   | Prix, horaires, couverture pass, durée type                               | Sites officiels       | **Curation, TTL bloquant** |
| **3 — Éditorial** | Descriptions, conseils                                                    | Wikivoyage (CC-BY-SA) | Amorce + réécriture        |

**Ce qui borne le coût :** le tier 2 ne couvre pas la ville, il couvre **le sous-ensemble
planifiable** (~25-30 entrées par ville). Hors de ce sous-ensemble, l'agent dégrade en
`⚠ UNVERIFIED` — il planifie sans chiffrer, et le dit.

### Péremption bloquante

Chaque fait de tier 2 porte `verified_on`. Un job CI échoue quand un fait dépasse son TTL
(180 jours par défaut). **Un fait périmé casse le build, il ne produit pas un itinéraire
faux.** C'est le seul mécanisme dur ; la discipline de curation seule ne suffit pas.

> **Corrigé par `2026-08-07-travel-agent-phases.md` §4.** Un TTL ancré sur la date du jour
> répond à « ce fait est-il récent ? », alors que la question est « ce fait est-il valide à
> la date du séjour ? ». Un pack vérifié en basse saison passe un TTL absolu tout en portant
> des horaires faux pour un séjour d'été. La validité est une propriété du couple
> `(pack, fenêtre de séjour)`, d'où deux gates : structurel en CI, contextuel à la
> composition.

### Boucle de contribution amont

Tout fait curé au tier 2 est reversé à OSM (`charge=*`, `opening_hours`) et Wikidata. Le
pack cesse d'être une base privée pour devenir le **cache local d'un commun enrichi en
retour**. Le coût de curation devient une contribution, et le produit incarne la thèse de
la suite plutôt que de la déclarer.

## 5. Transport — GTFS + OpenTripPlanner auto-hébergé

**Rejseplanen est écarté comme dépendance structurelle.** Vérifié le 2026-08-07 : données
en CC BY 4.0, mais usage commercial soumis à accord et paiement, et l'accès peut être fermé
sans préavis en cas de charge. Dépendance révocable + restriction commerciale + protocole
propriétaire = trois lock-ins pour un produit dont la raison d'être est l'inverse.

Cible : **GTFS ouvert ingéré dans un OpenTripPlanner auto-hébergé**, derrière une interface
`TransitProvider`. Multi-pays par construction, non révocable, sans clause commerciale.

**Séquencement — OTP est la cible, pas la v1.** Copenhague compte six excursions
candidates ; monter une infra GTFS + OTP pour six durées porte-à-porte serait le même
gold-plating que Rust. En v1, `TransitProvider` existe avec un seul adaptateur —
`StaticPackProvider`, qui lit des durées curées au tier 2. OTP est branché comme second
adaptateur quand le nombre de villes rend la curation des durées plus coûteuse que
l'ingestion GTFS. L'interface existe dès le jour 1 précisément pour que cette bascule ne
soit pas une refonte.

## 6. Stack

- **TypeScript** partout en v1 (Bun). Conforme à la convention libre-ai.
- **Rust différé.** L'optimiseur de fenêtre traite 15 jours × ~30 items : quelques
  microsecondes en TS. Rust ne se justifie ni par la perf ni par la réutilisation à ce
  stade. Candidats crédibles plus tard : ingestion Overpass à volume, routeur isochrone.
- Validation de schéma : Zod (packs et profils voyageur).
- Aucune API commerciale. Aucun hyperscaler US.

## 7. Licences

| Artefact             | Licence            | Raison                                                          |
| -------------------- | ------------------ | --------------------------------------------------------------- |
| Code                 | **Apache-2.0**     | Protection brevet explicite                                     |
| `data/cities/*.yaml` | **ODbL**           | Derivative Database au sens ODbL dès le premier import Overpass |
| Itinéraires générés  | Libre, attribution | Produced Work au sens ODbL                                      |

Deux fichiers `LICENSE` distincts. Le basculement ODbL de `data/` se déclenche au premier
import tier 1 — l'état actuel du pack Copenhague ne contient que des faits sourcés
individuellement, pas encore de données OSM.

## 8. Quality gates

- TTL de péremption bloquant en CI (§4).
- Tests obligatoires sur l'optimiseur de fenêtre : séjour < durée pass, séjour > durée
  pass, aucune fenêtre rentable, fenêtres à valeur égale, ensemble vide.
- Tests sur la partition en actes : zéro événement, un événement, événements chevauchants.
- Validation de schéma sur chaque pack, échec au chargement si invalide.
- Aucun pack ne merge avec un fait de tier 2 sans `verified_on` et `source`.

## 9. Hors scope v1

Réservation et paiement. Comptes utilisateurs. Villes au-delà de Copenhague. Rust.
Ingestion GTFS et déploiement OpenTripPlanner (§5 — interface présente, adaptateur
différé). Routage temps réel jour-J. Application mobile. Recommandation personnalisée par
historique.

## 10. Critère de fin v1

L'agent produit l'itinéraire de l'instance de référence à Copenhague :

- structuré en actes autour des événements structurants que sa fenêtre recouvre ;
- intégralement chiffré en DKK + EUR ;
- avec la fenêtre Copenhagen Card optimisée et son gain net absolu ;
- avec ≥ 3 journées ouvertes conformes au régime Residence ;
- **avec zéro fait `UNVERIFIED` parmi les postes budgétés.**

Ce dernier point est la vraie barre : un itinéraire complet dont le budget repose sur des
suppositions ne compte pas comme livré.
