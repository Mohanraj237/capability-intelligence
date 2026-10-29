# AI Capability Manifest: Rules and Conventions (POC draft)

This document states the rules that the proof of concept implements for **schema 0.1**, an
unpublished draft. It includes the metadata that the published mission boundaries ask for, and,
since 2026-10-23, the proposals of the [Spikes 1-3 research](../MISSION4_SPIKES_1_TO_3_RESEARCH.md),
which the Mission 4 lead asked to apply to the draft in place.
Field-level definitions are in the generated [field dictionary](field-dictionary/0.1.md). The
machine-readable contracts are [`schema/0.1/capability.schema.json`](../schema/0.1/capability.schema.json)
and the inter-team contracts in [`schema/contracts/`](../schema/contracts/). The division of
responsibilities with the other missions is in [mission-boundaries.md](mission-boundaries.md).

Every rule is tagged with its provenance:

- **[M4 §n]**: stated in the Mission 4 charter, section n. Where the charter itself calls the
  point "proposed" or "subject to Phase 0", that status still applies.
- **[POC, Spike n]**: a proposal made by this POC to fill a question that the charter leaves
  open. It is implemented so that it can be evaluated, and it needs confirmation by the owning
  spike. The four spike documents are charters without findings, so no rule here is a spike
  conclusion.
- **[R §n]**: proposed by the Spikes 1-3 research report, section n, from measurements on 60 real
  capability records, and applied to the 0.1 draft on 2026-10-23 at the Mission 4 lead's
  direction. It is still a proposal that the owning spike must confirm.

## 1. Principles

- A manifest describes one independently adoptable AI capability. It is a metadata and
  description contract, not a runtime execution protocol; manifest validity does not imply that
  a capability can be executed remotely. [M4 §2, §8]
- YAML is the authoring format and JSON Schema Draft 2020-12 is the validation contract, both
  still to be confirmed in Phase 0. [M4 §3] The schema is the single source of truth: the
  validator's hints, the lifecycle transitions, and the field dictionary are all read from it. [POC]
- Established protocols are referenced, not re-described: an interface points to its native
  contract (MCP server metadata, A2A Agent Card, OpenAPI document, SKILL.md) through
  `interfaces[].contractRef`. [M4 §8]
- Identity, publications, and relations are separate. The id identifies the capability; `source`
  and `publications` say where it is maintained and distributed, each with its native name and
  version; `relations` record forks, wrappers, and look-alikes. Matching on names fails on real
  data. [R §7.3, §10.2]
- Only the facts that every source supplies are mandatory; the rest are reported as completeness
  levels (§4). Each value may carry its provenance, so that consumers can tell stated, linked,
  inferred, and unknown facts apart. [R §11.1]

## 2. Capability definition and granularity

- Capability types: `skill`, `agent`, `mcp_server`, `plugin`, `tool`, `application`, `service`,
  `workflow` [M4 §2], plus `framework` and `platform`, because the capability landscape catalogues
  frameworks and platforms (Mission 2 boundaries) [POC, Spike 2, with Mission 2]. Type-specific
  rules exist only where the POC exercised them (§4).
- Independently adoptable parts of a bundle have their own manifest and are listed in the bundle's
  `components`; each child links back with `parent`. [M4 §2, §5]
- Parts that are not independently adoptable are described inline in `embeddedComponents`.
  Prompts, commands, hooks, and resources are modelled this way rather than as capability types.
  [POC, Spike 2; M4 §2 allows either]
- Documentation (READMEs, wikis) is a metadata source, not a capability. [M4 §2]

## 3. Naming conventions

| Element | Convention | Provenance |
|---|---|---|
| Field names | lowerCamelCase (`lifecycleStatus`) | [M4 §4] usage |
| Enumeration values | lower_snake_case (`mcp_server`) | [M4 §2] usage |
| Capability id | lowercase kebab-case `<namespace>/<name>`; segments may start with a digit | [POC, Spike 3; R §10.2] |
| Display `name` | 3-80 characters, no leading or trailing spaces; not unique, not an id | [POC, Spike 2] |
| Extension fields | `x-` prefix, then lowerCamelCase (`x-costCenter`) | [POC, Spike 1/2] |
| Manifest files | `<name>.capability.yaml`, one manifest per file (recommended, not enforced) | [POC] |

