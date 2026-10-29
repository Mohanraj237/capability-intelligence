# Mission 4 boundary and scope review

Date: 2026-10-20; updated 2026-10-23 for the revision that applies the Spikes 1-3 research (§6).
Inputs: the published "Boundaries for each team" (Missions 1-5) and the Mission 4 charter. This
review checks that Mission 4's work stays inside its boundaries and covers its scope. It records
what changed as a result.

## 1. Verdict

Mission 4's charter and this proof of concept are **within Mission 4's boundaries**. They define the
**structure and rules** used to represent capabilities: the schema, conventions, validation, and
exchange contracts. They do not own:
- the inventory's content (Mission 2);
- risk classifications or approvals (Mission 3 and the designated owners);
- recommendation logic (Mission 1);
- the contribution workflow (Mission 5).

The charter is consistent with the boundaries: its §9 exclusions match them, and its coordination
points cover the same four missions. Two gaps against the boundaries remained:
- the charter never mentions **maturity**, which the boundaries list as Mission 4 scope;
- the charter's capability types lack the **frameworks and platforms** that Mission 2 catalogues.

The review led to three boundary tightenings and six scope additions (§6). All schema additions are
in the single schema version, **0.1**, which is still an unpublished draft.

## 2. In-scope coverage

| Mission 4 in-scope item | Where it is covered | Status |
|---|---|---|
| Define the canonical capability manifest/schema | [`schema/0.1/capability.schema.json`](../schema/0.1/capability.schema.json) (unpublished draft, revised in this review) | Covered |
| Establish mandatory fields, metadata conventions, identifiers and versioning | [manifest-spec.md](manifest-spec.md) §3-§9; [field dictionary](field-dictionary/0.1.md). Since 2026-10-23: six mandatory fields and completeness levels, publications, relations, and provenance, from the Spikes 1-3 research | Covered; several rules are POC proposals awaiting the spikes |
| Standardize capability descriptions, supported use cases, maturity and integration metadata | `name`, `description`, `supportedUseCases`, `interfaces`, `dependencies`; added in this review: `maturity`, `intendedAudience`, `platformCompatibility`, `costInformation` | Covered, except Mission 3's assessment metadata (§5) |
| Define machine-readable contracts for exchanging information between teams | Manifest schema; [exchange-document contract](../schema/contracts/exchange-document-0.1.schema.json); [validation-report contract](../schema/contracts/validation-report-0.1.schema.json) | Covered |
| Validate schema completeness, consistency and compatibility | `test/schema.test.js` checks every registered version: documentation, rule hints, examples that satisfy their own fields, transition and risk-rule consistency, and (since 2026-10-23) completeness levels whose facts name defined fields and native-name synonyms that are not field names. `schema-compat` checks compatibility statically and against a corpus of manifests | Covered |
| Evolve the schema as new requirements emerge | Versioned schema registry, evolution rules (spec §9), `schema-compat`, and version-aware hints, ready for the next version. This review's requirements were added to the unpublished 0.1 draft; `schema-compat` confirmed the revision is additive, with all 8 manifests valid under the earlier draft still valid. The research revision of 2026-10-23 was checked against the 2026-10-22 draft: relaxations and additions, plus a widened id pattern that the tool classifies as breaking; all 9 manifests valid under that draft stay valid | Covered; the first published evolution is still to come |
| First-cycle deliverable: Manifest v0.1 applied to five capabilities | `examples/valid`: 8 capabilities across 6 types, internal and external; 2 of them are real public capabilities (2026-10-23) | Covered; internal capabilities are to come from Mission 2 |
| Success measure: consistent representation across sources, consumption without bespoke transformations | Repository, monorepo, registry, and external provider sources all share one shape. One manifest can list every channel a capability is published in (`publications`); among 60 real records, the validator's checks linked all 14 judged same-capability pairs with no false link. The exchange document carries manifests unchanged, with their completeness level. `test/consumers.test.js` reads every mission's needs through one accessor | Demonstrated in the POC and on public records |

## 3. Out-of-scope check

| Out of scope for Mission 4 | Owner | How the POC stays out |
|---|---|---|
| Contributor engagement and the end-to-end submission process | Mission 5 | It provides the validator and its report contract (JSON, exit codes) for Mission 5's validation step. There is no submission, review, or publication logic, and the README covers authoring the format, not how to contribute. |
| Governance decisions and approvals | Mission 3 and the designated owners | There is no approval field. Validity never implies approval, and `unassessed` is reported as unverified. Risk tier names are placeholders owned by Mission 3. Lifecycle transitions are representation rules that need Mission 3's confirmation. |
| Recommendation algorithms | Mission 1 | There is no ranking, scoring, or matching. The exchange document carries data only. |
| Discovering and maintaining the inventory | Mission 2 | There is no discovery, storage, or catalogue. The `catalog` command was replaced by `export`, which passes manifests through unchanged. Example content is fictional, apart from two public capabilities. Duplicate checks test identifier integrity (the same id, or the same source or publication under two ids), not the landscape's analysis of functional duplication. Completeness levels are reported; which level an inventory requires is the consumer's decision. |

