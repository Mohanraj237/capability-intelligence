# Journey pilot: proving discovery and reuse with real capabilities (iteration 1)

Date: 2026-10-22. Results: [pilot/results.md](../pilot/results.md), generated from the snapshot in
[pilot/samples](../pilot/samples/). Reproduce with `npm run pilot`, which works offline from the
snapshot. `npm run pilot:sample` draws a new sample and uses the network.

**Update 2026-10-23.** The findings below were measured against schema 0.1 as it stood on
2026-10-22. On 2026-10-23 the draft was revised to apply the Spikes 1-3 research, which builds on
this pilot, and `pilot/results.md` was regenerated against the revision (§7). The pilot's sample,
journeys, and measurements did not change.

## 1. Why

Until now the POC proved that manifests are well formed, not that they are useful:
- the schema's mandatory fields and rules were set before looking at any real capability;
- the example manifests were written to fit the schema;
- the tests checked structure.

This pilot reverses the order:
1. Write down discovery and reuse journeys.
2. Sample real capabilities at random.
3. Measure how much metadata they already share.
4. Take the overlap as the starter set.
5. Prove the journeys on the result.

## 2. Method

1. **Journeys** ([pilot/journeys.yaml](../pilot/journeys.yaml)). There are four:
   - find a capability for a need;
   - decide whether it can be reused;
   - check for something similar before building;
   - register a capability with little effort.

   Each question names the metadata that would answer it. The five discovery use cases were written
   down before the sample was drawn and not changed afterwards.
2. **Random sample.** 12 public capabilities, drawn with a fixed seed (20261022) from three sources
   of native metadata:

   | Source | Drawn |
   |---|---|
   | Agent Skills (`SKILL.md`) in anthropics/skills | 4 of 19 |
   | npm packages with the keyword `ai-agent` | 4 of the first 5,000 |
   | Official MCP Registry (`server.json`) | 4 of 47,633 active servers, by reservoir sampling over the whole registry, which pages alphabetically |

   The snapshot holds native metadata only, with email addresses redacted.

   Public capabilities stand in for internal ones, which are not reachable from here. Internal
   skills, MCP servers, and packages use the same native formats, so the overlap is indicative.
3. **Crosswalk** ([pilot/crosswalk.js](../pilot/crosswalk.js)). Each format is mapped onto the
   manifest's concepts, and every value is tagged with its provenance:
   - **native**: read from a field;
   - **derived**: inferred from context, such as location, format, or namespace;
   - **default**: only `riskTier: unassessed`.

   Nothing is guessed. Each capability is drafted into a manifest
   ([pilot/drafts](../pilot/drafts/)) that records this provenance in `x-provenance`.
4. **Measurements:**
   - how often each concept is available;
   - which journey questions can be answered;
   - whether the drafts are valid against schema 0.1;
   - what the discovery use cases match.

## 3. Findings

1. **A shared core already exists.** Ten concepts are available for all 12 capabilities:
   - identifier, display name, description, capability type, source location;
   - owner, support contact, internal or external;
   - last updated, and interfaces.

   A documentation link is available for 11 of 12. These largely match schema 0.1's mandatory
   fields as of 2026-10-22, so that mandatory set was mostly the right one for this sample. (On 60
   records in seven formats, the Spikes 1-3 research found a description, an owner contact, or a
   capability-specific date missing for some records; the revision of 2026-10-23 therefore makes
   six fields mandatory.) Much of it is *derived*, though:
   - the capability type is never declared; it is inferred from the format;
   - for skills and MCP servers (8 of 12), the owner and contact are inferred from the repository
     owner and its issue tracker.

   Derived values need a confirmation step when a capability is registered.
2. **One mandatory field blocks registration, and no source states it.** Against the 2026-10-22
   schema, 8 of the 12 drafts fail only because `lifecycleStatus` is missing. Only the MCP Registry
   tracks status, so its 4 drafts are valid as drafted.
