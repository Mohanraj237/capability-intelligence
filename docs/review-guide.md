# Mission 4 review guide: where things stand and what to read

| | |
|---|---|
| Date | 2026-11-13; updated 2026-11-16 |
| Purpose | One page that says which documents are current, in what order to review them, and which older statements are out of date |
| Rule of thumb | Documents dated **2026-11-16** (or updated on that date) describe the current state. Older documents are accurate **as of their date**; §5 lists what has changed since |

## 1. Current status in one table

| Item | Status |
|---|---|
| Charter deliverables (Phase 0) | All 10 acceptance criteria met as a proof-of-concept draft ([poc-report.md](poc-report.md) §6) |
| Schema 0.1 | **Unpublished draft, not final.** Revised in place on 2026-10-23 (research), 2026-11-13 (five additive Phase 1 changes), and 2026-11-16 (C5 AI-host list and `integrations`, C6 clarification, C12 per-publication hosts) |
| Mandatory fields | Six, plus four completeness levels (U1 accepted 2026-11-16). Listing requires `adoptable` or `governed` (U9) |
| Phase 1 schema changes | C1 to C16 **decided** on 2026-11-16 (C8 deferred to 0.2; C6 a clarification). Breaking against the Phase 1 baseline: the capability-wide `platformCompatibility` and `intendedAudience` removed as repetitions (C14, C15), and `assessmentReference.assessedOn` required for the 12-month expiry. 0.1 is unpublished, so no published record breaks |
| Decided on 2026-11-16 | C9 with U2 ([analysis](phase-1-testing/c9-source-and-publications.md)); C13 `setup[].group`; hosts named by agent; U4 wrappers are separate records (Mission 2 to confirm); U3 ids assigned by Mission 5 from namespaces Mission 2 registers; U9 listing at `adoptable`; risk tiers confirmed with 12-month expiry; C10, C11, U5, U6, U7, U10, R8, R9, and the schema `$id`; C14 to C16 from the [field overlap review](phase-1-testing/field-overlap-review.md). Recorded in the decision log |
| Still proposed or open | U8 (curation effort, needs real owners); R2, R3, R4, R6, R7, R10. C8 trust fields are deferred to 0.2 with Mission 3 |
| Open questions U1 to U10 | 9 of 10 decided; U8 open. All tracked in the [decision register](decision-register.md) |
| Real manifests | **22**: 16 production capabilities and Caveman (plugin and 5 skills), all valid; every `source.url` answered the online check (`--check-sources`) on 2026-11-16, a point-in-time result; all 22 `adoptable` (since 2026-11-16), 0 `governed` (no real assessment; the governed level is tested with simulated assessments, T12) |
| Risk | All 22 `unassessed`; no real Mission 3 assessment exists. The governed level is tested with simulated assessments (T12) |
| Waiting on other missions | Mission 3: trust fields (C8), lifecycle transitions (U6). Mission 2: maturity definitions, type list, confirm wrappers, the namespace list, 10-20 internal capabilities. Mission 1: a first real consumer, search guidance (R9). Mission 5: where validation sits, the setup-group form |
| Tests | 225 of 226 pass on Windows. The 1 failure is a test-side Windows issue (path separators in duplicate-id reporting), not a product defect. The Phase 1 field audit (T1-T11) is run separately |
| Field testing | Every field tested against the 22 manifests and five journeys on 2026-11-16 ([phase-1-testing](phase-1-testing/README.md)) |
| Version control | 2 commits. Most documents and all case studies are **not committed** |

## 2. Review flow (read in this order)

About three hours for all of it; steps 1 to 4 (about 75 minutes) give the decisions.