## 4. Field requirements

- **Mandatory** (6): `schemaVersion`, `id`, `name`, `capabilityType`, `source`, `riskTier`. Every
  sampled source supplies them, or they are assigned: `riskTier: unassessed` asserts nothing. They
  are six of the charter's ten mandatory-field candidates [M4 §4]. The other four stay in the
  schema, but no longer decide validity, because not every source states them [R §7.6, §13.1]:
  - `description`: 58 of 60 records; two Docker catalog entries have none;
  - `owner`, of which `owner.contact` and `owner.affiliation` are now optional too (an owner needs
    only a `name`);
  - `lifecycleStatus`: 17 of 60, almost all of them MCP Registry entries;
  - `lastUpdated`: a capability-specific date is missing for plugins in shared repositories.

  On the same 60 real records drafted the same way, the 2026-10-22 draft accepted 12 manifests and
  the revision accepts 57; drafted with the new fields, 58 are valid. The two that still fail state
  descriptions the schema cannot hold, 17 characters (the minimum is 20) and 1,221 (the maximum is
  1,024); the drafts never shorten a native value ([research results](../research/spikes-1-3/results.md)
  §10). Keeping `description` mandatory would also invalidate the two Docker entries without one,
  and Stage 2 would then miss 3 of the 14 judged identity links, because it checks only valid
  manifests.
- **Completeness levels** [R §11.3; POC]: above the mandatory fields, the schema defines cumulative
  levels (`x-completenessLevels`). The validator reports the level each structurally valid
  manifest reaches and the facts the next level needs; a level is enforced only when a caller asks
  for it (`validate --require-level <level>`), for example a catalog that lists only assessable
  records.

  | Level | Adds (any listed field states the fact) | Typically supplied by |
  |---|---|---|
  | discoverable | `description`; `interfaces` | Native metadata; a curator writes a missing description |
  | assessable | `runtime`; `license`; a version (`capabilityVersion`, or a publication's `nativeVersion` or `versionScheme`); a lifecycle signal (`lifecycleStatus`, `source.status` or `updatedAt`, or a publication's `status` or `updatedAt`); `owner.name` | Native metadata, with heuristic values confirmed |
  | adoptable | `setup` (`[]` declares none needed); `owner.contact`; `limitations` (`[]` declares none known) | The capability owner, through Mission 5's workflow |
  | governed | an assessed `riskTier` (not `unassessed`), which must cite `assessmentReference` | Mission 3 and the designated governance owners |

  A valid manifest without a description or an interface reaches no level (`none`). Measured on
  the 60 records: invalid 2, none 2, discoverable 25, assessable 31, adoptable 0 (no source states
  limitations), governed 0. The section 8 measurement of the research agrees for 56 of the 60; the
  other four are the two invalid records and two PyPI records that name no maintainer.
- **Conditional** [POC, Spike 2; R]:

  | When | Then required | Why |
  |---|---|---|
  | `riskTier` is `low`, `medium`, or `high` | `assessmentReference` | An assessed tier must cite its assessment, so a tier cannot be self-asserted. |
  | `lifecycleStatus` is `deprecated` or `retired` | `deprecation` (with `reason`) | Adopters need the reason and the replacement to plan a migration. |
  | `capabilityType` is `mcp_server` | an `interfaces` entry of type `mcp` | Type-specific requirement; references the MCP contract. |
  | `source.type` is `repository` or `provider` | `source.url` | A source must be locatable. |
  | `source.type` is `registry` | `source.registry`, `source.identifier` | Same. |
  | `source.type` is `other` | `source.description` | Same. |
  | `interfaces[].type` is `a2a` or `openapi` | `interfaces[].contractRef` | Reference the native contract instead of re-describing it. |
  | `license.expression` is absent | `license.text` | Terms that are not an SPDX expression are kept as stated, to be read. [R §7.4] |
  | `relations[].id` is absent | `relations[].locator` | A relation must identify its target. [R §10.1] |
  | `provenance[].method` is `derived` | `provenance[].basis` | Heuristic values must be told apart from values that follow from a documented convention. [R §9.4] |

  The rule that a `registry` source requires a SemVer `capabilityVersion` was removed: Docker
  catalog entries pin commits and plugins are often unversioned, and SemVer is never required
  [R §10.4].