3. **Native metadata has information the schema lacks:**
   - license: 7 of 12, and needed to decide whether reuse is allowed;
   - keywords: 4 of 12, which help discovery;
   - documentation link: 11 of 12;
   - required configuration: 2 of 12.

   Schema 0.1 had no field for any of them; the revision of 2026-10-23 added `license`,
   `keywords`, `documentation`, and `setup`.
4. **What the journeys need most is what no source provides.**
   - **Structured use cases: 0 of 12.** "Is it meant for my use case?" can be answered only from npm
     keywords (4 of 12), so the discovery journey is complete for 4 of 12.
   - **Missing everywhere:** maturity, intended audience, limitations, cost, and dependencies on
     other capabilities. npm dependencies are packages, not capabilities.
   - **Risk assessment: 0 of 12.** This is by design: it comes from governance.
   - **Adoption** is complete for 0 of 12. Leaving the governance question aside, it is complete for
     4 of 12; the gaps are the version (skills have none) and the license (MCP entries have none).
5. **Discovery from descriptions works for some needs, and its failures are informative.** Three of
   the five needs found plausible matches. Two results show why display names and structured use
   cases matter:
   - `io.github.bluwork/kontra-mcp` matched "GitHub issues" only because it has no title, so its
     machine name, containing `io.github`, stood in as the display name.
   - Nothing matched "query a database", although the Brazilian hospital-admissions MCP server is a
     data-query service.
6. **Evidence on identity for Spike 3:**
   - Native names are already namespaced: reverse-DNS in the MCP Registry, scoped names on npm.
   - Unscoped npm packages and skills need a namespace rule; the pilot used `npm/` and the
     repository owner.
   - MCP names keep uppercase letters (`SidneyBissoli`), so ids need case-insensitive uniqueness or
     normalization.
   - One capability is often published in several places: 3 of the 4 npm samples are MCP servers,
     and MCP Registry entries point to their npm packages. A single `source` cannot express that
     (in the 2026-10-22 schema; the revision adds `publications[]`).
7. **Quality varies.** Skill licenses point to a file ("Complete terms in LICENSE.txt"), while npm
   licenses are standard identifiers. The registries contain many narrow or hobby packages, so
   curation remains necessary; that is Mission 2's work.

## 4. What this suggests for the schema (proposals; most applied on 2026-10-23)

The evidence sorts the concepts as follows (results §6):

| Treatment | Concepts |
|---|---|
| Starter core: extract automatically | identifier, name, description, type, source, owner and contact, internal or external, last updated, interfaces, documentation link |
| Extract where present; ask at registration otherwise | version, lifecycle status, license, keywords, platform compatibility |
| Curate: no native source | supported use cases (first, because it blocks discovery), limitations, maturity, intended audience, cost |
| From governance | risk tier and assessment record; extractors write `unassessed` explicitly |

Decisions needed:

1. **Add optional `license`, `keywords`, and a documentation link to schema 0.1.** Each is common in
   native metadata and needed by a journey.
2. **Stop blocking on `lifecycleStatus` at draft time.** Three options:
   - (a) keep it mandatory, and ask for it at registration;
   - (b) define completeness levels and report which one a manifest reaches:
     - *discoverable*: the extractable core;
     - *adoptable*: adds lifecycle, version where distributed, license, confirmed contact, use cases;
     - *governed*: adds an assessment record;
   - (c) default it from registry status where a registry tracks one.

   **Recommended: (b).** It lets every capability enter at almost no cost and become richer over
   time, which fits the contribution workflow (Mission 5) and the radar (Mission 2). It does change
   what "mandatory" means in the validation contract.
3. **Capture `supportedUseCases` first.** Ask for it at registration, or extract it from skill
   descriptions, which already state "use this skill when..." in prose.
4. **For Spike 3:**
   - case-insensitive identifier uniqueness;
   - a namespace rule for unscoped packages and skills;
   - several publication locations per capability (registry entry, package, repository).

What was applied on 2026-10-23, as POC proposals at the Mission 4 lead's direction (details in
[poc-report.md](poc-report.md), revision 2026-10-23):

