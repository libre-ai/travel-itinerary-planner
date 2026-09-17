# travel-agent — Phases, livrables, organisation

**Date :** 2026-08-07
**Statut :** Approuvé pour planification
**Autorité d'état :** `project.v1.yaml` — ce document en est la narration, pas la source.
**Amont :** `docs/specs/2026-08-07-travel-agent-design.md`

> **Invariant de publication.** Ce document est public. Il ne nomme aucune fenêtre de
> séjour, aucune composition de groupe, aucun budget. Cette contrainte n'est pas une
> précaution rédactionnelle : c'est la première application de la règle que §1 pose.

---

## 0. Ce que ce document décide

Six décisions qui prolongent la spec de design, dont deux la corrigent.

1. **Une troisième strate** sépare l'instance de voyage des faits publics (§1).
2. **Le code vérifie, il ne rédige pas** — renversement du rôle du logiciel (§3).
3. **La fraîcheur se mesure contre la fenêtre du séjour**, pas contre aujourd'hui. La spec
   de design se trompait de question (§4).
4. **La contribution amont est le modèle, pas une vertu** : seule sortie connue de la dette
   de re-vérification, elle démarre en phase 2 et non en fin de parcours (§9).
5. **Deux surfaces**, pas trois (§6).
6. **Deux contrats versionnés**, pas six (§2).

---

## 1. Trois strates, pas deux

La spec de design pose une frontière entre logique et faits. Elle est nécessaire mais
incomplète : elle ne dit pas où vivent les données du voyageur.

| Strate       | Contenu                                | Vocation                    | Emplacement                             |
| ------------ | -------------------------------------- | --------------------------- | --------------------------------------- |
| Raisonnement | règles de planification, city-agnostic | publique                    | `prompts/`                              |
| Faits        | faits d'une ville, sourcés et datés    | **publique par obligation** | `data/cities/`                          |
| **Instance** | fenêtre de séjour, composition, budget | **jamais publique**         | hors dépôt, chemin fourni à l'exécution |

### 1.1 La protection réelle est la dé-singularisation, pas le masquage

Masquer une instance est fragile : un commentaire oublié suffit. Ce qui tient est de rendre
les faits **structurellement incapables de désigner quelqu'un**.

Un pack dont le calendrier ne contient que les événements recouvrant une fenêtre de séjour
donnée est un pack construit autour d'un voyageur : le calendrier _est_ la signature, même
sans aucune date de séjour écrite nulle part. Un pack honnête liste les événements
structurants de l'année — ce qui le rend simultanément réutilisable par des tiers, conforme
à sa vocation de commun, et muet sur son premier utilisateur.

### 1.2 La projection, et la faille qu'elle a d'abord contenue

L'instance se projette sur un **squelette** transmissible. Première version de ce design :
le squelette portait le nombre de nuits, le régime de rythme et les **décalages relatifs
aux événements du calendrier**.

Cette version fuit. Une donnée relative jointe à un référentiel public redevient absolue :

```
squelette : « événement structurant #1 à J−5 »
pack      : « cet événement commence le <date publique> »
            ─────────────────────────────────────────────
jointure  : la date de début du séjour, reconstituée exactement
```

C'est le mode d'échec classique de l'anonymisation par décalage. Le squelette ne contenait
aucune date et la date se déduisait en une ligne.

**Version retenue :** le squelette ne porte que des **propriétés de journée non
identifiantes** — forte affluence, rues fermées, transport perturbé, programme gratuit.
Jamais l'identité de l'événement qui les cause. L'optimiseur n'a besoin que de l'effet.

Conséquence vérifiable : **aucun module de calcul ou de veto n'importe le contrat
d'instance**. Un test d'architecture le prouve, indépendamment de la vigilance de qui
modifie ces modules. Le motif est déjà employé dans la constellation : une preuve
structurelle exécutée en CI plutôt qu'une promesse tenue à la revue.

### 1.3 Ce que la surface agentique impose en plus

Exposer le moteur à des agents tiers renverse le modèle de menace de la couche de
raisonnement. Son §9 protège l'agent du contenu récupéré ; ici le flux s'inverse : les
résultats produits entrent dans le contexte d'agents que le projet ne contrôle pas.

Le tier 3 est du contenu éditorial librement modifiable. Sans neutralisation en sortie, une
injection déposée en amont traverse le produit et atteint l'agent consommateur. Le projet
deviendrait un relais d'injection — d'où le prédicat d'abandon `injection-relay`.

---

## 2. Ce qui mérite une version, et ce qui n'en mérite pas encore

Convention de la constellation : `libre-ai.<nom>.v<N>` — versionnement **de contrat**, non
semver ; compatibilité additive à l'intérieur d'un `vN`.