| Step | Read | Time | What to check, and decide |
|---|---|---|---|
| 1 | **This guide** | 5 min | The status table above |
| 1a | [phase-1-demo.md](phase-1-demo.md) | 30 min | The Phase 1 demo walk-through for newcomers: scope, Phase 0 and Phase 1, every field, examples for all 11 types, test results with what they do and do not show, and the open ownership questions |
| 2 | [phase-1-changes-explained.md](phase-1-changes-explained.md) | 25 min | The five schema changes and why. **Decide:** accept C1, C2, C3, C4, C7 into 0.1 |
| 3 | [reviews/field-review-production-set.md](reviews/field-review-production-set.md) | 20 min | The evidence: all 98 fields against 22 manifests, and the six problems not yet fixed. **Decide:** how to handle C5, C6, and what to send Mission 3 (C8) |
| 4 | [reviews/phase-1-sample-review.md](reviews/phase-1-sample-review.md) | 15 min | Why these 16 capabilities replace the research's 16. **Decide:** accept the production reference set and the six criteria |
| 3a | [phase-1-testing/README.md](phase-1-testing/README.md), then [field-by-field-review.md](phase-1-testing/field-by-field-review.md) | 30 min | The 2026-11-16 testing of every field against 22 capabilities and five journeys (T1-T11), and the verdict per field. **Decide:** accept the evidence and the verdicts |
| 3c | [phase-1-testing/c9-source-and-publications.md](phase-1-testing/c9-source-and-publications.md) | 10 min | Why `source` and `publications` both stay, tested on all 22, and the five rules. Critical for every mission |
| 3d | [phase-1-testing/ai-catalog-interoperability.md](phase-1-testing/ai-catalog-interoperability.md) | 15 min | The AI Catalog test (U7) on all 22 and two live catalogs. **Decide:** the hybrid projection |
| 3f | [phase-1-testing/field-overlap-review.md](phase-1-testing/field-overlap-review.md) | 10 min | Which fields repeated another: the capability-wide host list and `intendedAudience` removed, `runtime[].detail` narrowed, and why every other field stays (C14 to C16) |
| 3e | [phase-1-testing/abilities-vocabulary-analysis.md](phase-1-testing/abilities-vocabulary-analysis.md) | 15 min | Abilities across A2A, MCP, Agent Skills, OASF, AI Catalog, and the 22 (U5). **Decide:** no new field in 0.1; classification in 0.2 |
| 3b | [capability-manifest-standard-v0.1.md](capability-manifest-standard-v0.1.md) | 20 min | The standard to share with the other missions and AI teams. **Decide:** approve it for sharing |
| 4a | [decision-register.md](decision-register.md) | 15 min | Every decision in one list: C1 to C16, U1 to U10, and R1 to R11, each with owner, schema impact, status, and priority. **Record decisions here** |
| 5 | [case-studies/production-set/README.md](../case-studies/production-set/README.md) | 15 min | The 22 manifests, the validation result, what the real data showed. Open 2 or 3 manifests (for example `github-mcp-server`, `pdfplumber`, `caveman/caveman-plugin`) |
| 6 | [case-studies/two-use-cases/README.md](../case-studies/two-use-cases/README.md) | 20 min | How Missions 5, 2, 1, and 3 use the manifest, the validation report, and the exchange document, on MCP Atlassian and PR-Agent |
| 7 | [mission-4-context-and-architecture.md](mission-4-context-and-architecture.md) | 60 min, optional | The full background: Phase 0, what the other missions are building, how they connect. Written 2026-11-11; see §5 for what changed since |

## 3. Reference (current; consult while reviewing)

| File | Use it for |
|---|---|
| [schema/0.1/capability.schema.json](../schema/0.1/capability.schema.json) | The schema itself, as revised on 2026-11-13 |
| [field-dictionary/0.1.md](field-dictionary/0.1.md) | Every field, its requirement level, and allowed values. Generated from the schema on 2026-11-13 |
| [manifest-spec.md](manifest-spec.md) | Rules and conventions (identifiers, lifecycle, versioning, risk). Dated 2026-10-23; still accurate for the rules, see §5 for values |
| [mission-boundaries.md](mission-boundaries.md) | What Mission 4 owns and does not own |
| [case-studies/production-set/manifests/](../case-studies/production-set/manifests/) | The 22 manifests; also the regression corpus for schema changes |
| [case-studies/production-set/outputs/](../case-studies/production-set/outputs/) | A real validation report and exchange document for all 22 |
| [caveman-manifest-test-results.md](caveman-manifest-test-results.md), [skills-and-agents-modelling.md](skills-and-agents-modelling.md) | How a plugin with sub-skills is modelled, and its tests (2026-11-09) |
| [../README.md](../README.md) | How to run the tool |
| [mission-2-standards-guidance-v0.1.md](mission-2-standards-guidance-v0.1.md) | The standard as guidance for Mission 2's catalogue (Skills, MCP servers, agents), with a proposed functional taxonomy |
| [../research/mission-2/model_capabilities.csv](../research/mission-2/model_capabilities.csv) | Mission 2's model-benchmark CSV, analysed in mission-4-context-and-architecture.md §18. Not a manifest input |

## 4. Background (accurate as of their date; read only if needed)

| File | Date | What it is |
|---|---|---|
| [research-explained.md](research-explained.md) | 2026-10-22/23 | The October research, explained for newcomers |
| [spikes-1-3-research.md](spikes-1-3-research.md) | 2026-10-22/23 | The full research report on 60 sampled records |
| [poc-report.md](poc-report.md) | 2026-10-19 to 23 | The proof-of-concept report and acceptance criteria |
| [mission-understanding.md](mission-understanding.md) | 2026-10-22/23 | The long-form understanding of the mission |
| [questions-answered.md](questions-answered.md) | 2026-10-23 | Questions and answers on problem, solution, and mechanics |
| [journey-pilot.md](journey-pilot.md), [../pilot/results.md](../pilot/results.md) | 2026-10-22 | The first pilot on 12 capabilities |
| [../research/spikes-1-3/README.md](../research/spikes-1-3/README.md), [results.md](../research/spikes-1-3/results.md) | 2026-10-22/23 | The research harness and its generated results |
| [reviews/spike-2-report-review.md](reviews/spike-2-report-review.md) | 2026-10-23 | A review of the Spike 2 report (the report itself is not in the repository) |
| [phase-1-plan.md](phase-1-plan.md), [phase-1-spike-briefs.md](phase-1-spike-briefs.md) | 2026-10-23 | The Phase 1 plan and the four tickets. Its outputs (decision records, experiment results) are not in the repository |

