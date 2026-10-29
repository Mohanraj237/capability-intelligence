# Mission 4 POC Report: AI Capability Manifest v0.1

Date: 2026-10-19; revised 2026-10-20 after the review against the published mission boundaries
([mission-boundaries.md](mission-boundaries.md)), and on 2026-10-23 to apply the proposals of the
[Spikes 1-3 research](../MISSION4_SPIKES_1_TO_3_RESEARCH.md). Sources: the Mission 4 charter and the Spike 1-4
documents in the repository root (all last modified 2026-10-16), and the boundaries for Missions
1-5. This report is the Spike 4 research document: findings, decisions, traceability, verification
results, limitations, and recommendations.

**Revision 2026-10-20.** The boundary review confirmed that the work is within Mission 4's scope.
It also led to these changes:
- `catalog` was replaced by `export`, which produces a lossless exchange document under a contract
  schema.
- Lifecycle and risk-vocabulary ownership is now explicit.
- The schema adds `maturity`, `intendedAudience`, `platformCompatibility`, `costInformation`, and
  the types `framework` and `platform`.
- `schema-compat` checks compatibility between schema versions.
- The validation report has a contract schema.
- A consumer-needs contract test covers what each mission needs.

The schema additions were first drafted as a separate version 0.2. At the Mission 4 lead's request
they were folded into the unpublished **0.1** draft, so there is a single schema version.
`schema-compat` confirmed the revision is additive (§7.2).

**Revision 2026-10-22: journey pilot.** The work so far proved that manifests are well formed, not
that they are useful. The [journey pilot](journey-pilot.md) therefore tests the model against
discovery and reuse journeys on 12 real capabilities drawn at random from public sources:
- Ten concepts are available from native metadata for all 12 capabilities, close to schema 0.1's
  mandatory set.
- 8 of the 12 drafted manifests fail only on `lifecycleStatus`.
- License, keywords, and documentation links are common in native metadata but missing from the
  schema.
- Structured use cases, which discovery needs most, exist in no source.

Its schema proposals were applied on 2026-10-23 (below); its recommended approach is the first
item in §11.

**Revision 2026-10-23: Spikes 1-3 research applied.** The [Spikes 1-3 research](../MISSION4_SPIKES_1_TO_3_RESEARCH.md)
ran four discovery and reuse journeys on 60 real capability records from seven sources. At the
Mission 4 lead's direction, its proposals (report §11 and §13.1) were applied to the unpublished
0.1 draft in place, as POC proposals for Spikes 2 and 3 to confirm, not as spike conclusions:
- **Requiredness.** Six fields are mandatory (`schemaVersion`, `id`, `name`, `capabilityType`,
  `source`, `riskTier`). `description`, `owner`, `lifecycleStatus`, and `lastUpdated` are optional,
  and `owner` needs only a `name`. The rule that a registry source requires `capabilityVersion` was
  removed.
- **Completeness levels.** The validator reports the level each manifest reaches (discoverable,
  assessable, adoptable, governed) and what the next level needs. `--require-level` turns a level
  into a requirement.
- **New optional fields**:
  - `publications[]`, with native name, version and scheme, status, and date;
  - `source.repositoryId`, `source.status`, and `source.updatedAt`;
  - `license`, `documentation`, `keywords`, `runtime[]`, `setup[]`, and `relations[]`;
  - `provenance[]` per value, and `interfaces[].transport`.
- **Ids and hints.** The id pattern accepts segments that start with a digit. Native field names
  such as `tags` or `homepage` are answered with the manifest field to use.
- **New Stage 2 checks**:
  - shared publications, and sources matched by repository id;
  - claimed relations;
  - conflicting lifecycle signals and differing publication versions;
  - license terms that need reading;
  - provenance, including heuristic values not yet confirmed.
- **Examples and pilot.** Two real examples come from the research snapshot: Microsoft's Playwright
  MCP server and a community fork of it. The pilot drafts now use the real license, keywords,
  documentation, and setup fields.

Measured on the same 60 records ([research results](../research/spikes-1-3/results.md) §10):
- the 2026-10-22 draft accepted 12 drafted manifests; with the same drafting the revision accepts
  57, and with drafts that use the new fields, 58 (the other two state a description of 17 or of
  1,221 characters, outside the 20-1,024 limits);
- through its duplicate-publication and duplicate-source checks alone, the validator links all 14
  judged same-capability pairs, with no false link, as the research's best rule did;
- its completeness levels agree with the research's measurement for 56 of the 60 records.

The revision was checked against the earlier draft and its manifests, both kept in
`research/spikes-1-3/reference/` (§7.2).

## 1. Executive summary

**Problem.** Teams describe AI capabilities in different shapes, so every consumer (inventory,
recommendation, risk, contribution workflow) needs bespoke field mappings. Mission 4 owns a common,
machine-readable manifest and a validation contract so that consumers can use capability metadata
"without capability-specific field mappings" (charter TL;DR, §1, §11).

**What the POC demonstrates.**

- A JSON Schema 2020-12 contract for Manifest v0.1, authored in YAML:
  - 6 mandatory fields, 12 conditional rules, and optional fields, with four cumulative completeness
    levels above the mandatory set (revision of 2026-10-23);
  - closed core with `x-` extensions;
  - versioned schema directories.
