# Mission 4: AI Capability Intelligence & Standards: Mission Understanding

| | |
|---|---|
| Compiled | 2026-10-22; updated 2026-10-23 for the Spikes 1-3 research and the revision of schema 0.1 that applies it |
| Sources | Mission 4 charter and Spike 1-4 documents (2026-10-16); POC report, rules, and field dictionary (2026-10-19, revised 2026-10-20, 2026-10-22, and 2026-10-23); boundary review (2026-10-20, updated 2026-10-23); journey pilot, iteration 1 (2026-10-22); Spikes 1-3 research (2026-10-22, addendum 2026-10-23). Full map in [§18](#18-recommended-reading-and-reference-map). |
| Purpose | A durable reference for onboarding, research, technical discussion, and decision-making |
| Handling | Derived from documents marked "Confidential – Authorized Use Only". Handle this file the same way. |

This document explains Mission 4: why it exists, what it owns, what has been learned so far, and
what is still open. **It does not decide the open questions.** Where the proof of concept or the
journey pilot made a choice so that it could be tested, the choice is reported as a proposal, next
to the alternatives that the sources suggest.

## How to read this document

Statements carry a label that says where they come from and how firm they are.

| Label | Meaning |
|---|---|
| **[Charter §n]** | Stated in the Mission 4 charter, section n. If the charter calls the point "proposed" or "subject to Phase 0", that status is kept. |
| **[Spike n]** | Stated in a spike document. The spike documents contain objectives, research areas, tasks, and deliverables only, with no findings. |
| **[Boundaries]** | From the published "Boundaries for each team" (Missions 1-5). The original text is not in the repository; it is quoted and summarised in `docs/mission-boundaries.md`. |
| **[Team decision]** | A decision by the Mission 4 team, with its date. |
| **[POC proposal]** | Implemented by the proof of concept so that it can be evaluated. It is not confirmed. Decision rows D1-D26 are in `docs/poc-report.md` §3. |
| **[Pilot evidence]** | Measured by the journey pilot, iteration 1: 12 public capabilities, 2026-10-22. |
| **[Pilot proposal]** | Suggested by the journey pilot. Not decided; most were applied to the POC on 2026-10-23 as POC proposals (§14.4). |
| **[Research §n]** | From the Spikes 1-3 research report (`spikes-1-3-research.md`), section n: four journeys measured on 60 public capability records in seven formats. Its proposals were applied to the 0.1 draft on 2026-10-23 as POC proposals. |
| **[Open]** | Unresolved. |
| **[Observation]** | This document's own reading of the sources. It is not stated in any source; check it before relying on it. |

Suggested reading paths:
- **New to the mission:** §1, §3, §4, §12.
- **Working on a spike:** §5, §6, §7, §13, §14.
- **Preparing a decision:** §8, §9, §14, §15.

## Contents

1. [Executive summary](#1-executive-summary)
2. [Background and context](#2-background-and-context)
3. [Mission scope and boundaries](#3-mission-scope-and-boundaries)
4. [Core concepts and terminology](#4-core-concepts-and-terminology)
5. [Understanding the problem](#5-understanding-the-problem)
6. [Existing research and findings](#6-existing-research-and-findings)
7. [Technical landscape and existing standards](#7-technical-landscape-and-existing-standards)
8. [Potential approaches and trade-offs](#8-potential-approaches-and-trade-offs)
9. [Requirements and constraints](#9-requirements-and-constraints)
10. [Edge cases and failure scenarios](#10-edge-cases-and-failure-scenarios)
11. [Stakeholders and integration points](#11-stakeholders-and-integration-points)
12. [Current state and work completed](#12-current-state-and-work-completed)
13. [Research spikes and investigation plan](#13-research-spikes-and-investigation-plan)
14. [Open questions and decision log](#14-open-questions-and-decision-log)
15. [Risks and feasibility](#15-risks-and-feasibility)
16. [Milestones and next steps](#16-milestones-and-next-steps)
17. [Definition of success](#17-definition-of-success)
18. [Recommended reading and reference map](#18-recommended-reading-and-reference-map)
- [Appendix A. Acronyms](#appendix-a-acronyms)

---

## 1. Executive summary

**What the mission is about.** Mission 4 is one of five missions in a larger initiative. Its core
ownership is the **common data model and interoperability** for AI capabilities. Its goal, in the
charter's words, is to "establish a common, machine-readable standard to describe, identify,
version, and validate AI capabilities so multiple consumers can use them consistently without
custom mappings" [Charter TL;DR]. An *AI capability* is an independently adoptable AI-related
asset: a skill, an agent, an MCP (Model Context Protocol) server, a tool, a plugin, an application,
a service, or a workflow [Charter §2].

**Why it exists, and the problem it addresses.** Capabilities are described in whatever shape
their own ecosystem uses. Several other missions need to work with the same capabilities: to
catalogue them, recommend them, assess their risk, and accept contributions. Without a shared
description, each of these consumers needs its own mapping for each kind of capability. The same
fact can then be read differently by different consumers. The most important example is whether
a capability has been risk-assessed: missing or unassessed risk must never be read as low risk or
as approval [Charter §6].

**What it produces.** The charter's key deliverables [Charter TL;DR]:
- the **AI Capability Manifest v0.1**, a standardized metadata model;
- a **schema and validator**: YAML manifests and a JSON Schema, both proposed;
- **identifier and versioning rules**;
- **risk semantics**;
- a **proof of concept** that validates five representative capabilities across at least four
  types and demonstrates downstream consumption.

**What success looks like.** "A documented Manifest v0.1, clear metadata and versioning rules,
working validation, and downstream consumption without capability-specific field mappings"
[Charter TL;DR]. The detailed acceptance criteria are in §17.

**How it fits the larger initiative.** Mission 4 owns the **structure and rules** for representing
capabilities. In the words of the boundaries: "The Landscape team owns the inventory's content;
this team owns the structure and rules used to represent that content" [Boundaries]. The other
missions own recommendations (Mission 1), the inventory (Mission 2), trust and governance
(Mission 3), and the contribution workflow (Mission 5). The repository's sources do not state the
umbrella initiative's name or overall goal.

**Where things stand on 2026-10-22.**
- The charter and the four spike charters exist, all dated 2026-10-16. **None of the spikes has
  recorded findings.**
- A proof of concept (POC) implements:
  - a draft schema 0.1;
  - a two-stage validator;
  - compatibility checkers;
  - two inter-team contracts.

  It fills every question the charter leaves open with a labelled, reversible proposal
  (decision rows D1-D22), not a conclusion. Its 157 automated tests pass (re-run 2026-10-22).
- A journey pilot tested the draft against four discovery and reuse journeys on 12 randomly sampled
  public capabilities. A shared core of metadata exists. What discovery needs most, structured use
  cases, exists in none of the sampled sources, and 4 of 12 automatically drafted manifests were
  valid.
- **Not yet done:** tests with real internal capabilities; integration with a real downstream
  consumer; and the cross-mission vocabulary decisions (risk tiers, maturity levels).

**Update 2026-10-23.**
- The Spikes 1-3 research ran four journeys on 60 public capability records in seven formats, plus
  36 A2A Agent Cards [Research §1]. Against the 0.1 draft of 2026-10-22, 12 of 60 drafted manifests
  were valid, 45 failing on `lifecycleStatus` [Research §7.6].
- At the team.s direction, its proposals were applied to the unpublished 0.1 draft as POC
  proposals [POC proposal D3, D23-D26]:
  - six mandatory fields, and completeness levels reported by the validator;
  - publications, relations, and provenance per value;
  - license, runtime, setup, documentation, and keywords.
- On the same records, the revised validator accepts 58 of 60 drafts. Through its duplicate checks
  alone, it links all 14 judged same-capability pairs with no false link. Its completeness levels
  agree with the research's measurement for 56 of 60 [Research §16].
- 206 automated tests pass. None of this is a spike conclusion.

---

## 2. Background and context

### 2.1 The problem space

AI capabilities come from several ecosystems, and each has its own **native metadata**: the
description an ecosystem already keeps about its own artifacts. Three examples were sampled in the
journey pilot [Pilot evidence]:

| Ecosystem | Native metadata | Facts it recorded in the sample |
|---|---|---|
| Agent Skills | Front matter of a `SKILL.md` file (a YAML header at the top of a Markdown file) | Name, description, and usually a license |
| MCP Registry | A `server.json` entry | Name in reverse-DNS form (for example `io.github.owner/name`), version, status, repository, packages, transports, environment variables |
| npm (the JavaScript package registry) | `package.json` | Name, version, description, keywords, license, repository, maintainers |

Each format answers a different subset of the questions that consumers ask. No format states
everything, and none states the facts that governance supplies. The Spikes 1-3 research found the
same in seven formats (the MCP Registry, npm, Agent Skills, Claude Code plugins, the Docker MCP
catalog, PyPI, and GitHub Actions) and in 36 A2A Agent Cards [Research §5].

### 2.2 Current challenges and inconsistencies

The sources give evidence of these inconsistencies. All come from public capabilities, which stand
in for internal ones (see the caveat below the table).

| Challenge | Evidence | Source |
|---|---|---|
| The kind of capability is never declared | Capability type was inferred from the format for 12 of 12 | Pilot results §2 |
| Status is rarely recorded | Lifecycle status was present only in the 4 MCP Registry entries | Pilot results §2 |
| Versions are missing for some types | Skills had no version (0 of 4) | Pilot results §2 |
| Ownership must be inferred | For skills and MCP servers (8 of 12), the owner and contact came from the repository owner and its issue tracker | Journey pilot §3.1 |
| The same fact appears in different forms | Skill licenses point to a file; npm licenses are standard identifiers | Journey pilot §3.7 |
| One capability is published in several places | 3 of 4 npm samples are MCP servers, and MCP Registry entries point to their npm packages | Journey pilot §3.6 |
| Naming conventions differ | Reverse-DNS names with uppercase letters (MCP); scoped and unscoped package names (npm) | Journey pilot §3.6 |
| What consumers need most is absent at the source | No structured use cases, maturity, audience, limitations, cost, or capability dependencies in any sample (0 of 12 each) | Pilot results §2 |
| Risk is never in native metadata | 0 of 12, by design: risk comes from governance | Pilot results §2 |

On 60 records in seven formats, the Spikes 1-3 research measured the same pattern: setup is stated
for 13, limitations for none, risk for none, and lifecycle natively for 17, almost all of them MCP
Registry entries [Research §1.2].

**Caveat.** The sources do not document how capabilities are described *inside* the organization
today: which internal formats, registries, or catalogues exist, and which consumers already map
them. The problem statement follows from the charter's goals ("without custom mappings") and from
public evidence, not from a documented internal baseline [Observation]. See Q30 in §14.

### 2.3 Why the problem matters

The charter's principles show what is at stake:
- **Several consumers, one set of facts.** The manifest should let multiple consumers "exchange
  capability information without bespoke mappings" [Charter §11].
- **Risk can be misread.** The charter states that missing or unassessed risk must not be
  interpreted as low risk or approval, and that passing schema validation does not mean a
  capability is safe or approved [Charter §6]. The POC showed how easily this can go wrong. A
  manifest with a duplicated key, `riskTier: high` followed by `riskTier: low`, is read silently
  as `low` by a common Python YAML parser (`docs/poc-report.md` §7.4).
- **Identity breaks when sources move.** "A repository URL is a source reference and is not
  automatically a permanent capability identifier" [Charter §5]. Repositories move and are renamed,
  and one repository can hold several capabilities.
- **Validity is not truth.** "A structurally valid manifest does not establish that a source is
  reachable, a dependency is available, or a capability is secure or approved for production"
  [Charter §3].

### 2.4 Limitations of the current approach

Neither source describes the current internal approach in detail. The POC report summarises the
problem as: "Teams describe AI capabilities in different shapes, so every consumer (inventory,
recommendation, risk, contribution workflow) needs bespoke field mappings" (`docs/poc-report.md`
§1). This is the POC's restatement of the charter's goal, not an audit of existing systems.

### 2.5 Consequences of leaving the problem unresolved

The charter's objectives imply these consequences; none has been measured [Observation]:
- each consumer builds and maintains its own mapping, and the number of mappings grows with every
  new capability type and every new consumer;
- different consumers interpret risk, lifecycle, and ownership differently;
- references between capabilities break when a source moves;
- duplicate registrations of the same capability go unnoticed;
- the description format cannot evolve safely, because there are no rules for breaking and
  non-breaking change.

### 2.6 Organizational context

The five missions, as far as they matter to Mission 4 [Boundaries, via `docs/mission-boundaries.md`]:

| Mission | Name used in the sources | Relationship to Mission 4 |
|---|---|---|
| 1 | Recommendation | Consumes capability metadata to match, rank, and explain recommendations |
| 2 | Landscape | Owns the capability inventory's content and its radar; catalogues capabilities, tools, frameworks, and platforms |
| 3 | Trust | Owns risk classifications, assessment criteria, and lifecycle expectations (the Trust Framework) |
| **4** | **AI Capability Intelligence & Standards** | **Owns the structure and rules: the common data model and interoperability** |
| 5 | Contribution | Owns contributor engagement and the end-to-end submission process |

### 2.7 Technical context

- No code existed before the POC. Node.js 22 was chosen because it was the only healthy runtime in
  the working environment [POC proposal D17].
- The project folder is **not under version control**, and **no continuous integration (CI)** is
  configured (`docs/poc-report.md` §9). As a result, the draft of schema 0.1 from before 2026-10-20
  was not kept. The draft of 2026-10-22 is kept in `research/spikes-1-3/reference/`.
- Internal capability metadata was not reachable from the working environment. Six of the eight
  example manifests are therefore fictional (domains such as `example-org` and `.example`); since
  2026-10-23, two describe public capabilities from the research snapshot. The pilot and the
  research used public sources.

---

## 3. Mission scope and boundaries

### 3.1 Core responsibilities

The charter says that Mission 4 owns "the metadata standard, identifier conventions, versioning
rules, and validation contract" [Charter §9]. The published boundaries list these in-scope items
[Boundaries]:
- define the canonical capability manifest and schema;
- establish mandatory fields, metadata conventions, identifiers, and versioning;
- standardize capability descriptions, supported use cases, maturity, and integration metadata;
- define machine-readable contracts for exchanging information between teams;
- validate the schema's completeness, consistency, and compatibility;
- evolve the schema as new requirements emerge.

The boundaries also state a **first-cycle deliverable** ("Manifest v0.1 applied to five
capabilities") and a **success measure** ("consistent representation across sources, consumption
without bespoke transformations").

### 3.2 Expected outputs

| Output | Defined in | Notes |
|---|---|---|
| AI Capability Manifest v0.1 and its field documentation | Charter TL;DR, §3, §10 | Field definitions, requirements, and examples |
| `capability.schema.json`, the machine-readable validation contract | Charter §3 | JSON Schema Draft 2020-12 is proposed, to be confirmed in Phase 0 |
| YAML manifest format | Charter §3 | Proposed authoring format, to be confirmed in Phase 0 |
| Validator with actionable feedback, in two stages | Charter §1, §3 | Separates errors, warnings, and unverified checks |
| Identifier, lifecycle, versioning, and compatibility rules | Charter §5-§7, §10 | |
| Risk semantics | Charter §6 | Unassessed is never low or approved |
| Sample manifests: five representative capabilities, at least four types, internal and external where available | Charter §10; Spike 4 | |
| A demonstrated downstream consumer, and a second consumer or integration path evaluated | Charter §8, §10 | |
| Documented limitations, unresolved decisions, and future enhancements | Charter §10 | |
| Four spike research documents | Spikes 1-4 | Deliverables listed in §13 |

### 3.3 Responsibilities owned elsewhere

Mission 4 "does not own the capability inventory, recommendation algorithm, governance approvals,
contribution lifecycle, catalog website, automated indexer, or runtime execution platform"
[Charter §9].

| Responsibility | Owner | Mission 4's interface with it |
|---|---|---|
| Discovering and maintaining the inventory; its content | Mission 2 | The manifest structure carries the content; Mission 2 provides real capabilities |
| Recommendation algorithms | Mission 1 | Mission 1 confirms which fields it needs to judge fit and constraints |
| Governance decisions, approvals, risk classifications, lifecycle expectations | Mission 3 and the designated governance owners | Mission 4 owns the risk *fields* and their integrity rules; Mission 3 owns the vocabulary and the assessments |
| Contributor engagement and the submission process | Mission 5 | The validator and its report plug into the workflow's validation step |
| Catalog website, automated indexer, runtime execution platform | Not named in the sources | Outside Mission 4. The sources do not say who owns them [Open] |

### 3.4 Structure versus content

The boundary review proposes this division (`docs/mission-boundaries.md` §4). It is a review
document, and parts of it need confirmation by the missions named.

| Element | Mission 4 owns | The values or vocabulary are owned by |
|---|---|---|
| Schema, field names, requiredness, conventions, versioning rules | All of it | Mission 4 |
| Capability content (description, use cases, limitations, owner, source) | The fields and their rules | Capability owners, submitting through Mission 5; Mission 2 as the inventory owner |
| `capabilityType` vocabulary | The vocabulary | Mission 4, agreed with Mission 2 |
| `lifecycleStatus` | The data element and its transition integrity rules | Values: capability owners. Expectations (approval, monitoring, reassessment, retirement): Mission 3 |
| `maturity` | The field and proposed level definitions | Definitions agreed with Mission 2; values assigned by Mission 2 |
| `riskTier`, `assessmentReference` | The fields, and the rules that an assessed tier cites an assessment and that unassessed is never low | Vocabulary and assessments: Mission 3 and the designated owners |
| Completeness levels (since 2026-10-23) | The levels, their facts, and how the validator reports them | Which level a process requires: its owner, for example Mission 5's workflow or Mission 2's inventory |
| `publications`, `relations`, `provenance` (since 2026-10-23) | The fields and their integrity checks | Content: capability owners and curators, through Mission 5. Whether two entries are one capability for the inventory: Mission 2 |
| `license` (since 2026-10-23) | The fields, and the rule that terms in prose need reading | Whether a license permits a use: the legal and governance owners |
| Identifier conventions | Format, uniqueness, and stability rules | Assignment and namespaces coordinated with Missions 5 and 2 [Charter §5] |
| Validation-report and exchange-document contracts | All of it | Consumed by Mission 5 (report); filled with Mission 2's content and consumed by Missions 1 and 3 (exchange) |

### 3.5 Coordination the charter requires

The charter limits coordination to four points [Charter §9]:

| Coordination point | With | Purpose |
|---|---|---|
| Recommendation requirements | Mission 1 | Confirm the fields needed to assess capability fit and constraints |
| Inventory requirements | Mission 2 | Align the manifest with inventory metadata needs and representative examples |
| Risk metadata | Mission 3 and the governance owners | Align risk terminology and assessment references |
| Contribution workflow | Mission 5 | Make sure the manifest and validator fit the contribution process |

### 3.6 Overlaps, ambiguities, and unresolved boundaries

| Area | Ambiguity | Current handling | Status |
|---|---|---|---|
| Lifecycle | Mission 4 defines lifecycle as a data element, and Mission 3 defines lifecycle *expectations*. A transition rule such as "an active capability is deprecated before it is retired" sits on the line between them | The transition table is a POC proposal that needs Mission 3's confirmation (D21) | [Open] |
| Maturity | The boundaries put "standardize ... maturity" in Mission 4's scope; Mission 2 tracks maturity | Mission 4 proposes the field and level definitions; Mission 2 agrees them and assigns the values (D15) | [Open] |
| Duplicates | Mission 4 checks identifier integrity; Mission 2 analyses functional duplication across the landscape | The validator flags the same id, the same source (by URL or, since 2026-10-23, by the forge's repository id), or the same publication under two ids; not "similar" capabilities | Handled in the POC; needs agreement |
| Identifier assignment | Mission 4 defines the conventions; it is not settled who allocates namespaces and when ids are assigned | Coordinated with Missions 5 and 2 [Charter §5] | [Open] |
| Crosswalks and extraction | Mapping native formats onto the manifest is treated as interoperability work (Mission 4's). An "automated indexer" is not Mission 4's, and "automated metadata extraction" is a future enhancement [Charter §9, §11] | The pilot's and the research's crosswalks draft manifests from snapshots only; extraction at scale is not done | Where a crosswalk ends and an indexer begins is [Open] |
| Authoring and contribution guidance | How to write a manifest (Mission 4) versus how to submit one (Mission 5) | The README covers the format only | Handled; needs agreement |
| Exchange and inventory | An exchange document holds many manifests, which can look like an inventory | `export` passes manifests through unchanged, with no rankings or approvals; the earlier `catalog` command was removed for this reason | Handled in the POC |
| Assessment metadata | Mission 3 needs data handling, access controls, and model use, but defines the criteria itself | Deliberately not in the schema until the Trust Framework states its needs | [Open] |
| Whose journeys | The pilot's journeys were written by Mission 4, but the journeys belong to other missions' users | Iteration 2 proposes journeys from Missions 1 and 2 | [Open] |

---

## 4. Core concepts and terminology

### 4.1 The mental model

This diagram shows how the POC connects the concepts. It describes the current POC shape, which
is one option among those in §8, not a mandated architecture.

```text
 Native metadata                          Capability owner or curator
 (SKILL.md, server.json, package.json,    (fills in what no native source states)
  A2A Agent Card, ...)                                 |
        |  crosswalk (pilot and research)              |  authoring
        v                                              v
 +-----------------------------------------------------------------+
 |  Capability manifest: one YAML file per capability               |
 |  identity - description - type - source and publications -       |
 |  owner - lifecycle - risk - versions - interfaces (references    |
 |  to native contracts) - provenance per value                     |
 +-----------------------------------------------------------------+
        |  declares schemaVersion, which selects
        v
 Schema (JSON Schema) = the validation contract
        |
 Validator: Stage 1 structural  ->  Stage 2 consistency (across manifests)  ->  completeness level
        |  findings: error | warning | unverified
        +---------------------------------+
        v                                 v
 Validation report (JSON contract)   Capability Exchange Document (JSON contract)
 -> contribution workflow (Mission 5) -> inventory (Mission 2), recommendation (Mission 1),
                                         trust (Mission 3)
```

### 4.2 Concepts

#### AI capability and granularity

- **Definition.** "An independently adoptable AI-related asset, tool, service, or solution that can
  be described and managed as a distinct unit" [Charter §2].
- **Granularity rules** [Charter §2]:
  - independently managed, reusable assets may have their own manifests;
  - parts that are not independent are represented inside a parent;
  - independently adoptable components may have separate manifests linked to their parent;
  - documentation (READMEs, wikis) is a metadata *source*, not a capability.
- **Why it matters.** Granularity decides what gets an identifier, what gets validated, and what a
  consumer can count, recommend, or assess.
- **In the POC** [POC proposal D7]:
  - independently adoptable children have their own manifest and are listed in the parent's
    `components`, and each child points back with `parent`;
  - prompts, commands, hooks, and resources are described inline as `embeddedComponents`.

  For example, the fictional `sre/sre-toolkit` plugin lists the independently adoptable
  `sre/runbook-search` tool as a component. Its postmortem prompt, triage command, and pre-deploy
  hook are embedded components.
- **Still ambiguous.** The charter allows prompts, commands, hooks, and resources to be "components
  or separate capability types where justified" [Charter §2]. Which one applies is open (Q5).

#### Capability type

- **Definition.** A classification of the capability. The charter lists eight types: `skill`,
  `agent`, `mcp_server`, `plugin`, `tool`, `application`, `service`, `workflow` [Charter §2]. The
  POC adds `framework` and `platform`, because Mission 2 catalogues frameworks and platforms
  [POC proposal D22].
- **Why it matters.** Consumers filter and reason by type, and some requirements may vary by type.
  The charter asks Phase 0 to establish "how metadata requirements vary by capability type"
  [Charter §4].
- **In the POC.** Only one type-specific rule exists: an `mcp_server` must declare an `mcp`
  interface. The charter also notes that "support for every platform or capability type is not
  assumed" [Charter §2].

#### Manifest

- **Definition.** A human-readable metadata document that describes one capability. The proposed
  format is YAML [Charter §3].
- **What it is not.** It is "a metadata and description contract, not a runtime execution
  protocol", and "manifest compatibility does not imply that a capability can be remotely
  executed" [Charter §8].

#### Schema, or validation contract

- **Definition.** A machine-readable definition of what a valid manifest looks like: its fields,
  types, allowed values, and conditional rules. JSON Schema Draft 2020-12 is proposed
  [Charter §3]. JSON Schema is a vocabulary for describing and validating the structure of JSON
  data; YAML manifests are validated after they are parsed into the same data model.
- **In the POC.** The schema is the single source of truth: the validator's hints, the lifecycle
  transitions, the completeness levels (since 2026-10-23), and the field dictionary are all read
  from it.

#### Requirement levels and missing data

- **Requirement levels.** A field is *mandatory* (always required), *conditional* (required only
  when a stated condition holds), or *optional*. The charter lists **ten mandatory-field
  candidates**: `id`, `name`, `description`, `capabilityType`, `source`, `owner`, `schemaVersion`,
  `lifecycleStatus`, `riskTier`, `lastUpdated`. These are "subject to Phase 0 validation"
  [Charter §4].
- **Missing data semantics.** Missing data semantics are the rules for telling apart "not
  provided", "unknown", "not applicable", and "explicitly none". Phase 0 must establish them
  [Charter §4].
- **In the POC** [POC proposal D5]:
  - an omitted optional field means "not provided";
  - `null` is never allowed;
  - an empty list means "declared none";
  - unknown risk is the explicit value `unassessed`.
- **Since 2026-10-23** [POC proposal D3, D23, D25; Research §11.3, §9.4]:
  - six of the ten candidates are mandatory: `schemaVersion`, `id`, `name`, `capabilityType`,
    `source`, `riskTier`;
  - above them, the validator reports a *completeness level* (discoverable, assessable, adoptable,
    governed) and what the next level needs; a level is enforced only on request;
  - `provenance[]` records per value whether it is stated, linked, derived, or declared, and
    Stage 2 reports unconfirmed, conflicting, and claimed values.

#### Identity: identifier, name, source, namespace

| Concept | Definition | Rule or status |
|---|---|---|
| Identifier (`id`) | The stable, unique key of a capability | "Every independently managed capability must have a stable, unique identifier" [Charter §5] |
| Display name (`name`) | The human-readable label | Not unique and not an identifier [POC proposal] |
| Source (`source`) | Where the capability is maintained or obtained: a repository, registry entry, provider, or other reference | "A repository URL is a source reference and is not automatically a permanent capability identifier" [Charter §5]. Since 2026-10-23 it can carry the forge's repository id, which survives renames [POC proposal D24] |
| Publication (`publications[]`, since 2026-10-23) | A channel that distributes the capability: a registry entry, package, container image, marketplace entry, or hosted endpoint, each with its native name, version, and status | POC proposal D24 [Research §7.3] |
| Relation (`relations[]`, since 2026-10-23) | A link to another capability: same as, fork of, wraps, derived from, or distinct from | POC proposal D24. A relation that is only claimed is reported as unverified |
| Namespace | The first part of a namespaced id, for example `ai-platform` in `ai-platform/sql-review` | POC proposal (D8). Who allocates namespaces is [Open] |

The candidate identifier formats are readable namespaced ids and URN-style ids. A URN (Uniform
Resource Name) is a persistent, location-independent name such as `urn:<namespace-id>:<name>`.
The final format "will be decided after Phase 0 evaluation" [Charter §5].

#### Lifecycle, maturity, risk, and approval: four separate axes

The charter insists that "lifecycle, risk classification, and approval status are separate
concepts" [Charter §6]. The POC adds maturity as a fourth axis, separate from lifecycle, because
Mission 2 tracks maturity separately from availability (D15).

| Axis | Field | Question it answers | Values and their status | Who sets the values |
|---|---|---|---|---|
| Lifecycle | `lifecycleStatus` | Is it available, and should adopters keep using it? | `experimental`, `active`, `deprecated`, `retired` ("proposed for evaluation" [Charter §6]). Optional since 2026-10-23; the statuses channels report are recorded per publication and for the source (D9) | Capability owners; expectations by Mission 3 |
| Maturity | `maturity` (optional) | How much real-world use backs it? | `prototype`, `pilot`, `production` [POC proposal] | Mission 2; the definitions are still to be agreed |
| Risk | `riskTier`, plus `assessmentReference` | Has it been assessed, and with what result? | `unassessed`, `low`, `medium`, `high` (the tier names are placeholders) | Mission 3 and the designated owners |
| Approval | None: the manifest has no approval field | May it be used for a given purpose? | Not represented [POC proposal] | Governance and consuming processes [Charter §6] |

Lifecycle transitions [POC proposal D9; to confirm with Spike 3 and Mission 3]:

| From | Allowed next states |
|---|---|
| `experimental` | `active`, `deprecated`, `retired` |
| `active` | `deprecated` |
| `deprecated` | `active` (reinstated), `retired` |
| `retired` | none (terminal) |

#### Versions: schemaVersion and capabilityVersion

- **`schemaVersion`** is the version of the metadata contract. **`capabilityVersion`** is the
  version of the capability itself. The charter requires the manifest to distinguish them
  [Charter §7].
- **Semantic Versioning (SemVer)** is the versioning scheme under evaluation, "or an appropriate
  alternative" [Charter §7]. A SemVer version has the form MAJOR.MINOR.PATCH, and the MAJOR number
  increases for incompatible changes.
- **In the POC** [POC proposals D10, D11]:
  - `schemaVersion` is a quoted `"MAJOR.MINOR"` string, currently `"0.1"`;
  - `capabilityVersion` follows SemVer 2.0.0 and, since 2026-10-23, is optional; native versions in
    other schemes are recorded per publication, with their scheme (D11);
  - a revision checker (`compat`) derives the required version bump from what changed;
  - a schema checker (`schema-compat`) classifies the changes between two schema versions.

#### Interfaces and references to native contracts

- **Definition.** An interface describes how consumers use a capability: through MCP, A2A, an
  OpenAPI document, an Agent Skill, a command-line interface, a library, or a user interface.
- **Charter guidance.** Where established protocols such as MCP or A2A already address
  interoperability, the solution "should reuse or reference them rather than recreate their
  functionality" [Charter §8].
- **In the POC** [POC proposal D14]. `interfaces[].contractRef` points to the native contract,
  such as an A2A Agent Card. It is required for `a2a` and `openapi` interfaces.

#### Validation stages and severities

| Stage [Charter §3] | What it checks |
|---|---|
| Stage 1, structural | Required fields, data types, allowed values and formats, conditional requirements, manifest structure, schema compatibility |
| Stage 2, consistency | Duplicate or conflicting identifiers, referenced dependency identifiers, source reachability where technically feasible, other cross-field rules |

| Severity [Charter §3] | Meaning in the POC |
|---|---|
| error | The manifest violates the contract and is invalid |
| warning | The manifest is valid, but something is likely wrong or risky |
| unverified | A check this run could not confirm: it has **neither passed nor failed** |

The *unverified* severity is what keeps "not checked" from being read as "passed". For example, an
`unassessed` risk tier is reported as unverified, never as passed.

Since 2026-10-23 the POC also reports the **completeness level** that each structurally valid
manifest reaches. It becomes an error only when a caller requires a level (D23).

#### Consumers, mappings, and contracts

- **Downstream consumer.** Any system or team that reads manifests: inventory, recommendation,
  risk assessment, or the contribution workflow.
- **"Without capability-specific field mappings."** A consumer should read the same fields in the
  same way for every capability type, with no per-type or per-source translation [Charter §1, §8].
- **In the POC:**
  - the **Capability Exchange Document** carries valid manifests unchanged, with their caveats, to
    other teams;
  - the **validation report** is a JSON contract for automation, such as Mission 5's validation
    step.
- **Still ambiguous.** It is unclear whether producer-side mappings, from native formats into the
  manifest, count against this requirement (Q21).

#### Native metadata, crosswalk, and provenance

- **Native metadata.** The description an ecosystem already keeps, for example `SKILL.md` front
  matter (§2.1).
- **Crosswalk.** A mapping from one native format onto the manifest's concepts. The pilot has
  three: Agent Skills, MCP Registry, and npm (`pilot/crosswalk.js`). The Spikes 1-3 research has
  eight (`research/spikes-1-3/crosswalk.js`).
- **Provenance.** Where each drafted value came from [Pilot evidence]:
  - *native*: read from a field;
  - *derived*: inferred from context, such as location, format, or namespace;
  - *default*: only `riskTier: unassessed`, which asserts nothing.
- **Why it matters.** Derived values, such as an owner inferred from a repository's owner, may be
  wrong, so they need confirmation before they are trusted.
- **In the manifest** (since 2026-10-23) [POC proposal D25]. `provenance[]` records, per value, its
  method (native, linked, derived, owner, or curated) and, for a derived value, whether a documented
  convention or a heuristic yields it. The validator reports heuristic values that nobody has
  confirmed.

#### Journeys and answerability

- **Journey.** A user's task, written as the questions the user must answer. The pilot uses four
  journeys (`pilot/journeys.yaml`):
  - find a capability for a need;
  - decide whether it can be reused;
  - check for something similar before building;
  - register a capability with little effort.
- **Answerable.** A question counts as answerable for a capability when the metadata concept that
  answers it has a value. This measures **presence, not correctness or quality**: the pilot did
  not formally judge relevance [Pilot evidence].

#### Extension fields

Top-level fields prefixed with `x-` are accepted without validation and ignored by core consumers.
Any other unknown field is an error, which catches typos such as `lifecyleStatus` [POC proposal
D13]. Since 2026-10-23, an unknown field that carries a native format's name for a manifest field,
such as `tags` or `homepage`, is answered with the field to use.

### 4.3 Terms that need clarification

| Term | Ambiguity | Where it matters |
|---|---|---|
| **Phase 0** | The charter refers to it five times (§3, §4 twice, §5, §7), but nothing defines its timeline, its exit criteria, or how it relates to the spikes. The spike documents never mention it. The spikes appear to be its vehicle, but no source says so [Observation] | All "subject to Phase 0" items (§9.2) |
| **Mandatory** | The charter calls the ten fields "candidates". The pilot proposed completeness levels. Since 2026-10-23 the POC makes six fields mandatory for validity and reports levels above them, so "mandatory" means "needed for a valid manifest", not "needed for every use" | §8.2, Q1-Q3 |
| **Capability-specific field mappings** | Consumer-side only, or also producer-side crosswalks? | Q21 |
| **Evaluated** (second consumer) | What depth of evaluation satisfies the charter is not defined | Q22 |
| **Representative**; **where available** | What makes five capabilities representative, and when internal or external examples count as "available" | §17 |
| **`riskTier`** | The charter defines it as "risk classification **or** assessment state", which puts two concepts in one field. `unassessed` is "subject to agreement on the risk vocabulary" | Q16, §8.7 |
| **`lastUpdated`** | The schema defines it as the date the *manifest metadata* was last updated. The pilot fills drafts from the last commit to `SKILL.md`, the registry's update date, or the npm publish date, which are dates of *capability* changes [Observation, `pilot/crosswalk.js`]. Since 2026-10-23 the schema states that it is the record's date, and records capability dates per publication and for the source; the pilot keeps its iteration-1 usage | Q24 |
| **Maturity versus lifecycle** | The POC treats lifecycle as availability and maturity as evidence of use. Mission 2 has not confirmed this | Q8 |
| **Consistency versus duplication** | Identifier integrity (Mission 4) versus functional duplication (Mission 2) | §3.6 |
| **Inventory, catalogue, landscape, radar** | Used for Mission 2's work; the boundaries between them are not defined in Mission 4's sources | §11 |
| **Owner** | Accountable owner, maintainer, or publisher? The pilot infers the owner from the repository owner. Since 2026-10-23 the schema defines `owner.name` as the owning team, maintaining organization, or verified publisher; the research distinguishes publisher and maintainer [Research §11.2] | Q11, §10 |
| **Internal or external** | The maintainer's affiliation (the POC's definition) or the source's location? | §10 |
| **Component metadata** | Listed among the charter's potential fields without definition [Charter §4] | Q5 |

Acronyms are expanded in [Appendix A](#appendix-a-acronyms).

---

## 5. Understanding the problem

### 5.1 How the problem decomposes

The charter's objectives break down into nine dimensions. Each can be studied on its own, but the
dimensions depend on one another. The decomposition follows the charter's own sections and adds
one dimension that the pilot surfaced (D9).

| # | Dimension | Core question | Charter or spike source |
|---|---|---|---|
| D1 | Definition and granularity | What counts as one capability, and when does a part get its own manifest? | Charter §2; Spike 2 |
| D2 | Information content | What must be said about a capability, and for whom? | Charter §4, §8; Spike 2 |
| D3 | Identity | How is the same capability referred to reliably across moves, renames, repositories, and publication channels? | Charter §5; Spike 3 |
| D4 | Change over time (the capability) | How are lifecycle states and capability versions represented, and which changes are breaking? | Charter §6, §7; Spike 3 |
| D5 | Change over time (the standard) | How does the schema evolve without stranding existing manifests or consumers? | Charter §7; Boundaries; Spike 3 |
| D6 | Trust semantics | How are risk and approval represented so that nobody can misread them? | Charter §6 |
| D7 | Validation | What can be checked automatically, and what does a check prove? | Charter §3; Spike 4 |
| D8 | Interoperability | How does information flow in from native formats, out to consumers, and across implementations? | Charter §8; Spike 1 |
| D9 | Population and provenance | Who supplies each fact, at what cost, and how reliably? | Not covered explicitly by any spike; raised by the pilot [Observation] |

The dimensions depend on one another:

```text
D1 granularity --> D3 identity --> D4/D5 change over time
      |                  \
      v                   v
D2 information <------ D9 population (what can actually be supplied)
      |
      v
D6 trust semantics --> D7 validation --> D8 interoperability (consumers)
```

The reasoning:
- What gets an identifier depends on granularity.
- What can be required depends on what producers can actually supply.
- What a validator can promise depends on the trust semantics.
- What consumers can rely on depends on all of the above.

### 5.2 What information is needed, and how much of it exists

This matrix combines two sources: the consumer needs taken from the published boundaries
(`docs/mission-boundaries.md` §5) and the journey questions and native availability measured by
the pilot (`pilot/results.md` §2-§3). "Available" counts native and derived values together.

| Information | Needed by missions | Journey need | Available (of 12) | Who could supply it |
|---|---|---|---|---|
| Identifier, name, description | 1, 2 | required | 12 | Native or derived |
| Capability type | 1, 2 | required | 12, all derived (never declared) | Derived; confirm |
| Supported use cases | 1, 2 | required (discover, avoid duplication) | **0** (npm keywords, 4 of 12, are the only proxy) | Owner or curator |
| Source location | 2, 3 | required | 12 | Native or derived |
| Owner and contact | 5 | required | 12 (8 derived) | Native or derived; confirm |
| Internal or external | 2, 3 | helpful | 12, all derived | Derived; confirm |
| Last updated | 5 | required (is it maintained?) | 12 (4 derived) | Native or derived; meaning unclear (§4.3) |
| Interfaces and protocols | 1 | required | 12 (8 derived) | Native or derived |
| Version | 5 | required (adopt) | 8 (none for skills) | Native where distributed |
| Lifecycle status | 1, 2, 3 | required | **4** (MCP Registry only) | Owner, or registry status |
| Maturity | 1, 2 | helpful | 0 | Mission 2 |
| Risk tier and assessment record | 1, 3 | required (governance) | 0, by design | Mission 3 |
| Limitations | 1, 2 | helpful | 0 | Owner or curator |
| Capability dependencies | 1, 3 | not used by the pilot's journeys | 0 (npm dependencies are packages, not capabilities) | Owner |
| Platform compatibility | 1 | helpful | 5 | Partly native |
| Cost | 1 | helpful | 0 | Owner |
| Intended audience | 2 | helpful | 0 | Owner or Mission 2 |
| License | Not listed in the boundaries [Observation] | required (adopt) | 7 | Native (npm, skills) |
| Keywords | Not listed | required (as a proxy for use cases) | 4 | Native (npm) |
| Documentation link | Not listed | helpful | 11 | Native or derived |
| Required configuration | Not listed | helpful | 2 | Native (MCP Registry) |
| Data handling, access controls, model use | 3 | not in the journeys | Not measured | Mission 3 defines the criteria first |

Two patterns stand out:
- The information that consumers and journeys need most (use cases, lifecycle, risk) is the least
  available at the source.
- The pilot's journeys and the missions' needs do not cover the same set. Dependencies matter to
  Missions 1 and 3 but to none of the pilot's journeys; license matters to the adoption journey but
  appears in no mission's documented needs [Observation].

### 5.3 Where inconsistencies or gaps can occur

| Between | Example |
|---|---|
| Native formats | Version, lifecycle, license, and owner are present in some formats and absent in others (§2.2) |
| Producers and consumers | A field's meaning differs: `lastUpdated` as a metadata date or a release date (§4.3; the revision of 2026-10-23 defines it as the record's date) |
| Implementations | YAML 1.1 and YAML 1.2 parsers read unquoted dates differently; duplicate keys are rejected by one and silently resolved by another (§6.2, F3) |
| Points in time | A capability moves repository, is deprecated, or changes interface; the schema itself changes |
| Structure owners and content owners | Mission 4 defines a field; another mission must agree its vocabulary (risk tiers, maturity levels) |

### 5.4 What makes the problem difficult

- **The ecosystem is heterogeneous.** Ten capability types and several native formats, each
  describing a different subset of facts.
- **The facts that matter most are not recorded at the source.** Use cases, lifecycle, and risk
  have to come from people or from governance, so curation effort is unavoidable.
- **Ownership is split.** Mission 4 can define a field but cannot decide its vocabulary or fill in
  its content.
- **There is no real internal data yet.** Every structural decision so far was tested on fictional
  examples or public stand-ins.
- **Stability conflicts with openness.** Identifiers and published schema versions must be stable,
  yet most of the underlying decisions are still open.
- **Validation has limits.** A schema can check shape, but not truth. Reachability, availability,
  and risk can only be partly verified, so the validator needs an honest "unverified" outcome.
- **The ecosystem moves.** The native formats are versioned and evolving; the MCP Registry API that
  the pilot used is at `v0.1`, for example [Observation]. Crosswalks and protocol references
  therefore need maintenance.

### 5.5 Constraints and edge cases

Constraints are consolidated in §9 and edge cases in §10.

---

## 6. Existing research and findings

### 6.1 Status of the research inputs

| Input | Status | Findings recorded |
|---|---|---|
| Spike 1: Standards and ecosystem | Charter only (2026-10-16) | **None** |
| Spike 2: Definition and metadata model | Charter only | **None** |
| Spike 3: Identifiers, lifecycle, versioning | Charter only | **None** |
| Spike 4: Validation and proof of concept | Charter only. The POC report presents itself as Spike 4's research document; no record shows it was reviewed or accepted as such | In the POC report |
| Proof of concept (`docs/poc-report.md`) | 2026-10-19, revised 2026-10-20, 2026-10-22, and 2026-10-23 | Yes; most "decisions" in it are proposals |
| Boundary review (`docs/mission-boundaries.md`) | 2026-10-20; updated 2026-10-23 | Yes |
| Journey pilot, iteration 1 (`docs/journey-pilot.md`, `pilot/`) | 2026-10-22 | Yes |
| Spikes 1-3 research (`spikes-1-3-research.md`, `research/spikes-1-3/`) | 2026-10-22; addendum 2026-10-23 | Yes: findings and proposals for Spikes 1-3, not spike conclusions |
| Journey pilot, iteration 2 | Proposed, not started | n/a |

**Caveats that apply to all the findings below:**
- the example manifests were written to fit the schema, so they confirm it by construction;
- the pilot measures whether metadata is present, not whether it is correct;
- the pilot's sample is small (12 capabilities, 3 formats, with all skills from one publisher); the
  research's is larger (60 records, 7 formats), but partly purposive and judged by one person;
- the acceptance-criteria statuses in the POC report are the POC's own assessment.

### 6.2 Findings from the proof of concept

**F1. The proposed model can be expressed and enforced with JSON Schema Draft 2020-12 and YAML,
with actionable feedback.**
- *Investigated:* whether the charter's fields, conditional requirements, and validation stages can
  be implemented with the proposed standards.
- *Found:* a schema with ten mandatory fields, ten conditional rules, optional fields, and
  extension fields compiles in strict mode (as of 2026-10-22; since 2026-10-23 the schema has six
  mandatory fields, twelve conditional rules, and completeness levels). Each finding carries a
  stable code, a JSON Pointer path, a line and column, a message, and a fix hint. (On 2026-10-22 the
  POC report said "9 conditional rules" while the schema had 10; since the revision, the report
  states the schema's count.)
- *Evidence:* 157 of 157 tests pass (re-run 2026-10-22). 6 of 6 valid examples pass. 5 of 5
  invalid examples fail with 16 coded errors (re-run 2026-10-22). Mutation checks detected 13
  injected defects in four rounds (`docs/poc-report.md` §7.1). After the revision of 2026-10-23:
  206 of 206 tests pass, 8 of 8 valid examples pass, 5 of 5 invalid examples fail with 15 coded
  errors, and a fifth round of mutation checks detected 5 more defects.
- *Why it matters:* it shows that the charter's validation approach is technically feasible.
- *Uncertain:* the examples are fictional and were written to fit the schema. Feedback quality has
  not been tested with real authors. Phase 0 has not confirmed the format choice.
- *Implication:* Spikes 1 and 4 can evaluate the format choice against working code rather than in
  the abstract.

**F2. Errors, warnings, and unverified checks can be kept apart, but source reachability can only
be partly verified.**
- *Investigated:* the Stage 2 checks, including an opt-in live check of source reachability.
- *Found:*
  - Duplicate ids and self-references can be detected within one validation run.
  - References to capabilities outside the run cannot be resolved; they are reported as
    unverified.
  - GitHub returns HTTP 404 both for a private repository and for a missing one, so the two cannot
    be told apart without credentials.
  - Registry sources without a URL cannot be checked.
- *Evidence:* `docs/poc-report.md` §7.3 and §8. The live check was not re-run on 2026-10-22.
- *Why it matters:* "Where feasible" [Charter §3] is a real limit. A global uniqueness check needs
  an inventory or registry, which Mission 4 does not own.
- *Uncertain:* how a CI pipeline should run reachability checks safely. Requesting URLs taken from
  untrusted manifests risks server-side request forgery (SSRF), so the POC recommends a host
  allowlist.
- *Implication:* consistency guarantees depend on Mission 2's inventory and Mission 5's workflow.

**F3. A second, independent implementation agrees on every example verdict, but three edge cases
diverge.**
- *Investigated:* whether the contract depends on the Node.js validator. The test used Python
  `jsonschema` 4.25.1 and PyYAML 6.0.3.
- *Found:* all 14 example files received identical verdicts. Three probes diverged:

  | Probe | Node.js validator | Python |
  |---|---|---|
  | Unquoted date | Valid, with a portability warning | Invalid: PyYAML (YAML 1.1) produces a date object |
  | `"2026-02-30"` | Invalid | Valid unless format assertion is enabled: Draft 2020-12 treats `format` as an annotation by default |
  | Duplicate `riskTier` key | Invalid | Valid, silently read as the last value; `high` then `low` becomes `low` |

- *Evidence:* `docs/poc-report.md` §7.4. **Not re-run on 2026-10-22**, because Python `jsonschema`
  is not installed in this environment. Re-run on 2026-10-23 from a scratch virtual environment:
  all 16 example files agree, and the probes behave as above.
- *Why it matters:* the duplicate-key case silently downgrades risk, which directly contradicts the
  charter's risk principle.
- *Uncertain:* how other languages and tools behave.
- *Implication:* the standard may need normative parsing rules (a "YAML profile") and conformance
  tests; the POC recommends both (§16.2).

**F4. The charter's identifier scenarios can be expressed.**
- *Investigated:* the five scenarios in [Charter §5]: monorepos, moved repositories, external tools,
  bundles, and parent-child references.
- *Found:*
  - several capabilities in one repository share a `source.url` and differ in `source.path`;
  - a moved repository changes `source` while the id stays stable, which `compat` reports as
    `SOURCE_RELOCATED`;
  - an external tool uses `source.type: provider`;
  - bundles use `components` and `parent`, with a reciprocity check.
- *Evidence:* `docs/manifest-spec.md` §6; consistency and compatibility tests.
- *Uncertain:* everything was tested on fictional data. Namespace allocation, case handling, and
  multiple publication locations were not addressed until the pilot (F14). Since 2026-10-23 the POC
  records several publications, relations, and the forge's repository id (D24), and the research
  tested the scenarios on real cases (F21).

**F5. Compatibility between capability revisions can be checked from manifests, but only
heuristically.**
- *Found:* changes are classified as breaking (interface removed, use case removed, type changed),
  additive, or metadata-only, and the required SemVer bump is derived from them. Lifecycle
  transitions and identity stability are enforced.
- *Uncertain:* a breaking change *inside* a referenced native contract, such as an MCP tool schema
  or an OpenAPI document, is not detected (`docs/manifest-spec.md` §9).

**F6. Changes between schema versions can be classified and checked against a corpus of
manifests, but no published version has evolved yet.**
- *Found:* `schema-compat` classified the boundary-review revision of the 0.1 draft as additive,
  and all 8 manifests that were valid under the earlier draft stayed valid.
- *Uncertain:* the tool is tested only with hypothetical next versions, and the 0.1 draft from
  before 2026-10-20 is no longer available (no version control). The research revision of
  2026-10-23 was checked against the kept 2026-10-22 draft: it reports relaxations and additions,
  and classifies the widened id pattern as breaking; all 9 earlier manifests stay valid. The tool treats any change to a regular-expression
  pattern as breaking, because it cannot prove that a new pattern accepts everything the old one
  did.

**F7. Consumption without mappings is demonstrated in POC terms only.**
- *Found:*
  - the exchange document carries manifests unchanged;
  - its summary view uses one code path for all capability types;
  - a consumer-needs contract test (`test/consumers.test.js`) reads each mission's documented
    needs through a single generic accessor.
- *Uncertain:* no real system of another mission has integrated. The "needs" were taken from the
  published scopes, not confirmed by those missions.

### 6.3 Findings from the boundary review

**F8. Mission 4's work is within its boundaries; two scope gaps were found and one gap was left
open deliberately.**
- *Found:*
  - The charter never mentions **maturity**, which the boundaries put in Mission 4's scope.
  - The charter's types lack the **frameworks and platforms** that Mission 2 catalogues.
  - The POC added optional `maturity`, `intendedAudience`, `platformCompatibility`, and
    `costInformation`, and the types `framework` and `platform`, to the 0.1 draft.
  - Mission 3's assessment metadata (data handling, access controls, model use) remains a
    deliberate gap.
- *Evidence:* `docs/mission-boundaries.md` §1, §5, §6.
- *Uncertain:* the needs were derived from the published scopes. The maturity definitions need
  Mission 2's agreement, and the cost model needs Mission 1's.

### 6.4 Findings from the journey pilot, iteration 1

**Method.** Four journeys and five discovery use cases were written down *before* the sample was
drawn and were not changed afterwards. Twelve public capabilities were drawn at random with a fixed
seed (20261022):
- 4 of 19 skills in `anthropics/skills`;
- 4 of the first 5,000 npm packages with the keyword `ai-agent`, out of 13,147;
- 4 of 47,633 active MCP Registry servers.

Each capability was drafted into a manifest from its native metadata alone, with provenance
recorded (`docs/journey-pilot.md` §2).

**F9. A shared core already exists, but much of it is derived.** Ten concepts are available for all
12 capabilities:
- identifier, name, description, type, source;
- owner, contact, internal or external;
- last updated, interfaces.

These largely match the charter's mandatory-field candidates. However, the type is never declared,
and the owner and contact are inferred for 8 of 12, so "available" often means "derived". *Why it
matters:* the starter set appears extractable, but derived values need confirmation.
(`pilot/results.md` §2)

**F10. One mandatory field blocks automatic registration.** 8 of the 12 drafts fail *only* because
`lifecycleStatus` is missing (against the 2026-10-22 schema; all 12 are valid against the revision
of 2026-10-23). Only the MCP Registry records status. *Why it matters:* a mandatory
field that no source states makes registration depend on a person. *Uncertain:* whether internal
sources record status.

**F11. Native metadata contains facts that the schema lacks.** License (7 of 12), keywords
(4 of 12), documentation link (11 of 12), and required configuration (2 of 12) had no field in
schema 0.1 until the revision of 2026-10-23 added them (D26). The adoption journey needs the
license.

**F12. What the journeys need most is what no source provides.**
- Structured use cases: 0 of 12.
- Maturity, audience, limitations, cost, and capability dependencies: 0 of 12 each.
- Risk assessment: 0 of 12, by design.

As a result, the discovery journey is complete for 4 of 12 capabilities, and the adoption journey
for 0 of 12 (4 of 12 if the governance question is set aside). *Why it matters:* the fields that
deliver discovery value must be curated.

**F13. Discovery from descriptions works for some needs, and its failures are informative.** Three
of the five needs found plausible matches:
- A GitHub-issues need matched one MCP server only because its machine name, containing
  `io.github`, stood in for a missing display name.
- No capability matched "query a database", although one sampled MCP server is a data-query service
  for Brazilian hospital admissions.

*Uncertain:* relevance was not formally judged.

**F14. Identity evidence for Spike 3.**
- Native names are already namespaced: reverse-DNS in the MCP Registry, scopes on npm.
- Unscoped packages and skills need a namespace rule.
- MCP names keep uppercase letters, so ids need either case-insensitive uniqueness or
  normalization.
- One capability is often published in several places, and a single `source` cannot express that
  (since 2026-10-23: `publications[]`, D24).

**F15. Quality varies, so curation remains necessary.** License formats differ, and the registries
contain many narrow or hobby packages. Curation of the landscape itself is Mission 2's work.

### 6.5 What has not been researched

| Gap | Why it matters |
|---|---|
| Spike 1's comparison table, reuse recommendations, and gap analysis | The charter asks to reuse rather than reinvent; no systematic comparison exists |
| A2A Agent Cards in practice | Researched since: the Spikes 1-3 research checked 36 public `agent-card.json` files found by code search; 4 conform to the A2A schema [Research §7.7]. No agent was run |
| Internal capabilities and internal formats (for example service-catalogue entries) | All evidence comes from fictional or public stand-ins |
| Consumer needs confirmed by Missions 1, 2, 3, and 5 | The needs were derived from the published scopes, not elicited from the missions |
| Authoring effort and curation time | Not measured; the pilot proposes measuring curation minutes per capability |
| Discovery relevance | Not formally judged |
| Risk vocabulary and assessment-reference format | Owned by Mission 3; not yet agreed |
| Namespace governance | No allocation model has been proposed or agreed |
| Non-SemVer vendor versioning | Researched since: versions recorded per publication with their scheme; SemVer never required [Research §10.4] |
| Performance, localization of messages | Not requirements; not measured |

### 6.6 Findings from the Spikes 1-3 research

Four journeys (find a capability; recognise the same capability across sources; compare and
decide; judge whether there is enough information) and four concrete needs were written down
before 60 public capability records in seven formats were sampled; 36 A2A Agent Cards were checked
separately [Research §1]. The findings are evidence and proposals for Spikes 1-3, not spike
conclusions, and one person made the judgments.

**F16. The sources' own discovery is weak.** The MCP Registry searches name substrings only: for
"github", GitHub's own server is at rank 12,080 of 29,152. Lexical matching over native metadata
reached 36-71% precision per need [Research §7.1, §7.2].

**F17. A shared core exists, but the facts that decide reuse are the least available.** Name 60,
description 58, source repository 54, version 47; but setup 13, limitations 0, risk 0, and
lifecycle stated natively 17 [Research §1.2].

**F18. Publications of one capability can be linked from metadata that exists, not from names.**
Declared links plus "same repository and same path" recovered all 14 judged same-capability pairs
with no false merge. Names alone merged two pairs of different capabilities and missed 10
[Research §7.3]. The revised POC validator reproduces the 14 of 14 through its own checks
[Research §16].

**F19. Validity and usefulness are independent.** 12 of 60 drafts were valid against the
2026-10-22 draft, 45 of them failing on `lifecycleStatus`, while 29 invalid drafts were assessable
from their metadata. Against the revision, 58 of 60 are valid [Research §7.6, §16].

**F20. Native formats are not reliably conformant.** 4 of 36 public Agent Cards validate against
the A2A v0.3.0 schema, and one conformant card states that it is not an A2A agent
[Research §7.7].

**F21. Identity breaks on real cases.** A renamed repository's URL went stale while its numeric id
did not change; two publishers ship different skills named `pdf`; forks are republished as separate
entries; real registry namespaces start with a digit; one capability showed three versions at once
across its publications [Research §10.1].

---

## 7. Technical landscape and existing standards

### 7.1 Evaluation status

Spike 1 has not run, so **no standard has been through Spike 1's comparison**. The Spikes 1-3
research drafted a comparison table for Spike 1 to review [Research §8.1]. The table below
separates these levels of contact with each item:
- **Exercised in the POC**: implemented and tested in the prototype;
- **Crosswalked in the pilot**, or **in the research**: real samples were mapped onto the manifest's
  concepts;
- **Referenced only**: the schema can point to it, but it was not evaluated;
- **Mentioned as a candidate**: named in a source, not used.

The "Purpose" descriptions are general background, not project findings. Spike 1 should verify the
current state of each item.

| Item | Purpose (general background) | Relationship to the mission | Status in the project | Known limitations or observations | Investigate before relying on it |
|---|---|---|---|---|---|
| **JSON Schema Draft 2020-12** | A vocabulary for describing and validating JSON data structures | Proposed validation contract [Charter §3] | Exercised in the POC; checked by a second implementation | `format` is an annotation unless assertion is enabled (F3). Cross-manifest rules need code outside the schema (Stage 2) | Confirm in Phase 0; required validator settings; tool support in consumers' languages |
| **YAML** | A human-friendly data serialization format | Proposed authoring format [Charter §3] | Exercised in the POC (YAML 1.2 parsing) | YAML 1.1 parsers read unquoted dates differently, and duplicate keys can be silently resolved (F3) | Whether a normative profile is needed; authors' tooling |
| **Semantic Versioning 2.0.0** | MAJOR.MINOR.PATCH versions that signal compatibility | Under evaluation for versions [Charter §7; Spike 1, 3] | Exercised in the POC for `capabilityVersion` (optional since 2026-10-23); schema versions use MAJOR.MINOR | Vendor versions may not follow SemVer; SemVer allows anything to change below 1.0.0 | Fit for internal capabilities; alternatives |
| **Agent Skills (`SKILL.md`)** | A folder whose `SKILL.md` front matter names and describes a skill, followed by instructions | Research area [Spike 1] | Crosswalked in the pilot (4 samples, one publisher) and in the research (11 records from three repositories); referenced as the `agent_skill` interface | No version and no lifecycle in the sample; license points to a file | Variation across publishers and internal skills |
| **Model Context Protocol (MCP)** | An open protocol through which AI applications reach tools and data exposed by MCP servers | Research area [Spike 1]; reuse or reference [Charter §8] | Referenced only (the `mcp` interface type) | The POC does not inspect MCP tool schemas, so breaking changes inside them go undetected (F5) | Which MCP metadata to reference or reuse; tool-level compatibility |
| **MCP Registry (`server.json`)** | A public registry of MCP servers with structured entries | Native source for MCP servers | Crosswalked in the pilot (4 samples) and in the research (14 records; its search behaviour measured) | The only source in the pilot's sample that records status; names keep uppercase letters | How stable the registry API is (it is at `v0.1`); its relation to internal registries |
| **A2A Agent Cards** | In the Agent2Agent (A2A) protocol, a document describing an agent's identity, skills, and interfaces | Research area [Spike 1]; reuse or reference [Charter §8] | Referenced only (the `a2a` interface requires `contractRef`); one fictional example; 36 public cards checked by the research | No public registry; of 36 cards found by code search, 4 validate against v0.3.0 and 4 have every field v1.0.1 marks REQUIRED [Research §7.7] | Agent Card fields against manifest fields; where internal agents publish cards |
| **OpenAPI** | A standard description format for HTTP APIs | Interface type in the POC | Referenced only (`openapi` requires `contractRef`) | Not evaluated | Whether services need more than a reference |
| **npm `package.json`** | Package metadata for the JavaScript ecosystem | Not in Spike 1's list; used as a real-world sample source | Crosswalked in the pilot (4 samples) and in the research | Many MCP servers are distributed as npm packages; npm dependencies are packages, not capabilities | How packages relate to the capability they deliver |
| **PyPI core metadata; Claude Code plugins; Docker MCP catalog; GitHub Actions (`action.yml`)** | Package, plugin, catalog, and CI-action metadata | Not in Spike 1's list; sample sources in the research | Crosswalked in the research | Lifecycle is mostly absent or in prose; plugins and catalog entries wrap other publications [Research §5, §10.3] | What the internal equivalents look like |
| **AI Catalog (draft); MCP Server Cards (SEP-2127)** | Discovery envelopes that reference native artifacts | Candidate envelopes for exchange [Research §8.7] | Read by the research; not used | The AI Catalog is a draft; Server Cards leave tools out of static metadata [Research §1.2] | Track the drafts; project starter records into an AI Catalog document (research experiment E3) |
| **Package URL (purl, ECMA-427)** | A standard locator for packages | Locator form for `publications[].locator` (since 2026-10-23) | Used in the examples and the research drafts | Identifies packages, not capabilities [Research §10.2] | n/a |
| **URN** | A persistent, location-independent name | Candidate id style [Charter §5; Spike 3] | The POC proposes a deterministic mapping from its readable ids to a URN; not exercised | Needs a namespace identifier for the organization | Spike 3 comparison |
| **JSON Pointer** | A string syntax that addresses a value inside a JSON document, for example `/source/url` | Used in the validation report to locate each finding | Exercised in the POC | n/a | n/a |
| **ISO 8601 dates; IANA media types** | Standard date notation (`YYYY-MM-DD`); registered content types such as `application/json` | Field formats in the schema | Exercised in the POC | Dates need quoting in YAML (F3) | n/a |
| **Service-catalogue entries** | Internal descriptions of services | Proposed native format for pilot iteration 2 | Mentioned as a candidate | Unknown | Which formats exist internally |

### 7.2 Metadata formats versus runtime protocols

Spike 1 asks to "distinguish metadata formats from runtime communication protocols". The
distinction matters because MCP and A2A are runtime protocols that also *carry* metadata (MCP server
descriptions, A2A Agent Cards). The charter positions the manifest as a description contract only,
which references these protocols rather than replacing them [Charter §8]. Spike 1 has not yet
established how much of their metadata the manifest should reference, mirror, or generate from
(Q18).

### 7.3 Implementation tooling (POC)

| Tool | Role | Status |
|---|---|---|
| Node.js 22, Ajv 8.20.0, ajv-formats 3.0.1, yaml 2.9.1, semver 7.8.5 | Reference validator and CLI | POC proposal D17: whether this is the long-term stack, or one reference implementation among several, is open |
| Python `jsonschema` 4.25.1, PyYAML 6.0.3 | Independent second implementation (`interop/python/crosscheck.py`) | Evaluation harness, optional; not part of `npm test`; last run on 2026-10-23 from a scratch virtual environment |

---

## 8. Potential approaches and trade-offs

The directions below are those the sources suggest. In most areas the POC picked one option so that
it could be tested; that option is marked "(POC)", **which does not make it the default answer.**
The options in one area are not always mutually exclusive.

### 8.1 How the manifest relates to existing formats

| Option | Idea | Potential benefits | Limitations and risks | Suitable when | Evidence needed |
|---|---|---|---|---|---|
| A. Independent manifest that references native contracts (POC) | A common core of fields; `interfaces[].contractRef` points to `SKILL.md`, the Agent Card, OpenAPI, or MCP metadata | One code path for consumers; protocols are not re-described [Charter §8] | Facts duplicated between the native file and the manifest can drift; authors maintain two artifacts; consumers that need protocol detail must follow references | Native formats differ widely, and consumers need mainly the common core | Drift rate; authoring effort; how much protocol detail consumers need |
| B. Embed or mirror selected native fields | The manifest carries copies of chosen native fields, such as A2A skills or MCP tools | Self-contained for consumers | Risks recreating protocol functionality; version skew with the native specs | Consumers cannot fetch native contracts | Which native fields consumers actually use (open question for Spike 1) |
| C. Generate drafts from native metadata through crosswalks, then curate | One crosswalk per format drafts a manifest with provenance; people add what no source states | Low registration effort; the shared core is largely extractable (F9) | Derived values can be wrong; crosswalks must track evolving formats; close to the "automated indexer" and "automated extraction" that Mission 4 does not own or has deferred [Charter §9, §11] | Most capabilities already have native metadata | Iteration 2 with internal formats; error rate of derived values; curation time |
| D. Adopt or adapt an existing format as the manifest | Use or extend an existing format as the common model ("reuse, adapt, or define independently" [Spike 1]) | No new format; existing tooling | In the pilot, each format described one family of capabilities; whether any format covers all the charter's types is unknown; the organization does not govern external specs | One format dominates the internal estate | Spike 1 comparison table and gap analysis |

### 8.2 Requiredness and completeness

| Option | Idea | Benefits | Limitations and risks | Suitable when | Evidence needed |
|---|---|---|---|---|---|
| A. A fixed mandatory set (the POC until 2026-10-22: all ten candidates) | Every manifest must contain the same ten fields | Simple contract; consumers can rely on every field | 8 of 12 pilot drafts were blocked by one field (F10); encourages placeholder values | The mandatory fields are available, or cheap to supply | Availability of each mandatory field in internal sources |
| B. Completeness levels: *discoverable*, *adoptable*, *governed* (Pilot proposal (b), recommended by the pilot; applied in the POC on 2026-10-23 with an added *assessable* level, Research §11.3) | A manifest is valid at the level it reaches, and the report states the level | Low entry cost; manifests get richer over time; fits a contribution flow | Changes what "mandatory" means in the validation contract; consumers must handle partial records; the levels need agreement | Contribution volume matters more than uniform completeness | Consumers' tolerance for partial records; Mission 5's workflow fit |
| C. Keep the field mandatory, and ask for it at registration (Pilot option (a)) | The mandatory set stays; the registration flow prompts for what is missing | Keeps the contract simple | Moves the effort to people; depends on Mission 5's workflow | Registration always involves a person | Curation time per capability |
| D. Default from registry status where a registry tracks one (Pilot option (c)) | Use native status where it exists | No effort where it applies | Only one of three sampled formats tracks status; registry semantics may differ | Most capabilities come from status-tracking registries | Status semantics across registries |
| E. Requirement profiles per capability type | Different required fields per type | Matches the charter's question on type variation [Charter §4] | More rules to maintain; consumers need per-type knowledge, in tension with "no capability-specific mappings" | Types genuinely differ in what they can state | Spike 2's per-type field analysis |

Evidence since 2026-10-22: under option A, 12 of 60 real records drafted into manifests were valid,
and 29 invalid drafts were nevertheless assessable from their metadata [Research §7.6]. Under
option B as applied, 58 of 60 are valid; the validator's levels agree with the research's
measurement for 56 [Research §16]. Whether consumers accept partial records is still open (research
U9).

### 8.3 Identifier format and allocation

| Option | Idea | Benefits | Limitations and risks | Evidence needed |
|---|---|---|---|---|
| A. Readable namespaced `<namespace>/<name>` (POC) | Lowercase kebab-case, maps to a URN | Human-readable; close to native names (reverse-DNS, npm scopes) | Needs namespace allocation; readability tempts people to rename | Namespace governance model; collision behaviour |
| B. URN-style | `urn:<organization>:capability:...` | Persistent, standard shape | Less readable; still needs a namespace model | Spike 3 comparison |
| C. Native names as identifiers | Use the reverse-DNS or package name directly | No new name to allocate | Native names change, differ in case, and are channel-specific; one capability can have several (F14) | How often native names change |
| D. Other approaches | Spike 3 asks about "other suitable approaches"; the sources discuss none in detail | n/a | n/a | Spike 3 |

Cross-cutting questions for any option:
- case normalization or case-insensitive uniqueness (F14);
- a namespace rule for unscoped names;
- who allocates namespaces, and at which step ids are assigned (Q10).

### 8.4 Capabilities published in several places

| Option | Idea | Trade-off |
|---|---|---|
| A. A single `source` (the POC until 2026-10-22) | One location per manifest | Simple, but cannot express a capability that is both an MCP Registry entry and an npm package (F14) |
| B. Several publication locations in one manifest (raised by the pilot for Spike 3; applied in the POC on 2026-10-23 as `publications[]` beside `source`, Research §7.3) | A list of publications, each with its native name, version, and status | Expressive, but consumers must choose between locations. Measured: with declared links and shared repositories, all 14 judged same-capability pairs among 60 records are linked with no false link; names alone merge different capabilities [Research §7.3, §16] |
| C. Separate manifests linked to one capability | One manifest per channel, with a link | Each channel is described faithfully, but identity becomes many-to-one and duplicate detection harder |

### 8.5 Versioning

| Concern | POC option | Alternatives in the sources | Evidence needed |
|---|---|---|---|
| `capabilityVersion` | SemVer 2.0.0; insufficient bumps are errors from 1.0.0 and warnings below. Optional since 2026-10-23, with native versions recorded per publication with their scheme | "An appropriate alternative" [Charter §7]; the research recommends never requiring SemVer [Research §10.4] | Versioning practice of internal and vendor capabilities |
| `schemaVersion` | Quoted `"MAJOR.MINOR"`; published versions immutable; MINOR for additive changes, MAJOR for breaking ones | Other schemes are open [Charter §7] | Consumers' upgrade practice; the deprecation window |
| Compatibility checking | Classification from the manifest only (heuristic) | Inspecting native contracts | How often breaking changes occur inside native contracts |
| Older manifests | Explicit rejection of unsupported versions; tolerant reading of newer MINOR versions | Migration tooling (none yet) | Consumer behaviour; migration effort |

### 8.6 Missing, unknown, and not-applicable values

| Option | Trade-off |
|---|---|
| Omit the field to mean "not provided"; `[]` for "declared none"; no `null` (POC) | Compact and unambiguous for presence, but cannot tell "unknown" apart from "not applicable" |
| Provenance per value, with conflicting and unverified states reported by Stage 2 (POC since 2026-10-23, D25) | Tells stated, linked, inferred, and claimed values apart; records become larger, and tooling is needed to write them [Research §9.4, §12.1] |
| Explicit markers, such as `unknown` or `not_applicable` values | Distinguishes the cases, at the cost of more vocabulary and validation rules |
| Allow `null` | Familiar, but `null` means different things to different consumers; the POC rejects it |

### 8.7 How risk is represented

| Option | Trade-off |
|---|---|
| One mandatory field with an explicit `unassessed` value, and an assessed tier that requires `assessmentReference` (POC) | Prevents silent defaults, but mixes "assessment state" and "classification" in one field, as the charter's own definition does |
| Separate fields for assessment state and classification | Clearer semantics; more fields; the vocabulary still depends on Mission 3 |
| A reference to the governance record only (a variant not discussed in the sources [Observation]) | Keeps risk content out of the manifest entirely; consumers then depend on access to the governance system |

### 8.8 Extensibility

| Option | Trade-off |
|---|---|
| Closed core with top-level `x-` extensions; nested objects closed (POC) | Catches typos and keeps the core consistent, but teams with extra needs must use extensions until a field is promoted |
| Open schema (unknown fields allowed) | Flexible; typos go undetected and consumers diverge |

### 8.9 How consumers integrate

| Path | Status | Trade-off |
|---|---|---|
| Exchange document (a file under a contract schema) | POC | Simple and language-neutral; a snapshot, not live data |
| Library API (`validateFiles`, `validateManifests`, `validateManifestText`) | POC | Direct, but ties consumers to one implementation and language |
| Validation report and exit codes, for CI or the contribution workflow | POC | Fits automation; does not deliver content |
| A live service or catalogue API | Not in the POC | Would fall under catalogue infrastructure, which Mission 4 does not own [Charter §9] |

### 8.10 How the standard itself is validated

| Approach | Strength | Weakness |
|---|---|---|
| Schema-first, with constructed examples (the original POC) | Fast; covers the rules | Self-confirming: the examples fit the schema by construction |
| Consumer-contract tests (`test/consumers.test.js`) | Checks that documented needs are representable | The needs are taken from documents and not confirmed by the consumers |
| Journey-first, with sampled capabilities (the pilot) | Tests usefulness on real metadata | Small samples; measures presence, not correctness; the journeys were written by Mission 4 |
| The validator's checks scored against judged journeys (the research harness, since 2026-10-23) | Tests whether the validator's own checks reproduce journey outcomes on real records | One judge; mechanical drafts; public records only |

These approaches complement one another. How much weight each carries in acceptance is undecided
(Q27).

---

## 9. Requirements and constraints

### 9.1 Confirmed requirements

These are stated in the charter as requirements or firm principles, or in the boundaries. They are
not marked "proposed" in their source.

| # | Requirement | Source | Reason, where stated |
|---|---|---|---|
| CR1 | A common, machine-readable standard to describe, identify, version, and validate AI capabilities | Charter TL;DR, §1 | So that multiple consumers use capabilities consistently |
| CR2 | Downstream consumers can use the manifest without capability-specific field mappings | Charter TL;DR, §1, §8, §10; Boundaries ("without bespoke transformations") | Avoid one mapping per type per consumer |
| CR3 | Two-stage validation: structural, then consistency | Charter §3 | Separate format from cross-manifest facts |
| CR4 | Results distinguish errors, warnings, and unverified checks | Charter §3, §10 | So that "not checked" is not read as "passed" |
| CR5 | A valid manifest does not establish reachability, availability, security, or production approval | Charter §3, §6 | Validity is not truth or approval |
| CR6 | Machine-readable validation with actionable error reporting | Charter §1, §10 | So that authors can fix problems |
| CR7 | Every independently managed capability has a stable, unique identifier | Charter §5 | Reliable references |
| CR8 | A repository URL is not automatically a permanent identifier | Charter §5 | Repositories move and hold several capabilities |
| CR9 | Lifecycle, risk classification, and approval status are separate concepts | Charter §6 | Prevents conflating them |
| CR10 | Missing or unassessed risk is never interpreted as low risk or approval | Charter §6, §10 | Safety |
| CR11 | Restrictions on recommendations or production use come from consuming and governance processes, not from schema validity | Charter §6 | Ownership of decisions |
| CR12 | Risk terminology and approval requirements are aligned with the designated governance owners | Charter §6 | Mission 3 owns them |
| CR13 | `schemaVersion` and `capabilityVersion` are distinct | Charter §7 | The contract and the capability evolve separately |
| CR14 | A metadata contract, not a runtime protocol; compatibility does not imply remote execution | Charter §8 | Scope |
| CR15 | Reuse or reference established protocols such as MCP or A2A rather than recreate them | Charter §8 | Avoid reinvention |
| CR16 | The POC shows a consumer parsing and validating; at least one downstream consumer without mappings; a second consumer or integration path evaluated before final acceptance | Charter §8, §10 | Proves interoperability |
| CR17 | Five representative manifests across at least four types, internal and external where available | Charter §10; Spike 4 | Feasibility across types |
| CR18 | Requiredness, identifier, lifecycle, versioning, and compatibility rules documented; identifier rules address uniqueness, stability, source references, and multi-capability repositories | Charter §10 | Acceptance |
| CR19 | Limitations, unresolved decisions, and future enhancements documented | Charter §10 | Acceptance |
| CR20 | Mission 4 stays out of the inventory, recommendation, approvals, contribution workflow, catalogue website, indexer, and runtime | Charter §9; Boundaries | Ownership |
| CR21 | Standardize maturity and integration metadata; define machine-readable exchange contracts; validate schema completeness, consistency, and compatibility; evolve the schema | Boundaries | Mission 4 scope |

The charter also says the manifest **should** describe identity, purpose, supported use cases,
interfaces, dependencies, limitations, source, version, ownership, and relevant assessment metadata
[Charter §8]. This is phrased as "should", and the charter does not fix it as requiredness.

Phase 0 **must establish** [Charter §4, §7]:
- which fields are mandatory, conditional, or optional;
- how missing, unknown, and inapplicable values are represented;
- how requirements vary by capability type;
- which fields interoperability and downstream consumption need;
- breaking and non-breaking changes;
- backward-compatibility expectations;
- schema migration and deprecation rules;
- the handling of older manifests and unsupported schema versions.

### 9.2 Proposed requirements

| Source | Proposal |
|---|---|
| Charter (proposed, Phase 0) | JSON Schema Draft 2020-12 and YAML authoring (§3); the ten mandatory-field candidates (§4); the potential additional fields (§4); the four lifecycle values (§6); namespaced or URN ids (§5); SemVer or an alternative (§7) |
| POC (D1-D26) | Summarised in §14.3; full table in `docs/poc-report.md` §3 |
| POC interoperability rules | Quote dates and versions; reject duplicate keys; assert formats (`docs/manifest-spec.md` §12) |
| Pilot | Add optional license, keywords, and documentation link; stop blocking on `lifecycleStatus` at draft time; capture use cases first; Spike 3 identity items (`docs/journey-pilot.md` §4). Most were applied on 2026-10-23 (§14.4) |
| Spikes 1-3 research | A starter model with completeness levels, publications and relations, provenance, license, and documentation; a fixed id pattern; runtime primitives kept out of the manifest (Research §11, §13.1). Applied to the 0.1 draft on 2026-10-23 as POC proposals (D23-D26) |
| POC report recommendations | A normative YAML profile and a conformance suite; operationalize versioning; integrate a second real consumer; govern namespaces (`docs/poc-report.md` §11) |

### 9.3 Technical constraints

- **Parser and validator differences** (F3): YAML 1.1 and 1.2 implicit typing, duplicate-key
  handling, and `format` assertion differ between implementations.
- **Cross-manifest rules are beyond JSON Schema.** Uniqueness and reference resolution need code
  (Stage 2) [Observation, from the POC's architecture].
- **Global uniqueness needs a registry or inventory**, which Mission 4 does not own.
- **Reachability is ambiguous without credentials** (a 404 for both private and missing
  repositories), and checking URLs from untrusted manifests risks SSRF.
- **Native contracts are not inspected**, so compatibility checking is heuristic.
- **Pattern changes cannot be proven compatible statically**; the corpus check is the second line
  of defence.
- **Placeholder schema identifiers.** The schema `$id` values use `schemas.example.com`. Publishing
  needs a real, immutable location [Observation].
- **No version control or CI.** Schema history cannot be reproduced; only the 2026-10-22 draft is
  kept, in `research/spikes-1-3/reference/`.

### 9.4 Operational and organizational constraints

- **Structure versus content.** Mission 4 cannot decide content or vocabularies owned elsewhere
  (§3.4).
- **Confidentiality.** The source documents are marked "Confidential – Authorized Use Only".
- **Access to real data.** Internal capability metadata was not available to the POC. The
  boundary review expects real capabilities from Mission 2.
- **Prioritized coverage.** "Support for every platform or capability type is not assumed"; the
  initial focus is "selected using representative examples and consumer requirements"
  [Charter §2].
- **Future enhancements are not commitments.** Automated metadata extraction, catalogue indexing,
  and broader platform integrations [Charter §11].
- **Working environment** (relevant to D17): Node.js 22 is available. The system Python is 3.9 and
  lacks `jsonschema`, so the Python cross-check runs from a scratch virtual environment. There is
  no document converter, so the `.docx` sources must be read with custom extraction.

### 9.5 Dependencies

| Mission 4 needs | From | For |
|---|---|---|
| Real capabilities, at least five for the first cycle | Mission 2 | The first-cycle deliverable; validation on real data |
| Agreement on maturity definitions and the type vocabulary | Mission 2 | The `maturity` and `capabilityType` fields |
| Confirmation of needed fields; the cost model; journeys | Mission 1 (and Mission 2 for journeys) | Requiredness; `costInformation`; pilot iteration 2 |
| Risk vocabulary, assessment-reference format, expiry rules, lifecycle-expectation check, assessment metadata list | Mission 3 and the designated governance owners | Risk fields; lifecycle transitions; later schema fields |
| Integration of the validation step; id and namespace assignment at submission | Mission 5 | Adoption in the workflow; identifier governance |
| Findings from Spikes 1-3 | The Mission 4 spike owners | Confirming or replacing the POC proposals |

### 9.6 Assumptions that need validation

| # | Assumption | Where it is made | How it could be validated |
|---|---|---|---|
| A1 | Public capabilities are indicative of internal ones | Journey pilot §2; Spikes 1-3 research §12.3 | Pilot iteration 2 on internal capabilities |
| A2 | The consumer needs derived from the published scopes are complete and correct | Boundary review §5 | Confirmation by Missions 1, 2, 3, and 5 |
| A3 | The pilot's four journeys reflect real users' tasks | Journey pilot §2 | Journeys provided by Missions 1 and 2 |
| A4 | The fictional examples represent real capability shapes | POC examples | Real manifests from Mission 2 |
| A5 | Derived values are acceptable after a confirmation step | Journey pilot §3.1 | Measure the error rate of derived owners and contacts |
| A6 | Consumers will follow the semantic rules: tolerant reading, never treating unassessed as low | Rules §9, §13 | Integration with a real consumer |
| A7 | Lowercasing native names creates no collisions | Pilot crosswalk | Collision analysis on a large sample |
| A8 | Owners will maintain manifests, or accept generated drafts | Implicit in the charter [Observation] | Mission 5 workflow trials |
| A9 | Node.js is acceptable as the reference stack | D17 | Mission 4 team decision; consumers' languages |
| A10 | SemVer fits internal capabilities that declare `capabilityVersion` (optional since 2026-10-23) | D11 | Survey of internal versioning practice |
| A11 | The spikes are Phase 0's vehicle | [Observation] | Confirmation by the Mission 4 team |

---

## 10. Edge cases and failure scenarios

Each scenario is drawn from the sources, or from the POC's and pilot's behaviour. For each, the
table gives the potential impact and the questions to answer. The list is not a design
specification.

| Scenario | Example or evidence | Potential impact | Questions to answer |
|---|---|---|---|
| **Incomplete or inconsistent information** | | | |
| A mandatory fact exists in no native source | `lifecycleStatus` blocks 8 of 12 drafts (F10) | Registration stalls, or placeholder values creep in | Mandatory, levelled, or defaulted (§8.2)? Levelled provisionally since 2026-10-23 (D23) |
| The facts needed for discovery are missing | Use cases 0 of 12 (F12) | Discovery fails silently; consumers fall back to prose | Curate, or extract from prose ("use this skill when...")? Who curates? |
| No display name; a machine name stands in | `io.github.bluwork/kontra-mcp` matched "GitHub" spuriously (F13) | False discovery hits | Should a display name be curated when absent? |
| The same fact appears in different forms | License as a file pointer or as a standard identifier (F15) | Consumers cannot compare terms | Normalize, or carry the native value with its type? Since 2026-10-23: an SPDX `expression`, or the `text` as stated, which the validator reports as needing review |
| **Duplicate or ambiguous identities** | | | |
| One capability published in several places | An npm package and an MCP Registry entry for the same server (F14) | Double counting; split usage and risk records | Several locations per manifest, or linked manifests (§8.4)? Since 2026-10-23: `publications[]`; two manifests that list one publication are reported (`DUPLICATE_PUBLICATION`) |
| Different capabilities share a name | Two publishers' skills named `pdf`; two `webapp-testing` skills with identical descriptions (F21) | A name-only match merges them | Never match on names; since 2026-10-23, `relations` can record `distinct_from` |
| A fork is republished as a separate entry | A package that calls itself a "Fork of official Playwright MCP" (F21) | The fork is taken for the original, or the reverse | Since 2026-10-23: `relations` with `fork_of`; a claim without `verified: true` is reported as unverified |
| Case variants of a name | `SidneyBissoli` lowercased to `sidneybissoli` | Collisions, or two ids for one capability | Normalize, or enforce case-insensitive uniqueness? |
| Unscoped names | Unscoped npm packages and skills need a namespace; the pilot used `npm/` and the repository owner | Namespace collisions; ids tied to a channel | What is the namespace rule, and who allocates? |
| Same id used by two teams | `examples/consistency/duplicate-id` (an analytics fork) | Conflicting records | Detected within one run only; who resolves conflicts globally? |
| Same source under two ids | `DUPLICATE_SOURCE` warning, matched by URL or, since 2026-10-23, by the forge's repository id | Shadow registrations | Warning or error? |
| **Changes over time** | | | |
| The repository moves or is renamed | `SOURCE_RELOCATED` keeps the id (F4); the research found a real rename whose repository id did not change (F21) | References break if consumers key on URLs | Do consumers resolve by id only, as the rules require? |
| Reinstatement of a deprecated capability | `deprecated` → `active` is allowed in the POC table | Possible conflict with Mission 3's expectations (for example reassessment) | Is reinstatement allowed, and under what conditions? |
| A component moves between bundles | Child ids are not nested under parent ids | Stale `components` or `parent` links | Who updates both sides, and how is reciprocity enforced across runs? |
| A risk assessment ages | `assessedOn` exists; there is no expiry rule | An old "low" tier is read as current | Do assessments expire, and who decides (Mission 3)? |
| `lastUpdated` drifts in meaning | Drafts use commit or publish dates, not metadata dates (§4.3) | Freshness signals are misread | Which date does the field mean? Defined on 2026-10-23 as the record's date, with capability dates per publication and for the source |
| **Compatibility between versions or systems** | | | |
| A manifest declares an unsupported schema version | `SCHEMA_VERSION_UNSUPPORTED` | Rejected; older or newer tooling cannot read it | Deprecation window? Migration notes? |
| A consumer reads a newer MINOR version | Tolerant-reader rule (rules §9) | Unknown fields ignored; fine if the change is truly additive | Do consumers implement tolerant reading? |
| A breaking change inside a native contract | An MCP tool's schema changes; `compat` cannot see it (F5) | Adopters break while the manifest shows "compatible" | Should compatibility inspect native contracts? |
| Vendor versions that are not SemVer | Commit pins, tags, `latest`, and dates in the research sample (F21) | Version checks are skipped or wrong | Accept other schemes? Mark them non-comparable? Since 2026-10-23: recorded per publication with their scheme, and compared only when comparable |
| **Missing dependencies or unavailable sources** | | | |
| A dependency is outside the validation run | `UNRESOLVED_REFERENCE`, reported as unverified | Consumers assume the dependency is available | Where are references resolved globally (Mission 2's inventory)? |
| A dependency is deprecated or retired | `REFERENCE_TO_DEPRECATED` warning | Adopters inherit a dead end | Warning or error, and for which consumers? |
| A private repository looks missing | HTTP 404 for both (F2) | False "unreachable" warnings, or false confidence | Credentials? Registry lookups? A host allowlist? |
| A registry source has no URL | Not checkable | Reachability is always unverified | Is a registry lookup needed? |
| **Different interpretations of the same metadata** | | | |
| Unquoted dates or versions in YAML | PyYAML reads a date object (F3) | Same file, different verdicts | Normative YAML profile? |
| `format` not asserted | `"2026-02-30"` passes in default Python (F3) | Invalid data accepted | Must conformant validators assert formats? |
| `active` read as "approved" | The rules say that `active` is not an approval | Unapproved capabilities are adopted | How is this communicated to consumers? |
| A valid manifest read as approved | CR5 | The same | Is the caveat in reports and exchange documents enough? |
| **Invalid, outdated, or unverified information** | | | |
| A duplicate key downgrades risk | `riskTier: high` then `low` is read as `low` by PyYAML (F3) | Silent risk downgrade | Must every consumer reject duplicate keys? |
| A derived owner is wrong | Owner inferred from the repository owner (F9) | Wrong contact; wrong accountability | How are derived values confirmed, and by whom? Since 2026-10-23, provenance records the inference, and the validator reports it until `confirmedBy` is set |
| An archived source is still offered as active | A catalog lists a server whose repository is archived (F21) | Adopters pick an unmaintained capability | Since 2026-10-23 reported as `LIFECYCLE_SIGNALS_CONFLICT`; who corrects the catalog? |
| A self-asserted risk tier | An assessed tier requires `assessmentReference`, but the record is not checked to exist | A fabricated tier passes | Should the reference be resolvable against Mission 3's system? |
| **Integration failures between producers and consumers** | | | |
| A consumer uses source URLs as keys | The rules say to resolve by id | Broken joins after moves | Will consumers adopt id-based resolution? |
| A consumer ignores unverified checks | The exchange document carries them | Unverified becomes "passed" downstream | Must consumers surface unverified states? |
| Untrusted contributions with reachability checks on | `--check-sources` in CI | SSRF exposure | Allowlist policy, set with Mission 5? |
| The exchange format does not fit ingestion | Not yet tested with Missions 1-3 | Bespoke transformations reappear | What do the consumers' ingestion paths require? |

---

## 11. Stakeholders and integration points

```text
                    capability owners and curators
                                |  author and confirm content
                                v
 Mission 2 (Landscape) <--- exchange document --- [ Mission 4: schema, rules, validator,
 Mission 1 (Recommendation) <-- exchange doc ---    contracts ]
 Mission 3 (Trust) <--- exchange doc; vocabulary --->      ^
 Mission 5 (Contribution) <--- validation report, exit codes; compat in the improve step
                                                           |
 native ecosystems (skills, MCP Registry, npm, A2A, ...) --- crosswalks (pilot, research)
 other implementations (for example Python) --- schema plus conformance rules
```

### Mission 1: Recommendation

- **May provide:** the fields it needs to assess fit and constraints [Charter §9]; journeys for
  pilot iteration 2; confirmation of whether a cost-model category is enough.
- **May expect:** consistent fields for matching, ranking by risk and cost where data exists,
  judging feasibility, and explaining alternatives (`docs/mission-boundaries.md` §5).
- **Mission 4 provides (POC):** exchange documents; the library API; fields such as
  `supportedUseCases`, `limitations`, `costInformation`, `maturity`, `platformCompatibility`, and
  `deprecation.replacedBy`. The boundary review suggests exchange documents as input to Mission 1's
  MVP of 10-20 capabilities. Since 2026-10-23 also `runtime`, `setup`, and `license`, and each
  manifest's completeness level in the exchange document, so that partial records can be filtered.
- **Contracts and coordination:** the exchange-document contract and the field list.
- **Unverified:** that the documented needs are complete; that the exchange document fits its
  ingestion; that it will never rank `unassessed` as low.

### Mission 2: Landscape

- **May provide:** real capabilities (at least five for the first cycle); journeys; agreement on
  maturity definitions and the type vocabulary.
- **May expect:** a structure to hold inventory content, and a clear line between identifier
  integrity checks and its own duplication analysis.
- **Mission 4 provides:** the schema; the `maturity`, `intendedAudience`, `framework`, and
  `platform` additions; the exchange contract. Since 2026-10-23: `publications`, `relations`, the
  forge's repository id, and warnings for shared publications and sources (identifier integrity,
  not functional duplication).
- **Contracts and coordination:** the type vocabulary, maturity definitions, and id assignment
  [Charter §5].
- **Unverified:** the shape of Mission 2's inventory and its ingestion path; whether radar
  placement and inventory fields stay outside the manifest, as the boundary review proposes.

### Mission 3: Trust, and the designated governance owners

- **May provide:** the risk-tier vocabulary; the assessment-reference format; assessment expiry
  rules; confirmation of the lifecycle transitions; the metadata the Trust Framework needs.
- **May expect:** that no manifest asserts approval; that unassessed is never low; that assessed
  tiers cite their assessment.
- **Mission 4 provides:** the `riskTier` and `assessmentReference` fields; the `RISK_UNASSESSED`
  reporting; the lifecycle data element; the representative manifests as a shared test set (the
  boundary review mentions the Trust Framework's 3-5 capabilities).
- **Contracts and coordination:** the risk vocabulary and assessment-reference format.
- **Unverified:** everything about the Trust Framework's criteria; whether governance records can
  be referenced or resolved.

### Mission 5: Contribution

- **May provide:** the workflow steps where validation runs; namespace and id assignment at
  submission; contributor guidance.
- **May expect:** a stable machine-readable validation result and exit codes; checks for revisions.
- **Mission 4 provides:**
  - `validate --format json`, which conforms to the validation-report contract 0.1;
  - exit codes: 0 for no errors, 1 for validation errors, 2 for usage or I/O errors;
  - `compat` for revisions;
  - since 2026-10-23, the completeness level in every result, `--require-level` for a gate, and
    provenance that shows which values an owner must confirm.
- **Contracts and coordination:** the validation-report contract; id and namespace assignment;
  the SSRF policy for reachability checks.
- **Unverified:** the workflow's tooling and where validation actually sits in it.

### Capability owners, authors, and curators

- **Provide:** the content of the manifests, and confirmation of derived values.
- **Expect:** clear field documentation; actionable errors; low effort to register.
- **Mission 4 provides:** the field dictionary; the authoring guide (README); validator hints;
  since 2026-10-23, the facts that each completeness level still needs.
- **Unverified:** authoring effort, and willingness to maintain manifests (A8). Who the "named
  curator" for un-sourced fields is remains [Open].

### Native ecosystems and external publishers

- **Provide:** native metadata (`SKILL.md`, `server.json`, `package.json`, PyPI metadata, plugin
  manifests, Docker catalog entries, `action.yml`, Agent Cards).
- **Mission 4's relationship:** consumes them through crosswalks (the pilot and the research
  harness only) and references them
  through `contractRef`. It does not control their evolution.
- **Unverified:** the stability of the native formats; access to internal equivalents.

### Other implementations and tooling

- **Expect:** a language-neutral contract and unambiguous parsing rules.
- **Mission 4 provides:** a standard-keyword schema with `x-` annotations that other validators
  ignore; the interoperability rules; the example files, which could serve as golden files (a
  proposal).
- **Unverified:** implementations beyond Node.js and Python.

### Integration contracts in the POC

| Contract | Version | Path | Status |
|---|---|---|---|
| Capability manifest schema | 0.1 (unpublished draft) | `schema/0.1/capability.schema.json` | POC; placeholder `$id` |
| Validation report | `reportFormatVersion` 0.1 | `schema/contracts/validation-report-0.1.schema.json` | POC; revised in place on 2026-10-23 (completeness, related ids) |
| Capability Exchange Document | `exchangeFormatVersion` 0.1 | `schema/contracts/exchange-document-0.1.schema.json` | POC; revised in place on 2026-10-23 (completeness level) |
| CLI exit codes | n/a | README | POC |

---

## 12. Current state and work completed

### 12.1 Artifacts

| Artifact | Path | What it is | Status |
|---|---|---|---|
| Mission 4 charter | `docs/charter/Mission 4 AI Capability Intelligence & Standards.docx` | Goal, scope, proposed solution, acceptance criteria | 2026-10-16; confidential |
| Spike 1-4 documents | `docs/charter/Spike 1 ... .docx` to `docs/charter/Spike 4 ... .docx` | Objectives, research areas, tasks, deliverables | 2026-10-16; no findings |
| Manifest schema 0.1 | `schema/0.1/capability.schema.json` | 6 mandatory fields, 12 conditional rules, 4 completeness levels, 10 capability types, `x-` extensions (10 mandatory and 10 rules until 2026-10-22) | Unpublished draft (POC), revised 2026-10-23 |
| Inter-team contracts | `schema/contracts/` | Validation report, exchange document | POC; revised in place 2026-10-23 |
| Field dictionary | `docs/field-dictionary/0.1.md` | Generated from the schema | Current with the schema |
| Rules and conventions | `docs/manifest-spec.md` | Identifiers, lifecycle, versioning, risk, extensibility; provenance-tagged | POC draft; revised 2026-10-23 |
| POC report | `docs/poc-report.md` | Findings, decision table D1-D26, traceability, verification, open questions | 2026-10-19; revised 2026-10-20, 2026-10-22, and 2026-10-23 |
| Boundary review | `docs/mission-boundaries.md` | Scope check against Missions 1-5 | 2026-10-20; updated 2026-10-23 |
| Journey pilot | `docs/journey-pilot.md`; `pilot/` (journeys, sampler, snapshot, crosswalk, analysis, drafts, results) | Iteration 1 | 2026-10-22; most proposals applied 2026-10-23 |
| Spikes 1-3 research | `spikes-1-3-research.md`; `research/spikes-1-3/` (pre-registered needs, snapshot, crosswalk for seven formats, judgments, analysis, results; `reference/` keeps the 2026-10-22 draft and its manifests) | Findings and proposals for Spikes 1-3 | 2026-10-22; addendum 2026-10-23 |
| Validator, checkers, CLI | `src/`, `bin/capability-manifest.js` | `validate`, `compat`, `export`, `schema-compat`, `docs`; completeness levels and `--require-level` since 2026-10-23 | POC |
| Examples | `examples/` | 8 valid (6 types; 5 internal, 3 external; 2 of them real public capabilities), 5 invalid, 1 consistency, 2 compatibility | POC |
| Tests | `test/` | 206 tests in 39 suites (157 in 33 until 2026-10-22) | POC |
| Second implementation | `interop/python/crosscheck.py` | Python cross-check | Optional harness |
| README | `README.md` | Overview, commands, authoring, schema-change procedure | Current |

### 12.2 Verification performed while compiling this document (2026-10-22)

| Command | Result |
|---|---|
| `npm test` (Node.js v22.23.2) | 157 tests, 33 suites: 157 pass, 0 fail |
| `validate examples/valid` | 6 valid, 0 errors, 1 warning, 11 unverified checks |
| `validate examples/invalid` | 0 valid, 5 invalid, 16 errors |
| `node pilot/analyze.js` | 12 drafts, 4 valid as drafted; journey counts as in §6.4. The command regenerates `pilot/results.md` and `pilot/drafts/` from the fixed snapshot |
| Python cross-check | **Not run**: `jsonschema` is not installed (system Python 3.9) |
| Live source reachability | **Not run** (network check; results cited from the POC report) |

After the revision of 2026-10-23:

| Command | Result |
|---|---|
| `npm test` (Node.js v22.23.2) | 206 tests, 39 suites: 206 pass, 0 fail |
| `validate examples/valid` | 8 valid, 0 errors, 1 warning, 20 unverified checks; completeness none 1, discoverable 1, assessable 2, adoptable 2, governed 2 |
| `validate examples/invalid` | 0 valid, 5 invalid, 15 errors |
| `npm run pilot` | 12 drafts, 12 valid as drafted |
| `npm run research` | Against the 2026-10-22 draft 12 of 60 valid; against the revision 57 (same drafting) and 58 (starter-model drafts); identity through the validator 14 correct, 0 false, 0 missed |
| Python cross-check | Run in a scratch virtual environment (`jsonschema` 4.25.1, PyYAML 6.0.3): all 16 example verdicts match |

### 12.3 Research performed, decisions, and proposals

- **Research performed:** §6.
- **Decisions agreed:** §14.2.
- **Proposals awaiting validation:** §14.3 and §14.4.

### 12.4 Work in progress

The sources record **no work as in progress**. Spike research and pilot iteration 2 are recommended
next steps (§16.2), not recorded as started. The Spikes 1-3 research and the revision of
2026-10-23 are complete; their confirmation by the spikes has not started.

### 12.5 Known blockers and unresolved issues

| Blocker | Effect |
|---|---|
| No spike findings | Every POC decision remains an unconfirmed proposal |
| No real internal capabilities | The first-cycle deliverable is met with fictional content only; iteration 2 cannot start |
| Risk vocabulary not agreed (Mission 3) | The tier names remain placeholders |
| Maturity definitions and cost model not agreed (Missions 2 and 1) | The added fields remain proposals |
| No real consumer integration | CR16 is demonstrated in POC terms only |
| Pilot and research proposals unconfirmed | Applied to the 0.1 draft on 2026-10-23 as POC proposals; Spikes 2 and 3 must confirm them. How to capture use cases is still undecided |
| Phase 0, acceptance authority, and deadlines undefined | It is unclear when, and by whom, v0.1 is accepted |
| No version control or CI | Schema revisions cannot be diffed; the 0.1 draft before 2026-10-20 is lost. The 2026-10-22 draft is kept in `research/spikes-1-3/reference/` |
| No public A2A registry | No registry exists; the research sampled 36 public Agent Card files instead. No agent was run |

---

## 13. Research spikes and investigation plan

### 13.1 How the spikes fit together

```text
Spike 1  Standards and ecosystem ----+---> Spike 2  Definition and metadata model ---+
 (what to reuse, adapt, define)       |     (what is a capability; which fields)      |
                                      +---> Spike 3  Identifiers, lifecycle, versions -+--> Spike 4  Validation and POC
                                            (granularity decides what gets an id)          (reports back what fails)
```

This dependency reading is from `docs/poc-report.md` §2.2. The pilot adds a feedback loop: real
sampled capabilities feed evidence back into Spikes 1-3. The Spikes 1-3 research is the first full
turn of that loop (§6.6).

Each subsection below lists the spike's question, why it matters, its research areas, its expected
deliverables (from the spike document), how its findings feed later work, and its dependencies. It
also lists the **material now available** to examine, which is input, not an answer, and the
**questions raised since the spike was written**.

### 13.2 Spike 1: Standards and ecosystem research

- **Question.** Which existing standards and formats can be reused to define a common,
  machine-readable AI Capability Manifest?
- **Why it matters.** The charter asks to reuse or reference rather than recreate (CR15). Every
  format choice downstream depends on this.
- **Areas:**
  - Agent Skills;
  - MCP metadata conventions;
  - A2A Agent Cards;
  - JSON Schema;
  - SemVer.

  Also: metadata formats versus runtime protocols, reusable fields, limitations, gaps.
- **Expected deliverables:**
  - a comparison table (standard, purpose, metadata covered, validation and versioning support,
    relevance);
  - reuse recommendations;
  - a gap analysis;
  - a practical approach for v0.1, with references.
- **Feeds:** Spike 2's field set and Spike 3's versioning scheme; Phase 0 confirmation of JSON
  Schema and YAML.
- **Dependencies:** none upstream.
- **Material now available:**
  - three crosswalks (`pilot/crosswalk.js`);
  - native snapshots (`pilot/samples/`);
  - the cross-implementation probes (F3);
  - POC rows D1, D13, and D14;
  - the research's eight crosswalks, metadata comparison matrix, and draft comparison table
    (Research §5, §8.1);
  - its conformance check on 36 public Agent Cards (Research §7.7).
- **Questions raised since:**
  - Embed or map native fields, beyond referencing them?
  - Generate manifests from native sources?
  - How to evaluate A2A without a public sample? (The research used code search, Research §7.7.)
  - Does the standard need a normative YAML profile?

  The pilot proposes that Spike 1's reuse analysis become one crosswalk per native format
  (`docs/journey-pilot.md` §5); this is a proposal.

### 13.3 Spike 2: Capability definition and metadata model

- **Question.** What constitutes an AI capability, and what metadata describes it consistently
  across types?
- **Why it matters.** It decides what gets a manifest (and therefore an id), and which fields
  consumers can rely on.
- **Areas:** definition and granularity; capability types; mandatory, conditional, and optional
  fields; missing-data semantics; consumer requirements for discovery, recommendation,
  interoperability, and risk assessment.
- **Expected deliverables:** a capability definition with granularity rules; type recommendations;
  a field dictionary (name, description, data type, requirement level); missing-data rules;
  recommendations and open questions.
- **Feeds:** Spike 3 (what gets an id) and Spike 4 (what the schema enforces).
- **Dependencies:** Spike 1 (which formats to reuse); Missions 1, 2, and 3 for consumer needs.
- **Material now available:**
  - the POC field dictionary;
  - rows D3-D7, D15, D16, and D22;
  - the pilot's availability and treatment table (`pilot/results.md` §6);
  - the consumer-needs matrix (§5.2);
  - the research's availability per format, starter model, and value states (Research §5, §9.4,
    §11);
  - the completeness levels and new fields as implemented (D23, D25, D26).
- **Questions raised since:**
  - Fixed mandatory set or completeness levels? (Levels applied provisionally, D23.)
  - Add license, keywords, and a documentation link? (Added, D26.)
  - How to source use cases?
  - Are the maturity levels right?
  - Do `platformCompatibility`, `costInformation`, and `intendedAudience` have the right
    structure?
  - Is `techStack` needed?
  - Should prompts, commands, hooks, and resources ever be types?
  - What does `lastUpdated` mean? (Defined on 2026-10-23 as the record's date.)

### 13.4 Spike 3: Identifiers, lifecycle, and versioning

- **Question.** How are AI capabilities uniquely identified, and how are their lifecycle, versions,
  and compatibility managed?
- **Why it matters.** Identifiers are hard to change once published; lifecycle and versioning
  govern how consumers handle change.
- **Areas:** identifier approaches; source references kept separate from ids; lifecycle states and
  transitions; schema versus capability versioning; compatibility and older manifests.
- **Expected deliverables:** an identifier recommendation (format, uniqueness, stability); a
  scenario analysis (repositories, monorepos, external capabilities, bundles); a lifecycle model; a
  versioning strategy for each version kind; compatibility guidelines; open questions.
- **Feeds:** Spike 4's checks; Mission 5's id assignment; schema publication.
- **Dependencies:** Spike 2's granularity rules; Spike 1's SemVer evaluation; Mission 3 for
  lifecycle expectations.
- **Material now available:**
  - rows D8-D11, D20, and D21;
  - `compat` and `schema-compat`;
  - the identity evidence F14;
  - the compatibility examples;
  - the research's scenario analysis on real cases, its comparison of identifier approaches, and
    identity-linking rules with measured accuracy (Research §7.3, §10);
  - publications and relations as implemented (D24).
- **Questions raised since:**
  - Namespaced or URN ids, and who allocates namespaces?
  - Case handling? (Ids are lowercase; digit-first segments allowed since 2026-10-23.)
  - Several publication locations? (`publications[]`, D24; whether to fold `source` into it is
    research question U2.)
  - Reinstating deprecated capabilities?
  - The deprecation window for schema versions?
  - Non-SemVer vendor versions? (Recorded per publication with their scheme, D11.)
  - The syntax for dependency version constraints?

### 13.5 Spike 4: Validation and proof of concept

- **Question.** Is the proposed manifest structure feasible, as shown by a minimal POC on
  representative capabilities?
- **Why it matters.** It turns the proposals into something testable, and reports what does not
  work.
- **Areas:** schema validation; validation rules; consistency checks; representative examples;
  validation feedback.
- **Expected deliverables:** a schema prototype; five sample manifests; a validator; test results;
  consistency-check findings; recommendations.
- **Feeds:** acceptance of v0.1; feedback to Spikes 1-3.
- **Dependencies:** Spikes 1-3. These have no findings yet, so the POC filled their questions with
  provisional answers.
- **Material now available:** the whole POC (§12.1). The POC report presents itself as this spike's
  research document.
- **Questions raised since:**
  - Does the POC report satisfy this spike's deliverable, or must it be re-run after Spikes 1-3?
  - The pilot proposes that the spike's harness be re-run on real capabilities.
  - The research harness now scores the validator's own checks on 60 real records
    (Research §16).

### 13.6 Investigations no single spike covers

These cross-cutting investigations are suggested by the evidence. They are not assigned in any
source [Observation].

| Investigation | Why | Related questions |
|---|---|---|
| Confirm consumer needs with Missions 1, 2, 3, and 5 | The needs were derived from documents (A2) | Q23 |
| Pilot iteration 2 on internal capabilities | Tests A1, A3, and A4 | Q27 |
| Measure population cost (curation minutes per capability; derived-value error rate) | Dimension D9 has no owner | Q3, Q7 |
| Agree the risk vocabulary with Mission 3 | Blocks the risk fields | Q16, Q17 |
| Namespace governance with Missions 5 and 2 | Blocks the publication of ids | Q10 |
| Conformance rules for other implementations | F3 | Q20 |
| A second judge for the research's relevance and identity judgments | One judge so far [Research §4.4] | Q27 |

The pilot proposes measuring the following on every iteration (`docs/journey-pilot.md` §5). These
are proposed measures; no targets have been set.
- journeys that can be completed;
- mandatory fields filled automatically;
- curation minutes per capability;
- discovery matches.

---

## 14. Open questions and decision log

### 14.1 Open questions

"Next step" names the likely forum; owners are proposals unless the charter assigns them.

**Definition and metadata model**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q1 | Which fields are mandatory, conditional, and optional? | Defines validity for every manifest and consumer | 10 charter candidates; the POC makes 6 mandatory since 2026-10-23 (all 10 before); availability measured on 12 (pilot) and 60 (research) records | Internal availability; confirmed consumer needs | Arbitrary friction, or unreliable fields | Spike 2, with pilot iteration 2 |
| Q2 | How do requirements vary by capability type? | Must be decided in Phase 0 [Charter §4] | One type-specific rule (`mcp_server`) | Per-type field analysis | Either over-general or over-specific rules | Spike 2 |
| Q3 | One requiredness level, or completeness levels? | Changes the validation contract | Levels applied provisionally on 2026-10-23 (D23); 58 of 60 research drafts valid | Consumers' tolerance for partial records; Mission 5's fit | The provisional levels harden by default | Mission 4 team decision, with Mission 5 |
| Q4 | How are missing, unknown, and inapplicable values represented? | Phase 0 item [Charter §4] | POC: omit, `[]`, no `null`, `unassessed`; provenance and reported states since 2026-10-23 | Whether consumers need to tell unknown from not applicable | Consumers infer values | Spike 2 |
| Q5 | Are prompts, commands, hooks, and resources components or types? | Granularity, and therefore ids | Charter allows either; POC embeds them | Real bundles | Inconsistent manifests | Spike 2 |
| Q6 | Add license, keywords, documentation link, required configuration? | Common in native metadata; the adoption journey needs the license | Pilot F11; added as optional fields on 2026-10-23 (D26) | Internal availability | Adoption journey stays incomplete | Spike 2 confirmation |
| Q7 | How are supported use cases captured: curated, or extracted from prose? | Discovery depends on them (0 of 12) | Skill descriptions state uses in prose | Curation cost; extraction quality | Discovery stays weak | Spike 2, with Mission 2 |
| Q8 | Are the maturity levels, cost model, platform tokens, and `techStack` right? | Missions 1 and 2 use them | POC proposals D15, D16 | Agreement from Missions 1 and 2 | Fields are unused or misused | Missions 1 and 2 |

**Identity**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q9 | Namespaced, URN-style, or another id format? | Ids are permanent once assigned | Charter candidates; POC namespaced with a URN mapping; the research advises keeping the format provisional and evaluating `urn:air` [Research §10.2] | Spike 3 comparison | Ids cannot be published safely | Spike 3 |
| Q10 | Who allocates namespaces and assigns ids, and at which step? | Uniqueness depends on it | Coordinated with Missions 5 and 2 [Charter §5] | Governance model | Collisions; inconsistent ids | Missions 4, 5, and 2 |
| Q11 | Case handling, and a namespace rule for unscoped names? | Collisions and split identities | Pilot F14; ids lowercase, and digit-first segments allowed since 2026-10-23 | Collision analysis | Duplicates | Spike 3 |
| Q12 | How is a capability published in several places represented? | Double counting | Pilot F14; options in §8.4; `publications[]` beside `source` since 2026-10-23 (D24) | Internal publication patterns | Inventory inconsistencies | Spike 3 |

**Lifecycle and versioning**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q13 | Are the lifecycle values and transitions right, including reinstatement? | Integrity of the lifecycle; Mission 3's expectations | POC table D9 | Mission 3's expectations | Conflicting rules | Spike 3, with Mission 3 |
| Q14 | Versioning for non-SemVer capabilities, and the syntax of dependency version constraints? | Compatibility checks | POC SemVer, lenient below 1.0.0; native versions per publication since 2026-10-23 | Internal and vendor practice | Version checks skipped or wrong | Spike 3 |
| Q15 | How is schema 0.1 published: immutable `$id`, deprecation window, migration notes? | Consumers need stable contracts | POC rules; placeholder `$id` | Hosting location; consumers' upgrade cadence | Unstable contract | Spike 3; Mission 4 team |

**Risk and trust**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q16 | What are the risk vocabulary and the assessment-reference format, and do assessments expire? | CR10, CR12 | Placeholder tiers; `assessedOn` exists | Mission 3's framework | Placeholders become de facto standards | Mission 3 |
| Q17 | Which assessment metadata (data handling, access controls, model use) does the schema add, and when? | Mission 3's needs | A deliberate gap | Trust Framework criteria | Information goes into ad hoc `x-` fields | Mission 3, then a schema MINOR version |

**Standards and interoperability**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q18 | Reuse, adapt, or define, per standard; and reference, embed, or generate? | CR15 | Options in §8.1 | Spike 1 comparison | Reinvention, or protocol coupling | Spike 1 |
| Q19 | Are JSON Schema 2020-12 and YAML confirmed? | Phase 0 item [Charter §3] | Exercised in the POC; F3 divergences | Spike 1 and 4 assessment | Format churn later | Spikes 1 and 4 |
| Q20 | Must other implementations follow a normative YAML profile and pass a conformance suite? | F3 shows divergent verdicts | POC rules §12 | Consumers' languages and tools | Same file, different verdicts | Spike 4; Mission 4 team |

**Consumers and integration**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q21 | Does "without capability-specific field mappings" apply to producer-side crosswalks as well as consumers? | Defines success (CR2) | The POC reads it as consumer-side; the pilot uses crosswalks | Team.s interpretation | Disputed acceptance | Mission 4 team |
| Q22 | What counts as an "evaluated" second consumer, and which real consumer integrates first? | CR16 | POC: Python implementation plus the report contract | Acceptance expectations | Final acceptance is unclear | Mission 4 team, with Missions 1 and 5 |
| Q23 | Which fields do Missions 1, 2, 3, and 5 actually need, and does the exchange document fit their ingestion? | A2 | Derived from the published scopes | Confirmation by the missions | Bespoke transformations reappear | Each mission |

**Validation semantics**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q24 | What date does `lastUpdated` mean: the metadata's update or the capability's? | Freshness signals | Defined on 2026-10-23 as the record's date, with capability dates per publication and for the source; the pilot keeps its iteration-1 usage (§4.3) | Consumers' needs | Misread freshness | Spike 2 |
| Q25 | How are reachability checks run in CI: allowlist, credentials, registry lookups? | F2; SSRF | Opt-in; HTTPS only | Mission 5's environment | Unsafe or useless checks | Missions 4 and 5 |

**Process and programme**

| ID | Question | Why it matters | Known now | Missing evidence | If unresolved | Next step |
|---|---|---|---|---|---|---|
| Q26 | What is Phase 0: its scope, timeline, and exit criteria; and who accepts v0.1? | Many items are "subject to Phase 0" | Only charter mentions | Plan and sign-off authority | Proposals harden by default | Mission 4 team |
| Q27 | Are journeys the acceptance tests? Whose journeys, and which targets for the pilot's measures? | Shapes what counts as evidence | Recommendation 1 in the POC report; team direction (§14.2) | Agreed journeys and targets | Endless refinement, or premature acceptance | Mission 4 team, with Missions 1 and 2 |
| Q28 | Is the Node.js implementation the long-term stack, or one reference among several? | Consumers' integration | D17 | Consumers' languages | Fragmented tooling | Mission 4 team |
| Q29 | When do the standard's artifacts get version control and CI? | Reproducibility; enforcing `schema-compat` | Neither exists | n/a | Unreviewable schema changes | Mission 4 team |
| Q30 | What is the umbrella initiative's goal, and what is the internal baseline (current formats, mappings, consumers)? | Grounds the problem and its priorities | Not in the sources | Programme documents | Requirements rest on inference | Mission 4 team |

### 14.2 Decisions already made

| Decision | By, and when | Evidence |
|---|---|---|
| The charter's firm positions: CR1-CR21 in §9.1, including the separate lifecycle, risk, and approval axes; unassessed never low; a URL is not an id; distinct version kinds; a metadata contract, not a runtime protocol; the boundaries | Charter (2026-10-16); Boundaries | Charter §1-§10; `docs/mission-boundaries.md` |
| Keep a **single schema version**. The boundary-review fields, first drafted as 0.2, were folded into the unpublished 0.1 draft | [Team decision], 2026-10-20 | `docs/poc-report.md` revision note and D20; `docs/mission-boundaries.md` §6 |
| Revise 0.1 in place while it is unpublished; create a new version directory only once 0.1 is published | [Team decision], 2026-10-20 | README, "Changing the schema" |
| Direction to prove discovery and reuse on real, sampled capabilities rather than only refine metadata definitions. The review.s assessment was that the mission and spikes are well scoped, but that too much effort had gone into defining metadata without proving those scenarios | [Team decision], 2026-10-22 (review feedback; not written into the repository documents, which record its result: the journey pilot) | `docs/journey-pilot.md` §1; `docs/poc-report.md` revision note of 2026-10-22 |
| Apply the Spikes 1-3 research analysis to the code and documents: revise the unpublished 0.1 draft in place with its proposals, as POC proposals | [Team decision], 2026-10-23 (request to update the codebase and documents with the research analysis) | `docs/poc-report.md` revision note of 2026-10-23; research report §16. The decision is to apply the proposals for evaluation; their content is not confirmed (§14.3) |

Whether journeys formally become the acceptance tests is **not** decided. It is the first of the
POC report's recommendations (Q27).

### 14.3 Tentative decisions: POC proposals

Every row is a reversible proposal awaiting the named confirmer. Full detail is in
`docs/poc-report.md` §3.

| # | Topic | POC choice, in short | Confirm with |
|---|---|---|---|
| D1 | Schema standard, authoring | JSON Schema 2020-12; YAML 1.2 | Spikes 1 and 4 |
| D2 | Validation stages and severities | As the charter states | n/a (charter) |
| D3 | Mandatory fields | 6 of the 10 candidates since 2026-10-23 (all 10 before) | Spike 2 |
| D4 | Conditional rules | Rules for risk, deprecation, MCP interface, source details, contract references, cost "other", license, relations, provenance; the registry-version rule was removed on 2026-10-23 | Spike 2 |
| D5 | Missing data | Omit, `[]`, no `null`, `unassessed`; since 2026-10-23 also provenance per value and conflicting and unverified states | Spike 2 |
| D6 | Capability types | The charter's 8 (and D22) | Spike 2 |
| D7 | Components | `components` and `parent`; `embeddedComponents` | Spikes 2 and 3 |
| D8 | Identifier format | `<namespace>/<name>`, lowercase kebab-case, URN mapping; digit-first segments allowed since 2026-10-23 | Spike 3 |
| D9 | Lifecycle | Charter states, with the transition table in the schema; since 2026-10-23 an optional owner declaration, with observed signals per publication and source | Spike 3; Mission 3 |
| D10 | `schemaVersion` | Quoted `"MAJOR.MINOR"`; routing; immutability; MINOR and MAJOR rules | Spike 3 |
| D11 | `capabilityVersion` | SemVer 2.0.0; bump derived from change impact; optional since 2026-10-23, with native versions per publication | Spike 3 |
| D12 | Risk | Mandatory, no default; assessed tier needs a reference; placeholder tiers | Governance owners |
| D13 | Extensibility | Closed core; `x-` fields | Spikes 1 and 2 |
| D14 | Protocol reuse | `interfaces[].contractRef` | Spike 1 |
| D15 | Maturity | Optional `prototype`, `pilot`, `production` | Mission 2; Spike 2 |
| D16 | Deferred fields | `platformCompatibility`, `costInformation`, `intendedAudience` added; `techStack` and Mission 3's metadata deferred | Missions 1-3; Spike 2 |
| D17 | Implementation stack | Node.js 22, Ajv, yaml, semver | Mission 4 team |
| D18 | Second consumer or integration path | Python implementation; validation-report contract | Mission 4 and consumers |
| D19 | Exchange between teams | `export` to an exchange document; `catalog` removed | Missions 1-3 |
| D20 | Schema evolution | Single version; `schema-compat` (the single version is a team decision, §14.2) | Spike 3 |
| D21 | Lifecycle and risk-vocabulary ownership | Mission 4 owns the fields; Mission 3 the expectations and vocabulary | Mission 3 |
| D22 | `framework`, `platform` types | Added | Mission 2; Spike 2 |
| D23 | Completeness levels | discoverable, assessable, adoptable, governed; reported, enforced only on request (2026-10-23) | Mission 4 team, Mission 5; Spike 2 |
| D24 | Publications and relations | `publications[]` beside `source`; repository id; `relations[]` (2026-10-23) | Spike 3 |
| D25 | Provenance and value states | `provenance[]`; unconfirmed, conflicting, and claimed values reported (2026-10-23) | Spike 2 |
| D26 | License, runtime, setup, documentation, keywords | Optional fields (2026-10-23) | Spike 2 |

### 14.4 Pilot proposals awaiting a decision

From `docs/journey-pilot.md` §4. On 2026-10-23, items 1, 2 (option b), and parts of 4 were applied
to the 0.1 draft as POC proposals (D23-D26); they still await confirmation.
1. Add optional `license`, `keywords`, and a documentation link to schema 0.1. **Applied.**
2. Stop blocking on `lifecycleStatus` at draft time. The options are (a) ask at registration,
   (b) completeness levels, or (c) a registry default. The pilot recommends (b), noting that it
   changes what "mandatory" means. **Applied as (b)**, with an added assessable level.
3. Capture `supportedUseCases` first, at registration or by extraction from skill descriptions.
   **Not applied**: the field stays optional pending a vocabulary decision (research U5).
4. For Spike 3: case-insensitive id uniqueness; a namespace rule for unscoped packages and skills;
   several publication locations per capability. **Applied**, except the namespace rule, which
   stays open.

---

## 15. Risks and feasibility

The evidence is too thin for quantified likelihood. Each assessment is therefore **preliminary**,
unless the evidence column shows a measured result.

| # | Risk | Area | Evidence | Assessment | Ways to reduce uncertainty |
|---|---|---|---|---|---|
| K1 | The standard fits fictional data but not real capabilities | Validation | The examples were written to fit the schema; the pilot found gaps (F10-F12), and the research more on 60 records (F17-F21) | Demonstrated in part by the pilot | Pilot iteration 2 on internal capabilities |
| K2 | Discovery delivers little value because use cases are absent at the source | Data quality, adoption | 0 of 12 (F12) | Measured on public data; high relevance to Mission 1 | Test curation and extraction on a small set; measure discovery matches |
| K3 | Registration friction deters contributors | Adoption, scope | 8 of 12 drafts blocked by one field (F10); with completeness levels (since 2026-10-23), 12 of 12 pilot and 58 of 60 research drafts are valid | Measured on public data; mitigated provisionally | Confirm the levels with Mission 5; measure curation effort |
| K4 | Curation effort is unsustainable | Feasibility | Not measured | Preliminary | Measure curation minutes per capability |
| K5 | Parser or validator divergence silently downgrades risk | Interoperability | Demonstrated with PyYAML (F3) | Demonstrated | Normative YAML profile; conformance suite; consumer guidance |
| K6 | Consumers misread semantics (valid as approved; unassessed as low) | Adoption | POC mitigations exist; no real consumer yet | Preliminary | Integration with one real consumer; review its handling of unassessed |
| K7 | Identity collisions or split identities | Data quality | Case variants, unscoped names, multi-channel publication (F14); renames, same-name skills, forks, and digit-first namespaces in the research (F21) | Evidence of the mechanisms; frequency unknown | Collision analysis on a larger sample; Spike 3 |
| K8 | Cross-mission vocabulary decisions delay v0.1 | Dependencies | Risk, maturity, and cost are all pending | Preliminary | Agree interim placeholders explicitly; time-box decisions |
| K9 | Scope creep into the inventory or indexer | Scope | `catalog` had to be replaced by `export` | Has occurred once | Boundary checks at each review (`docs/mission-boundaries.md`) |
| K10 | Premature lock-in: publishing 0.1 before the spikes conclude | Compatibility and evolution | Published versions are immutable (proposed); ids are permanent | Preliminary | Publish only after Spike 3; corpus-check every change |
| K11 | Schema history becomes unreproducible | Process | The 0.1 draft from before 2026-10-20 was lost (no version control); the 2026-10-22 draft was kept by hand | Has occurred | Version control and CI (Q29) |
| K12 | No real downstream consumer adopts the standard | Adoption | No integration yet | Preliminary | Pick a first real consumer (Q22) |
| K13 | Native formats evolve and break crosswalks or references | Compatibility | Registry API at `v0.1`; protocol versions are dated [Observation] | Preliminary | Treat crosswalks as versioned artifacts; monitor the formats |
| K14 | Validation gives false confidence | Validation | Reachability ambiguity; heuristic compatibility (F2, F5) | Known limitation | Keep the "unverified" severity visible in every consumer |
| K15 | Reachability checks on untrusted input enable SSRF | Security | POC security note | Known; mitigated by default-off | Allowlist policy with Mission 5 |
| K16 | Sampling bias distorts the field decisions | Validation | Pilot: one skills publisher, the first 5,000 npm results, 12 capabilities. Research: 60 records, partly purposive, one judge | Known limitation | Larger, stratified internal samples |
| K17 | Too many types for the evidence | Scope, complexity | 10 types, one type-specific rule; "support for every type is not assumed" | Preliminary | Prioritize types by consumer need [Charter §2] |

**Feasibility, in summary.**
- **Structural validation** is technically feasible: demonstrated in the POC on fictional data.
- **Usefulness** for discovery and reuse is partly demonstrated and partly contradicted by the
  pilot. On 60 public records, the revised validator reproduces the research's identity and
  completeness results (F18, F19).
- **Integration** with real consumers has not been tested.

---

## 16. Milestones and next steps

### 16.1 Known milestones and commitments

**The sources set no dates or deadlines for any milestone.**

| Milestone or commitment | Source | Status |
|---|---|---|
| Phase 0 confirms the format, the fields, missing-data rules, and versioning | Charter §3, §4, §7 | Not done: the spikes have no findings |
| Spike 1-4 research documents | Spikes 1-4 | Not submitted; the POC report presents itself as Spike 4's |
| Manifest v0.1 accepted against the charter's §10 criteria | Charter §10 | The POC self-assesses each criterion as "met" in POC terms; no formal acceptance is recorded |
| First-cycle deliverable: Manifest v0.1 applied to five capabilities | Boundaries | Met with fictional content; real capabilities pending from Mission 2 |
| Second consumer or integration path evaluated before final acceptance | Charter §8 | Evaluated in POC terms (D18); no real integration |
| Publish schema 0.1 with an immutable `$id` | POC report §11 (recommendation) | Not done |

Changes on 2026-10-23: the 0.1 draft was revised in place (D23-D26); the Spikes 1-3 research report
exists as input to Spikes 1-3, but is not a spike document; and the first-cycle examples now include
two real public capabilities.

### 16.2 Recommended next steps documented in the sources

These are **recommendations**, not commitments.

From the POC report, §11:
1. Make journeys the acceptance tests. Run pilot iteration 2 with 3 to 5 real journeys and 10 to 20
   internal capabilities from Missions 1 and 2, with the Spikes 1-3 harness and two judges.
2. Run Spikes 1-3 against the POC, using the decision table as the agenda, starting with the
   2026-10-23 revisions (D3, D4, D8, D9, D11, D23-D26).
3. Agree the risk vocabulary and the assessment-reference format with the governance owners.
4. Offer Mission 5 the validation step: the report contract and exit codes, plus `compat` for
   revisions.
5. Publish a normative YAML profile and a conformance suite.
6. Operationalize versioning: version control; publish 0.1 with an immutable `$id` once confirmed;
   define the deprecation window; run `schema-compat --corpus` on every change.
7. Integrate a second real consumer.
8. Govern namespaces and id assignment with the contribution workflow's owners.

From the journey pilot, §5:
- Iteration 2 adds internal native formats (for example A2A Agent Cards and service-catalogue
  entries) to the crosswalk.
- It also measures curation time.

From the Spikes 1-3 research, §13 [Research]:
- run iteration 2 with its harness on internal capabilities, with a second judge (experiments E1,
  E2);
- project starter records into an AI Catalog document and record what is lost (E3);
- agree the vocabularies with their owners: capability types and abilities with Mission 2,
  assessment references with Mission 3;
- measure owner effort for the adoptable level with three to five owners (E4).

### 16.3 Which questions block others

The dependencies in §5.1 and §13.1 suggest an order. This is a reading of the dependencies, not a
plan; the team decides.

| Group | Questions | Why this position |
|---|---|---|
| Frame the acceptance basis | Q26 (Phase 0 and acceptance), Q27 (journeys), Q21 and Q22 (what success means) | Without them, no finding can close a question |
| Granularity and requiredness | Q1-Q5 | Identity and validation depend on what a capability is and what it must state |
| Identity, before any id is published | Q9-Q12 | Ids are permanent |
| Cross-mission vocabularies | Q8, Q13, Q16, Q17 | These depend on other missions, so they can run in parallel with the rest |
| Integration | Q23, Q25 | Needs a stable enough schema; reveals mismatches early |
| Publication | Q15, Q19, Q20, Q29 | Depends on most of the above |

### 16.4 Evidence needed before moving forward

- Spike findings that confirm, change, or replace each POC proposal (§14.3).
- Real internal capabilities and journeys (iteration 2).
- Confirmed consumer needs from Missions 1, 2, 3, and 5.
- Mission 3's risk vocabulary.
- A real consumer's integration result.
- A second judge for the research's relevance and identity judgments.

### 16.5 What completes the current phase

The documented completion conditions are:
- the charter's acceptance criteria (§17);
- the Phase 0 "must establish" items (§9.1);
- the four spike deliverables (§13).

The sources do not say who confirms completion (Q26).

### 16.6 Work beyond the current phase

| Item | Source |
|---|---|
| Automated metadata extraction, catalogue indexing, broader platform integrations | Charter §11: "potential future enhancements", not commitments |
| `techStack` and Mission 3's assessment metadata | POC D16 (deferred) |
| Migration tooling for breaking schema changes | POC report §9 |
| Registry lookups for reachability; credentialed checks | POC report §8 |
| Inspection of native contracts for compatibility | Rules §9 |
| Messages in languages other than English; performance | POC report §9 (not required) |

---

## 17. Definition of success

### 17.1 Deliverables that must exist

| Deliverable | Source | Status (POC self-assessment unless noted) |
|---|---|---|
| Manifest v0.1 and its field documentation | Charter §10 | Draft exists; unpublished |
| Documented mandatory, conditional, and optional requirements | Charter §10 | Documented; proposals |
| Documented identifier, lifecycle, versioning, and compatibility rules | Charter §10 | Documented; proposals pending Spike 3 |
| Five representative manifests, at least four types, internal and external where available | Charter §10 | 8 manifests, 6 types, 3 external; 6 fictional and, since 2026-10-23, 2 real public capabilities |
| Known limitations, unresolved decisions, future enhancements | Charter §10 | `docs/poc-report.md` §8-§10 |
| Spike research documents | Spikes 1-4 | Not produced as spike documents (Spike 4: see §6.1). The Spikes 1-3 research report provides findings and proposals for Spikes 1-3 (§6.6) |

### 17.2 Functional capabilities to demonstrate

| Capability | Source | Status |
|---|---|---|
| Valid manifests pass structural validation; invalid ones fail with actionable feedback | Charter §10 | Demonstrated on the examples (re-run 2026-10-23) |
| Structural and consistency results distinguishable; errors, warnings, and unverified checks reported | Charter §10 | Demonstrated |
| Identifier rules address uniqueness, stability, sources, and multi-capability repositories | Charter §10 | Within one validation run; global uniqueness needs an inventory |
| Unassessed risk cannot be read as low risk or approval | Charter §10 | Demonstrated in the validator and the exchange view; consumer behaviour unverified |

### 17.3 Integration outcomes to verify

| Outcome | Source | Status |
|---|---|---|
| A consumer can parse and validate the manifest | Charter §8 | Demonstrated (Node.js; Python re-run 2026-10-23) |
| At least one downstream consumer uses it without capability-specific field mappings | Charter §8, §10 | Demonstrated in POC terms; no real consumer |
| A second consumer or integration path evaluated before final acceptance | Charter §8, §10 | Evaluated in POC terms (D18) |
| Consistent representation across sources; consumption without bespoke transformations | Boundaries | Demonstrated in POC terms |

### 17.4 Quality attributes

Drawn from the charter's language and the POC's evidence:
- **actionable feedback**: each error says what is wrong and how to fix it;
- **honest uncertainty**: "unverified" is never "passed";
- **stable identity**: ids survive moves and renames;
- **predictable evolution**: breaking and non-breaking change rules, enforced by checks;
- **language neutrality**: the same verdict from independent implementations;
- **low registration effort**: from the pilot's "register with little effort" journey;
- **semantic safety**: no implicit approval, and no default risk.

None of these has an agreed measurable target.

### 17.5 Outside the current commitment

Automated extraction, catalogue indexing, and broader integrations [Charter §11], plus the deferred
items in §16.6.

### 17.6 Success measures that still need agreement

- What "evaluated" means for the second consumer (Q22).
- Whether producer-side mappings count against "without mappings" (Q21).
- What makes the five capabilities "representative", and whether fictional ones count for
  acceptance.
- Whether journeys are acceptance tests, and the targets for the pilot's measures (Q27).
- Who grants acceptance, and when (Q26).

---

## 18. Recommended reading and reference map

### 18.1 Sources used

All paths are relative to the project root and were verified on 2026-10-22; the rows added on
2026-10-23 were verified that day.

| Source | Path | Contributes | Supports sections |
|---|---|---|---|
| Mission 4 charter | `docs/charter/Mission 4 AI Capability Intelligence & Standards.docx` | Goal, scope, capability definition, proposed solution, metadata candidates, identifiers, risk and lifecycle semantics, versioning, interoperability, boundaries, acceptance criteria | All, especially §1, §3, §9, §17 |
| Spike 1 | `docs/charter/Spike 1 Existing Standards & Ecosystem Research.docx` | Standards research questions and deliverables | §7, §13.2 |
| Spike 2 | `docs/charter/Spike 2 Capability Definition and Metadata Model.docx` | Definition and metadata-model questions | §5, §13.3 |
| Spike 3 | `docs/charter/Spike 3 Identifiers, Lifecycle & Versioning.docx` | Identifier, lifecycle, and versioning questions | §8.3-§8.5, §13.4 |
| Spike 4 | `docs/charter/Spike 4 Validation and Proof of Concept.docx` | Validation and POC questions | §6.2, §13.5 |
| POC report | `docs/poc-report.md` | Decision table D1-D26, traceability, verification results, limitations, open questions, recommendations | §6.2, §12, §14.3, §15, §16.2 |
| Spikes 1-3 research | `spikes-1-3-research.md`; `research/spikes-1-3/results.md` | Journeys on 60 public records, metadata comparison matrix, identity and lifecycle evidence, starter model, the revision's results | §1, §6.1, §6.5, §6.6, §7.1, §8.2, §8.4, §10, §12-§16 |
| Research harness | `research/spikes-1-3/` (README, `needs.yaml`, `judgments.yaml`, crosswalk, analysis, `reference/`) | Pre-registration, snapshot, scoring rules, and the kept 2026-10-22 draft with its manifests | §6.6, §12 |
| Rules and conventions | `docs/manifest-spec.md` | Provenance-tagged rules for identifiers, lifecycle, versioning, risk, validation, interoperability | §4, §8, §10 |
| Field dictionary | `docs/field-dictionary/0.1.md` | Every field, requirement level, and conditional rule (generated from the schema) | §4, §9 |
| Boundary review | `docs/mission-boundaries.md` | Published boundaries (secondary source), structure-versus-content model, consumer needs, cross-mission items | §2.6, §3, §5.2, §11 |
| Journey pilot | `docs/journey-pilot.md` | Method, findings, schema proposals, approach | §2.2, §6.4, §14.4 |
| Pilot results | `pilot/results.md` | Measured availability, answerability, draft validity, discovery matches | §5.2, §6.4 |
| Pilot journeys | `pilot/journeys.yaml` | Journey questions and discovery use cases | §4, §6.4 |
| Pilot crosswalk | `pilot/crosswalk.js` | Mapping from native formats, and provenance | §4.3, §7 |
| Pilot sample record | `pilot/samples/sources.json` | Sample pools, seed, retrieval time, endpoints | §6.4 |
| Schema and contracts | `schema/0.1/capability.schema.json`; `schema/contracts/*.json` | The machine-readable contracts | §11, §12 |
| Consumer-needs test | `test/consumers.test.js` | The per-mission needs encoded as a test | §6.2, §11 |
| Python cross-check | `interop/python/crosscheck.py` | The second implementation | §6.2 |
| README | `README.md` | Commands, authoring, schema-change procedure | §12, §14.2 |
| Published "Boundaries for each team" | **Not in the repository** | Primary source for the boundaries, known here only through the boundary review | §3 |

### 18.2 External references

- The pilot recorded these retrieval endpoints in `pilot/samples/sources.json` on 2026-10-22. They
  were not re-fetched for this document.
  - Agent Skills: `https://github.com/anthropics/skills/tree/main/skills`
  - npm search: `https://registry.npmjs.org/-/v1/search?text=keywords:ai-agent`
  - MCP Registry: `https://registry.modelcontextprotocol.io/v0.1/servers?limit=100&version=latest`
- **Authoritative specification links.** The Spikes 1-3 research lists 28 external sources, all
  retrieved on 2026-10-22, among them JSON Schema, SemVer, MCP, A2A, Agent Skills, the AI Catalog
  draft, and Package URL [Research §15.3]. Links for YAML, OpenAPI, and URN are still not recorded.
  Confirming the references remains part of Spike 1's deliverable ("with supporting references").

### 18.3 Suggested reading order

1. The charter (about 15 minutes).
2. This document's §1, §3, and §4.
3. `docs/mission-boundaries.md`.
4. `docs/journey-pilot.md`, then `pilot/results.md`.
5. `spikes-1-3-research.md` §1 and §16, then `research/spikes-1-3/results.md` as needed.
6. `docs/poc-report.md` §3 (decisions) and §9-§11.
7. `docs/manifest-spec.md` and `docs/field-dictionary/0.1.md` as references.
8. The spike documents, before working on a spike.

---

## Appendix A. Acronyms

| Acronym | Expansion |
|---|---|
| A2A | Agent2Agent (protocol); an *Agent Card* describes an A2A agent |
| AI | Artificial intelligence |
| API | Application programming interface |
| CI | Continuous integration |
| CLI | Command-line interface |
| DNS | Domain Name System |
| ESM | ECMAScript modules (the JavaScript module system the POC uses) |
| HTTP(S) | Hypertext Transfer Protocol (Secure) |
| IANA | Internet Assigned Numbers Authority (registers media types) |
| I/O | Input/output |
| ISO 8601 | International standard for date and time notation |
| JSON | JavaScript Object Notation |
| MCP | Model Context Protocol |
| MVP | Minimum viable product (Mission 1's MVP, as named in the boundary review) |
| PII | Personally identifiable information (appears in an example manifest) |
| POC | Proof of concept |
| PURL (purl) | Package URL (ECMA-427), a standard locator for packages |
| SemVer | Semantic Versioning |
| SPDX | Software Package Data Exchange; its license expressions, such as `Apache-2.0`, identify licenses |
| SSRF | Server-side request forgery |
| URL | Uniform Resource Locator |
| URN | Uniform Resource Name |
| YAML | YAML Ain't Markup Language |
