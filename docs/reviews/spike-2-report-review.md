# Review: Spike 2 report "Capability Definition and Metadata Model"

| | |
|---|---|
| Reviewed | The Spike 2 report, status "Proposed model for team review — not final", as shared with the Mission 4 lead on 2026-10-23. The report itself is not in the repository; quotes below are from it |
| Reviewed against | The Spike 2 charter (`Spike 2 Capability Definition and Metadata Model.docx`, 2026-10-16); the Mission 4 charter; the Spikes 1-3 research ([MISSION4_SPIKES_1_TO_3_RESEARCH.md](../../MISSION4_SPIKES_1_TO_3_RESEARCH.md)) and its 60-record snapshot; the POC's schema 0.1 as revised on 2026-10-23 ([manifest-spec.md](../manifest-spec.md)); the boundary review ([mission-boundaries.md](../mission-boundaries.md)) |
| Date | 2026-10-23 |
| Status | A review, not a decision. It recommends; the Spike 2 owner and the Mission 4 lead decide |
| Handling | Derived from documents marked "Confidential – Authorized Use Only". Handle it the same way |

Labels: **[Report]** the Spike 2 report; **[Spike 2]** the spike charter; **[Charter §n]** the Mission
4 charter; **[Research §n]** the Spikes 1-3 research; **[Measured]** computed for this review from
the research snapshot (60 capability records, 36 A2A Agent Cards, retrieved 2026-10-22);
**[Verified]** checked against the official source on 2026-10-23; **[POC]** schema 0.1 as revised
on 2026-10-23; **[Inference]** this review's reading; **[Recommendation]** a proposal.

## 1. Summary

The report is a clear, well-bounded desk study. Its core positions agree with the evidence and with
the POC:
- reference native formats instead of copying them;
- keep identity separate from sources;
- one repository can hold several manifests, and bundles reference their components;
- explicit missing-data rules, with no `null` and with `[]` meaning "none";
- unassessed is never low risk;
- the manifest is not the inventory, a ranking, or a workflow.

Its standards table is accurate where checked (§5).

It needs revision before it can guide v0.1, for four reasons:

1. **It does not do the spike's first task.** Spike 2 asks to "review representative AI
   capabilities and their existing metadata" [Spike 2]. The report reviews format specifications,
   not capabilities, and gives no measurements. This is the concern the lead raised: designing the
   model from documents rather than from evidence.
2. **Its required set would block almost every real capability.** Requiring at least one supported
   use case for a published manifest fails 59 of 60 sampled records, because only 1 states use
   cases natively [Measured]. This repeats the problem the research found with a mandatory
   `lifecycleStatus`.
3. **Two type decisions conflict with the evidence.**
   - *MCP servers as services:* "typically a service with an MCP interface" fits 4 of 37 sampled
     MCP servers; 30 run only locally or as a container image [Measured].
   - *Per-tool manifests:* manifests for individual tools rest on lists that MCP serves at
     runtime, that may change, and that may vary by the caller's authorization [Verified].
4. **It drops facts the journeys and the charter need**, without saying why:
   - a capability version;
   - lifecycle status, deprecation, and replacement;
   - per-value provenance;
   - relations such as forks, wrappers, and look-alikes;
   - the per-publication facts that recognise one capability across sources.

Several of its open questions are already answered by measurement: the draft-versus-published
distinction, the unknown and not-applicable states, and how much of each field exists. §6 maps the
report's fields onto the POC revision; §7 lists the decisions the lead needs to take.

## 2. Coverage of the Spike 2 charter

| Spike 2 asks for | In the report | Assessment |
|---|---|---|
| Task: review representative AI capabilities and their existing metadata | Formats and standards reviewed (§2); no capability sampled | **Missing.** The research supplies this: 60 records in 7 formats, availability per field [Research §5] |
| Capability definition and granularity rules | §1, §3 | Done; consistent with Charter §2 and POC D7 |
| Capability type recommendations and applicability | §3: 8 types; MCP server and plugin reclassified | Done, but two choices are contradicted by evidence (§4.3) |
| Field dictionary: name, description, data type, requirement level | §4 | Mostly done. Data types are loose ("String", "Array of objects"); several fields lack structure (sources, requirements, trustAssessment) |
| Identify fields that may vary by capability type | One paragraph of examples | **Thin.** No per-type analysis; the research has per-format availability [Research §5.1, §7.5] |
| Missing-data rules | §5 | Done; close to POC D5, with useful additions (§4.6) |
| Consumer requirements: discovery, recommendation, interoperability, risk | §6 alignment by mission | Partly: ownership is covered, the information each consumer needs is not traced to fields |
| Gaps and unresolved decisions | §7 | Done; several are now answerable (§7 of this review) |