Deux artefacts la prennent maintenant, parce qu'ils portent un risque réel :

| Artefact               | Risque                                                                                                          | Contrat                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- |
| couche de raisonnement | **régression silencieuse** : modifier une règle change toutes les sorties, sans qu'aucun signal ne se déclenche | `travel-agent.reasoning.v1` |
| pack de ville          | **péremption** : un fait invalide doit être détectable                                                          | `libre-ai.city-pack.v1`     |

Les autres — instance, squelette, itinéraire, fournisseur de transport — prendront une
version le jour où ils traverseront une frontière. Un contrat sans consommateur est une
abstraction sans preuve, et la règle de trois s'applique aux contrats comme au reste.

**La limite à assumer :** un prompt n'est pas typé. Sa compatibilité ne se vérifie pas par
schéma mais par évaluation sur des sorties de référence figées. C'est la garantie la plus
faible du dispositif, et la plus centrale ; la présenter comme équivalente à un contrat de
données serait se mentir.

---

## 3. Le code vérifie, il ne rédige pas

Question décisive : quels modules méritent d'exister, sachant qu'un modèle de langage
tient déjà l'autre bout ?

| Travail                         | Le modèle le fait                   | Verdict           |
| ------------------------------- | ----------------------------------- | ----------------- |
| optimisation de fenêtre de pass | **mal** — arithmétique combinatoire | **code justifié** |
| partition en actes              | bien, mais sans reproductibilité    | code léger        |
| rédaction de l'itinéraire       | **mieux que du code**               | **ne pas coder**  |

Écrire un générateur qui remplit les gabarits de sortie en TypeScript réimplémenterait en
moins bien ce que le modèle fait nativement — et appauvrirait la prose, alors que l'objet
livré _est_ de la prose.

**Le logiciel devient un vérificateur.** Il ne compose pas : il refuse. Un itinéraire
proposé est rejeté s'il viole une contrainte vérifiable :

- quota de journées ouvertes non atteint en régime Residence ;
- un poste budgété repose sur un fait non sourcé ;
- un fait budgété ne couvre pas la fenêtre du séjour (§4) ;
- journées denses consécutives au-delà de ce que le régime autorise ;
- ventilation budgétaire incomplète.

Le modèle produit, le code oppose son veto. Base de code plus petite, contraintes toutes
testables, et la valeur déplacée là où elle est réelle.

---

## 4. La fraîcheur se mesure contre le séjour, pas contre aujourd'hui

La spec de design pose un TTL absolu : un fait au-delà de N jours casse le build. Cela
répond à « ce fait est-il récent ? ». Ce n'est pas la question.

> Pack vérifié en hiver, séjour planifié en été. Le TTL absolu passe au vert. Les horaires
> de haute saison ne sont pas ceux de basse saison. **L'itinéraire est faux et le build est
> vert** — précisément le mode d'échec que le TTL prétend empêcher.

La validité n'est pas une propriété du pack seul : c'est une propriété du couple
`(pack, fenêtre de séjour)`. D'où **deux gates distincts** :

| Gate       | Où          | Ce qu'il refuse                                             |
| ---------- | ----------- | ----------------------------------------------------------- |
| structurel | CI          | un pack dont des faits sont périmés dans l'absolu           |
| contextuel | composition | un itinéraire dont un fait budgété ne couvre pas la fenêtre |

Le second est celui qui protège réellement le voyageur.

---

## 5. Deux voies, six phases

### 5.1 Voie Terrain — sans code

La curation du sous-ensemble planifiable n'est pas une tâche de développement : c'est de la
vérification sur sources officielles. Aucune phase de code ne la débloque, et rien en aval
ne se teste sérieusement sans elle — un optimiseur qui reçoit un ensemble vide répond
« aucune fenêtre rentable » : un test vert qui ne prouve rien.

Cette voie produit le pack chiffrable et un **itinéraire de référence** composé sur une
instance réelle. Ce dernier ne quitte pas la machine ; il sert de sortie attendue.

### 5.2 Voie Produit

| Phase             | Ce qu'elle prouve                               | Devient possible ensuite           |
| ----------------- | ----------------------------------------------- | ---------------------------------- |
| `sealed-repo`     | le dépôt ne **peut pas** publier une instance   | tout le reste peut être commité    |
| `curated-pack`    | un itinéraire peut être chiffré intégralement   | les moteurs ont une matière réelle |
| `typed-core`      | pack et instance sont des données validées      | le squelette circule sans fuir     |
| `planning-engine` | le calcul sort, et le veto mord                 | la composition est encadrée        |
| `surfaces`        | consommable hors-ligne et par un agent          | utilisable en situation            |
| `durability`      | ni mensonge dans le temps, ni dette non mesurée | la v1 tient sans surveillance      |