The [journey pilot](journey-pilot.md) samples public capabilities only as evidence for the data
model:
- It keeps no inventory.
- Its term matcher checks whether metadata lets a capability be found; it does not rank.
- It writes `riskTier: unassessed` and asserts no risk.

Its crosswalk maps native formats onto the manifest. That is interoperability work, which is
Mission 4's. The Spikes 1-3 research harness ([research/spikes-1-3/](../research/spikes-1-3/))
follows the same rules on a larger public sample. Its term matcher and identity rules are test
instruments for the data model, not a search, ranking, or crawling service: those belong to
Missions 1 and 2.

## 4. Ownership model: structure versus content

"The Landscape team owns the inventory's content; this team owns the structure and rules used to
represent that content."

| Element | Mission 4 owns | The values or vocabulary are owned by |
|---|---|---|
| Schema, field names, requiredness, conventions, versioning rules | All of it | Mission 4 |
| Capability content (description, use cases, limitations, owner, source) | The fields and their rules | Capability owners, submitted through Mission 5's workflow; Mission 2 as the inventory owner |
| `capabilityType` | The vocabulary | Mission 4, agreed with Mission 2, which catalogues the types |
| `lifecycleStatus` | States as a data element; integrity rules for transitions | Values: capability owners. Lifecycle expectations (approval, monitoring, reassessment, retirement): Mission 3 |
| `maturity` | The field and proposed level definitions | Definitions agreed with Mission 2; values assigned by Mission 2 |
| `riskTier`, `assessmentReference` | The fields; the rules that an assessed tier must cite an assessment and that unassessed is never low | Vocabulary and assessments: Mission 3 and the designated owners |
| `costInformation`, `platformCompatibility`, `intendedAudience` | The fields | Content: capability owners and Mission 2; used by Missions 1 and 2 |
| Completeness levels (`x-completenessLevels`) | The levels, their facts, and how the validator reports them | Which level a process requires: its owner (for example Mission 5's workflow, or Mission 2's inventory). The facts of the adoptable level come from capability owners |
| `publications`, `relations`, `provenance` | The fields and their integrity checks | Content: capability owners and curators, through Mission 5's workflow; Mission 2 decides which entries are duplicates of one capability |
| `license` | The fields, and the rule that prose terms need reading | Whether a license permits a use: the organization's legal and governance owners, not Mission 4 |
| Identifier conventions | The format, uniqueness, and stability rules | Assignment and namespaces coordinated with Missions 5 and 2 (charter §5) |
| Validation-report contract | All of it | Consumed by Mission 5's workflow |
| Exchange-document contract | All of it | Filled with Mission 2's inventory content; consumed by Missions 1 and 3 |

## 5. Consumer needs coverage

These needs are taken from each mission's published scope. The test `test/consumers.test.js` checks
that each one can be represented in schema 0.1 and read uniformly.

| Mission | Need | Manifest fields | Before the review | Now |
|---|---|---|---|---|
| 1 Recommendation | Match needs against capabilities | description, supportedUseCases, capabilityType, interfaces, platformCompatibility | Partial | Yes |
| 1 Recommendation | Rank by risk and cost, where data is available | riskTier, assessmentReference, costInformation | Risk only | Yes |
| 1 Recommendation | Judge feasibility and constraints | maturity, lifecycleStatus, limitations, dependencies, platformCompatibility; since 2026-10-23 also runtime, setup, license | Partial | Yes |
| 1 Recommendation | Explain recommendations and identify alternatives | description, use cases, limitations, deprecation.replacedBy | Yes | Yes |
| 2 Landscape | Track maturity, availability, use cases, limitations | maturity, lifecycleStatus (availability), supportedUseCases, limitations | No maturity | Yes |
| 2 Landscape | The problem a capability solves, and its intended audience | description, intendedAudience | No audience | Yes |
| 2 Landscape | Catalogue capabilities, tools, frameworks, platforms, reusable solutions | capabilityType (including framework and platform), source, owner | No framework or platform | Yes |
| 2 Landscape | Recognise one capability across sources (part of maintaining the inventory) | publications, source.repositoryId, relations (added 2026-10-23) | No: a single source | Yes |
| 3 Trust | Risk classifications and assessment records | riskTier, assessmentReference | Yes | Yes |
| 3 Trust | Lifecycle expectations up to retirement | lifecycleStatus, deprecation | Yes | Yes |
| 3 Trust | Third-party dependencies | owner.affiliation, source.type, dependencies (capabilities only); since 2026-10-23 license (expression and scope) | Partial | Partial |
| 3 Trust | Data handling, access controls, model risks | None | **Gap** | **Gap** |
| 5 Contribution | Validation step in the workflow | Validation-report contract, exit codes | Machine-readable output, no contract | Yes |
| 5 Contribution | Contributor responsibilities; improvement of revisions | owner, capabilityVersion, lastUpdated; `compat`; since 2026-10-23 provenance (which values an owner must confirm) and the completeness level (what to ask the owner for) | Yes | Yes |

