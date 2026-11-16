# AI Capability Manifest Standard, version 0.1

| | |
|---|---|
| Owner | Mission 4: AI Capability Intelligence & Standards |
| Version | 0.1, final draft for cross-mission review (2026-11-16) |
| Audience | Missions 1, 2, 3, and 5, and AI teams that build or consume agents, MCP servers, skills, and plugins |
| Status | Mission 4's field testing is complete: every field was tested against 22 real capabilities and five user journeys. The content below is what Mission 4 proposes to publish as 0.1. On 2026-11-16 Mission 4 accepted every schema change and recorded the answers of Missions 1, 2, 3, and 5 on identifiers, listing, and risk (§13). The items still open in §13 do not change the structure; after publication, every change follows the versioning rules in §8 |
| Machine-readable form | `schema/0.1/capability.schema.json` (JSON Schema 2020-12), `$id` `https://raw.githubusercontent.com/Mohanraj237/capability-intelligence/main/schema/0.1/capability.schema.json`. Where this page and the schema differ, the schema wins |

## Contents

1. What a manifest is
2. Who reads it, and for what
3. Two examples
4. The fields
5. Conditional rules
6. Completeness levels
7. Values: missing, empty, unknown, guessed
8. Identity, naming, and versions
9. Validation
10. For AI teams and AI hosts
11. For recommenders, catalogues, and contributors
12. Evidence behind this standard
13. Open items, and what Mission 4 needs from each mission

## 1. What a manifest is

A **capability manifest** is one structured record, written in YAML (JSON is accepted for storage and
exchange), that describes **one independently adoptable AI capability**: a skill, an MCP server, an
agent, a plugin, a tool, a library, or another of the 11 types in §4.1.

| Principle | What it means |
|---|---|
| One record per capability | A package that contains several independently usable capabilities gets one record per capability, linked through `components` and `parent`. Parts that cannot be used alone (tools, commands, hooks, prompts) are listed inside the record |
| One structure for every type | The same fields mean the same thing for every type. A few rules depend on the type (§5) |
| Describe, do not copy | Where a native definition exists (`SKILL.md`, MCP `server.json`, an A2A Agent Card, an OpenAPI document), the manifest links to it instead of repeating it |
| Few mandatory fields, levels for the rest | Six fields are mandatory. Everything else adds to a **completeness level** (§6), so incomplete public records can still be listed, with their gaps visible |
| Every value can say where it came from | `provenance` tells values the source states apart from values a curator wrote or a tool guessed |
| Unknown risk is never low risk | `riskTier: unassessed` is mandatory when no assessment exists. A valid record is never an approval |

**What a manifest is not:** it is not a runtime protocol (MCP and A2A are), not an approval, not a
risk assessment, not an inventory, and not a recommendation. Those belong to Missions 1, 2, 3, and 5.

## 2. Who reads it, and for what