Aucune phase n'est un socle muet : `sealed-repo` se démontre par un gate rouge puis vert,
pas par la présence de fichiers de configuration.

---

## 6. Livrables par phase

Définition de terminé : code + tests + documentation de contrat + exemple + ADR si décision
d'architecture.

### `sealed-repo`

- Purge de toute instance dans les documents hérités — **avant** le commit initial.
- Fiche de flotte, adaptateurs de périmètre, double licence.
- Hygiène de contexte de flotte, consommée par SHA.
- **Gate d'isolation d'instance**, avec motifs encodés : un gate qui contiendrait en clair
  ce qu'il protège le publierait lui-même.
- **ADR-0001 — trois strates, projection non jointive.**
- **ADR-0002 — modèle de menace de la surface agentique.**

> **Contrainte de conception du gate, mesurée avant écriture.** Un gate qui recherche des
> dates produit majoritairement des faux positifs : sur le pack de la première ville, trois
> captures sur quatre sont les dates d'événements du calendrier — des faits publics
> légitimes, précisément ceux que §1.1 demande d'ajouter. Un gate bruyant est désarmé au
> troisième contournement.
>
> Le gate doit donc être **structurel avant d'être lexical** : refuser tout fichier tracké
> conforme au contrat d'instance, refuser toute référence à une fenêtre de séjour dans les
> commentaires d'un pack, et ne recourir à un motif encodé que pour la fenêtre exacte de
> l'instance connue. Le premier test à écrire est celui qui prouve que le calendrier de
> `curated-pack` **ne déclenche pas** le gate.

### `curated-pack`

- Sous-ensemble planifiable peuplé, chaque entrée sourcée et datée.
- **Tous les postes budgétaires modélisés, hébergement compris.** Sans cela, le critère
  « zéro fait non vérifié parmi les postes budgétés » est inatteignable par construction :
  sur un long séjour, l'hébergement est le premier poste et il n'existe nulle part dans le
  modèle de données actuel.
- **Normales climatiques par mois** — jours de pluie, températures, heures de clarté.
  Aucune prévision n'étant exploitable au-delà de dix jours, ce qui alimente les plans de
  repli est une statistique, pas une API. Donnée stable, donc fait de tier 2 dans le pack.
- Calendrier étendu à l'année (§1.1).
- **Démarrage de la contribution amont**, avec mesure de la part reversée (§9).
- Note de méthode de curation, réutilisable pour la ville suivante.

### `typed-core`

- Chargeurs et schémas de pack et d'instance ; refus documenté avec chemin du champ fautif.
- **Projection instance → squelette non jointive** (§1.2) et sa batterie de tests.
- Trip de démonstration public, servant de test de bout en bout.
- Versions de contrat sur les deux artefacts qui le méritent (§2).

### `planning-engine`

- Optimiseur de fenêtre : verdict chiffré, gain net absolu, coût des jours restants.
- **Veto**, avec un test par contrainte prise isolément (§3).
- Fixtures **synthétiques** pour les cas limites. Une ville réelle ne produira jamais deux
  fenêtres à valeur exactement égale : un banc de test exige des valeurs choisies.
- Test d'architecture prouvant l'aveuglement à l'instance.

### `surfaces`

Deux surfaces, pour un cœur. Pas de troisième.

```
        ┌──── cœur : optimiseur + veto ────┐
        └─────────────┬────────────────────┘
              ┌───────┴────────┐
        surface agentique   export statique
        (production)        (consultation, hors-ligne)
```

- Interface de fournisseur de transport et son unique adaptateur statique.
- **Export statique autonome**, testé réseau réellement coupé, plans de repli et listes
  courtes inclus.
- **Surface agentique** opérant sur le squelette, avec neutralisation du tier 3 et test
  d'injection.

### `durability`

- **Deux gates de fraîcheur** (§4), le contextuel prouvé par un fait récent mais hors
  saison — celui qui passerait un TTL absolu.
- Gate de non-régression de la couche de raisonnement, par sorties de référence.
- **Mesures d'entrée du réexamen de la troisième ville** (§10).

---

## 7. Organisation

### 7.1 Ce qui se parallélise

| Travaux                                | Relation          | Justification                                        |
| -------------------------------------- | ----------------- | ---------------------------------------------------- |
| Terrain ∥ `sealed-repo` ∥ `typed-core` | indépendants      | vérification humaine d'un côté, code de l'autre      |
| curation du sous-ensemble              | **fan-out**       | chaque agent prend quelques entrées et leurs sources |
| optimiseur ∥ veto                      | modules disjoints | aucun import croisé                                  |

