# ADR-0002 — Modèle de menace de la surface agentique

**Date :** 2026-08-07
**Statut :** Accepté
**Contexte amont :** `docs/specs/2026-08-07-travel-agent-phases.md` §1.3

## Contexte

La couche de raisonnement traite le contenu récupéré comme de la donnée et jamais
comme une instruction. Cette règle protège **notre** agent de ce qu'il lit.

Exposer le moteur à des agents tiers inverse le flux. Nos sorties entrent alors
dans le contexte d'agents que nous ne contrôlons pas, et le tier 3 est du contenu
éditorial librement modifiable en amont. Une injection déposée dans un article
traverserait le produit et atteindrait l'agent d'un utilisateur : le projet
deviendrait un relais d'injection.

Aucun autre dépôt de la constellation n'expose de surface agentique. Il n'existe
donc aucun motif interne à reprendre.

## Décision

**Neutralisation en sortie.** Tout champ de tier 3 est neutralisé avant de
traverser la surface agentique. Un test d'injection le prouve, et le prédicat
d'abandon `injection-relay` en fait une condition d'existence du produit, pas une
amélioration souhaitable.

**Opérations en propriétés non identifiantes.** La plupart des opérations n'ont
aucun besoin d'un calendrier absolu : l'optimisation de fenêtre raisonne sur des
durées et des valeurs, la partition en actes sur des propriétés de journée. Seule
la composition finale voit des dates réelles, et elle s'exécute localement.

**Deux surfaces, pas trois.** Une surface agentique n'est pas joignable depuis un
téléphone en déplacement ; une surface de consultation mobile ne peut donc pas
être la surface agentique. Le produit expose une surface de production
(agentique) et une surface de consultation (export statique autonome, consultable
sans réseau). Une troisième surface de replanification en ligne est écartée : les
plans de repli et les listes courtes du gabarit de sortie couvrent le besoin
hors-ligne, et une surface exigeant le réseau au moment précis où il manque
résout mal un problème déjà résolu.

## Conséquences

- Le coût du premier motif agentique de la constellation est porté par ce dépôt.
- La sanitisation est un gate, pas une revue.
- Le protocole d'exposition est un transport, jamais un contrat. Le contrat reste
  un schéma de données ; la surface agentique en est un adaptateur, au même titre
  que l'export statique. Changer de protocole ne doit pas changer le cœur.

## Ce que cette décision ne résout pas

Une surface agentique locale transmet quand même ses entrées à l'hôte qui
l'invoque, et cet hôte les transmet à son modèle. Les propriétés non
identifiantes réduisent fortement ce qui transite, elles ne l'annulent pas. La
composition finale, qui voit un calendrier réel, reste l'opération à surveiller —
et la seule justification de la garder locale.