- Schema evolution support. The metadata the other missions need was added to the 0.1 draft, and
  `schema-compat` showed the revision to be non-breaking, statically and against a corpus of
  manifests. The research revision of 2026-10-23 was checked the same way: the corpus showed no
  regression, although the static check classifies the widened id pattern as breaking (§7.2).
  Version routing and version-aware hints are ready for the first published evolution.
- A validator in two stages (structural, then consistency) that also reports each manifest's
  completeness level. It separates errors, warnings, and unverified checks, and gives each finding a
  stable code, a JSON Pointer, a line and column, the problem, and a fix.
- Rules for identifiers, lifecycle, and versioning, enforced by the validator and by a compatibility
  checker for capability revisions.
- Eight manifests covering six capability types: six realistic but fictional ones, and since
  2026-10-23 two real ones taken from the research snapshot. They span every completeness level and
  internal and external owners, and come with invalid, consistency, and compatibility scenarios.
- Downstream consumption without bespoke transformations:
  - a lossless Capability Exchange Document, with a contract schema and a summary view that uses
    one code path for all capability types;
  - a consumer-needs contract test that reads each mission's documented information needs through
    one accessor.
- A second integration path was evaluated: an independent Python implementation, plus the
  validation-report contract for the contribution workflow.
- Risk semantics: a missing risk tier is an error and is never defaulted. `unassessed` is
  reported as unverified, never as passed. There is no approval field.

**Results.**
- `npm test`: 206 of 206 tests pass (2026-10-23). Mutation checks confirmed that the suite catches
  injected defects (eighteen defects across five rounds, each detected).
- All 16 example files received identical verdicts from the Node.js validator and from Python
  `jsonschema`.
- On 60 real capability records, the revised schema and validator reproduce the research's identity
  linking (14 of 14 pairs, no false link) and its completeness measurement (56 of 60 records).
- The cross-implementation evaluation found three interoperability risks (§7.4) that the standard
  must address. The most serious: a duplicate YAML key can silently downgrade a risk tier under
  PyYAML.

**Caveat.** The four spike documents are charters without findings. Every decision that the
charter leaves open is implemented here as a labelled, reversible POC proposal (§3), not as a
spike conclusion. The Spikes 1-3 research is evidence and proposals for the spikes; its proposals
applied here are POC proposals too.

## 2. Documentation findings

### 2.1 Mission 4 charter

| Area | What the charter states | Firmness |
|---|---|---|
| Goal | A common, machine-readable standard to describe, identify, version, and validate AI capabilities | Objective |
| Format | JSON Schema Draft 2020-12 and YAML authoring (§3) | "Proposed; confirmed during Phase 0" |
| Validation | Stage 1 structural, Stage 2 consistency; distinguish errors, warnings, and unverified checks; validity is not reachability, availability, security, or approval (§3) | Stated as requirements |
| Fields | 10 mandatory-field candidates; 10 further potential fields (§4) | "Subject to Phase 0 validation" |
| Identifiers | Stable and unique; a repository URL is not an id; namespaced or URN-style candidates (§5) | Rules firm, format open |
| Lifecycle | experimental, active, deprecated, retired; transitions to be documented (§6) | "Proposed for evaluation" |
| Risk | Lifecycle, risk, and approval are separate; missing or unassessed risk is never low risk or approval (§6) | Firm; vocabulary to align with governance |
| Versioning | schemaVersion is distinct from capabilityVersion; SemVer or an alternative to be assessed (§7) | Distinction firm, scheme open |
| Interoperability | A metadata contract, not a runtime protocol; reuse or reference MCP and A2A; one consumer without mappings, a second evaluated (§8) | Requirements |
| Boundaries | Not inventory, recommendation, approvals, contribution workflow, catalog site, indexer, or runtime (§9) | Firm |

### 2.2 Spikes

All four spike documents define an objective, research areas, tasks, and deliverables. **None
records findings, decisions, or open-question resolutions.**

| Spike | Research questions | Expected deliverables | Findings documented |
|---|---|---|---|
| 1 Standards and ecosystem | What to reuse from Agent Skills, MCP, A2A Agent Cards, JSON Schema, SemVer; metadata formats versus runtime protocols | Comparison table, reuse recommendations, gap analysis, v0.1 approach | None |
| 2 Definition and metadata model | Capability definition and granularity; types; mandatory, conditional, and optional fields; missing data; consumer needs | Definition, type recommendations, field dictionary, missing-data rules | None |
| 3 Identifiers, lifecycle, versioning | ID format; source references; lifecycle states and transitions; schema versus capability versioning; compatibility | ID recommendation, scenario analysis, lifecycle model, versioning strategy | None |
| 4 Validation and POC | Schema prototype, sample manifests, validator, consistency checks, feedback quality | Schema, 5 manifests, validator, test results, consistency findings | None; this POC delivers it |

**Dependencies.** Spike 1 informs Spikes 2 and 3 (formats to reuse, SemVer evaluation). Spike 2
decides what is a capability and which fields exist, and its granularity rules decide what gets an
id in Spike 3. Spike 4 consumes Spikes 1-3 and reports back what does not work. Because Spikes 1-3
have no findings yet, this POC fills their open questions with provisional answers (§3), which the
spikes can now evaluate against working code.

## 3. Decisions: documented positions and POC assumptions

"POC" means a proposal made here that needs confirmation by the named owner. All POC choices are
reversible: the data rules are confined to the schema, and the code reads them from it.