## 3. Where the report agrees with the evidence

| Report position | Evidence |
|---|---|
| No single format covers the need; reuse formats as authoritative and keep a catalog-level summary | Same conclusion [Research §8.2-§8.5]; the AI Catalog draft takes this approach [Research §1.2 finding 11] |
| Manifest when independently adoptable; components otherwise; several manifests per repository | Charter §2; POC D7; real cases: `anthropics/skills` holds 20 skills, a plugin marketplace 315 plugins [Research §10.1] |
| Keep `id` separate from sources | Charter §5; a stored URL went stale after a rename while the repository id did not [Research §10.1] |
| Several sources per capability ("sources" array) | One capability had up to four publications [Research §7.3]; POC `publications[]` (D24) |
| Plugin is usually a packaging form | Of 7 sampled plugins, 6 configure at least one MCP server; 2 were judged configuration-only wrappers and counted as the same capability as what they run [Measured; Research judgments] |
| Keep type separate from interface | Matches the POC's `interfaces[]`; the research found the same word meaning different things across formats [Research §6.3] |
| Omitted ≠ none; no `null`; `[]` = none; unassessed ≠ low | POC D5; Charter §6 |
| Avoid a status wrapper on every field | Consistent with the research, which uses provenance per value instead [Research §9.4] |
| `maturity`, `availability` content owned by Mission 2; assessment states by Mission 3; ranking by Mission 1 | Boundary review §4 |
| Type vocabulary controlled but extensible | Backstage accepts any `spec.type` and asks organizations to establish a taxonomy [Verified] |

## 4. Issues

### 4.1 The model is not derived from capabilities

The report's evidence is format documentation. Spike 2's first task, the lead's direction
(2026-10-22), and the charter's "subject to Phase 0 validation" all ask for evidence from real
capabilities. Without it the report cannot say how often a field exists, who would supply it, or
whether requiring it blocks registration.

[Recommendation] Re-run the field dictionary against the research snapshot: for each field, record
its availability, who supplies it (native, derived, owner, curator), and the journey question it
answers. Research §11.2 already has this table for most of the report's fields.

### 4.2 Required `supportedUseCases` would block publication

The report requires "at least one" supported use case for published capabilities, and asks whether
there are exceptions.

- Native use cases or abilities exist for **1 of 60** records: one Docker catalog entry lists two
  tools [Measured]. Iteration 1 of the journey pilot found **0 of 12**.
- A2A Agent Cards are the exception: **21 of 36** list skills [Measured].
- Name, description, type, and a source are available for 58-60 of 60 [Research §1.2].

So under the report's rule, at most 1 of 60 sampled capabilities could be published without a
person writing use cases. The research saw the same effect with a mandatory `lifecycleStatus`:
12 of 60 drafts valid [Research §7.6].

[Recommendation] Keep `supportedUseCases` as a curation target, not a structural requirement. If
the catalog wants it before publication, express that as a level that the publishing workflow
requires. The POC's completeness levels and `validate --require-level` do this today. Meanwhile:
- measure the curation effort (research experiment E4);
- test drafting use cases from descriptions, with owner confirmation (experiment E6).

### 4.3 MCP servers, plugins, tools, and the type list

| Report position | Evidence | Assessment |
|---|---|---|
| An MCP server is "typically a service with an MCP interface" | Of 37 sampled MCP servers, 4 are hosted only and 3 hosted or local. 22 run only as a local process (npx, uvx, pip) and 8 only as a container image. Transports: stdio in 33, streamable HTTP in 7 [Measured] | The mapping fits a minority. A local stdio server is not a hosted service; typing it `service` mislabels where it runs, which J3 needs |
| Give an MCP server's tools their own manifests when independently selectable | MCP: clients get tools through `tools/list`; the set "MAY change over time" and "MAY vary by the authorization presented"; tool names are unique only within a server [Verified]. Only 1 of 8 Docker catalog entries lists tools statically, generated by running the server [Measured]. MCP Server Cards leave tools out of static metadata [Research §1.2 finding 11] | **Not supported.** Adopters install, configure, and authorize the server. Setup, runtime, license, version, and lifecycle are all server-level facts [Research §7.4]. Per-tool manifests would multiply records and drift with the runtime |
| Drop `mcp_server` and `plugin` as types | Both are in the charter's list [Charter §2]. MCP servers are the most common capability form in the sample (37 of 60) | A charter change: it needs a recorded decision and Mission 2's agreement on the catalogue taxonomy, not only a Spike 2 recommendation |
| Add `model` | No model hub was sampled; the charter's types do not include models | Plausible, but untested. Ask Mission 2 whether models are catalogued as capabilities |
| Omit `framework` | Mission 2 catalogues "capabilities, tools, frameworks, platforms" [Boundary review §5]; the POC added `framework` (D22) | Restore it, or record why frameworks are out of scope |

