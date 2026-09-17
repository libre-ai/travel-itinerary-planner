<!-- SPDX-FileCopyrightText: 2026 Libre AI contributors -->
<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Développement local

Le code récupéré est intégré dans `data, tools/ci, tests`. Les sous-paquets conservent leurs noms et versions propres ; ce dépôt n’est pas un paquet monolithique. La provenance par fichier et les notices historiques sont dans `code-recovery-provenance.json` et `source-licensing/`.

## Installer et vérifier

Utilisez le [guide commun de composition locale](https://github.com/libre-ai/project-governance/blob/main/docs/LOCAL-COMPOSITION.md) avec la cible `travel-itinerary-planner` et le SHA du commit à vérifier. Il prépare les voisins épinglés, installe les workspaces dans l’ordre et construit UI avant les consommateurs. Après cette préparation, exécutez les commandes propres à cette application depuis sa racine dans la composition.

L’installation est une étape explicite ; `check` ne télécharge plus de dépendances. Les contrôles Bun, toolchain, secrets, données personnelles et les suites applicables restent bloquants. Les tests d’intégration utilisant PGlite n’ouvrent pas de base de données de production. Les scripts de déploiement hérités ne sont pas nécessaires à ces vérifications et ne doivent pas être exécutés pour un test local.

## État et limites

Les résultats observés sont dans [verification-status.json](verification-status.json). Les suites navigateur utilisant le même port doivent être exécutées séquentiellement. Un build local ne constitue ni publication de paquet, ni déploiement, ni validation de toutes les intégrations futures. Les README d’applications et les documents historiques décrivent aussi des étapes non réalisées ; leur ancien statut n’est pas une preuve actuelle.

Les quinze tests d’isolation portent sur les données/voyages et leur confinement dans le dépôt. Aucune application de génération d’itinéraire n’est présente : ces tests ne prouvent pas une telle application.