| # | Topic | Documented position | POC choice | Confirm with |
|---|---|---|---|---|
| D1 | Schema standard and authoring | JSON Schema 2020-12, YAML (§3, proposed) | Adopted; YAML 1.2 parsing | Spike 1/4 |
| D2 | Validation stages and severities | §3 | Implemented as stated | n/a |
| D3 | Mandatory fields | 10 candidates (§4) | **Revised 2026-10-23** (research §7.6, §13.1): 6 mandatory, the facts every sampled source supplies; `description`, `owner`, `lifecycleStatus`, `lastUpdated` optional and reported through completeness levels (D23). Until then: all 10 mandatory | Spike 2 |
| D4 | Conditional rules | Not specified | 12 rules (spec §4). **Revised 2026-10-23**: the registry-requires-`capabilityVersion` rule removed; rules added for `license`, `relations`, and `provenance` | Spike 2 |
| D5 | Missing, unknown, inapplicable values | Open (§4) | Omit means not provided; null never allowed; `[]` means declared none; `unassessed` for unknown risk. **Added 2026-10-23** (research §9.4): provenance per value, and conflicting and unverified states reported by Stage 2 (D25) | Spike 2 |
| D6 | Capability types | 8 candidates (§2) | All 8 allowed; one type-specific rule (`mcp_server`) | Spike 2 |
| D7 | Components | Granularity rules (§2, §5) | `components` and `parent` for independently adoptable children; `embeddedComponents` for prompts, commands, hooks, resources | Spike 2/3 |
| D8 | Identifier format | Namespaced or URN-style, open (§5) | `<namespace>/<name>`, lowercase kebab-case, maps to a URN. **Revised 2026-10-23** (research §10.2): segments may start with a digit; the format stays provisional | Spike 3 |
| D9 | Lifecycle | States proposed (§6); transitions open | States adopted; transition table in `x-lifecycleTransitions`. **Revised 2026-10-23** (research §10.3): `lifecycleStatus` is the owner's optional declaration and the table governs only it; observed signals per publication and source; conflicts reported | Spike 3, Mission 3 |
| D10 | schemaVersion | Scheme open (§7) | Quoted `"MAJOR.MINOR"`, `"0.1"`; routing; explicit rejection of unsupported versions; immutability and MINOR/MAJOR rules | Spike 3 |
| D11 | capabilityVersion | SemVer or alternative (§7) | SemVer 2.0.0; change-impact classes determine the required bump; lenient below 1.0.0. **Revised 2026-10-23** (research §10.4): optional; native versions recorded per publication with their scheme; SemVer never required | Spike 3 |
| D12 | Risk | Firm rules (§6); vocabulary open | Mandatory, no default; assessed tier needs `assessmentReference`; placeholder tiers low, medium, high | Governance owners |
| D13 | Extensibility | Not specified | Closed core with typo suggestions; top-level `x-` extension fields | Spike 1/2 |
| D14 | Protocol reuse | Reference MCP and A2A (§8) | `interfaces[].contractRef` to the native contract; required for a2a and openapi | Spike 1 |
| D15 | Maturity | Not in the charter; the boundaries put "standardize maturity" in Mission 4 scope, and Mission 2 tracks maturity separately from availability | **Revised 2026-10-20**: optional `maturity` (`prototype`, `pilot`, `production`) in schema 0.1; `lifecycleStatus` expresses availability | Mission 2 (definitions), Spike 2 |
| D16 | Deferred fields | Potential fields (§4); needs in the boundaries of Missions 1 and 2 | **Revised 2026-10-20**: `platformCompatibility`, `costInformation`, and `intendedAudience` are optional fields of schema 0.1; `techStack` and Mission 3's assessment metadata remain deferred | Missions 1-3, Spike 2 |
| D17 | Implementation stack | No existing code | Node.js 22 (ESM), Ajv 8, ajv-formats, yaml 2, semver; tests use `node:test` | Mission 4 team |
| D18 | Second consumer or integration path | "Evaluated" (§8) | Independent Python implementation, plus the validation-report contract and exit codes as the contribution-workflow path | Mission 4 and consumers |
| D19 | Exchange between teams | Boundaries: "define machine-readable contracts for exchanging information between teams"; Mission 2 owns the inventory | `export` produces a lossless exchange document under a contract schema; the projected `catalog` was removed | Missions 1-3 |
| D20 | Schema evolution and compatibility | Boundaries: "evolve the schema", "validate schema ... compatibility" | One schema version: the boundary-review additions were first drafted as 0.2, then folded into the unpublished 0.1 draft (Mission 4 lead's decision, 2026-10-20). `schema-compat` (static classification plus corpus re-validation) confirmed the revision is additive. The research revision of 2026-10-23 was likewise made in place, at the lead's direction, and checked against the kept 2026-10-22 draft and its manifests (§7.2). Once published, versions are immutable | Spike 3 |
| D21 | Ownership of lifecycle expectations and risk vocabulary | Boundaries: Mission 3 defines lifecycle expectations and risk classifications | Mission 4 owns the fields and integrity rules; the transition table and tier names need Mission 3's confirmation | Mission 3 |
| D22 | Capability types `framework`, `platform` | Mission 2 catalogues frameworks and platforms | Added to schema 0.1 | Mission 2, Spike 2 |
| D23 | Completeness levels | Not specified; the pilot proposed levels (journey-pilot §4) | **Added 2026-10-23** (research §11.3): discoverable, assessable, adoptable, governed, in `x-completenessLevels`; reported for every manifest, enforced only with `--require-level` | Mission 4 lead, Mission 5, Spike 2 |
| D24 | Publications and relations | Several source references per capability (§5) | **Added 2026-10-23** (research §7.3, §10.1): `publications[]` beside `source`; `source.repositoryId`; `relations[]`; `DUPLICATE_PUBLICATION`, and `DUPLICATE_SOURCE` by repository id. `source` was kept as the primary reference rather than replaced, to keep the change small; whether to fold it into `publications` is open (research U2) | Spike 3 |
| D25 | Provenance and value states | Not specified | **Added 2026-10-23** (research §9.4): `provenance[]` (native, linked, derived with a convention or heuristic basis, owner, curated); heuristic values, claimed relations, and prose license terms reported as unverified | Spike 2 |
| D26 | License, runtime, setup, documentation, keywords | `techStack` and further potential fields (§4) | **Added 2026-10-23** (research §11.2): optional fields; `license` and `runtime` count towards the assessable level, `setup` towards the adoptable level | Spike 2 |

Why D17: no code existed. Node.js 22 was the only healthy runtime in the environment: JDK 27 is
installed through Homebrew but not on the PATH, and Python is the end-of-life 3.9 system
interpreter. Ajv is a widely used Draft 2020-12 validator; the `yaml` library provides YAML 1.2
parsing, source positions, and duplicate-key detection; and there is no build step. The contract
(schema and YAML) is language-neutral, as §7.4 shows.

## 4. Architecture

```text
YAML/JSON file
  -> parse (yaml-source.js)   YAML 1.2, one document, duplicate keys = error, line/column map,
                              portability warnings
  -> Stage 1 (structural.js)  schemaVersion routing (schema-registry.js) -> Ajv 2020-12 (strict)
                              -> translators: code + JSON Pointer + line/column + message + hint
  -> Stage 2 (consistency.js) across the manifests validated together: ids, sources, publications,
                              references, relations, lifecycle of targets and signals, versions,
                              license, provenance, dates, risk, optional reachability
  -> completeness (completeness.js) level reached and facts the next level needs (x-completenessLevels);
                              an error only below --require-level
  -> report (validator.js)    per-check status, completeness, error/warning/unverified counts, caveat
       -> text, or JSON per the validation-report contract  -> CI / contribution workflow (exit codes)
       -> exchange.js: Capability Exchange Document (manifests unchanged, plus caveats) -> other missions
compat (compatibility.js):      Stage 1 on both revisions -> change impact -> identity, lifecycle,
                                SemVer bump
schema-compat (schema-compat.js): two schema versions -> static classification -> required bump;
                                optional corpus re-validation
docs (field-docs.js):           each schema -> docs/field-dictionary/<version>.md, including changes
                                since the previous version (stale-file test)
```

The schema is the single source of truth. Hints (`x-hint`), lifecycle transitions
(`x-lifecycleTransitions`), completeness levels (`x-completenessLevels`), native field names
(`x-synonyms`), conditional-rule explanations, and the field dictionary are all read from it, so
there are no parallel definitions to keep in sync.

## 5. Traceability matrix

The "Documented finding" column is empty for every spike because none has been recorded (§2.2).
Each row traces a requirement to its source in the charter and to the evidence.

| Spike | Documented finding | Requirement (source) | POC component | Test / evidence |
|---|---|---|---|---|
| 1 | None (asks: reuse of Agent Skills, MCP, A2A, JSON Schema, SemVer) | Machine-readable contract in JSON Schema 2020-12 (§3) | `schema/0.1/capability.schema.json`; `schema-registry.js` (Ajv 2020, strict) | schema.test: "compiles the schema in Ajv strict mode..."; Python `check_schema` (§7.4) |
| 1 | None | Reference MCP and A2A, do not recreate them (§8) | `interfaces[].type`, `contractRef`; a2a/openapi rule; mcp_server rule | structural.test: "requires a contractRef...", "requires an mcp interface for an mcp_server" |
| 1 | None | Evaluate SemVer for versions (§7) | `capabilityVersion` SemVer pattern; `compatibility.js` | structural.test: "requires Semantic Versioning..."; compatibility.test (14 tests) |
| 1 | None | Manifest is not a runtime protocol (§8) | No execution fields; contract references only | Schema review; spec §1 |
| 2 | None (asks: definition, types, field dictionary, missing data) | Mandatory, conditional, optional fields (§1, §4) | Schema `required` and `allOf` rules; generated field dictionaries | schema.test (per version): "mandates only the facts every sampled source supplies...", "documents every field...", "keeps docs/field-dictionary/<version>.md in sync"; structural.test: 6 mandatory tests and 11 conditional tests |
| 2 | None; research §11.3 proposes levels | Requiredness that follows availability (research §7.6) | `x-completenessLevels`; `completeness.js`; `--require-level` | completeness.test (11 tests); schema.test: "defines cumulative completeness levels..."; research.test: levels on 60 real records |
| 2 | None; research §9.4 | Provenance and value states | `provenance[]`; `DERIVED_VALUE_UNCONFIRMED`, `PROVENANCE_FIELD_NOT_FOUND`, `LICENSE_NEEDS_REVIEW` | structural.test: "requires the basis of a derived value..."; consistency.test: "reports heuristic values that nobody confirmed...", "reports license terms in prose..." |
| 2 | None | Capability types (§2) | `capabilityType` enum | schema.test: "offers the capability types listed in Mission 4 section 2" |
| 2 | None | Granularity: independent versus embedded components (§2) | `components`, `parent`, `embeddedComponents`; reciprocity check | consistency.test: "warns when parent and component links are not reciprocal", "accepts reciprocal..."; examples `sre-toolkit` and `runbook-search` |
| 2 | None | Missing, unknown, inapplicable values (§4) | null rejected; `[]` versus omitted; `unassessed` | structural.test: "rejects null...", "distinguishes an empty list..." |
| 2 | None | Consumption without capability-specific mappings (§8, §10); boundaries: "consumed by other missions without bespoke data transformations" | `src/exchange.js` (lossless); contract schema; summary view | exchange.test: "carries every valid manifest exactly as authored...", "contains no capability-type-specific logic..."; consumers.test (15 tests) |
| 2 | None | Standardize maturity and integration metadata (boundaries) | Schema 0.1, added in the boundary review: `maturity`, `intendedAudience`, `platformCompatibility`, `costInformation`, types `framework` and `platform` | structural.test: "maturity, audience, platform, and cost metadata"; consumers.test: per-mission needs |
| 3 | None (asks: ID format, sources, lifecycle, versioning, compatibility) | Stable, unique ids; a URL is not an id (§5) | `$defs/capabilityId`; URL hint; `DUPLICATE_ID`; `IDENTITY_CHANGED` | structural.test: "explains that a repository URL is not a capability id", "enforces the namespaced, lowercase id convention"; consistency.test: duplicate id; compatibility.test: "rejects a changed id" |
| 3 | None | Sources separate from ids: monorepo, moved repository, external (§5) | `source` with per-type rules and `path`; `DUPLICATE_SOURCE`; `SOURCE_RELOCATED` | consistency.test: "flags one source location...", "allows several capabilities in one repository..."; compatibility.test: compatible example |
| 3 | None; research §7.3, §10.1 | Several source references per capability; renamed repositories (§5) | `publications[]`, `source.repositoryId`, `relations[]`; `DUPLICATE_PUBLICATION`; `DUPLICATE_SOURCE` by repository id; `RELATION_UNVERIFIED` | consistency.test: "matches a renamed repository by its forge id...", "flags one publication listed by several ids...", relations tests; research.test: "links the same capabilities as the declared-link rule of J2..." |
| 3 | None | Lifecycle states and transitions (§6) | `lifecycleStatus` and `x-lifecycleTransitions`; compat check; observed signals in `publications[].status` and `source.status`; `LIFECYCLE_SIGNALS_CONFLICT` | schema.test: transition consistency; compatibility.test: exhaustive 4x4 transition test; consistency.test: "warns when a catalog still lists as active..." |
| 3 | None | schemaVersion versus capabilityVersion; unsupported versions (§7) | Registry routing; `SCHEMA_VERSION_UNSUPPORTED` | structural.test: "rejects a well-formed but unsupported schemaVersion...", "validates a malformed schemaVersion..." |
| 3 | None | Breaking changes and backward compatibility (§7) | Change classes and bump rules | compatibility.test: example revisions, MAJOR/MINOR/none, 0.x leniency, decrease |
| 3 | None | Schema evolution, compatibility between schema versions, older manifests (§7; boundaries) | Schema registry and version routing; `schema-compat`; version-aware hints; both 0.1 draft revisions checked against the earlier draft | schema-compat.test (16 tests); structural.test: "newer schema versions" (a hypothetical next version); §7.2 |
| 4 | None (asks: schema, 5 manifests, validator, consistency checks, feedback) | Structural validation with actionable feedback (§3, §10) | `structural.js` keyword translators | structural.test (72 tests); CLI output samples (README) |
| 4 | None | 5 manifests, at least 4 types, internal and external (§10) | `examples/valid` (skill, agent, mcp_server, tool, plugin, framework; 5 internal, 3 external, of which 2 real) | consistency.test: "covers at least four capability types, internal and external owners" |
| 4 | None | Errors, warnings, and unverified checks distinguishable (§3, §10) | Severities; per-check status | consistency.test: "is valid, and separates warnings and unverified checks from errors"; cli.test: JSON report |
| 4 | None | Consistency checks: duplicates, references, reachability (§3) | `consistency.js` | consistency.test (32 tests); live `--check-sources` run (§7.3) |
| 4 | None | Unassessed risk is never low or approval (§6, §10) | Mandatory `riskTier` without default; `RISK_UNASSESSED`; exchange summary view | schema.test: "...has no default tier"; exchange.test: "shows unassessed and missing risk as UNASSESSED..." |
| 4 | None | A second consumer or integration path evaluated (§8, §10) | `interop/python/crosscheck.py`; validation-report contract and exit codes | §7.4; cli.test: "writes JSON that conforms to the validation-report contract..." |

## 6. Acceptance criteria (charter §10)

| Criterion | Status | Evidence |
|---|---|---|
| Manifest v0.1 and its field documentation available | Met (POC draft) | Schema; generated field dictionary |
| Mandatory, conditional, and optional requirements documented | Met; requiredness rules are POC proposals | Field dictionary; spec §4 |
| Identifier, lifecycle, versioning, and compatibility rules documented | Met as proposals pending Spike 3 | Spec §6-§9 |
| Five representative manifests, at least four types, internal and external where available | Met | `examples/valid`: 8 manifests, 6 types, 3 external. Six are realistic but fictional; two are real public capabilities from the research snapshot (2026-10-23). No internal capability metadata was available |
| Valid manifests pass; invalid ones fail with actionable feedback | Met | 8 of 8 valid pass; 5 of 5 invalid fail with 15 coded findings |
| Structural and consistency results distinguishable; errors, warnings, unverified | Met | Stage and severity on every finding; per-check status |
| Identifier rules cover uniqueness, stability, sources, multi-capability repositories | Met within one validation run | Global uniqueness needs an inventory, which is outside Mission 4 |
| Unassessed risk cannot be read as low risk or approval | Met | Mandatory field without default, unverified reporting, consumer semantics, no approval field |
| One downstream consumer without mappings; a second evaluated | Met for the POC | Lossless exchange document, its summary view, and the consumer-needs contract test; independent Python implementation evaluated. Not integrated with another mission's real system |
| Limitations, unresolved decisions, and enhancements documented | Met | §8-§10 of this report |

## 7. Verification results

Environment: macOS (Darwin 25.6.0), Node.js v22.23.2, npm 10.9.8.

### 7.1 Build and tests

| Command | Result |
|---|---|
| `npm install` | 4 dependencies, exact versions pinned; npm reported 0 vulnerabilities |
| `npm test` (2026-10-23) | 206 tests in 39 suites: 206 pass, 0 fail (schema 14, structural 72, consistency 32, completeness 11, compatibility 14, schema-compat 16, exchange 7, consumers 15, pilot 7, research 6, CLI 12). Before the revision: 157 in 33 suites |
| Mutation check, 2026-10-19 (three defects injected one at a time, then restored) | Each defect was detected: active->experimental allowed (3 failures); missing risk defaulted to low (1); conditional `if` noise not filtered (2) |
| Mutation check, 2026-10-20 (four defects in the boundary-review code) | Each defect was detected: new required schema field classified as additive (1 failure); newer-version hints disabled (1); exchange document altering manifests (1); a gap field added to the schema without updating the gap list (4) |
| Mutation check, 2026-10-20, after folding into 0.1 (three defects) | Each defect was detected: a maturity level removed from the schema (19 failures); newer-version hints disabled (1); added enumeration values classified as breaking (2) |
| Mutation check, 2026-10-22, journey pilot (three defects) | Each defect was detected: the crosswalk inventing a license value (2 failures); the crosswalk asserting a low risk tier (2); a comma in a compact YAML mapping truncating a journey question (2) |
| Mutation check, 2026-10-23, the research revision (five defects) | Each defect was detected: `unassessed` counted towards the governed level (7 failures); levels not cumulative (3); publication locators compared case-sensitively (1); repository id ignored when matching sources (1); "is absent" conditions not described (2) |
| `npm run pilot` | 12 drafted manifests, 12 valid as drafted against the revised 0.1 (4 against the 2026-10-22 draft; the other 8 failed only on `lifecycleStatus`); journey answerability and coverage in [pilot/results.md](../pilot/results.md) |
| `npm run research` | Regenerates [research/spikes-1-3/results.md](../research/spikes-1-3/results.md) offline from the snapshot. Against the 2026-10-22 draft: 12 of 60 drafts valid, as the research reported. Against the revised 0.1: 57 of 60 with the same drafting, 58 of 60 with starter-model drafts; validator levels none 2, discoverable 25, assessable 31; identity through the validator 14 correct pairs, 0 false, 0 missed |
| `python3 -I interop/python/crosscheck.py` (scratch virtual environment) | All 16 example verdicts match; the three probes differ as documented in §7.4 |

### 7.2 CLI scenarios

| Command | Exit code | Outcome |
|---|---|---|
| `validate examples/valid` | 0 | 8 valid; 0 errors, 1 warning (`REFERENCE_TO_DEPRECATED`), 20 unverified; completeness none 1, discoverable 1, assessable 2, adoptable 2, governed 2 |
| `validate examples/valid --require-level adoptable` | 1 | 4 manifests below the level get `COMPLETENESS_BELOW_REQUIRED`, with the missing facts per level |
| `validate examples/invalid` | 1 | 0 valid, 5 invalid; 15 errors (16 before the revision: the misspelled `lifecyleStatus` no longer also leaves a mandatory field missing) |
| `validate examples/valid examples/consistency` | 1 | `DUPLICATE_ID` on both files that declare `ai-platform/sql-review` |
| `compat sql-review -> 1.4.0-compatible` | 0 | Backward compatible; MINOR bump required and present; `SOURCE_RELOCATED`, id stable |
| `compat sql-review -> 1.4.0-breaking` | 1 | `INSUFFICIENT_VERSION_BUMP` (expected 2.0.0), `LIFECYCLE_TRANSITION_NOT_ALLOWED` |
| `export examples/valid examples/invalid` | 0 | Exchange document with 8 manifests unchanged, each with its completeness level, and 5 rejected inputs with error codes; conforms to its contract schema |
| `schema-compat <earlier 0.1 draft> schema/0.1/capability.schema.json --corpus examples` | 0 | The boundary-review revision of the 0.1 draft is additive (4 optional fields, 2 capability types). All 8 manifests valid under the earlier draft stay valid. One warning: the contract changed without a version change, which is acceptable while 0.1 is unpublished. The earlier draft was kept only for this check; the repository has no version history |
| `schema-compat research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json 0.1 --corpus research/spikes-1-3/reference/examples-2026-10-22` | 0 | The research revision of the 0.1 draft: requirements and the registry rule removed (relaxations); 12 optional fields and 4 completeness levels added; the id pattern reported as breaking at the 5 places that use it, because a changed pattern cannot be proven to accept every earlier value (it only adds digit-first segments). All 9 manifests valid under the 2026-10-22 draft stay valid. One warning: the contract changed without a version change, acceptable while 0.1 is unpublished |
| `schema-compat 0.1 <next-version draft> --corpus examples/valid` (cli.test) | 0 | A hypothetical next version that adds an optional field: additive, MINOR required and present, 8 of 8 manifests still valid |
| `schema-compat <next-version draft> 0.1` (cli.test) | 1 | Breaking (field removed); `VERSION_DECREASED` |

### 7.3 Live source reachability (`--check-sources`, opt-in)

Run before the revision of 2026-10-23; it was not repeated for the two real examples added then,
because the check uses the network.

| Capability | Result | Classification |
|---|---|---|
| `ai-platform/sql-review`, `sre/sre-toolkit`, `ai-platform/incident-triage-agent` | github.com returned HTTP 404 for the placeholder repositories | unverified: a private repository and a missing one look the same without credentials |
| `acme/observability-mcp-server` | DNS failure (`ENOTFOUND`) for the fictional `.example` domain | warning |
| `sre/runbook-search`, `ai-platform/agent-eval-framework` | Registry sources without a URL | unverified: not checkable |

### 7.4 Second implementation: Python `jsonschema` 4.25.1 with PyYAML 6.0.3

Reproduce with `python3 interop/python/crosscheck.py` after `pip install jsonschema pyyaml`.

- The independent implementation accepts the schema against the Draft 2020-12 meta-schema.
- With manifests routed by their `schemaVersion`, all **16** example files receive the expected
  verdict from both validators, with and without format assertion (re-run on 2026-10-23 after the
  research revision).
- Three probes differ, and each is an interoperability risk:

| Probe | Node.js validator | Python default | Python with `FormatChecker` | Cause and mitigation |
|---|---|---|---|---|
| Unquoted `lastUpdated: 2026-10-12` | valid, with a `YAML_PORTABILITY` warning | invalid | invalid | PyYAML (YAML 1.1) reads a date object. Mitigation: quote dates (spec §12); the validator now warns |
| `"2026-02-30"` | invalid (`INVALID_FORMAT`) | valid | invalid | Draft 2020-12 treats `format` as an annotation by default. Mitigation: conforming validators must assert formats |
| `riskTier: high` then `riskTier: low` | invalid (`DUPLICATE_KEY`) | valid, read as `low` | valid, read as `low` | PyYAML keeps the last duplicate key silently, which downgrades risk. Mitigation: duplicate keys must be rejected |

## 8. Consistency checks: supported, limited, unverified

| Check | Support | Limitation |
|---|---|---|
| Duplicate ids | Error, across the manifests validated together | No global registry |
| Duplicate source locations | Warning, naming the other ids | Compares normalized URL and path, the forge's repository id and path, or registry and identifier |
| Shared publications | Warning, naming the other ids | Compares locators case-insensitively; does not normalise a locator written in another form (a Package URL against a registry URL) |
| Relations | Targets resolved like references; a claimed relation is unverified | `verified` is the author's statement; the validator does not query the forge |
| Lifecycle signals | Warning when the declaration and the observed signals, or two signals, conflict | Signals are as recorded in the manifest; the validator does not re-read the channels |
| Publication versions | Unverified when comparable versions differ | Versions are compared as text within comparable schemes, not ordered |
| License terms | Unverified when stated as text or for the whole repository | No check against the SPDX License List |
| Provenance | Warning when a pointer resolves to nothing; unverified when a heuristic value is unconfirmed | Provenance is the author's statement; it is not checked against the native source |
| Dependency, component, parent, and replacement references | Resolved within the run; outside it, reported as unverified | No inventory lookup |
| References to deprecated or retired capabilities | Warning, with the replacement suggested | Only for targets in the run |
| Parent and child reciprocity | Warning in both directions | Only for targets in the run |
| Self-reference | Error | |
| Date sanity, deprecation and status mismatch | Warnings | |
| Risk assessment state | `unassessed` is unverified | Does not check that the assessment record exists |
| Source reachability | Opt-in HTTPS HEAD, falling back to GET; 2xx/3xx passes; 401/403/404 unverified; other failures are warnings | No credentials; registry lookups not implemented; see the security note in §9 |

## 9. Limitations and remaining gaps

- **Open decisions.** Every decision marked POC in §3 awaits confirmation. The spikes have no
  findings to validate against.
- **Evolution not yet exercised with a published version.** There is one schema version (0.1).
  Routing between versions, version-aware hints, and `schema-compat` are tested with hypothetical
  next versions, and the in-place revision of the 0.1 draft was checked against the earlier draft.
  There is no migration tooling for breaking changes beyond re-declaring `schemaVersion`.
  `schema-compat` treats any pattern change as breaking, because it cannot prove that a new regular
  expression accepts everything the old one did; the corpus check is the second line of defence.
- **No version history.** The repository is not under version control, so the earlier 0.1 draft
  used for the fold-in check of 2026-10-20 is not retained. For the revision of 2026-10-23, the
  2026-10-22 draft and the manifests valid under it are kept in `research/spikes-1-3/reference/`.
  Future draft revisions should be diffable.
- **The research revision is a set of proposals.** Completeness levels, publications, relations,
  and provenance were measured on public capabilities by one researcher (research §4.4, §12.3).
  The research drafts are mechanical; nobody confirmed their heuristic values. Validator and
  research levels differ for 4 of 60 records: two native descriptions are outside the 20-1,024
  character limits, and two PyPI records name their maintainer only by email address.
- **The boundary-review fields are proposals.** They were derived from the published boundaries.
  The maturity definitions need Mission 2's agreement, and the cost model needs Mission 1's.
- **Heuristic compatibility.** The checker classifies changes from the manifest only. Breaking
  changes inside referenced contracts (MCP tool schemas, OpenAPI documents) are not detected.
- **Mostly fictional examples.** No internal capability metadata was available. Six examples are
  fictional (`example-org`, the `.example` vendor domain); two describe public capabilities from the
  research snapshot. Validation against real inventory entries is pending.
- **Optional evaluation harness.** The second-implementation check (`interop/python`) is not part
  of `npm test` and needs `pip install jsonschema pyyaml`.
- **Security.** `--check-sources` sends requests to URLs taken from manifests. In a CI pipeline that
  validates untrusted contributions, enable it only with a host allowlist, to avoid server-side
  request forgery. It is off by default.
- **Scope.** There is no inventory, registry, namespace governance, or approval workflow; these are
  owned outside Mission 4 (charter §9, [mission-boundaries.md](mission-boundaries.md)). The
  repository is not under version control, and no CI pipeline is configured.
- **Mission 3's metadata.** Data handling, access controls, and model use are not represented. This
  is deliberate until Mission 3's Trust Framework defines the criteria.
- **Messages.** Messages are in English only. Performance was not measured, as it was not a
  requirement.

## 10. Open questions

| Owner | Question |
|---|---|
| Spike 1 | Should the manifest embed or map fields from Agent Skills (`SKILL.md` front matter), the MCP server metadata, and A2A Agent Cards, beyond referencing them? Should a manifest be generated from those sources? |
| Spike 2 | Confirm the mandatory set (D3), the completeness levels (D23), and the conditional rules (D4). Is "declared none" for setup and limitations owner-asserted only, or verifiable (research U10)? Which abilities vocabulary, if any (research U5)? Are the maturity levels right (D15)? Are the structures of `platformCompatibility`, `costInformation`, and `intendedAudience` right, and does `techStack` need a field (D16)? Should prompts, commands, hooks, and resources ever be capability types (D7)? Is a configuration-only wrapper a publication or its own inventory entry (research U4)? |
| Spike 3 | Should `source` be folded into `publications` (D24, research U2)? Namespaced or URN ids (D8), possibly `urn:air`, and who allocates namespaces (research U3)? Are the lifecycle transitions right for owner declarations (D9, research U6)? How long is the deprecation window for schema versions? What syntax should dependency version constraints use? |
| Mission 3 and governance owners | What is the risk tier vocabulary? What format must an assessment reference take? Should an assessment expire (`assessedOn` age)? Is the lifecycle transition table consistent with retirement expectations (D21)? Which assessment metadata should the schema add? |
| Missions 1 and 2 | Which fields does each consumer need beyond those in [mission-boundaries.md](mission-boundaries.md) §5? Does the exchange document fit their ingestion? |
| Mission 4 | Is the implementation stack (D17) the long-term choice, or a reference implementation alongside others? |

## 11. Recommendations

1. **Make journeys the acceptance tests** ([journey-pilot.md](journey-pilot.md) §5). Every field
   must trace to a journey question, and to either a native source or a named curator. Run the
   pilot's second iteration with 3 to 5 real journeys and 10 to 20 internal capabilities from
   Missions 1 and 2, with the Spikes 1-3 harness (`research/spikes-1-3/`, `npm run research`) and two
   judges.
2. **Run Spikes 1-3 against this POC.** Use the decision table (§3) as the agenda: confirm, change,
   or replace each POC choice in the schema, starting with the 2026-10-23 revisions (D3, D4, D8,
   D9, D11, D23-D26), and the tests and the research harness show the effect.
3. **Agree the risk vocabulary** and the assessment-reference format with the governance owners,
   then replace the placeholder tiers.
4. **Offer Mission 5 the validation step.** Mission 5 owns the contribution workflow. Mission 4
   offers it the validation-report contract and exit codes (`validate --format json`; exit code 1
   fails the check) for the workflow's validate step, plus `compat` for revisions in the improve
   step.
5. **Publish a normative YAML profile and conformance suite.** Require YAML 1.2, unique keys, quoted
   dates and versions, and asserted formats. Publish the example manifests as golden files that
   other implementations must reproduce.
6. **Operationalise versioning.**
   - Put the repository under version control, so that every draft revision of the schema is
     diffable.
   - Publish 0.1 with an immutable schema URL (`$id`) once the spikes confirm it, and define the
     deprecation window.
   - Run `schema-compat --corpus` on every schema change, so that the MINOR/MAJOR rules are enforced
     automatically.
7. **Integrate a second real consumer**, for example the recommendation mission, using the exchange
   document or the library API, to close the evaluation required by §8.
8. **Govern namespaces** and id assignment with the contribution workflow owners.