- **Optional**: the remaining fields the charter says a manifest should describe (supported use
  cases, interfaces, dependencies, limitations, version, components) [M4 §8].
- **Added from the Spikes 1-3 research, all optional** [R §11.2, §11.5]:

  | Field | Journey question it answers | Measured availability (of 60) |
  |---|---|---|
  | `publications[]`: `kind`, `locator` (a Package URL, image reference, registry name, marketplace coordinate, or URL), `nativeName`, `nativeVersion`, `versionScheme`, `status`, `statusMessage`, `updatedAt`, `verifiedBy` | Where do I get it? Is this the same capability? | At least one each; 28 declare further publications |
  | `source.repositoryId`, `source.status`, `source.updatedAt` | Does a stale URL still identify the repository? Is it archived? | Forge id for 42 (every targeted record with a GitHub repository; the iteration-1 records were not looked up); one archived source |
  | `license`: `expression` (SPDX) or `text`, `url`, `scope` (`capability` or `repository`) | May we use it? | 24 native, 26 only from the repository |
  | `runtime[]`: `kind` (`local_process`, `container`, `hosted_service`, `agent_host`, `ci_runner`, `other`), `detail` | Where does it run? | 36 native, 24 derived |
  | `setup[]`: `name`, `description`, `secret`, `required`; `[]` declares none | What does it need? | 13 |
  | `documentation`, `keywords` | Where do I learn more? Does it match my terms? | 56 and 28 |
  | `relations[]`: `type` (`same_as`, `fork_of`, `wraps`, `derived_from`, `distinct_from`), `id` or `locator`, `evidence`, `verified` | Is it a fork, a wrapper, or a look-alike? | From curation or judgment; none stated natively |
  | `provenance[]`: `field` (JSON Pointer), `method` (`native`, `linked`, `derived`, `owner`, `curated`), `basis` (`convention` or `heuristic`), `source`, `observedAt`, `confirmedBy` | Can I rely on this value? | Computed by whoever drafts the manifest |
  | `interfaces[].transport` | How do I connect? | 14 native |

  `lastUpdated` is now defined as the date of the record. The date a capability changed in a
  channel is recorded per publication (`publications[].updatedAt`) or for the source
  (`source.updatedAt`); the charter's single date had both meanings [Q24; R §6.3].
- **Added in the boundary review, all optional** [POC; the information needs come from the
  published mission boundaries]:

  | Field | Needed by | Content owner |
  |---|---|---|
  | `maturity`: `prototype`, `pilot`, `production` | Mission 2 tracks maturity separately from availability; Mission 4 scope includes standardizing maturity | Mission 2 assigns the values; the definitions are to be agreed with it |
  | `intendedAudience` | Mission 2 identifies each capability's intended audience | Capability owners and Mission 2 |
  | `platformCompatibility` (kebab-case tokens) | Integration metadata, in Mission 4 scope; Mission 1 judges feasibility | Capability owners; the token vocabulary is not yet controlled |
  | `costInformation`: `model` plus `details` and `url` | Mission 1 ranks by cost where data is available | Capability owners |

  `lifecycleStatus` expresses availability, and `maturity` expresses evidence of real-world use.
- **Still deferred**: `techStack` [M4 §4], and structured abilities with an agreed vocabulary
  [R §12.4 U5]. Also deferred are the metadata Mission 3 needs to assess data handling, access
  controls, and model risk; Mission 3's Trust Framework defines those criteria first. Until then,
  record such information in `x-` extension fields.