[Recommendation]
- Keep the type as "what the capability is", and keep interfaces and runtime separate, as the
  report wants.
- Keep `mcp_server` as a built-in type until Mission 2 agrees an alternative. The POC already
  requires an `mcp` interface for it and records where it runs in `runtime[]`, so moving to
  `tool` or `service` later is a vocabulary change, not a model change.
- Treat tools as runtime data referenced through the MCP contract, not as manifests.

### 4.4 Version, lifecycle, deprecation, and replacement are missing

The field dictionary has `schemaVersion` but no capability version, and no lifecycle, deprecation,
or replacement field. "Governance lifecycle" is assigned to Mission 3.

- Charter §7 requires the manifest to distinguish `schemaVersion` from `capabilityVersion`.
  Charter §6 lists `lifecycleStatus` among the mandatory candidates. The boundary review assigns
  lifecycle as a data element to Mission 4, and lifecycle *expectations* to Mission 3.
- J3 asks "which version is current?" and "is it maintained or replaced?". 47 of 60 records state
  a version, and one capability carried three versions at once across its publications. Lifecycle
  signals are common but mostly observed: a registry status, an npm deprecation message, an
  archived repository. No source records a successor in machine-readable form [Research §10.3,
  §10.4].

[Recommendation] Add a capability version, recorded per source with its scheme, and a lifecycle
block: the owner's declared status, observed signals with their source, and `deprecation` with
`replacedBy`. The POC has all of these (D9, D11).

### 4.5 Risk: optional `trustAssessment` versus an explicit `unassessed`

The report replaces the charter's `riskTier` with an optional `trustAssessment`, "include when an
assessment exists", and relies on the rule that omission is not "safe".

[Inference] Leaving risk vocabulary to Mission 3 is right. But "absent" carries the risk meaning
silently, and an extractor bug or a dropped field then looks exactly like "never assessed". The
charter makes `riskTier` a mandatory candidate precisely so that the unassessed state is explicit
[Charter §6]. The POC found a related failure: a duplicate YAML key silently downgraded a risk
tier in a common parser.

[Recommendation] Combine the two: a required assessment block whose status defaults to an explicit
`unassessed`, with the reference and the states defined by Mission 3. This is the POC's
`riskTier: unassessed` under the report's name.

### 4.6 Conditions that a validator cannot check

Several conditional requirements depend on facts the manifest does not state:
- "required when the capability is callable" (interfaces);
- "when needed to adopt or run" (requirements);
- "when dependencies exist";
- "when distributed or licensed" (license).

No validator can enforce them, so they act as guidance. [Recommendation] Either tie each condition
to a field, for example a type or a distribution channel, or call it guidance. The POC's
conditional rules all key off values in the manifest.

The report's missing-data rules add two useful ideas: field-specific "unknown" and "not
applicable" states, and keeping claims apart from evidence. The research generalizes the second
into per-value provenance [Research §9.4]. That matters because much catalog metadata is
inferred:
- the capability type is never declared; it is derived for 60 of 60 records, 13 of them by
  heuristic;
- 46 of 60 interfaces are derived [Research §7.5].

The report has no way to say "inferred, confirm before relying on it".

### 4.7 Recognising one capability across sources

`sources` is "kind and URI". The research found that linking publications needs more than that:

| Need | Evidence |
|---|---|
| The native name and version of each source | Versions differ per channel (0.0.82 and 0.0.83 for one capability) |
| A verified back-link | npm `mcpName` and PyPI `mcp-name` link packages to registry entries; these links, plus same repository and path, linked all 14 judged same-capability pairs with no false link |
| The forge's repository id | It survived a rename that broke the URL |
| A status per source | A catalog still listed a server whose repository was archived |
| Relations other than dependencies | Forks republished as separate entries; two different skills named `pdf` |

Matching on names alone merged two pairs of different capabilities and missed 10 of the 14
[Research §7.3, §10.1]. Through `publications[]`, `relations[]`, and two duplicate checks, the
revised POC validator links 14 of 14 on the same records [Research §16].

