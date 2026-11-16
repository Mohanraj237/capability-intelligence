# Phase 1 testing: every manifest field against 22 real capabilities

| | |
|---|---|
| Date | 2026-11-16 |
| Status | Complete for Mission 4. The results feed the [field-by-field review](field-by-field-review.md) and the [shareable standard](../capability-manifest-standard-v0.1.md). Items that need another mission are listed in §6 |
| Corpus | The 22 production manifests in [`case-studies/production-set/manifests`](../../case-studies/production-set/manifests/): 8 MCP servers, 6 skills, 5 libraries, 1 plugin, 1 framework, 1 workflow, 1 tool. All public, all external |
| Protocol | [`research/phase-1/field-audit/protocol.yaml`](../../research/phase-1/field-audit/protocol.yaml): 5 journeys, 37 questions, 7 needs, and the relevance judgments, written before the first run |
| Harness | [`audit.js`](../../research/phase-1/field-audit/audit.js) (T1-T9, T11) and [`crosscheck.py`](../../research/phase-1/field-audit/crosscheck.py) (T10). Deterministic, offline. Raw results: [`results.json`](../../research/phase-1/field-audit/results.json) |

## 1. What was tested, and why

The project's unit tests (`npm test`, 226 tests) check that the validator behaves as specified.
They do not check whether the **fields themselves earn their place**. This phase asks that of
every one of the schema's 106 field paths (108 before the 2026-11-16 overlap review removed two), using real capabilities rather than examples.

| # | Test | The question it answers | Draft |
|---|---|---|---|
| T1 | Field inventory | What does the schema define, what is mandatory, and which completeness level needs each field? | [T01](drafts/T01-field-inventory.md) |
| T2 | Coverage and provenance | How often is each field filled in, for which capability types, and where did the value come from? | [T02](drafts/T02-coverage-and-provenance.md) |
| T3 | Removal (ablation) | If a field is removed, what breaks: validity, completeness level, validator findings, journey answers? | [T03](drafts/T03-removal-ablation.md) |
| T4 | Journey answerability | Can each journey question be answered from each manifest, and which fields give the answers? | [T04](drafts/T04-journeys.md) |
| T5 | Search efficiency | Which fields find the right capabilities for a need, and which add noise? | [T05](drafts/T05-search-efficiency.md) |
| T6 | Identity | Does the manifest recognise the same capability under another id, and never link different ones? | [T06](drafts/T06-identity.md) |
| T7 | Mutation per field | If a field holds a wrong value, does the validator reject it at that field? | [T07](drafts/T07-mutation-per-field.md) |
| T8 | AI host recipes | Can an AI host or agent install and connect the capability from structured fields alone? | [T08](drafts/T08-ai-host-recipes.md) |
| T9 | Native counterparts | Which facts do MCP, Agent Skills, A2A, npm, and Python metadata already state, and which cost curation effort? | [T09](drafts/T09-native-counterparts.md) |
| T10 | Independent validator | Does a second implementation (Python jsonschema) reach the same verdicts? | [T10](drafts/T10-independent-validator.md) |
| T11 | Exchange round trip | Is every manifest carried to consumers unchanged, with its completeness level? | [T11](drafts/T11-exchange-round-trip.md) |
| T12 | Governed level | With simulated Mission 3 assessments, do all 22 reach `governed`, and does the 12-month expiry work? | [T12](drafts/T12-governed-level.md) |
| T13 | AI Catalog interoperability | Can the 22 be exported as a valid AI Catalog and imported back without loss? | [T13](drafts/T13-ai-catalog.md), [report](ai-catalog-interoperability.md) |
| - | Abilities vocabulary (U5) | Should 0.1 adopt a vocabulary for what a capability can do? Six public standards, 36 A2A cards, OASF | [analysis](abilities-vocabulary-analysis.md) |
| - | `source` versus `publications` (C9) | Do the two fields repeat each other? | [analysis](c9-source-and-publications.md) |
| - | Field overlap (C14 to C16) | Does any field state the same fact as another? | [analysis](field-overlap-review.md) |

The five journeys: **J1** find a capability for a need; **J2** recognise the same capability
across sources; **J3** compare and decide whether to adopt; **J4** judge whether there is enough
information; **J5** load and use it from an AI host (new in this phase).

## 2. Results at a glance

