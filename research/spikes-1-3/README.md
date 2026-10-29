# Spikes 1-3 research: evidence and proof of concept

Supporting evidence for [MISSION4_SPIKES_1_TO_3_RESEARCH.md](../../MISSION4_SPIKES_1_TO_3_RESEARCH.md).
Handle it like its sources: the Mission 4 documents are marked "Confidential – Authorized Use
Only". The capability metadata here is public, but the analysis is Mission 4's.

| File | What it is |
|---|---|
| [needs.yaml](needs.yaml) | Journeys J1-J4, decision questions, needs N1-N4 with relevance criteria, and the sampling rule. Written before sampling |
| [fetch.js](fetch.js) | Applies the sampling rule and snapshots native metadata into `samples/` (network) |
| [fetch-supplementary.js](fetch-supplementary.js) | Adds documentation text, GitHub's MCP Registry entry, and Spike 3 identity cases (network) |
| [fetch-renames.js](fetch-renames.js) | Resolves every GitHub repository reference in the snapshot, to find stale and unresolvable references (network) |
| [crosswalk.js](crosswalk.js) | Maps eight native formats onto common concepts, with provenance per value |
| [judgments.yaml](judgments.yaml) | Relevance per need, identity groups, and derivative links: the ground truth the journeys are scored against |
| [analyze.js](analyze.js) | Offline: runs J1-J4, the A2A conformance check, and the schema comparison. The records are validated against the 0.1 draft of 2026-10-22 (section 9) and, since 2026-10-23, against the revised 0.1, also as starter-model drafts (section 10). Writes `results.md` and `results.json` |
| [results.md](results.md) | Generated results. Do not edit by hand; `test/research.test.js` fails when they are stale |
| `samples/` | The snapshot: `index.json` (search results and selections), `records/` (one file per record), `supplementary.json`, `a2a-cards.json` |
| `reference/a2a-v0.3.0.schema.json` | The A2A v0.3.0 JSON Schema, copied unchanged from github.com/a2aproject/A2A (tag v0.3.0, `specification/json/a2a.json`, Apache-2.0; sha256 `97d6e243...5f17`) |
| `reference/capability-0.1-2026-10-22.schema.json` | Schema 0.1 as it stood on 2026-10-22, the draft the report evaluated, kept unchanged before the revision of 2026-10-23 (sha256 `cee8c606...d8c7`) |
| `reference/examples-2026-10-22/` | The 9 manifests that were valid under that draft (the project's valid, consistency, and compatibility examples as of 2026-10-22): the corpus for `schema-compat` from the draft to the revision |

## Reproduce

```bash
npm run research                           # offline, from the snapshot; rewrites results.md and results.json
                                           # (the same as: node research/spikes-1-3/analyze.js)
```

The schema revision of 2026-10-23 is checked against the frozen draft and corpus with:

```bash
node bin/capability-manifest.js schema-compat research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json 0.1 \
  --corpus research/spikes-1-3/reference/examples-2026-10-22
```

Refreshing the snapshot uses the network and draws a new sample, because registries change by the
hour. A GitHub token raises the API rate limit and is needed for code search (the A2A sample):

```bash
GITHUB_TOKEN=$(gh auth token) node research/spikes-1-3/fetch.js
GITHUB_TOKEN=$(gh auth token) node research/spikes-1-3/fetch-supplementary.js
GITHUB_TOKEN=$(gh auth token) node research/spikes-1-3/fetch-renames.js
```

The scripts only read public metadata, redact email addresses, and execute nothing they download.
They import the POC validator (`src/validator.js`) and the project's pinned dependencies, and change
nothing outside this folder.

## Runs against the revised schema (2026-10-23)

Section 10 of `results.md` validates the same 60 records three times: A, with the §7.6 mapping
against the 2026-10-22 draft; B, with the same mapping against the revised 0.1; C, as starter-model
drafts (`draftStarterManifest`) against the revised 0.1. The starter drafts follow two rules:
- their ids are assigned from the record reference (`research.<ref>/<name>`), never derived from a
  name, so that identity can come only from publications and sources;
- a native value the schema cannot hold is left out, never shortened, and every drafted value
  carries its provenance.

Section 10 then scores the validator's duplicate warnings against the judged identity groups, its
completeness levels against section 8, and a sensitivity run with `description` mandatory.

## Deviations from the pre-registered rule

1. **npm vendor test too broad (N2).** The rule's vendor publication for N2 is GitHub's MCP
   server. `fetch.js` tested for any `@github/` package and picked `@github/mcp-registry` (rank 7
   for "github mcp"), an SDK for the MCP Registry API published by GitHub, not GitHub's MCP
   server, which is not published on npm. The record (N2-13) is kept as drawn, judged not
   relevant, and reported as a mis-selection.
2. **Registry vendor lookup stopped too early (N2).** `fetch.js` searched 30 result pages for
   GitHub's entry. The registry's search returns every `io.github.*` name for "github", and the
   entry is at rank 12,080 of 29,152. `fetch-supplementary.js` found it and added it as N2-50,
   the purposive record that the rule calls for.
3. **Documentation collected after sampling.** README and long-description text was fetched by
   `fetch-supplementary.js`, after the sample was drawn, to judge relevance and to test whether
   documentation-derived text helps discovery (J1 variant V1). It did not change the sample.
   Background records (iteration 1) have no documentation snapshot, so V1 equals V0 for them.
4. **One publication drawn twice.** The plugin `hostinger` was drawn for N1 (N1-08) and N3
   (N3-27); the iteration-1 record of the `pdf` skill (B03) is the same publication as N4-35. The
   analysis counts each publication once (aliases are listed in `results.md`).

## Limitations

- **One judge.** The relevance and identity judgments were made by the same researcher who wrote
  the matcher, from each capability's own documentation and against the criteria in
  `needs.yaml`. They were written before the matcher was run, but they were not checked by a second
  person. Borderline cases are marked `partial` with a rationale.
- **Small and partly purposive.** 50 targeted records in 4 needs, 12 background records, and 36
  A2A files. Random draws come from the first result page or the matching listing entries, so they
  reflect what a searcher sees, not the whole ecosystem.
- **Public capabilities stand in for internal ones.** No internal capability, catalogue, or journey
  was available.
- **Metadata only.** No capability was installed or run. Tool lists come only from the Docker
  catalog's `tools.json`, which the catalog generates by running the server.
- **Point in time.** Registries change continuously; the snapshot is from 2026-10-22.
- **Mechanical drafts.** The starter-model drafts of section 10 are generated from the crosswalk;
  nobody confirmed their heuristic values, which the validator reports as unconfirmed.
