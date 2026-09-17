# trips/

Trip instances — the third stratum (`AGENTS.md`). **Real instances are never
tracked here, nor anywhere else in this repository.**

## Where a real instance lives

Anywhere outside this tree. The tooling takes an explicit path and has no
default location, deliberately: a default path inside the repository is an
invitation to put a file there, and a default path on one machine is a
machine-local path in a tracked file.

```sh
bun run plan --trip /absolute/path/to/your-instance.yaml
```

## What is tracked here

`demo-*.yaml` only — fictional instances used as public end-to-end fixtures.
Their dates are invented and overlap no real stay. They exist so the repository
can demonstrate what it does without demonstrating who uses it.

## Why the separation is not merely hygiene

A city pack is a public good and is meant to be shared and contributed back
upstream. An instance is the opposite: joined to a public identity, it states
that a specific home is unoccupied between two specific dates.

Note that a relative instance is not automatically safe. A skeleton saying
"structuring event at day −5", joined with a pack saying when that event starts,
reconstructs the absolute date in one step. This is why the skeleton carries
day _properties_ — high attendance, street closures — and never the identity of
the event that causes them.