| Test | Result |
|---|---|
| Validity | 22 of 22 valid, **all 22 `adoptable`** (the five Caveman skills were completed from their own sources on 2026-11-16), 0 `governed` (no real assessment) |
| T3 Removal | Every mandatory field, when removed, makes all 22 invalid. Every completeness fact, when removed, lowers the level exactly as defined. 29 paths change nothing when removed alone; 12 of them prove their value in another test (§4) |
| T4 Journeys | **440 of 440 required answers (100%)**, every journey complete for every manifest. (First run: 415; the C9 fix added the skills' `main` ref, and completing the Caveman skills closed the rest) |
| T5 Search | Name and description alone: recall 0.84, precision 0.92. Adding `supportedUseCases` raises recall to 0.95 (precision 0.86, F1 0.90). `keywords`, `interfaces`, `integrations`, and `embeddedComponents` add nothing. `limitations` lowers precision to 0.73: the completed Caveman limitations mention "issues" and "tickets" |
| T6 Identity | 66 of 66 synthetic cases correct: 22 re-registrations caught by shared publications, 22 repository renames caught by `source.repositoryId`, 22 namesakes correctly not linked. No false links among the 22. The real earlier Playwright example is linked |
| T7 Mutation | 102 of 102 testable fields reject a wrong value at that field. 4 fields appear in no manifest and are covered by unit tests |
| T8 AI host | 22 of 22 yield an install or connection recipe from structured fields. Alternative credentials, first a gap, are now expressed with `setup[].group` in the 5 manifests that have them (C13). Remaining gap: exact launch arguments live only in free text or the native contract |
| T9 Effort | 280 provenance entries: 39% native, 26% linked, 7% derived, 29% curated, 0% owner-confirmed |
| T12 Governed | Simulated assessments: all 22 `governed`; 22 `ASSESSMENT_EXPIRED` warnings when older than 12 months; 22 invalid with a tier but no reference |
| T13 AI Catalog | All three projections valid (Level 2). Reference-only keeps 11 of 88 used fields and rebuilds 0 valid manifests; the hybrid (native artifacts plus the manifest in `extensions`) round-trips 22 of 22. 8 of 28 artifacts have a known AI Catalog type. All 28 artifact URLs return 200. exa.ai and github.com publish live catalogs |
| T10 Python | 33 of 33 verdicts match (22 manifests valid, 11 probes rejected, including the two retired fields) |
| T11 Exchange | 22 of 22 carried unchanged, with their level |

## 3. The tough questions, and what the tests say

**Is every mandatory field needed?** Yes. Each of the six (`schemaVersion`, `id`, `name`,
`capabilityType`, `source`, `riskTier`) is stated by all 22. Removing any one makes all 22 invalid,
and each answers a required journey question or anchors identity. `riskTier` is the only one with
no counterpart in any native format, and it is mandatory on purpose: `unassessed` must be explicit,
never inferred.

**Should more fields be mandatory?** No. `description`, `license`, `owner`, `interfaces`, and
`runtime` are present in all 22 production manifests, but the 60-record research sample showed
sources without them. Making them mandatory would reject public records that are still worth
listing. The completeness levels already require them where they matter.

**Do the completeness levels measure what they claim?** Yes, with one caveat. Every level fact
behaves as defined when removed. The caveat: `versionScheme: unversioned` satisfies the version
fact. That is a declared absence, like `setup: []`, so it is correct. But a consumer asking "which
version?" gets "none, pin a commit", not a number. This is documented in the standard.

**Which fields does an AI host actually need?** Eight: `interfaces[].type`, `interfaces[].transport`,
`interfaces[].contractRef`, `publications[].kind` and `.locator`, `setup[].name`, `.kind`, and
`.secret`, plus `publications[].platformCompatibility`. With them, all 22 yield a recipe. They cannot say "supply
one of these credential sets" (MCP Atlassian: a Cloud token or a Data Center token; Exa: OAuth or
an API key). And the exact launch arguments of an MCP server are only in free text, although
`server.json` states them. None of the 7 MCP servers sets `contractRef` to point at it.

**Which fields help a recommender find the right capability?** Name, description, and supported
use cases. Keywords from public sources are noise for matching (`ai`, `claude`, `python`).
Limitations mention other technologies, so searching them returns wrong matches. Mission 1 should
not index `limitations` for matching.

**How much effort does a manifest cost?** About 13 provenance entries per manifest. 65% come
from the sources; 29% are written by a curator, mostly `description`, `limitations`, and
`owner.contact`. No owner has confirmed a value yet, so U8 (acceptable effort) still needs real
owners.

**Which fields are never used, and why keep them?** 18 paths are stated by none of the 22:
`lifecycleStatus`, `maturity`, `assessmentReference` and its 3 sub-fields, `deprecation` and its 3
sub-fields, `source.registry`, `.identifier`, and `.description`, `license.text`,
`publications[].statusMessage`, `interfaces[].specVersion`, `dependencies[].id`, and
`provenance[].confirmedBy`. Most record the outcome of a process that has not happened for these
public capabilities: an owner declaring a status, Mission 2 rating maturity, Mission 3 assessing
risk, a capability being deprecated, an owner confirming a value. The others apply to cases absent
from this set: registry-only sources, licenses stated in prose, A2A agents with a protocol
version, an agent that depends on another registered capability. All 18 are exercised by the
examples and unit tests. They are dormant by design, not dead.

## 4. What changed as a result of testing