Le fan-out de curation exige un prompt fermé : source officielle obligatoire, **citation
exacte et URL retournées avec chaque valeur**, format imposé, interdiction absolue de
produire une valeur non sourcée. Sans la citation, le fan-out n'est pas un accélérateur de
vérification mais un générateur de fausses certitudes — un prix halluciné qui franchit la
revue casse le critère de fin, et le casse en silence.

Recoupement croisé recommandé sur les valeurs monétaires : deux agents indépendants par
entrée, désaccord traité comme non vérifié.

### 7.2 Ce qui est séquentiel

`sealed-repo` précède tout commit : après le premier envoi, la correction d'une fuite
devient une réécriture d'historique. Puis `typed-core` → `planning-engine` → `surfaces`.
La voie Terrain alimente `surfaces` en sortie attendue.

### 7.3 Worktrees

Un seul emplacement les justifie : l'exécution simultanée de l'optimiseur et du veto, deux
agents écrivant dans l'arborescence de code au même moment. Partout ailleurs : non. Dépôt
neuf, aucune branche déployable à protéger, phases courtes. Tout worktree ouvert est retiré
dans le même flux, y compris en cas d'échec.

---

## 8. Chemin critique

```
Terrain : curation ──▶ itinéraire de référence
                              │ (sortie attendue)
                              ▼
sealed-repo ──▶ typed-core ──▶ planning-engine ──▶ surfaces ──▶ durability
```

Le chemin critique est la **curation**, et il ne contient pas une ligne de code. Commencer
par le socle, c'est faire le bon travail dans le mauvais ordre.

---

## 9. La contribution amont est le modèle, pas une vertu

Arithmétique de la dette : quelques dizaines d'entrées par ville, re-vérifiées deux fois
l'an. À dix villes, plusieurs centaines de vérifications annuelles, indéfiniment. Aucune
discipline individuelle ne tient cela.

La seule issue connue est que la curation cesse d'être un coût privé. Si les prix et les
horaires remontent dans les communs, l'ingestion automatique finit par les lire, et la
curation devient un **investissement amorti** au lieu d'une rente à payer.

C'est pourquoi le reversement amont démarre en `curated-pack`, avec sa part mesurée, et non
comme dernier critère de la dernière phase. Traité comme une finition, il resterait une
intention ; traité comme un levier, il conditionne la viabilité au-delà de la troisième
ville.

---

## 10. Écarté délibérément, et le point de bascule

| Écarté                                  | Motif                                                          | Ce qui le ferait revenir                     |
| --------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Rust en v1                              | volume de calcul dérisoire                                     | ingestion à fort volume, routage isochrone   |
| Infrastructure de routage en v1         | quelques durées porte-à-porte                                  | quand curer les durées coûte plus qu'ingérer |
| **Ingestion automatique de tier 1**     | un pipeline coûte plus que les entrées qu'il produirait        | **réexamen à la troisième ville**            |
| **Générateur d'itinéraire en code**     | réimplémente le modèle en moins bien (§3)                      | rien de prévisible                           |
| **Surface de replanification en ligne** | plans de repli et listes courtes couvrent le besoin hors-ligne | un usage réel qui démontre le contraire      |

### Le réexamen de la troisième ville

La v1 vise un usage personnel sur une à deux villes. Le passage à l'échelle ne se décide
pas sur projection mais sur trois mesures, consignées pendant `curated-pack` et
`durability` :

1. le **coût réel** de curation d'une ville, mesuré et non estimé ;
2. le **taux de péremption observé** sur un cycle complet ;
3. la **part des faits absorbés en amont** — a-t-elle commencé à réduire le coût ?

Si la dette croît sans que le reversement ne la réduise, le prédicat
`curation-debt-unbounded` s'applique et le passage à l'échelle est abandonné plutôt que
subi. Décider maintenant, sans ces chiffres, serait construire pour une ambition non
vérifiée.

---

## 11. Ce qui reste incertain

1. **L'itinéraire de référence est un artefact privé dont dépend une phase publique.** Un
   contributeur externe ne peut pas le reproduire. Arbitrage rendu en faveur du probant ;
   à réexaminer à la première contribution externe.
2. **Aucun précédent de surface agentique dans la constellation.** Aucun motif interne à
   reprendre : ce dépôt écrit le sien et en porte le coût.
3. **La compatibilité de la couche de raisonnement n'est vérifiable que par évaluation** —
   la garantie la plus faible du dispositif, et la plus centrale.
4. **Le veto suppose que les contraintes du régime de rythme sont les bonnes.** Elles sont
   posées par la couche de raisonnement sans validation empirique : un quota de journées
   ouvertes est un jugement, pas un fait mesuré.