## 5. Missing, unknown, and inapplicable values [POC, Spike 2]

| Situation | Representation |
|---|---|
| Mandatory field | Always present with a real value. Missing is an error. |
| Unknown or inapplicable optional value | Omit the field. Omitted means "not provided"; consumers must not infer a value. The completeness level lists what is missing. |
| Explicitly none | An empty list, where that is meaningful: `dependencies: []`, `limitations: []`, `components: []`, `setup: []`. It counts as stated for the completeness levels. |
| `null` | Never allowed. The validator explains the alternatives. |
| Unknown risk | The explicit value `riskTier: unassessed`, never an omission. It never counts towards the governed level. |
| Stated, linked, derived, curated [R §9.4] | `provenance[]` records, per value, whether the native metadata states it, a source it declares states it, a rule derives it (`basis: convention` or `heuristic`), or the owner or a curator declares it. A heuristic value without `confirmedBy` is reported as `DERIVED_VALUE_UNCONFIRMED` (unverified). |
| Conflicting [R §9.4] | Several publications state different versions (`PUBLICATION_VERSIONS_DIFFER`, unverified), or the declared and observed statuses disagree (`LIFECYCLE_SIGNALS_CONFLICT`, warning). Both values are kept; neither is chosen. |
| Unverified claim [R §9.4] | A relation without `verified: true` (`RELATION_UNVERIFIED`), and license terms in prose or read from the whole repository (`LICENSE_NEEDS_REVIEW`), are reported as unverified. |

`supportedUseCases` and `interfaces`, when present, need at least one entry, because "declared
none" is not meaningful for them.

## 6. Identifiers [rules M4 §5; format POC, Spike 3]

- Format: `<namespace>/<name>`. Both parts are lowercase kebab-case, and the namespace may have
  dot-separated segments (`acme.platform-ai/code-review`). Segments may start with a digit, because
  registry-verified namespaces do (`io.github.0xmortuex`); the 2026-10-22 draft rejected three such
  real ids [R §10.2]. Maximum 128 characters. Ids are lowercase, so uniqueness is case-insensitive.
- Every independently managed capability has exactly one id. Ids must be unique: the validator
  checks uniqueness across the manifests validated together (`DUPLICATE_ID`), and global
  uniqueness needs an inventory or registry, which is outside Mission 4. [M4 §5, §9]
- An id is assigned once and never changed or reused. It is not derived from anything that can
  change: the repository URL, owner, display name, version, lifecycle, or type. A repository URL is
  a source reference, not an id. [M4 §5] The validator explains this when a URL is used as an id.
- The namespace is an allocation scope (a product or domain), not the name of the owning team, so a
  reorganisation does not change ids. Who allocates namespaces is open. [POC, Spike 3]
- The readable form maps deterministically to a URN (`urn:<org-nid>:capability:<namespace>:<name>`),
  so choosing it does not preclude a URN-style final decision. [POC, Spike 3; M4 §5 lists both] The
  choice can stay provisional: with publications and relations carried separately, it affects
  allocation and stability, not discovery or linking. The AI Catalog's `urn:air` is the strongest
  external precedent to evaluate first. [R §10.2]