| Change | Why | Kind |
|---|---|---|
| PR-Agent manifest: GitHub Action interface typed `ci_action` instead of `other` | T8 found the Action could not be generated as a CI step | Data fix |
| `dependencies` definition clarified: other registered capabilities only; installed software, accounts, runtimes, and connected systems go in `setup`, `runtime`, and `integrations` | T2/T3: the 16 `dependencies: []` were misleading. With `setup[].kind` (C7) and `integrations` (C5), every external dependency the field review found now has a structured place. C6 can be resolved without a breaking change | Description only |
| C9 decided: `source` is the origin, `publications` what adopters obtain; new warning `PUBLICATION_REPEATS_SOURCE`; the 5 Caveman skills state their `main` ref instead of repeating the source ([analysis](c9-source-and-publications.md)) | Tested on all 22: only 5 manifests truly repeated a fact | Decision, warning, data fix |
| C13: `setup[].group` for alternatives; applied to MCP Atlassian, Exa, Claude Code Action, GitHub MCP, Tavily MCP | T8 | Additive field and a warning |
| AI hosts named by agent: `vs-code` removed, use `github-copilot` | Decision | Breaking (draft) |
| C14: AI hosts stated only per publication; the capability-wide `platformCompatibility` removed; the 9 lists re-checked against the READMEs and moved to 13 publications | The top-level list was by rule the union of the publications' lists, and in 6 of 9 it hid which publication works in which host ([analysis](field-overlap-review.md)) | Breaking (draft) |
| C15: `intendedAudience` removed | 25 of 25 values restated other fields or said only "developers" | Breaking (draft) |
| C16: `runtime[].detail` states requirements only; new warning `RUNTIME_REPEATS_PUBLICATION`; 24 details corrected | 24 of 32 details repeated a package, image, host, or endpoint | Definition, warning, data fix |
| Harness and drafts added | This phase | New |

Removing a field on its own changes nothing in T3 for 29 paths. That alone does not make them
useless:

- **Redundant on purpose (4):** `capabilityVersion`, `source.updatedAt`, `publications[].status`,
  and `.updatedAt` are each one of several fields that answer the same question with a different
  meaning (the [overlap review](field-overlap-review.md) checks each). Remove all of them and the
  question fails.
- **Shown by another test (8):** `source.repositoryId` (T6: it is the only signal that survives a
  repository rename); `setup[].kind`, `.group`, `.secret`, `.required`, and `runtime[].detail` (T8:
  the AI host recipe); `costInformation.details` (read by Mission 1); `relations[].evidence` (read by a
  curator before setting `verified`).
- **Informational for people only (17):** `lastUpdated`, `keywords`, `publications[].nativeName`,
  `.verifiedBy`, `license.url`, `supportedUseCases[].description`, `interfaces[].description`, the
  6 paths of `interfaces[].inputs` and `.outputs`, `setup[].description`, `costInformation.url`,
  `embeddedComponents[].description`, and `provenance[].observedAt`.

None of these is removed. The [review](field-by-field-review.md) gives the verdict for each. The
two fields that were removed, `platformCompatibility` and `intendedAudience`, went because they
repeated other fields, not because removing them changed nothing.

## 5. Limits of this testing

- **All 22 are public and external.** Internal capabilities, `owner.affiliation: internal`, owner
  declarations, maturity, and risk assessments are not tested on real data (R6).
- **One curator wrote the manifests and judged relevance.** The judgments were fixed before the
  run, but a second judge (Phase 1 Ticket 4, E2) has not checked them.
- **Search is a term matcher, not Mission 1's recommender.** It shows which fields carry the
  matching words; it does not measure ranking.
- **The AI host recipes are generated, not run.** The test checks that the needed facts are
  structured; it does not start the servers.
- **The Caveman fact checks and mutation tests (R5)** were re-run on 2026-11-16 against a fresh clone: 44 of 44 checks (online included) and 22 of 22 mutations detected.
- **The governed level is tested with simulated assessments** (T12); no real Mission 3 assessment exists.

## 6. What remains for other missions

| Item | With | Evidence from this phase |
|---|---|---|
| Accept C1-C5, C7, C12, and the C6 clarification into 0.1 | Mission 4 team | All tests above |
| U3 identifier allocation | Missions 5 and 2 | T6: ids are never derived; identity works through publications and repository ids |
| U9 partial records | Missions 1 and 2 | T4: `assessable` records still answer 15 of 20 required questions |
| Maturity definitions, internal capabilities (R6) | Mission 2 | T2: 0 of 22 can state maturity without Mission 2 |
| Trust fields (C8), risk vocabulary | Mission 3 | T4: J4 risk 0 of 22, as expected |
| Search guidance: index name, description, use cases; not limitations | Mission 1 | T5 |
| How Mission 5's form presents `setup[].group` (C13, decided) | Mission 5 | T8 |

## 7. Reproduce

```bash
node research/phase-1/field-audit/audit.js
python -I research/phase-1/field-audit/crosscheck.py
npm test
```