[Recommendation] Give each source entry a native name, a native version with its scheme, a status,
a date, and how its link was verified. Add relations (fork of, wraps, derived from, same as,
distinct from) beside `dependencies`. Some locators are not URIs: a registry name, or
`playwright@claude-plugins-official`; Package URLs are.

### 4.8 Names, dates, and the remaining fields

| Report | Charter or POC | Note |
|---|---|---|
| `summary` | `description` (charter candidate) | Native formats mostly say `description` (SKILL.md, npm, `server.json`, A2A); PyPI says `summary`. Keep the charter name |
| `type` | `capabilityType` (charter candidate) | `type` collides with nested `type` fields (source, interface) |
| `tags` | `keywords` (POC) | Same concept; npm says `keywords`, Docker and Hugging Face say `tags`. Either works; the POC maps one to the other |
| `requirements` | `runtime[]` and `setup[]` (POC) | Same concept, split in the POC because availability differs: runtime is known for 60 of 60, setup for 13 [Research §1.2] |
| `owner` / `maintainer`, optional | Charter: mandatory candidate; POC: optional, with name and contact at completeness levels | Agree in substance. The report's distinction between content owner and inventory owner is useful |
| `lastVerifiedAt` | Charter: `lastUpdated`; POC: record date, plus per-publication `updatedAt` and per-value `observedAt` | A third date meaning (last checked). Worth keeping, but define all three dates explicitly; the research found `lastUpdated` used for two of them (Q24) |
| `license`, conditional | POC: optional; counts towards the assessable level; SPDX expression or text, with scope | License is the J3 question "may we use it?" and exists for 50 of 60 records; 6 need reading, and in monorepos the repository's license may not be the capability's [Research §1.2, §7.4] |
| `evaluation` (metric, value, unit, conditions, date, source) | Not in the POC | No sampled format except model cards carries evaluation data. Hold it until Mission 1 confirms the need, as the report's own open question suggests |
| `availability` | Not in the POC; lifecycle and `runtime` cover parts of it | Define it with Mission 2 before adding it; the charter uses lifecycle as availability (D15) |

## 5. Accuracy of the standards table

