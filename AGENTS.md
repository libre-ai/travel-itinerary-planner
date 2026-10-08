# Travel Itinerary Planner Agent Rules

## Purpose

Reserved product home, couche 1 of the Libre AI constellation: itinerary
planning over verified, sourced destination facts. The model composes, the
code vetoes; trip instances never leave the traveller's machine. Today the
repository holds reference data, a design and trip-isolation checks, not an
itinerary application. State, phases and exit criteria live in
`project.v1.yaml`, never restated here.
Fleet doctrine lives upstream:
https://raw.githubusercontent.com/libre-ai/project-governance/HEAD/AGENTS.md

## Domain doctrine

- Three strata (`docs/adr/0001-three-strata-trip-isolation.md`): reasoning in
  `prompts/` (public), facts in `data/cities/` (public by obligation), trip
  instances outside this repository (never public).
- `trips/` tracks fictional `demo-*` fixtures only. Never commit a real stay
  window, party, budget or lodging, nor a default path that invites one.
- Agent surface threat model: `docs/adr/0002-agent-surface-threat-model.md`.
- Reservations and payments are out of scope.
- Contract shapes are canonical in `libre-ai/schemas-and-contracts`, never
  redefined here.

## Commands

Install through the shared local composition (`docs/DEVELOPMENT.md`), then:

- `bun run check` — Bun floor, toolchain, secret scan, trip isolation, lint,
  typecheck and tests.
- `bun run check:trip-isolation` — the trip-isolation gate alone.

## Working here

- Read actual state before editing; never hide a red test.
- Stage files before running tree-walking gates.
- Security > quality > performance > completeness.