The Mission 3 gap is deliberate. Mission 3 defines the assessment criteria, so Mission 4 adds the
matching fields once the Trust Framework states what it needs. Defining them first would put
Mission 4 in the business of setting assessment criteria.

## 6. Changes made in this review

Boundary tightenings:

1. **`catalog` replaced by `export`.** The old command built a projected capability list that
   looked like an inventory. `export` produces a Capability Exchange Document instead: the manifests
   unchanged, with their validation caveats, under a [contract schema](../schema/contracts/exchange-document-0.1.schema.json).
2. **Lifecycle and risk ownership made explicit**, in the schema descriptions and in spec §7 and
   §8. The transition table is a representation rule that needs Mission 3's confirmation, and the
   risk tier vocabulary belongs to Mission 3.
3. **Boundaries documented** (this file). Identifier-integrity checks are distinguished from
   Mission 2's duplication analysis, and format authoring guidance from Mission 5's contribution
   guidance.

Scope additions:

1. **New optional schema fields**, all in the 0.1 draft:
   - `maturity`, `intendedAudience`, `platformCompatibility`, and `costInformation`;
   - the capability types `framework` and `platform`.

   They were first drafted as a separate version 0.2. At the Mission 4 team's request they were then
   folded into 0.1, which is unpublished, so that there is one schema version.
2. **`schema-compat`**: classifies the changes between two schema versions or drafts (breaking,
   additive, relaxation, annotation). It enforces the version-bump rule and confirms the result
   against a corpus of manifests. Field dictionaries list each version's changes from the previous
   version.
3. **Contract schemas** for the validation report (consumed by Mission 5) and the exchange
   document. Both declare a format version.
4. **Schema tests** that run over every registered version.
5. **Version-aware hints.** When a later schema version adds a field or value, a manifest that uses
   it under an older version is told which `schemaVersion` to declare. This is tested with a
   hypothetical next version.
6. **The consumer-needs contract test** described in §5.

Changes made on 2026-10-23, applying the Spikes 1-3 research at the Mission 4 team's direction
(details in [poc-report.md](poc-report.md)). Each is a POC proposal for the owning spike:

1. **Requiredness follows availability.** Six mandatory fields; `description`, `owner`,
   `lifecycleStatus`, and `lastUpdated` are optional and reported through completeness levels.
   Validity no longer depends on facts that most sources cannot supply.
2. **Several publications, relations, and provenance per value**, with Stage 2 checks that report
   shared publications, claimed relations, and conflicting or unconfirmed values. None of them
   decides whether two entries are the same capability for the inventory; that stays with Mission 2.
3. **License, runtime, setup, documentation, and keywords** as optional fields. The license fields
   record the stated terms; they do not judge whether a use is permitted.
4. **The exchange document carries each manifest's completeness level**, so that consumers can
   handle partial records explicitly.

## 7. Open cross-mission items

| With | Item |
|---|---|
| Mission 1 | Confirm the fields the MVP needs; in particular, is a cost model category enough? Offer exchange documents as the MVP's input for its 10-20 capabilities. Can the MVP use partial records, filtered by completeness level (research U9)? |
| Mission 2 | Agree the maturity level definitions and the capability-type vocabulary (framework, platform). Provide at least five real capabilities for the first-cycle deliverable, and 10-20 internal ones for iteration 2 of the journey tests. Accept partial records in ingestion (research U9)? Is a configuration-only wrapper its own inventory entry (research U4)? Placement on the radar is Mission 2's content, not a manifest field. |
| Mission 3 | Agree the risk tier vocabulary and the assessment-reference format, including whether assessments expire. Confirm the lifecycle transition table for owner declarations against retirement expectations (research U6). List the metadata the Trust Framework needs (data handling, access controls, model use, third-party dependencies) for a later schema version. |
| Mission 5 | Integrate the validation-report contract and exit codes into the validate step. Agree which completeness level submission requires, and what curation effort per capability is acceptable (research U1, U8). Agree how owners confirm derived values (`provenance[].confirmedBy`), id and namespace assignment at submission time, and the use of `compat` in the improve step. |
| All | Use the eight representative manifests as a shared test set: for example for Mission 3's Trust Framework (3-5 capabilities) and as seed data for Mission 1. |