| Scenario [M4 §5] | Handling |
|---|---|
| Several capabilities in one repository | One manifest and id each; same `source.url`, different `source.path` (see `sql-review` and `sre-toolkit`). The same location under two ids is reported as `DUPLICATE_SOURCE`. |
| Repository moved or renamed | Only `source` changes; the id stays. `compat` reports `SOURCE_RELOCATED` as a non-breaking change. `source.repositoryId` (the forge's id) survives the rename, so a record that still cites the old URL is matched to the new one (`DUPLICATE_SOURCE` compares ids as well as URLs). [R §10.1] |
| One capability published in several channels | One manifest lists every channel in `publications`, each with its native name and version (see `playwright-mcp`: a registry entry, an npm package, a container image, a plugin). Manifests with different ids that list the same publication are reported as `DUPLICATE_PUBLICATION`, naming the others in `related`. On 60 real records, this check and `DUPLICATE_SOURCE` linked all 14 judged same-capability pairs, with no false link. [R §7.3] |
| Forks, wrappers, and look-alikes | Separate capabilities with their own ids, linked by `relations` (`fork_of`, `wraps`, `derived_from`, `distinct_from`); see `agentic-playwright-mcp`. A wrapper that adds only configuration may instead be listed as a publication (open question U4). |
| External tool or API without accessible source | `source.type: provider` with the provider URL; `owner.affiliation: external` (see `observability-mcp-server`). |
| Bundle with independently adoptable components | Each component has its own manifest and id; the bundle lists them in `components`, and each child declares `parent`. Non-reciprocal links are reported. |
| Parent and child references | Child ids are not nested under the parent id, so a component can move between bundles or stand alone without changing its id. |
| Capability versions | Versions are not part of the id; `capabilityVersion` and `publications[].nativeVersion` carry them. |

## 7. Lifecycle [values M4 §6 (proposed); transitions POC, Spike 3]

| State | Meaning (POC definition) |
|---|---|
| `experimental` | Available for trial; no stability or compatibility promise. |
| `active` | Maintained and offered for adoption. This is not an approval. |
| `deprecated` | Still available, but adopters should migrate; `deprecation.reason` is required. |
| `retired` | No longer available. Terminal; the id is never reused. |

| From | Allowed next states |
|---|---|
| `experimental` | `active`, `deprecated`, `retired` |
| `active` | `deprecated` (an active capability is deprecated before it is retired) |
| `deprecated` | `active` (reinstated), `retired` |
| `retired` | none |

The transitions are machine-readable (`x-lifecycleTransitions` in the schema) and enforced by
`compat`. Lifecycle, risk classification, and approval are separate concepts. [M4 §6]

Declared and observed lifecycle [R §10.3]:
- `lifecycleStatus` is the owner's declaration, and it is optional. The transition table governs
  declarations only: `compat` allows a first declaration and warns when a declaration is removed
  (`LIFECYCLE_STATUS_REMOVED`).
- What channels report is recorded as observed signals: `publications[].status` and `.statusMessage`
  (an MCP Registry status, an npm deprecation message) and `source.status` (an archived repository).
  Observed signals can change at any time and in any direction, because a source changed; no
  transition rule applies to them.
- The validator warns when the declaration and the signals disagree, or when one channel still
  lists as active what another reports deprecated or archived (`LIFECYCLE_SIGNALS_CONFLICT`). In the
  research sample, a catalog still offered a server whose repository was archived.

Ownership: Mission 4 defines the lifecycle as a data element, together with the integrity rules for
changing it. Mission 3 defines lifecycle *expectations*: when approval, monitoring, reassessment, and
retirement are required. The transition table must therefore be confirmed with Mission 3, and the
manifest encodes no approval or reassessment rules.

## 8. Risk semantics [M4 §6]

- `riskTier` is mandatory and has no default value. `unassessed` records that no assessment
  exists. The classification vocabulary is owned by Mission 3 ("establish risk classifications");
  the tier names are placeholders until it is agreed. [M4 §6; Mission 3 boundaries] Mission 4 owns
  only the field and its integrity rules.
- Missing or unassessed risk is never treated as low risk or as approval. [M4 §6] The validator
  reports `unassessed` as an **unverified** check (`RISK_UNASSESSED`), never as passed, and the
  exchange summary view (`export`) shows it as `UNASSESSED`.
- An assessed tier requires `assessmentReference`. [POC] Only an assessed tier reaches the
  `governed` completeness level; no native metadata supplies one. [R §11.3]
- Passing validation does not mean a capability is safe or approved for production. Restrictions
  are decided by consuming and governance processes. [M4 §3, §6] The manifest therefore has no
  approval field.

## 9. Versioning and compatibility [distinction M4 §7; scheme POC, Spike 3]

### schemaVersion (the metadata contract)

- A quoted `"MAJOR.MINOR"` string; this POC defines `"0.1"`. Unquoted `0.1` is a YAML number and
  is rejected with a hint.
- The validator routes each manifest to the schema for its declared version
  (`schema/<version>/capability.schema.json`). A well-formed but unsupported version is rejected
  explicitly (`SCHEMA_VERSION_UNSUPPORTED`) and is not partially validated against another version's
  rules. A missing or malformed version is reported, and the rest of the manifest is checked against
  the latest schema so that the author gets complete feedback.
- Proposed evolution rules:
  - A published schema version is immutable.
  - **MINOR** (non-breaking for existing manifests): add an optional field, add an enumeration
    value, relax a constraint.
  - **MAJOR** (breaking): add a mandatory field or a conditional requirement, remove or rename a
    field, remove an enumeration value, tighten a constraint, or change a type or meaning.
  - Compatibility is checked, not assumed from version numbers. `schema-compat <previous> <next>`
    classifies every difference as breaking, additive, relaxation, or annotation-only, and derives
    the required bump. With `--corpus` it also re-declares manifests that are valid under
    `<previous>` as `<next>` and re-validates them; any regression makes the change breaking. A
    breaking change under a MINOR bump is an error from 1.0 onwards and a warning below 1.0
    (SemVer §4). Each field dictionary lists its changes since the previous version.
  - While 0.1 is an unpublished draft, it may be revised in place. The fields added in the boundary
    review were checked this way: `schema-compat <earlier 0.1 draft> schema/0.1/capability.schema.json
    --corpus examples` classified the revision as additive, and all 8 manifests valid under the
    earlier draft stayed valid. The tool also warns that the contract changed without a version
    change, which is acceptable only before publication. Once 0.1 is published, changes go to a new
    version.
  - The revision of 2026-10-23 was checked the same way, against the draft and the manifests of
    2026-10-22, both kept in [`research/spikes-1-3/reference/`](../research/spikes-1-3/reference/):
    `schema-compat research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json 0.1 --corpus
    research/spikes-1-3/reference/examples-2026-10-22`. It reports relaxations (requirements and a
    conditional rule removed), additions (fields and completeness levels), and one change it
    classifies as breaking: the id pattern, at the five places that use it. The tool cannot prove
    that a changed pattern accepts every earlier value; the new pattern only adds digit-first
    segments, and all 9 manifests valid under the earlier draft stay valid. Changes to completeness
    levels are classified too: a level that requires more is breaking for callers that enforce it.
  - Validators keep accepting the previous versions for a deprecation window, and each new version
    ships with migration notes. The length of the window is open. Manifests of different versions
    can be validated in one run; each is routed to its own schema.
  - Consumers may read a newer MINOR version of the same MAJOR, ignoring fields they do not know
    (tolerant reader), when `schema-compat` classified it as non-breaking. They must not read another
    MAJOR version.
  - A manifest that uses a field or value from a newer registered version is told which
    `schemaVersion` to declare.

### capabilityVersion (the capability)

- Semantic Versioning 2.0.0, independent of `schemaVersion`, and optional. Versions in other
  schemes are recorded per publication: `publications[].nativeVersion` with its `versionScheme`
  (`semver`, `pep440`, `calver`, `commit`, `tag`, `floating`, `unversioned`, `other`). Versions are
  compared only when their schemes allow it; publications that state different comparable versions
  are reported as `PUBLICATION_VERSIONS_DIFFER`. SemVer is never required. [R §10.4]
- `compat <previous> <next>` classifies each change by its impact on consumers and checks the bump:

  | Impact | Changes | Required bump |
  |---|---|---|
  | breaking | interface, use case, component, or embedded component removed; `capabilityType` changed | MAJOR |
  | additive | interface, use case, component, embedded component, or dependency added | MINOR |
  | metadata | description, owner, source, risk tier, lifecycle, or limitations changed; dependency removed; interface details updated; any other field changed (publications, relations, license, runtime, setup, keywords, documentation, provenance, extensions) | none |

- An insufficient bump is an error from 1.0.0 onwards and a warning below 1.0.0 (SemVer §4). A
  decreasing version, a changed id, or a lifecycle transition that is not allowed is an error. When
  either revision has no `capabilityVersion`, the version check is reported as unverified.
- Limits: the classification is heuristic and manifest-based. It does not inspect the native
  contracts (for example MCP tool schemas or an OpenAPI document), so a breaking change inside a
  referenced contract is not detected.

## 10. Extensibility [POC, Spike 1/2]

- The core is closed: an unknown field is an error, which catches typos (`lifecyleStatus`), and the
  validator suggests the closest field. A field name that a native format uses for a manifest field
  (`tags`, `homepage`, `version`, `author`, `repository`) is answered with the field to use; the
  names are listed in the schema's `x-synonyms` annotation and the field dictionary. [R §6.2]
- Top-level fields prefixed with `x-` are extension fields. They are accepted without validation
  and ignored by core consumers. Nested objects are closed in v0.1.
- A useful extension is promoted by proposing it as a field in the next MINOR schema version.

## 11. Validation contract [M4 §3]

1. **Parse**: YAML 1.2, one document per file. Duplicate keys are errors. Unquoted values that YAML
   1.1 parsers read as dates or booleans produce a `YAML_PORTABILITY` warning.
2. **Stage 1, structural**: schema-version routing, then JSON Schema validation (required fields,
   types, allowed values, formats, conditional rules, unknown fields).
3. **Stage 2, consistency** (only for structurally valid manifests, across all manifests validated
   together): duplicate ids, sources (by URL and repository id), and publications; references
   (dependencies, components, parent, replacement, relations); lifecycle of referenced
   capabilities; parent and child reciprocity; date sanity; deprecation and status mismatch;
   conflicts between declared and observed lifecycle; differing publication versions; claimed
   relations; license terms that need reading; provenance (pointers that resolve, heuristic values
   not yet confirmed); risk assessment state; and source reachability. Reachability is checked over
   the network only with `--check-sources` (https only); otherwise it is reported as unverified.
4. **Completeness**: the level each structurally valid manifest reaches, with the facts each higher
   level needs. It is reported in every result, and is an error (`COMPLETENESS_BELOW_REQUIRED`) only
   below the level given with `--require-level`. [R §11.3]

Severities:

| Severity | Meaning | Effect |
|---|---|---|
| `error` | The manifest violates the contract. | Manifest invalid; exit code 1 |
| `warning` | Valid, but likely wrong or risky. | Still valid |
| `unverified` | A check that this run could not confirm. It has neither passed nor failed. | Still valid |

Each finding has `severity`, `stage`, `check`, a stable `code`, a JSON Pointer `path`, `line` and
`column` in the source file, a `message` (what is wrong), and a `hint` (how to fix it, or what to do
next). Findings about shared sources and publications also list the other manifests' ids in
`related`. Each result carries its `completeness` (`level` and the `unmet` facts per level). Each report repeats the charter's caveat: structural validity does not establish that a
source is reachable, a dependency is available, or a capability is secure or approved for
production. The JSON report is a versioned contract (`reportFormatVersion` 0.1, described by
[`validation-report-0.1.schema.json`](../schema/contracts/validation-report-0.1.schema.json)), for
automation such as the validation step of Mission 5's contribution workflow.

| Stage | Codes |
|---|---|
| Structural, error | `YAML_SYNTAX_ERROR`, `DUPLICATE_KEY`, `NOT_A_MAPPING`, `SCHEMA_VERSION_UNSUPPORTED`, `MISSING_REQUIRED_FIELD`, `CONDITIONAL_FIELD_REQUIRED`, `CONDITIONAL_RULE_VIOLATION`, `UNKNOWN_FIELD`, `INVALID_TYPE`, `INVALID_VALUE`, `INVALID_FORMAT`, `CONSTRAINT_VIOLATION`, `SCHEMA_VIOLATION` |
| Structural, warning | `YAML_PORTABILITY` |
| Consistency, error | `DUPLICATE_ID`, `SELF_REFERENCE` |
| Consistency, warning | `DUPLICATE_SOURCE`, `DUPLICATE_PUBLICATION`, `REFERENCE_TO_DEPRECATED`, `REFERENCE_TO_RETIRED`, `PARENT_CHILD_MISMATCH`, `DATE_IN_FUTURE`, `DEPRECATION_STATUS_MISMATCH`, `LIFECYCLE_SIGNALS_CONFLICT`, `PROVENANCE_FIELD_NOT_FOUND`, `SOURCE_UNREACHABLE` |
| Consistency, unverified | `UNRESOLVED_REFERENCE`, `RELATION_UNVERIFIED`, `PUBLICATION_VERSIONS_DIFFER`, `LICENSE_NEEDS_REVIEW`, `DERIVED_VALUE_UNCONFIRMED`, `RISK_UNASSESSED`, `SOURCE_NOT_CHECKED`, `SOURCE_NOT_CHECKABLE`, `SOURCE_NOT_ACCESSIBLE` |
| Completeness, error | `COMPLETENESS_BELOW_REQUIRED` (only with `--require-level`) |
| Compatibility | Errors: `IDENTITY_CHANGED`, `LIFECYCLE_TRANSITION_NOT_ALLOWED`, `VERSION_DECREASED`, `INSUFFICIENT_VERSION_BUMP` (a warning below 1.0.0). Warning: `LIFECYCLE_STATUS_REMOVED`. Unverified: `VERSION_NOT_COMPARABLE` |

## 12. Interoperability rules [POC, from the cross-implementation evaluation]

The same schema was evaluated with a second, independent implementation (Python `jsonschema` with
PyYAML). All example verdicts agreed; after the revision of 2026-10-23 they still agree for all 16
examples (`jsonschema` 4.25.1, PyYAML 6.0.3). Three differences were found in edge cases; they lead to these
rules for anyone producing or validating manifests:

1. **Quote dates and version strings.** YAML 1.1 parsers such as PyYAML read an unquoted
   `2026-10-12` as a date object, which fails `type: string`.
2. **Reject duplicate keys.** PyYAML keeps the last value silently. A manifest with `riskTier: high`
   followed by `riskTier: low` is read as `low`, which quietly downgrades the risk tier.
3. **Assert formats.** Draft 2020-12 treats `format` as an annotation by default, so `"2026-02-30"`
   passes unless the validator enables format assertion (Python: `FormatChecker`). The schema also
   uses `pattern` for the shape of values, which every validator enforces.

## 13. Guidance for consumers

- Exchange manifests unchanged. `export` produces a Capability Exchange Document
  ([`exchange-document-0.1.schema.json`](../schema/contracts/exchange-document-0.1.schema.json)): the
  valid manifests exactly as authored, their warnings and unverified checks, and the rejected
  inputs. Once there are several schema versions, one document can mix them; validate each
  manifest against its own `schemaVersion`.
- Validate before use, and consume only valid manifests. Keep the warnings and unverified checks
  with the data.
- Read the common fields only, through one code path for all capability types. Ignore `x-` fields.
- Expect partial records. The exchange document carries each manifest's completeness level;
  filter on it rather than assuming that every field is present.
- Resolve references by id, never by source URL. Recognise the same capability across sources by
  its publications and its source repository id, never by its name: two different skills share the
  name `pdf`, and a name-only match merged two pairs of different capabilities. [R §7.3]
- Treat a value whose provenance is a heuristic, and a relation that is not verified, as a claim to
  confirm, not as a fact.
- Treat a missing or unassessed risk tier as unassessed, never as low risk, and never treat a risk
  tier or a valid manifest as an approval.