## 5. What has changed since the older documents were written

Statements in older documents that are no longer true. The documents were not rewritten, so that
they stay a faithful record of their date.

| Older statement | Where | Now |
|---|---|---|
| "10 capability types" | mission-understanding.md, mission-4-context-and-architecture.md, skills-and-agents-modelling.md | **11**: `library` added (C1) |
| `embeddedComponents[].type` allows only prompt, command, hook, resource, tool, other (gap G1) | mission-4-context-and-architecture.md, skills-and-agents-modelling.md, questions-answered.md | `skill` and `agent` added (C2). G1 is marked resolved in the first two |
| Cost models: free, included, subscription, usage_based, chargeback, other | questions-answered.md | `provider_billed` added (C4) |
| `platformCompatibility` holds any kebab-case token (`python`, `linux`, `gitlab`) | Older documents, the field review, the Mission 2 standards draft | Since 2026-11-16 only AI hosts from a controlled list, stated **only per publication** (`publications[].platformCompatibility`; the capability-wide list was removed as a repetition); connected systems and frameworks go in `integrations`; languages and operating systems stay in `runtime` and `limitations` (C5, C12, C14) |
| `intendedAudience` is an optional field; a capability-wide `platformCompatibility` | mission-boundaries.md, mission-understanding.md, poc-report.md, questions-answered.md, research-explained.md, spikes-1-3-research.md, the field review, the Mission 2 guidance (before 2026-11-16) | Removed (C15): every value restated another field. Use `supportedUseCases`, or `x-intendedAudience` |
| `runtime[].detail` may give the install command or the image | Older manifests and examples | It states requirements only (`Node.js >=18`); `RUNTIME_REPEATS_PUBLICATION` warns (C16) |
| `vs-code` is a host value | Mission 2 guidance (before 2026-11-16), earlier drafts of this standard | Hosts are named by agent; use `github-copilot` |
| Caveman skill publications are `unversioned` | caveman-manifest-test-results.md, field review | Since 2026-11-16 they state `nativeVersion: main`, `versionScheme: floating` (C9) |
| Interface types without `ci_action`; `setup` without `kind` | questions-answered.md, manifest-spec.md | Both added (C3, C7) |
| `npm test`: 206 of 206 pass | poc-report.md | That was on macOS. Since 2026-11-16: 226 tests, 225 pass on Windows (one test-side issue) |
| `dependencies: []` means "needs nothing" | field review, phase-1-changes-explained.md | Since 2026-11-16 it means "needs no other registered capability"; external needs are in `setup`, `runtime`, `integrations` (C6) |
| C5 and C6 "not applied, breaking" | phase-1-changes-explained.md, field review | C5 applied (breaking) and C6 resolved by clarification on 2026-11-16 |
| The Caveman manifests are in `case-studies/caveman/` | Older copies of links | Moved to `case-studies/production-set/manifests/caveman/`; the test scripts stay in `case-studies/caveman/`. Links were updated |
| The two use-case manifests are in `case-studies/two-use-cases/manifests/` | Earlier on 2026-11-13 | Moved to `case-studies/production-set/manifests/` |
| Examples use fictional capabilities | README.md, poc-report.md | Still true for `examples/`. The 22 real manifests are in the production set |

## 6. Needs attention before it is shared

| File | Issue |
|---|---|
| [ai-capability-ecosystem-business-workflows.md](ai-capability-ecosystem-business-workflows.md) | Several claims have no source in this folder: the full mission names, the six-step Mission 5 lifecycle described as "explicitly defined", Mission 2's gap and opportunity analysis, Mission 3's escalation and controls, and four actor names. They may come from documents outside the repository; mark them or confirm them first |
| [mission-2-standards-guidance-v0.1.md](mission-2-standards-guidance-v0.1.md) | The guidance for Mission 2 (the draft attached on 2026-11-16, moved here from the repository root). §4.3 says a configuration-only wrapper is a separate entry; §6 says it is a publication of the original. Decide (U4) before sending |
| Uncommitted work | Everything since the second commit is uncommitted: the Phase 1 documents, the case studies, the field testing, and the schema, code, and test changes. Commit before sharing |