| Reader | Uses the manifest to | Reads mainly |
|---|---|---|
| **Mission 1** (Recommendation) | Match a need, judge feasibility, rank by risk and cost, explain alternatives | `description`, `supportedUseCases`, `capabilityType`, `interfaces`, `publications[].platformCompatibility`, `integrations`, `runtime`, `setup`, `limitations`, `license`, `costInformation`, `riskTier`, `maturity`, `lifecycleStatus`, `deprecation` |
| **Mission 2** (Landscape) | Catalogue capabilities and recognise one capability across sources | `id`, `name`, `capabilityType`, `source`, `publications`, `relations`, `owner`, `maturity`, `supportedUseCases` |
| **Mission 3** (Trust) | Queue unassessed capabilities, see what they can change and where data goes | `riskTier`, `assessmentReference`, `limitations`, `setup`, `owner`, `license`, `lifecycleStatus`, `deprecation` |
| **Mission 5** (Contribution) | Validate submissions, ask owners for missing facts, track revisions | The validation report; the completeness level and its missing facts; `owner`, `provenance`, `lastUpdated` |
| **AI hosts and agent builders** | Decide when to use a capability, and install and connect it | `description`, `supportedUseCases`, `interfaces`, `publications` (with each one's `platformCompatibility`), `setup`, `embeddedComponents`, `limitations` (§10) |

Mission 4 provides three artefacts: the **manifest**; the **validation report** (JSON, for Mission
5's validate step); and the **exchange document** (JSON: valid manifests passed through unchanged,
each with its completeness level and open caveats, for Missions 1 and 3).

## 3. Two examples

**The smallest valid manifest.** It is valid, and its completeness level is `none`: it can be
stored, but not yet listed.

```yaml
schemaVersion: "0.1"
id: ai-platform/sql-review
name: SQL Review
capabilityType: skill
source:
  type: repository
  url: https://github.com/example-org/ai-capabilities
  path: skills/sql-review
riskTier: unassessed
```

**A real MCP server at the `adoptable` level** (Playwright MCP, read from its public sources on
2026-11-13, hosts re-checked 2026-11-16; shortened, provenance omitted).

```yaml
schemaVersion: "0.1"
id: microsoft/playwright-mcp
name: Playwright MCP
capabilityType: mcp_server
capabilityVersion: "0.0.85"
description: >-
  MCP server by Microsoft that lets an AI agent automate a browser with Playwright. The agent
  works from structured accessibility snapshots of the page instead of screenshots, so no vision
  model is needed: it navigates, clicks, fills forms, and takes screenshots.
source:
  type: repository
  url: https://github.com/microsoft/playwright-mcp
  repositoryId: "952688112"
  status: active
publications:
  - kind: registry_entry
    locator: io.github.microsoft/playwright-mcp
    nativeVersion: "0.0.85"
    versionScheme: semver
    status: active
  - kind: package
    locator: pkg:npm/%40playwright/mcp
    nativeName: "@playwright/mcp"
    nativeVersion: "0.0.85"
    versionScheme: semver
    platformCompatibility:
      - claude-code
      - claude-desktop
      - codex
      - cursor
      - gemini-cli
      - github-copilot
      - windsurf
owner:
  name: Microsoft Corporation
  contact: https://github.com/microsoft/playwright-mcp/issues
  affiliation: external
license:
  expression: Apache-2.0
  scope: capability
riskTier: unassessed
lastUpdated: "2026-11-16"
supportedUseCases:
  - title: Let a coding agent click through a web application
  - title: Capture screenshots and page state
interfaces:
  - type: mcp
    transport: stdio
runtime:
  - kind: local_process
    detail: Node.js >=18.
setup:
  - name: PLAYWRIGHT_MCP_HEADLESS
    kind: env_var
    description: Optional. Run the browser headless; headed by default.
    secret: false
    required: false
dependencies: []
limitations:
  - By default the browser keeps a persistent profile on disk, so logins and cookies survive between sessions; use --isolated for tests.
costInformation:
  model: free
  details: Apache-2.0 open source; no charge.
```

## 4. The fields

Requirement: **M** mandatory · **C** conditional (§5) · **O** optional. Level: the completeness
level that needs the field (§6). Inside a list or group, "**req**" means required whenever the
group is given.

### 4.1 Identity

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `schemaVersion` | M | - | Version of this standard the record follows | `"0.1"`, quoted |
| `id` | M | - | Permanent identifier, assigned once, never changed or reused (§8) | `namespace/name`: lowercase, hyphens, dots allowed in the namespace; up to 128 characters |
| `name` | M | - | Display name. Not unique, not an identifier | 3-80 characters, no leading or trailing space |
| `capabilityType` | M | - | The primary kind of capability, by how it is adopted | `skill`, `agent`, `mcp_server`, `plugin`, `tool` (run by a person or agent), `library` (called by code), `application`, `service`, `workflow`, `framework` (for building agents or applications), `platform` |
| `capabilityVersion` | O | assessable (a version) | The capability's own version, when its owner uses Semantic Versioning | `"1.3.0"`, quoted, no `v`. Other schemes go in `publications[].nativeVersion` |

### 4.2 Description

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `description` | O | discoverable | What it does and the problem it solves | 20-1024 characters |
| `supportedUseCases[]` | O | - | Use cases it is meant for. **Recommended for every capability**: the strongest field for search after the description | 1-20 items: `title` (req), `description` |
| `keywords[]` | O | - | Search terms and tags from the source. Not categories | 1-30 items |
| `documentation` | O | - | Documentation or home page | `https://` URL |
| `limitations[]` | O | adoptable | Known limitations, including write access, telemetry, and data sent to third parties. `[]` declares none known | Free-text items |

### 4.3 Source and distribution

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `source` | M | - | The canonical origin: where the capability is maintained | Group |
| `source.type` | req | - | Kind of source | `repository`, `registry`, `provider`, `other` |
| `source.url` | C | - | Repository or provider URL | `https://` URL |
| `source.path` | O | - | Path inside a repository that holds several capabilities | Relative path |
| `source.repositoryId` | O | - | The forge's permanent repository id; survives renames and moves | Quoted string, for example `"952688112"` |
| `source.status` | O | assessable (lifecycle signal) | Status the source reports (observed, not declared) | `active`, `deprecated`, `deleted`, `archived`, `yanked` |
| `source.updatedAt` | O | assessable (lifecycle signal) | Date of the latest change the source reports | `"YYYY-MM-DD"` |
| `source.registry`, `source.identifier` | C | - | Registry name and package id, for a registry source | Text |
| `source.description` | C | - | How the capability is obtained, for an `other` source | Text |
| `publications[]` | O | - | Every channel that distributes this same capability | List |
| `publications[].kind` | req | - | Kind of channel | `registry_entry`, `package`, `container_image`, `marketplace_entry`, `hosted_endpoint`, `repository`, `other` |
| `publications[].locator` | req | - | Where to find it, in the channel's own form (§8.3) | No spaces; compared case-insensitively |
| `publications[].nativeName` | O | - | The name in this channel, when it differs | Text |
| `publications[].nativeVersion` | O | assessable (a version) | The version this channel states | Text, in its own scheme |
| `publications[].versionScheme` | O | assessable (a version) | Scheme of `nativeVersion`. `unversioned` declares that the channel has no version | `semver`, `pep440`, `calver`, `commit`, `tag`, `floating`, `unversioned`, `other` |
| `publications[].status`, `.statusMessage` | O | assessable (lifecycle signal) | Status the channel reports, and its message | As `source.status` |
| `publications[].updatedAt` | O | assessable (lifecycle signal) | Latest publish date in the channel | `"YYYY-MM-DD"` |
| `publications[].verifiedBy` | O | - | How this channel is known to belong to the capability | Text |
| `publications[].platformCompatibility[]` | O | - | **AI hosts and clients** in which this channel has documented or tested support, named by the **agent** that loads it, not the editor (MCP servers in VS Code are used by GitHub Copilot: `github-copilot`). **The only place hosts are stated**: a capability supports the union of its publications' hosts, and the publication that lists a host is the one to install for it. Not languages, runtimes, or operating systems. Omit it for a channel that runs in no AI host (a library package). A capability used from its repository states its hosts on a `repository` publication with the ref | `claude-code`, `claude-desktop`, `codex`, `cursor`, `devin`, `gemini-cli`, `github-copilot`, `windsurf` |

**`source` and `publications` hold different facts** (tested on all 22 capabilities). `source` is
where the capability is maintained: it anchors identity (`url`, `path`, `repositoryId`) and shows
whether the maintained code is alive (`status`, `updatedAt`). `publications` are what adopters
install or connect to, each with its own version and status. A repository is listed under
`publications` only when people use it directly (an Agent Skill folder, a CI action), and then it
states the ref they pin: `nativeVersion` `v1` with `versionScheme: tag`, or `main` with
`floating`. A repository publication without a ref only repeats `source`; the validator reports it
(`PUBLICATION_REPEATS_SOURCE`). Record each fact once.

### 4.4 Ownership and terms

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `owner.name` | req | assessable | The owning team, maintaining organisation, or verified publisher | Text |
| `owner.contact` | O | adoptable | How to reach the maintainers | Email address or `https://` URL |
| `owner.affiliation` | O | - | Internal or external | `internal`, `external` |
| `license.expression` | O | assessable (license) | The license as an SPDX expression | For example `MIT`, `Apache-2.0`, `LicenseRef-...` |
| `license.text` | C | assessable (license) | The terms as stated, when they are not an SPDX license | Text |
| `license.url`, `license.scope` | O | - | Where the terms are; whether they were read for this capability or for the whole repository | `scope`: `capability`, `repository` |
| `costInformation.model` | req | - | Cost model | `free`, `included`, `subscription`, `usage_based`, `provider_billed` (free software that calls a paid third-party service), `chargeback`, `other` |
| `costInformation.details`, `.url` | C, O | - | Explanation, and the pricing page | Text; `https://` URL |

### 4.5 Status and lifecycle

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `lifecycleStatus` | O | assessable (lifecycle signal) | Availability, **declared by the owner** | `experimental`, `active`, `deprecated`, `retired` (§8.4) |
| `deprecation` | C | - | Why it is deprecated: `reason` (req), `replacedBy` (an id), `sunsetDate` | Group |
| `maturity` | O | - | How proven it is in real use **in this organisation**; set by Mission 2. `prototype`: demonstrated, not yet used for real work; `pilot`: used for real work by a limited group; `production`: used in production and supported for wider adoption (confirmed by Mission 2) | `prototype`, `pilot`, `production` |
| `lastUpdated` | O | - | When this record was last edited (not when the capability changed) | `"YYYY-MM-DD"` |

### 4.6 Risk

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `riskTier` | M | governed (when assessed) | Risk assessment state. `unassessed` when there is no assessment: never treated as low | `unassessed`, `low`, `medium`, `high` (confirmed by Mission 3) |
| `assessmentReference` | C | governed | The assessment that set the tier: `id` (req), `assessedOn` (req), `url`. **An assessment is valid for 12 months** from `assessedOn`; after that the validator warns (`ASSESSMENT_EXPIRED`) until a new one is recorded | Group |

### 4.7 Technical

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `interfaces[]` | C | discoverable | How the capability is used | List |
| `interfaces[].type` | req | discoverable | Protocol or way of use | `mcp`, `a2a`, `openapi`, `agent_skill`, `cli`, `library`, `ci_action`, `ui`, `other` |
| `interfaces[].transport` | O | - | Transport, for MCP and A2A | For example `stdio`, `streamable-http` |
| `interfaces[].contractRef` | C | - | Link to the native contract: `SKILL.md`, MCP `server.json`, Agent Card, OpenAPI document. Required for `a2a` and `openapi`; **recommended for every MCP server** | `https://` URL |
| `interfaces[].specVersion`, `.description` | O | - | Protocol version; a short description | Text |
| `interfaces[].inputs[]`, `.outputs[]` | O | - | What it accepts and returns: `name` (req), `mediaType`, `description` | List |
| `runtime[]` | O | assessable | Where it runs: `kind` (req), and `detail`: what the environment requires or who operates it (`Node.js >=18`, `Hosted by Exa.`). The detail does not repeat a publication: no package name, image, install command, or host | `kind`: `local_process`, `container`, `hosted_service`, `agent_host`, `ci_runner`, `other` |
| `setup[]` | O | adoptable | What an adopter must provide. `[]` declares that nothing is needed | List |
| `setup[].name` | req | adoptable | The item, for example `GITHUB_TOKEN` | Up to 120 characters |
| `setup[].kind` | O | - | What kind of item it is | `env_var`, `input`, `header`, `system_package`, `software`, `account`, `app`, `setting`, `other` |
| `setup[].group` | O | - | Alternatives: items that share a group are one way of setting it up; the adopter supplies the required items of **one** group. Items without a group are always needed | Lowercase with hyphens, for example `jira-cloud`, `jira-server-data-center`. At least two groups |
| `setup[].description`, `.secret`, `.required` | O | - | Explanation; whether it is a secret; whether it is needed (within its group, if it has one) | Text; `true`/`false` |
| `integrations[]` | O | - | Systems, products, and frameworks it connects to or plugs into | Lowercase tokens with hyphens, for example `gitlab`, `jira-data-center`, `langchain` |
| `dependencies[]` | O | - | **Other registered capabilities** it requires, by `id`. Installed software, accounts, runtimes, and connected systems go in `setup`, `runtime`, and `integrations`. `[]` means it needs no other registered capability | List of `{ id }` |
| `costInformation` | O | - | See §4.4 | Group |

### 4.8 Structure

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `components[]` | O | - | Independently usable capabilities this package contains, by `id` | List of `{ id }` |
| `parent` | O | - | The package this capability belongs to, by `id` | `{ id }` |
| `embeddedComponents[]` | O | - | Parts that cannot be used alone: `name` (req), `type` (req), `description` | `type`: `prompt`, `command`, `hook`, `resource`, `tool`, `skill`, `agent`, `other` |
| `relations[]` | O | - | Links to other entries: `type` (req), `id` or `locator`, `evidence`, `verified` | `type`: `same_as`, `fork_of`, `wraps`, `derived_from`, `distinct_from` |

### 4.9 Data quality and extensions

| Field | Req. | Level | Meaning | Values and format |
|---|---|---|---|---|
| `provenance[]` | O | - | Where values came from: `field` (req, a JSON Pointer), `method` (req), `source` (req), `basis`, `observedAt`, `confirmedBy` | `method`: `native` (the source states it), `linked` (a source it declares), `derived` (inferred), `owner`, `curated`. `basis`: `convention`, `heuristic` |
| `x-...` | O | - | Organisation-specific extension fields. Accepted, never checked, ignored by core consumers | Any; name starts with `x-` |

Any other field name is rejected, so typos are caught. Common names from other formats are pointed
to the right field: `tags` to `keywords`, `version` to `capabilityVersion`, `homepage` to
`documentation`, `author` to `owner`, `repository` to `source`. The two fields removed during
Phase 1 are answered with where their content goes: a top-level `platformCompatibility` moves to
`publications[].platformCompatibility`, and `intendedAudience` to `supportedUseCases` (or
`x-intendedAudience`).

## 5. Conditional rules

| When | Then also required | Why |
|---|---|---|
| `riskTier` is `low`, `medium`, or `high` | `assessmentReference` with `id` | A tier cannot be self-asserted |
| `lifecycleStatus` is `deprecated` or `retired` | `deprecation` with `reason` | Adopters must be able to plan a move |
| `capabilityType` is `mcp_server` | An `interfaces` entry with `type: mcp` | An MCP server must declare its MCP interface |
| `source.type` is `repository` or `provider` | `source.url` | The source must be locatable |
| `source.type` is `registry` | `source.registry` and `source.identifier` | The source must be locatable |
| `source.type` is `other` | `source.description` | The source must be locatable |
| `license.expression` is absent | `license.text` | Custom terms are kept for a person to read |
| `interfaces[].type` is `a2a` or `openapi` | `interfaces[].contractRef` | The native contract is linked, not re-described |
| `costInformation.model` is `other` | `costInformation.details` | An unusual model must be explained |
| A `relations` entry has no `id` | `relations[].locator` | A link must identify its target |
| A `provenance` entry has `method: derived` | `provenance[].basis` | Guessed values must be identifiable |

## 6. Completeness levels

Each level includes the levels below it. A record is valid at whatever level it reaches; the
validator reports the level and the facts still missing for the next one.

**Agreed thresholds (2026-11-16):** a record is **listed in the catalogue and recommended only at
`adoptable` or `governed`**. Records below that are valid and kept, with their missing facts
reported to the owner, but they are not listed. Mission 5 can enforce the threshold at submission
with `validate --require-level adoptable`.

| Level | What it means | Facts needed (any listed field counts) | Usually supplied by |
|---|---|---|---|
| `none` | Valid, but only the mandatory fields | - | - |
| `discoverable` | It can be found and understood | `description`; `interfaces` | The source; a curator writes a missing description |
| `assessable` | A reuse assessment can start | `runtime`; `license`; a version (`capabilityVersion`, `publications[].nativeVersion`, or `publications[].versionScheme`); a lifecycle signal (`lifecycleStatus`, `source.status`, `source.updatedAt`, `publications[].status`, `publications[].updatedAt`); `owner.name` | The source |
| `adoptable` | A team can adopt it without asking anyone | `setup` (`[]` allowed); `owner.contact`; `limitations` (`[]` allowed) | The owner |
| `governed` | A risk assessment is recorded | `riskTier` other than `unassessed`, with `assessmentReference` | Mission 3 |

Two notes from testing:

- `versionScheme: unversioned` satisfies the version fact. It is a declared answer ("there is no
  version; pin a commit"), like `setup: []`.
- The lifecycle signal is usually **observed** (an active, non-archived repository), not declared.
  A consumer that needs the owner's declaration must read `lifecycleStatus` itself.

## 7. Values: missing, empty, unknown, guessed

| Situation | How it is recorded |
|---|---|
| A mandatory field | Always present with a real value; otherwise the record is invalid |
| An optional value that is not known | The field is left out. Leaving it out means "not provided"; never fill in a guess |
| Explicitly none | An empty list: `setup: []`, `limitations: []`, `dependencies: []` |
| `null` or an empty string | Not allowed |
| Unknown risk | `riskTier: unassessed` |
| Sources disagree (different versions on npm and Docker) | Keep both, in their publications. The validator reports `PUBLICATION_VERSIONS_DIFFER` |
| A guessed value | `provenance` with `method: derived` and `basis: heuristic`, until the owner or a curator confirms it (`confirmedBy`), which closes the review |
| Evidence older than 180 days | Reported once per manifest (`EVIDENCE_STALE`): re-read those values from their sources and update `observedAt` |
| A license read from the whole repository | `license.scope: repository`, reported for review until the owner or a curator confirms it applies (`confirmedBy` on the `/license` provenance entry) |
| A host, platform, or system not listed | Unknown, never incompatible |

## 8. Identity, naming, and versions

### 8.1 Identifier rules

1. Every capability has exactly one `id`, **assigned by Mission 5's workflow when a submission is accepted**, never changed and never reused, even after retirement.
2. An id is never built from anything that can change: the URL, owner, display name, version, status, or type.
3. The namespace is a product, a domain, or a verified publisher, not a team name, taken from a **registered list kept by Mission 2**.
4. Ids are unique across the catalogue, ignoring case.
5. Links between records (`dependencies`, `components`, `parent`, `deprecation.replacedBy`, `relations[].id`) always use the id.
6. The same capability is recognised by its publication locators and `source.repositoryId`, **never by its name**.

### 8.2 Naming conventions

| Element | Convention | Example |
|---|---|---|
| Field names | camelCase | `lifecycleStatus` |
| Values from fixed lists | lowercase with underscores | `mcp_server`, `provider_billed` |
| AI host and integration tokens | lowercase with hyphens | `claude-code`, `jira-data-center` |
| Extension fields | `x-` then camelCase | `x-costCenter` |
| File name | `<name>.capability.yaml`, one capability per file | `sql-review.capability.yaml` |
| Dates and versions | Quoted | `"2026-11-16"`, `"1.3.0"` |

### 8.3 Publication locators

| `kind` | Format | Example |
|---|---|---|
| `package` | Package URL | `pkg:npm/%40playwright/mcp`, `pkg:pypi/docling` |
| `container_image` | Image name without a tag | `docker.io/mcp/playwright` |
| `registry_entry` | The registry's name | `io.github.microsoft/playwright-mcp` |
| `marketplace_entry` | `name@marketplace` | `playwright@claude-plugins-official` |
| `hosted_endpoint`, `repository`, `other` | `https://` URL | `https://mcp.exa.ai/mcp` |

### 8.4 Versions and lifecycle

| Version | Field | Rule |
|---|---|---|
| This standard | `schemaVersion` | `MAJOR.MINOR`. After 0.1 is published, an additive change is a new MINOR version (0.2); a change that can invalidate records is a MAJOR version. Published versions are never revised in place |
| The capability | `capabilityVersion` | Semantic Versioning. Removing an interface, use case, or component, or changing the type, is MAJOR; adding one is MINOR; descriptive changes need no bump; a version never goes down |
| A channel | `publications[].nativeVersion` | Any scheme, named in `versionScheme` |

Declared lifecycle transitions (confirmed by Mission 3): `experimental` to `active`,
`deprecated`, or `retired`; `active` to `deprecated`; `deprecated` to `active` or `retired`;
`retired` to nothing. A status the source reports is recorded separately (`source.status`,
`publications[].status`); a conflict with the declared status raises a warning.

## 9. Validation

| Stage | Checks | Scope |
|---|---|---|
| 1. Readability | Valid YAML or JSON; no repeated field names | Each file |
| 2. Structure | Mandatory fields, types, allowed values, formats, conditional rules, unknown fields | Each record |
| 3. Consistency | Duplicate ids, shared sources and publications, references, parent-component links, dates, conflicting status signals, differing versions, licenses that need reading, unconfirmed guesses, platform lists, risk state | All records together |
| 4. Completeness | The level reached, and the facts missing for the next | Each valid record |

| Severity | Meaning | What a consumer should do |
|---|---|---|
| Error | A rule is broken | Reject or quarantine the record |
| Warning | Valid, but probably wrong | Accept and show the warning |
| Unverified | Could not be confirmed; neither passed nor failed | Accept and show "not verified" |

| Stage and severity | Codes |
|---|---|
| Structure, error | `YAML_SYNTAX_ERROR`, `DUPLICATE_KEY`, `NOT_A_MAPPING`, `SCHEMA_VERSION_UNSUPPORTED`, `MISSING_REQUIRED_FIELD`, `CONDITIONAL_FIELD_REQUIRED`, `CONDITIONAL_RULE_VIOLATION`, `UNKNOWN_FIELD`, `INVALID_TYPE`, `INVALID_VALUE`, `INVALID_FORMAT`, `CONSTRAINT_VIOLATION`, `SCHEMA_VIOLATION` |
| Structure, warning | `YAML_PORTABILITY` |
| Consistency, error | `DUPLICATE_ID`, `SELF_REFERENCE` |
| Consistency, warning | `DUPLICATE_SOURCE`, `DUPLICATE_PUBLICATION`, `REFERENCE_TO_DEPRECATED`, `REFERENCE_TO_RETIRED`, `PARENT_CHILD_MISMATCH`, `PUBLICATION_REPEATS_SOURCE`, `SETUP_SINGLE_GROUP`, `ASSESSMENT_EXPIRED`, `EVIDENCE_STALE`, `DATE_IN_FUTURE`, `DEPRECATION_STATUS_MISMATCH`, `LIFECYCLE_SIGNALS_CONFLICT`, `RUNTIME_REPEATS_PUBLICATION`, `PROVENANCE_FIELD_NOT_FOUND`, `SOURCE_UNREACHABLE` |
| Consistency, unverified | `UNRESOLVED_REFERENCE`, `RELATION_UNVERIFIED`, `PUBLICATION_VERSIONS_DIFFER`, `LICENSE_NEEDS_REVIEW`, `DERIVED_VALUE_UNCONFIRMED`, `RISK_UNASSESSED`, `SOURCE_NOT_CHECKED`, `SOURCE_NOT_CHECKABLE`, `SOURCE_NOT_ACCESSIBLE` |
| Completeness, error | `COMPLETENESS_BELOW_REQUIRED` (only when a minimum level is set) |
| Revision of a record | Errors: `IDENTITY_CHANGED`, `LIFECYCLE_TRANSITION_NOT_ALLOWED`, `VERSION_DECREASED`, `INSUFFICIENT_VERSION_BUMP`. Warning: `LIFECYCLE_STATUS_REMOVED`. Unverified: `VERSION_NOT_COMPARABLE` |

Every finding carries its severity, stage, code, the field (a JSON Pointer such as
`/interfaces/0/type`) with line and column, a message, a fix hint, and related record ids.

**Rules for any tool that writes or checks manifests:** quote dates and versions; reject repeated
field names; check date and link formats strictly; validate each record against the
`schemaVersion` it declares. Mission 4's validator applies all of these, and an independent Python
implementation reaches the same verdicts.

## 10. For AI teams and AI hosts

The manifest tells an AI host or an agent builder **when** to use a capability and **how** to
install and connect it, without reading the README.

| The host needs | Read | Notes |
|---|---|---|
| When to use it | `description`, `supportedUseCases` | Use as tool-selection text |
| Which protocol | `interfaces[].type` | `mcp`, `agent_skill`, `a2a`, `openapi`, `cli`, `library`, `ci_action` |
| The native contract | `interfaces[].contractRef` | `SKILL.md`, MCP `server.json`, Agent Card. The exact launch arguments live there |
| How to install or start it | `publications[].kind` and `.locator` | A package URL gives the package; a container image, the image; a hosted endpoint, the URL; a marketplace entry, the plugin to install |
| Which transport | `interfaces[].transport` | For example `stdio`, `streamable-http` |
| What to ask the user for | `setup[]`: `name`, `kind`, `group`, `secret`, `required` | Ask for every `required: true` item without a group, plus the required items of one group the user chooses; never log a `secret: true` item |
| Whether this host is supported, and what to install for it | `publications[].platformCompatibility` | Install the publication that lists the host. A host not listed is unknown, not incompatible. For MCP servers, any MCP client that supports the transport may work |
| What it exposes | `embeddedComponents` | Tools, commands, hooks, sub-skills, subagents |
| What can go wrong | `limitations` | Write access, telemetry, data sent to providers |
| Whether it has been assessed | `riskTier` | `unassessed` must be shown as such |

**Typical recipes from structured fields** (tested on 22 real capabilities):

| Capability | From | Recipe |
|---|---|---|
| MCP server from npm | `publications: kind package, locator pkg:npm/...` | `npx -y <package>`, stdio |
| MCP server from PyPI | `pkg:pypi/...` | `uvx <package>`, stdio |
| MCP server in a container | `kind container_image` | `docker run -i --rm <image>` |
| Hosted MCP server | `kind hosted_endpoint` | Connect to the URL with the stated transport |
| Agent Skill | `interfaces: agent_skill, contractRef` | Load `SKILL.md` from the link |
| Plugin | `kind marketplace_entry` | Install `<name>@<marketplace>` |
| Library | `interfaces: library` and a package | `pip install` or `npm install` |
| CI step | `interfaces: ci_action` and a repository | `uses: <owner>/<repo>@<pinned ref>` |

**Alternatives.** When `setup` items carry a `group`, ask the user to choose one group and supply its
required items; items without a group are always needed. Example (MCP Atlassian): `JIRA_URL` always;
then either group `jira-cloud` (`JIRA_USERNAME` + `JIRA_API_TOKEN`) or group
`jira-server-data-center` (`JIRA_PERSONAL_TOKEN`). Exact launch arguments are in the native
contract, not in the manifest.

## 11. For recommenders, catalogues, and contributors

**Recommenders (Mission 1).** Index `name`, `description`, and `supportedUseCases` for matching.
Do **not** index `limitations`: they name other technologies and other missions' words ("issues",
"tickets"), and lowered precision from 0.86 to 0.73 in testing. `keywords` add no matching power; use them for display. Filter by `capabilityType`,
`interfaces[].type`, `publications[].platformCompatibility` (any publication), `integrations`, `costInformation.model`, and the
completeness level. Recommend only `adoptable` and `governed` records. Never rank `unassessed` as
low risk, and treat an `ASSESSMENT_EXPIRED` record as needing reassessment.

**Catalogues (Mission 2).** Recognise the same capability by `publications[].locator` and
`source.repositoryId`, never by name. One capability published on npm, Docker Hub, and the MCP
Registry is one record with three publications. A fork or a different product with the same name is
a separate record, linked through `relations`. So is a **wrapper** that only adds configuration
around another capability: its own record, linked with `relations` type `wraps`, because its owner,
version, and configuration differ from the original's.

**Contributors and curators (Mission 5).** Most facts can be drafted from the source: in testing,
63% of the recorded values came from native or linked sources. The owner is needed for
`setup`, `owner.contact`, and `limitations` (the `adoptable` level). For every skill, state
`supportedUseCases` and `setup` (`[]` when nothing is needed). For every MCP server, link its MCP
Server Card (or, for a local server, its `server.json`) in `interfaces[].contractRef`. When the capability accepts alternative credentials,
give each alternative its own `setup[].group`. Record guessed values as `derived` with a `basis`.

**Describing what a capability can do.** There is no separate "abilities" field. Four fields say
it, each tested on the 22 capabilities: `supportedUseCases` (what it is for, in words: the best
search field after the description), `embeddedComponents` (the tools, commands, and sub-skills it
exposes), `interfaces[].inputs` and `.outputs` (IANA media types, where that matters), and
`interfaces[].contractRef` (the native contract that holds the precise, current abilities: MCP
tools, A2A skills, `SKILL.md`). Do not copy tool schemas or Agent Card skills into the manifest. A
controlled functional classification is planned for 0.2 (see §13).

**Other catalogues (AI Catalog).** A manifest set can be exported as an AI Catalog document: one
entry per capability, referencing its native artifacts (`SKILL.md`, MCP Server Card, packages), with
the complete manifest in `extensions` under the schema `$id`. All 22 test manifests export as a valid
Level 2 catalog and import back unchanged. Exporting only the AI Catalog's own members keeps 11 of
90 used fields, so the extension is needed.

## 12. Evidence behind this standard

Tested on 2026-11-16 against 22 real, public capabilities (8 MCP servers, 6 skills, 5 libraries, a
plugin, a framework, a workflow, and a tool), five user journeys, seven search needs, and the
needs of Missions 1, 2, 3, and 5.

| Test | Result |
|---|---|
| Validity | 22 of 22 valid, all 22 `adoptable` (the five Caveman skills were completed from their own sources) |
| Mandatory fields | Each of the six: removed, all 22 become invalid |
| Completeness levels | Each level fact: removed, the level drops exactly as defined |
| Journeys | 100% of required questions answered (440 of 440) |
| Search | Name and description: recall 0.84, precision 0.92; with use cases, recall 0.95, precision 0.86; adding limitations drops precision to 0.73 |
| Identity | 66 of 66 synthetic cases correct; no false links among the 22 |
| Wrong values | 102 of 102 testable fields reject a wrong value at that field |
| AI host recipes | 22 of 22 from structured fields |
| Independent validator | 33 of 33 verdicts agree (Python jsonschema) |
| Exchange | 22 of 22 carried unchanged with their level |
| Governed level (simulated Mission 3 assessments) | All 22 reach `governed` with a current assessment; all 22 warn `ASSESSMENT_EXPIRED` when it is older than 12 months; all 22 are invalid with a tier but no reference |
| Caveman facts | 44 of 44 fact checks against the source repository, 22 of 22 deliberate errors detected |
| Overlap | No two fields state the same fact: the two that did were removed, and runtime details no longer repeat publications ([review](phase-1-testing/field-overlap-review.md)) |

Limits: all 22 are public and external; internal capabilities, owner declarations, and maturity are
not yet tested on real data, and the risk assessments of the governed test are simulated.

## 13. Decided, open, and what Mission 4 needs from each mission

**Decided on 2026-11-16:** ids are assigned by Mission 5 at submission, from namespaces Mission 2
registers (§8.1); listing requires `adoptable` or `governed` (§6); risk tiers are `unassessed`,
`low`, `medium`, `high`, and an assessment is valid for 12 months (§4.6); `source` is the origin and
`publications` what adopters obtain (§4.3); alternatives in `setup` use `group` (§4.7); hosts are
named by agent and stated only per publication, and `intendedAudience` was removed because it
repeated other fields (§4.3, [field overlap review](phase-1-testing/field-overlap-review.md));
`runtime` details state requirements only (§4.7); a configuration-only wrapper is its own record (§11); the maturity levels
and the 11 capability types fit Mission 2's catalogue; Mission 3 confirmed the lifecycle transitions
(§8.4); the owner or a Mission 5 curator confirms values through `confirmedBy` (§7); trust fields are
deferred to 0.2; evidence older than 180 days is reported; abilities use the four existing fields, with a classification field planned for 0.2; AI Catalog export uses the hybrid projection; after publication, versions follow §8.4; recommenders match on name, description, and use cases (§11).

**Still open:**

| Item | Needed from | Question |
|---|---|---|
| Internal capabilities | Mission 2 | 10-20 internal capabilities, to test internal ownership, maturity, and lifecycle |
| Wrappers | Mission 2 | Mission 4 decided that a configuration-only wrapper is its own record, linked by `wraps` (§11). Do you agree? |
| Trust fields (0.2) | Mission 3 | Deferred to 0.2: trust facts (data egress, write access, telemetry, credentials) stay in `limitations` for 0.1. Which fields does the Trust Framework need for 0.2? |
| Ranking | Mission 1 | Is `provider_billed` useful for ranking? |
| Validation step | Mission 5 | Where does validation sit in your workflow? (Listing requires `adoptable`.) How will the registered namespace list be checked at submission? |
| Alternative credentials (`setup[].group`) | Mission 5 | How will your submission form let a contributor declare groups? |
| AI host names | AI teams | Hosts are named by agent and stated per publication. Which agents are missing from the list? |
| Functional classification (0.2) | Mission 2 | Agree the category list (the `x-classification` proposal) so that it becomes a standard field in 0.2; Mission 4 cross-walks it to OASF. If you need to filter by role, propose a controlled role list with it (it replaces the removed `intendedAudience`) |
| Curation effort | Mission 5 | How long does a manifest take an owner? No owner has timed one yet (U8) |

Please send answers and change requests to Mission 4. Agreed changes are recorded in the decision
register and released as 0.1 (if before publication) or 0.2 (after).