| Proposal | Status |
|---|---|
| 1. `license`, `keywords`, documentation link | Applied: optional `license`, `keywords`, `documentation`, and `setup` (required configuration) |
| 2. Completeness levels, option (b) | Applied, refined by the Spikes 1-3 research: discoverable, assessable (a level that native metadata usually reaches), adoptable, governed. `lifecycleStatus` is optional and counts towards assessable, together with lifecycle signals that channels report |
| 3. Capture `supportedUseCases` first | Not applied: the field stays optional. The research found structured abilities in no package format, so it needs curation and a vocabulary decision (research U5) |
| 4. Case-insensitive uniqueness | Ids are lowercase, so uniqueness is case-insensitive; ids may now start with a digit |
| 4. Namespace rule for unscoped packages and skills | Open: namespace allocation is undecided (research U3) |
| 4. Several publication locations | Applied: `publications[]` beside `source` |

## 5. What this suggests for the approach

- **Journeys become the acceptance tests.** Every field must trace to a journey question, and to
  either a native source or a named curator. Fields that trace to neither are deferred.
- **Each spike gets a concrete input from this pilot:**
  - Spike 1: its analysis of what to reuse becomes one crosswalk per native format, starting from
    `pilot/crosswalk.js`.
  - Spike 2: starts from journeys and sampled capabilities; results §6 is its first field
    dictionary.
  - Spike 3: takes the identity evidence in §3.6.
  - Spike 4: its POC becomes this harness, run on real capabilities.
- **Iteration 2, with internal capabilities:**
  - Missions 1 and 2 provide 3 to 5 real journeys and 10 to 20 capabilities from the radar,
    including agents, internal MCP servers, and services.
  - Their native formats (for example A2A Agent Cards and service-catalog entries) are added to
    the crosswalk.
  - The same measurements are taken, plus the curation time per capability.
- **Measured every iteration:**
  - journeys that can be completed;
  - mandatory fields filled automatically;
  - curation minutes per capability;
  - discovery matches.

## 6. Boundaries and limitations

**Boundaries.** The pilot samples public capabilities only as evidence for the data model:
- it keeps no inventory (Mission 2);
- it ranks nothing (Mission 1): the term matcher only checks whether the metadata allows a
  capability to be found;
- it asserts no risk (Mission 3).

Mapping native formats onto the manifest is interoperability work, which is Mission 4's. Automated
extraction at scale remains a future enhancement.

**Limitations:**
- Small sample: 12 capabilities in three formats.
- The crosswalk still maps a capability's last change into `lastUpdated` and a registry status
  into `lifecycleStatus`, as in iteration 1, so that the results stay comparable. The revised
  schema defines `lastUpdated` as the record's date and `lifecycleStatus` as the owner's
  declaration; the Spikes 1-3 harness records both observations per publication instead.
- No agents: there is no public registry of A2A Agent Cards to sample from.
- The skills come from a single publisher.
- npm sampling covers only the first 5,000 search results.
- Discovery relevance was not formally judged.
- Derived owners and contacts are inferences, marked as such in `x-provenance`.
- Public capabilities stand in for internal ones.

## 7. Re-run against the revised schema (2026-10-23)

`npm run pilot` regenerated [pilot/results.md](../pilot/results.md) and the drafts against the
revised schema 0.1. The crosswalk now writes license, keywords, documentation, and required
configuration into the schema's own fields instead of `x-` extension fields. Results:
- **12 of 12 drafts are valid as drafted** (4 of 12 against the 2026-10-22 schema). The fourth
  journey, "register a capability with little effort", is now complete for 12 of 12.
- The "In schema 0.1" columns name the completeness level that needs each concept, for example
  "optional; assessable level" for the version and the license.
- Everything that does not depend on the schema is unchanged: concept availability, journey
  answerability for the other three journeys, and discovery matches.

The Spikes 1-3 research repeated this test on 60 records in seven formats; its results, before and
after the revision, are in [research/spikes-1-3/results.md](../research/spikes-1-3/results.md)
sections 9 and 10.