| Row | Check | Result |
|---|---|---|
| Agent Skills | agentskills.io specification | **Verified**: `name` and `description` required; `license`, `compatibility`, `metadata`, `allowed-tools` (experimental) optional; progressive disclosure described |
| MCP tool metadata | MCP specification 2026-07-28, Tools | **Verified**: name, title, description, inputSchema, optional outputSchema, annotations. Omission: MCP also has static server metadata (the MCP Registry's `server.json` with status, packages, and namespace verification; Server Cards), so "MCP is a runtime protocol" undersells what it supplies for catalogs [Research §5, §10.3] |
| A2A Agent Cards | Research E11-E14 | Consistent. Add the practical finding: 4 of 36 public cards validate against the A2A v0.3.0 schema, and v1.0 changed the card layout [Research §7.7] |
| Backstage | backstage.io descriptor format | **Verified**: envelope of `apiVersion`, `kind`, `metadata`, `spec`; metadata has `labels`, `annotations`, `links`; `spec.type` accepts any value, and organizations should establish a taxonomy |
| OpenAPI, JSON Schema 2020-12 | General | Consistent |
| Hugging Face model cards | huggingface.co/docs/hub/model-cards | **Verified**: intended uses and limitations, training, datasets, evaluation results (model-index), license in YAML metadata |
| CycloneDX ML-BOM | Secondary sources only | Consistent with them: ML-BOM since CycloneDX 1.5, a `machine-learning-model` component type, a model card on that component. Not checked against the official specification |
| NIST AI RMF | nist.gov AI RMF page | **Verified**: "The AI RMF 1.0 is being revised as part of the White House AI Action Plan"; no date given |

Formats the sample shows matter but the table omits: the MCP Registry (`server.json`), npm and
PyPI package metadata, Claude Code plugin manifests, the Docker MCP catalog, GitHub Actions
`action.yml`, and the AI Catalog draft [Research §8.1].

## 6. Field-by-field reconciliation with the POC revision of 2026-10-23

| Concept | Report | POC 0.1 (2026-10-23) | Suggested resolution |
|---|---|---|---|
| Schema version | `schemaVersion`, required | Same | Agree |
| Identifier | `id`, required; format to Spike 3 | Same; assigned, never derived; digit-first segments allowed | Agree |
| Name | `name`, required | Same | Agree |
| What it does | `summary`, required | `description`; discoverable level | Use `description`; decide whether it is mandatory or a level requirement (2 of 60 records lack one) |
| Type | `type`, controlled and extensible; 8 types, no `mcp_server` or `plugin` | `capabilityType`, closed enum of 10, extensible only by a schema version | Decide the vocabulary with Mission 2 (§4.3); decide "extensible" (namespaced custom types, or new MINOR versions) |
| Use cases | Required, at least one, when published | Optional | Curation target and level requirement (§4.2) |
| Sources | `sources[]`: kind and URI; required when published | `source` (mandatory) plus `publications[]` with native facts | Converge on one list with per-publication facts (§4.7); research question U2 |
| Interfaces | Conditional when callable | Optional; discoverable level; `mcp` required for an `mcp_server` | Agree on the content; tie the condition to the type |
| Requirements | Conditional | `runtime[]` (assessable), `setup[]` (adoptable; `[]` = none) | Merge or split; keep "declared none" |
| Dependencies | Conditional; `[]` = none; relationship type | `dependencies[]` by id; `relations[]` for non-dependency links | Add relations (§4.7) |
| Capability version | Missing | `capabilityVersion` (SemVer, optional); native versions per publication | Add (§4.4) |
| Lifecycle | Missing; "governance lifecycle" to Mission 3 | `lifecycleStatus`, observed statuses, `deprecation.replacedBy` | Add; Mission 4 owns the data element (§4.4) |
| Maturity | Conditional, Mission 2 vocabulary | Optional, Mission 2 vocabulary | Agree |
| Availability | Optional, Mission 2 | Not present | Define with Mission 2 first |
| Limitations | Optional, strongly recommended | Optional; adoptable level; `[]` = none known | Agree |
| Tags | Optional | `keywords` | Naming only |
| Owner, maintainer | Optional | `owner` optional (name, contact at levels) | Agree |
| License | Conditional when distributed | Optional; SPDX or text, with scope; assessable level | Add scope; tie the condition to a field (§4.6) |
| Evaluation | Optional evidence records | Not present | Hold until Mission 1 confirms |
| Risk | `trustAssessment`, optional | `riskTier`, mandatory, explicit `unassessed`; `assessmentReference` | Required block with explicit `unassessed` (§4.5) |
| Freshness | `lastVerifiedAt`, optional | `lastUpdated` (record), `updatedAt` (publication), `observedAt` (value) | Define the three meanings |
| Provenance | Only for evaluation evidence | `provenance[]` per value | Add (§4.6) |
| Draft versus published | Open question | Completeness levels; `--require-level` | Map "published" onto a level |

## 7. Decisions for the lead, and questions for the author

Decisions:
1. **Requiredness.** Adopt "few mandatory fields, plus levels" (the POC, measured on 60 records),
   or the report's published set with required use cases? If the latter, who writes the use cases,
   and at what cost?
2. **Type vocabulary.** Keep the charter's `mcp_server` and `plugin`, adopt the report's
   reclassification, or decide with Mission 2? Is `model` in, and is `framework` out? Is the
   vocabulary closed per schema version, or open to namespaced custom types?
3. **Lifecycle and version.** Confirm that the manifest carries a capability version and a
   lifecycle (Charter §6, §7), which the report omits.
4. **Risk representation.** An explicit `unassessed` state, or absence meaning "not assessed"?

Questions for the author:
1. Which capabilities were reviewed, and can the dictionary carry availability per field? The
   research snapshot and harness can be reused (`npm run research`).
2. What makes an MCP tool "independently discoverable or selectable" when tool sets change at
   runtime and vary by authorization?
3. How should a validator decide "callable", "needed", or "distributed"?
4. Should the `sources` entries carry native names, versions, statuses, and verification, to
   support recognising one capability across sources?

[Recommendation] Next step: draft the 60 snapshot records into the report's field set, as the
research did for the POC (its runs A to C), and measure how many are publishable and whether the
journeys J2 and J4 still work. This would put the two models side by side on the same evidence.

## Sources checked for this review (2026-10-23)

- Agent Skills specification: https://agentskills.io/specification
- MCP specification 2026-07-28, Tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- Backstage descriptor format: https://backstage.io/docs/features/software-catalog/descriptor-format
- Hugging Face model cards: https://huggingface.co/docs/hub/model-cards
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- CycloneDX ML-BOM (secondary sources only): https://cyclonedx.org/guides/OWASP_CycloneDX-Authoritative-Guide-to-AI-ML-BOM-en.pdf
- The research's external sources E1-E28 [Research §15.3]
