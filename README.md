<!-- SPDX-FileCopyrightText: 2026 Libre AI contributors -->
<!-- SPDX-License-Identifier: CC-BY-4.0 -->
<!-- Rewritten for the retained Libre AI portfolio on 2026-09-14; earlier revisions retain their original licensing. -->

# Libre AI Travel Itinerary Planner

## Intended use

A future tool for preparing a trip from cited destination information. It aims to help a traveler see which proposed activities fit together, which constraints were checked, and which facts still need confirmation.

This repository's proposed scope is documentary. No planning application, complete city itinerary, executable example or deployed service is admitted by this candidate. The existence of earlier source code or tests is not evidence of an available product here.

## Product boundaries

Planning rules, destination facts and a person's trip details are separate concerns. Proposed plans should identify their sources and the period for which volatile facts were checked. Missing or outdated information must remain visible rather than becoming a confident itinerary claim.

The intended output is a plan to inspect and adjust. Reservations, payments and other external commitments are outside this scope. Local handling of trip details is a requirement to verify, not an implemented privacy guarantee.

## Proposed contracts

- A destination fact identifies its source, observation date, applicable period and unresolved uncertainty.
- A trip request describes the traveler's explicit constraints without including their private details in a public dataset.
- An itinerary proposal links activities to supporting facts and records constraint checks, exclusions and remaining confirmations.
- A local export preserves the information needed to inspect the proposal and its limitations.

These descriptions are proposals, not canonical schemas or compatibility promises. Canonical exchange contracts require admission by Contracts; their admission alone would not qualify a planning implementation.

## Activation criteria

A bounded city dataset must have reviewed provenance and sufficient usable facts for a complete itinerary. A runnable journey must demonstrate constraint checks and rejection of expired or missing required information. Independent tests must verify what leaves the local environment, export behavior and the separation of private trip details from destination data. The exact implementation and evidence must be reviewed before any capability is labeled available.

The initial city, permitted data sources and the intended execution environment remain to be selected for that qualification. They do not prevent retaining this documentary product scope.

[Français](README.fr.md)

## Portfolio navigation

The links below describe the intended retained portfolio. Public availability and link reachability have not been verified for this candidate.

### Products

- [Libre AI Work Supervision](https://github.com/libre-ai/ai-work-supervision)
- [Libre AI Model Policy](https://github.com/libre-ai/ai-model-policy)
- [Libre AI Practice Workbench](https://github.com/libre-ai/ai-practice-workbench)
- [Libre AI Learning Session Facilitation](https://github.com/libre-ai/learning-session-facilitation)
- [Libre AI Personal Knowledge Notebook](https://github.com/libre-ai/personal-knowledge-notebook)
- [Libre AI Information Feed Filter](https://github.com/libre-ai/information-feed-filter)
- [Libre AI Travel Itinerary Planner](https://github.com/libre-ai/travel-itinerary-planner)
- [Libre AI Public Vote Comparison](https://github.com/libre-ai/public-vote-comparison)

### Components and tools

- [Libre AI Application Development Toolkit](https://github.com/libre-ai/application-development-toolkit)
- [Libre AI Schemas And Contracts](https://github.com/libre-ai/schemas-and-contracts)
- [Libre AI Collaborative Data Sync](https://github.com/libre-ai/collaborative-data-sync)
- [Libre AI Execution Continuity Evaluator](https://github.com/libre-ai/execution-continuity-evaluator)
- [Libre AI Execution Sandbox](https://github.com/libre-ai/execution-sandbox)
- [Libre AI Capability Authorization](https://github.com/libre-ai/capability-authorization)
- [Libre AI Organization Data Lifecycle](https://github.com/libre-ai/organization-data-lifecycle)
- [Libre AI Database Policy Inspector](https://github.com/libre-ai/database-policy-inspector)
- [Libre AI Artifact Verification](https://github.com/libre-ai/artifact-verification)

### Project

- [Libre AI](https://github.com/libre-ai/.github)
- [Libre AI Project Website](https://github.com/libre-ai/project-website)
- [Libre AI Project Governance](https://github.com/libre-ai/project-governance)



---

## Reviewed editorial source

[Reviewed material](https://github.com/libre-ai/travel-itinerary-planner/blob/21b70e1efc3697cad41cfcc19a64b7bffcad6987/docs/portfolio-material.json)

SHA-256: `a6842cbfc8aa303528c08686c672d334843c8b9a284a2b2584bd4833546ad3a8`
