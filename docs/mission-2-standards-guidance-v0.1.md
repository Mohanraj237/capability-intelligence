# AI Capability Standards: Mission 4 Guidance for Mission 2

This document sets out the common structure and rules that Mission 4 proposes for describing AI capabilities. It covers the three capability types Mission 2 is cataloguing: **Skills**, **MCP Servers** and **AI Agents**. It is the **initial version (v0.1, draft)**, shared for alignment. Items marked **[Proposal]** are suggestions that both teams still need to agree.

---

## 1. Capability Manifest

A **capability manifest** is one structured record that describes one AI capability. Each catalogue entry is one capability and has one manifest.

**General principles**

| Principle | What it means for the catalogue |
|---|---|
| One manifest per capability | One catalogue entry describes exactly one Skill, MCP Server, or Agent |
| One common structure for all three types | One table design and one API work for every type; only a few attributes differ by type (see 1.2) |
| Describe, do not copy | Where a capability already has its own technical definition (a Skill's SKILL.md file, an MCP server's metadata, an Agent's "Agent Card"), the manifest links to it instead of repeating it |
| Every value can record where it came from | Values that ingestion guessed can be told apart from values the source stated, and confirmed later |

**Format:** manifests are written in YAML. JSON is accepted for storage and exchange.

### 1.1 Field groups (common to all three types)

| Group | Fields | Purpose |
|---|---|---|
| Identity | `schemaVersion`, `id`, `name`, `capabilityType`, `capabilityVersion` | What the capability is, and how it is uniquely identified |
| Description | `description`, `supportedUseCases`, `keywords`, `documentation`, `limitations` | What it does, what it is for (and so who it is for), and its constraints |
| Classification **[Proposal]** | `x-classification.category`, `x-classification.subcategories` | Functional category (see Section 2) |
| Source | `source` (`type`, `url`, `path`, `repositoryId`, `status`, `updatedAt`, `registry`, `identifier`, `description`) | Where the capability is maintained |
| Distribution | `publications` (`kind`, `locator`, `nativeName`, `nativeVersion`, `versionScheme`, `status`, `statusMessage`, `updatedAt`, `verifiedBy`, `platformCompatibility`) | Every place it is published, for example npm, the MCP Registry, or Docker Hub |
| Ownership | `owner` (`name`, `contact`, `affiliation`) | Who maintains it, and whether they are internal or external |
| Terms | `license` (`expression`, `text`, `url`, `scope`), `costInformation` (`model`, `details`, `url`) | Whether it may be used, and what it costs |
| Status | `lifecycleStatus`, `deprecation`, `maturity`, `lastUpdated` | Whether it is available, how proven it is, and when the record was last updated |
| Risk | `riskTier`, `assessmentReference` | Risk assessment state. Mission 3 sets the values |
| Technical | `interfaces`, `runtime`, `setup`, `integrations` | How it is used, where it runs, which systems it connects to, and what it needs. The AI hosts it works in are stated per publication (`publications[].platformCompatibility`) |
| Structure | `dependencies`, `components`, `parent`, `embeddedComponents`, `relations` | Links to other capabilities: what it depends on, what it contains, and forks or copies of it |
| Data quality | `provenance` | Where each value came from |
| Extensions | Any field whose name starts with `x-` | Extra organization-specific data. It is accepted, but not checked |

### 1.2 Attributes that depend on the capability type

| Attribute | Skill (`skill`) | MCP Server (`mcp_server`) | AI Agent (`agent`) |
|---|---|---|---|
| What it is | A packaged set of instructions and supporting files (a SKILL.md folder) that an AI assistant loads to carry out a task | A server that gives AI assistants access to tools or data through the Model Context Protocol (MCP) | A system that works towards a goal on its own: it plans steps, uses tools or other capabilities, and runs as its own service |
| Mandatory, specific to the type | None | At least one `interfaces` entry with `type: mcp` | None |
| `interfaces.type` | `agent_skill` | `mcp` | `a2a` (Agent-to-Agent protocol), `openapi`, `cli`, or `ui` |
| `interfaces.contractRef` (a link to the technical definition) | The SKILL.md file (recommended) | The server metadata (optional) | The Agent Card or the OpenAPI document (**mandatory** for `a2a` and `openapi`) |
| `interfaces.transport` | Not applicable | `stdio`, `streamable-http`, `sse` | `JSONRPC`, `GRPC`, `HTTP+JSON` |
| `runtime.kind` | `agent_host` (runs inside an AI assistant) | `local_process`, `container`, `hosted_service` | Usually `hosted_service` |
| `setup` | Usually `[]` (nothing needed) | Environment variables and secrets, for example API tokens | Credentials, model or provider access |
| `publications[].platformCompatibility` (AI hosts, per publication) | The hosts that load the published skill, for example `claude-code` on its repository or marketplace publication | On each publication, the MCP clients its documentation configures, for example `cursor`, `github-copilot` on the npm package; other MCP clients may work too | Usually omitted when it runs as its own service |
| Typical `publications.kind` | `repository`, `marketplace_entry` | `registry_entry` (MCP Registry), `package` (npm, PyPI), `container_image`, `marketplace_entry` | `hosted_endpoint`, `package` |
| `dependencies` | Rarely used | Rarely used | The Skills and MCP Servers the agent uses |
| Metadata available at the public source | SKILL.md header (`name`, `description`) | MCP Registry entry, package metadata, Docker catalog entry | Agent Card |

The standard also defines further types (for example `plugin`, `tool`, `application`). The current catalogue scope doesn't need them.

### 1.3 Packages that contain several capabilities

| Situation | How to catalogue it |
|---|---|
| A package or plugin contains several Skills or MCP Servers that can each be used on their own | Each one gets its own catalogue entry. The package lists them in `components`, and each entry names the package in `parent` |
| A capability contains parts that cannot be used on their own (prompts, commands, hooks) | They are described inside that capability's record (`embeddedComponents`), not as separate entries |
| Documentation pages (README, wiki) | They are a source of information about a capability, not a capability |

### 1.4 Example manifests

These examples are illustrative. The `example.com` and `example-org` values are placeholders.

**Skill**
```yaml
schemaVersion: "0.1"
id: ai-platform/sql-review
name: SQL Review
capabilityType: skill
capabilityVersion: "1.3.0"
description: Reviews SQL changes in pull requests for performance anti-patterns and data-access policy violations.
source:
  type: repository
  url: https://github.com/example-org/ai-capabilities
  path: skills/sql-review
owner: { name: AI Platform Engineering, contact: ai-platform@example.com, affiliation: internal }
license: { expression: LicenseRef-Example-Internal, scope: capability }
lifecycleStatus: active
maturity: production
riskTier: unassessed
interfaces:
  - type: agent_skill
    contractRef: https://github.com/example-org/ai-capabilities/blob/main/skills/sql-review/SKILL.md
runtime:
  - kind: agent_host
setup: []
limitations:
  - Supports the PostgreSQL and MySQL dialects only.
x-classification:
  category: software_engineering
  subcategories: [software_engineering.code_review]
```

**Skill with platform-specific publications [Proposal]**
```yaml
schemaVersion: "0.1"
id: ai-platform/code-reviewer
name: Code Reviewer
capabilityType: skill
source:
  type: repository
  url: https://github.com/example-org/ai-capabilities
  path: skills/code-reviewer
riskTier: unassessed
publications:
  - kind: repository
    locator: https://github.com/example-org/claude-code-reviewer
    nativeVersion: v1.2.0
    versionScheme: tag
    platformCompatibility:
      - claude-code
  - kind: repository
    locator: https://github.com/example-org/copilot-code-reviewer
    nativeVersion: v1.2.0
    versionScheme: tag
    platformCompatibility:
      - github-copilot
```

The example uses distinct publication URLs, each with the tag adopters pin. Hosts are asserted independently for each artifact, and only there: the capability supports the union (`claude-code`, `github-copilot`), which a catalogue computes; there is no capability-wide list to keep in sync (decision register C14). Only AI hosts from the fixed list in 4.4 are allowed. All URLs are illustrative.

**MCP Server** (a real public capability)
```yaml
schemaVersion: "0.1"
id: microsoft/playwright-mcp
name: Playwright MCP
capabilityType: mcp_server
description: Browser automation and end-to-end testing MCP server by Microsoft.
source:
  type: repository
  url: https://github.com/microsoft/playwright-mcp
  repositoryId: "952688112"
publications:
  - { kind: registry_entry, locator: io.github.microsoft/playwright-mcp, nativeVersion: "0.0.82", versionScheme: semver, status: active }
  - { kind: package, locator: pkg:npm/%40playwright/mcp, nativeName: "@playwright/mcp", nativeVersion: "0.0.83", versionScheme: semver }
  - { kind: container_image, locator: docker.io/mcp/playwright, versionScheme: commit, nativeVersion: "2d446f9e1b79886103c79406b81cc5408364487a" }
owner: { name: Microsoft Corporation, contact: https://github.com/microsoft/playwright-mcp/issues, affiliation: external }
license: { expression: Apache-2.0, scope: capability }
riskTier: unassessed
interfaces:
  - type: mcp
    transport: stdio
runtime:
  - { kind: local_process, detail: "Node.js >=18, started with npx @playwright/mcp" }
  - { kind: container, detail: docker.io/mcp/playwright }
x-classification:
  category: web_browser
  subcategories: [web_browser.browser_automation, web_browser.web_testing]
```

**AI Agent**
```yaml
schemaVersion: "0.1"
id: ai-platform/incident-triage-agent
name: Incident Triage Agent
capabilityType: agent
capabilityVersion: "0.4.0"
description: Triages production alerts, correlates them with deployments, logs and metrics, and proposes a severity and first response.
source:
  type: repository
  url: https://github.com/example-org/incident-triage-agent
owner: { name: AI Platform Engineering, contact: ai-platform@example.com, affiliation: internal }
lifecycleStatus: experimental
riskTier: unassessed
interfaces:
  - type: a2a
    contractRef: https://agents.example.com/incident-triage/.well-known/agent-card.json
runtime:
  - kind: hosted_service
dependencies:
  - id: sre/runbook-search
  - id: acme/observability-mcp-server
limitations:
  - Proposes actions only; it never executes remediation steps.
x-classification:
  category: infrastructure_operations
  subcategories: [infrastructure_operations.incident_response]
```

---

## 2. Capability Taxonomy

Each capability is classified in two ways:

| Classification | Field | Question it answers | Status |
|---|---|---|---|
| Capability type | `capabilityType` | What *kind* of capability is it: Skill, MCP Server, or Agent? | Defined (see 1.2) |
| Functional category | `x-classification.category` and `x-classification.subcategories` | What *does* it do? | **[Proposal]** It becomes a standard field once both teams agree the list |

Other fields that already exist can serve as catalogue filters as well (see 2.4).

### 2.1 How to decide the capability type

Ask the questions in order, and stop at the first "yes".

| Step | Question | If yes | Example |
|---|---|---|---|
| 1 | Does it give AI assistants tools or data through **MCP** (Model Context Protocol)? | **MCP Server**. This holds even when it is delivered as an npm package, a Docker image, or a plugin | Playwright MCP |
| 2 | Is it a set of **instructions and files (a SKILL.md folder)** that an AI assistant loads to do a task better? | **Skill** | SQL Review skill |
| 3 | Does it **work towards a goal on its own**: plan steps, use tools, and run as its own service? | **AI Agent** | Incident Triage Agent |
| 4 | None of the above | Outside the current catalogue scope; raise it with Mission 4 | — |

**Common points of confusion**

| Situation | Correct treatment |
|---|---|
| An Agent's description (its "Agent Card") lists the "skills" the agent has | These describe the agent's abilities. They are **not** separate Skill entries |
| The same MCP server is on npm, Docker Hub, and the MCP Registry | **One** MCP Server entry; each location is listed under `publications` |
| A plugin contains two Skills and one MCP Server | **Three** entries (one per capability), each linked to the plugin through `parent` |
| A copy (fork) of a capability, maintained by someone else | A **separate** entry, linked to the original through `relations` (`fork_of`) |
| The type was guessed during automatic ingestion | Record that it was guessed (in `provenance`) so that a curator can confirm it |

### 2.2 Functional categories and subcategories **[Proposal]**

| Category | Covers | Subcategories |
|---|---|---|
| `software_engineering` | Building, reviewing, and shipping software | `code_generation`, `code_review`, `testing`, `debugging`, `refactoring`, `documentation`, `version_control`, `ci_cd`, `other` |
| `data_analytics` | Querying, transforming, and analysing data | `data_query`, `data_transformation`, `visualization`, `reporting`, `data_quality`, `other` |
| `knowledge_retrieval` | Finding and condensing information | `web_search`, `enterprise_search`, `rag` (retrieval-augmented generation), `summarization`, `translation`, `other` |
| `document_processing` | Reading, extracting from, and producing documents | `parsing`, `ocr`, `generation`, `conversion`, `other` |
| `web_browser` | Interacting with web pages | `browser_automation`, `web_scraping`, `web_testing`, `other` |
| `infrastructure_operations` | Running and operating systems | `cloud_management`, `observability`, `incident_response`, `deployment`, `database_administration`, `other` |
| `security_compliance` | Security and policy assurance | `vulnerability_scanning`, `secrets_management`, `policy_compliance`, `identity_access`, `other` |
| `content_creation` | Creating written and media content | `writing`, `design`, `image_generation`, `audio_video`, `presentation`, `other` |
| `communication_collaboration` | Team communication and coordination | `messaging`, `email`, `meetings`, `project_management`, `other` |
| `business_operations` | Business functions | `sales_crm`, `finance`, `hr`, `customer_support`, `legal`, `other` |
| `ai_engineering` | Building and operating AI systems | `agent_orchestration`, `model_evaluation`, `prompt_management`, `model_serving`, `memory_context`, `other` |
| `other` | Nothing above fits | — |

A subcategory is written as `category.subcategory`, for example `web_browser.browser_automation`.

### 2.3 How to assign a category **[Proposal]**

| # | Rule | Example |
|---|---|---|
| 1 | Choose **one main category**: the area where the capability is mainly used | Playwright MCP → `web_browser` |
| 2 | Add **up to 5 subcategories**, all from that same category | `web_browser.browser_automation`, `web_browser.web_testing` |
| 3 | Decide from **what it does** (its description, use cases, and interfaces), not from its name | A server named "github-helper" that only searches issues → `knowledge_retrieval`, not `software_engineering` |
| 4 | If no subcategory fits, use `category.other`. If no category fits, use `other`, and add descriptive words to `keywords` | `document_processing.other` + keywords `[invoices]` |
| 5 | Put secondary areas in `keywords`, not in a second category | An SQL review skill that also checks policy → category `software_engineering`, keyword `compliance` |
| 6 | Copy tags or categories from public sources into `keywords`, not into the category. Different sources use the same word for different things | Docker Hub files Playwright under "devops" → keyword `devops` |
| 7 | When ingestion assigns a category automatically, mark it as guessed (in `provenance`) until a curator confirms it | — |
| 8 | Changing a category does not change the capability's id or version | — |

### 2.4 Other filters already in the standard

| Filter | Field | Values |
|---|---|---|
| How it is used | `interfaces.type` | `mcp`, `a2a`, `openapi`, `agent_skill`, `cli`, `library`, `ci_action`, `ui`, `other` |
| Where it runs | `runtime.kind` | `local_process`, `container`, `hosted_service`, `agent_host`, `ci_runner`, `other` |
| Internal or external | `owner.affiliation` | `internal`, `external` |
| Availability | `lifecycleStatus` | `experimental`, `active`, `deprecated`, `retired` |
| Maturity | `maturity` | `prototype`, `pilot`, `production` |
| Cost model | `costInformation.model` | `free`, `included`, `subscription`, `usage_based`, `provider_billed` (free software that calls a paid third-party service), `chargeback`, `other` |
| Risk state | `riskTier` | `unassessed`, `low`, `medium`, `high` (confirmed by Mission 3; an assessment is valid for 12 months) |
| Source type | `source.type` | `repository`, `registry`, `provider`, `other` |
| AI host | `publications[].platformCompatibility` (per publication; the only place hosts are stated) | Optional list from a fixed set of AI hosts and clients: `claude-code`, `claude-desktop`, `codex`, `cursor`, `devin`, `gemini-cli`, `github-copilot`, `windsurf` |
| Connected systems | `integrations` | Optional list of lowercase tokens for the systems, products, and frameworks it connects to, for example `gitlab`, `jira-data-center`, `langchain` (not yet a fixed list) |

---

## 3. Metadata Standards

**General principles**

| Principle | What it means for the catalogue |
|---|---|
| Only six fields are mandatory | Records from public sources with little metadata can still be ingested |
| The other fields add a "completeness level" | Instead of rejecting incomplete records, the catalogue shows how complete each one is (see 3.4) |
| Unknown risk is `unassessed`, never "low" | A missing risk assessment never looks like a safe capability |
| A valid record is not an approval | Passing validation says nothing about whether a capability is safe or approved for use |

### 3.1 Mandatory metadata

| Field | Type | Rule | Example |
|---|---|---|---|
| `schemaVersion` | text | The version of this standard the record follows; currently `"0.1"` (in quotes) | `"0.1"` |
| `id` | text | Unique identifier `namespace/name` (see Section 4) | `microsoft/playwright-mcp` |
| `name` | text | Display name, 3–80 characters | `Playwright MCP` |
| `capabilityType` | fixed list | `skill`, `mcp_server`, or `agent` | `mcp_server` |
| `source` | group | `type` is always mandatory; other parts depend on the type (see 3.2) | `{ type: repository, url: https://… }` |
| `riskTier` | fixed list | `unassessed` when no risk assessment exists; never left out | `unassessed` |

### 3.2 Metadata that becomes mandatory in certain cases

| When | Then also required | Reason |
|---|---|---|
| `riskTier` is `low`, `medium`, or `high` | `assessmentReference` (with `id` and `assessedOn`) | A risk level must point to the assessment that set it, and its date shows when it expires (12 months) |
| `lifecycleStatus` is `deprecated` or `retired` | `deprecation` (with `reason`) | Users need to know why, in order to plan a move |
| `capabilityType` is `mcp_server` | An `interfaces` entry with `type: mcp` | An MCP server must declare its MCP interface |
| `source.type` is `repository` or `provider` | `source.url` | The source must be locatable |
| `source.type` is `registry` | `source.registry` and `source.identifier` | The source must be locatable |
| `source.type` is `other` | `source.description` | The source must be locatable |
| `interfaces.type` is `a2a` or `openapi` | `interfaces.contractRef` | A link to the technical definition is required |
| The license is not a standard license code | `license.text` (the terms as stated) | Custom terms are kept for a person to read |
| A `relations` entry has no `id` | `relations.locator` | A link must identify its target |
| A `provenance` entry has `method: derived` | `provenance.basis` | Guessed values must be identifiable |
| `owner` is given | `owner.name` | — |
| `costInformation` is given | `costInformation.model` | — |

### 3.3 Optional metadata

| Field | Type | Description | Constraints |
|---|---|---|---|
| `description` | text | What it does and the problem it solves | 20–1024 characters |
| `capabilityVersion` | text | Version of the capability | Semantic Versioning, for example `"1.3.0"` |
| `publications` | list | Places it is published (see 4.4) | Each entry needs a `kind` and a `locator`; each may declare the AI hosts it supports in `platformCompatibility` |
| `owner` | group | `name`, `contact` (an email address or https link), `affiliation` (`internal` or `external`) | — |
| `license` | group | A standard license code (SPDX, for example `MIT`, `Apache-2.0`) or the text of the terms; `url`; `scope` (`capability` or `repository`) | — |
| `documentation` | link | Documentation or home page | https only |
| `keywords` | list | Search terms and tags from the source | 1–30 items; free text |
| `lifecycleStatus` | fixed list | Availability, as declared by the owner | See 4.6 |
| `maturity` | fixed list | How proven the capability is in real use | See 3.6 |
| `lastUpdated` | date | When this record was last updated (not when the capability changed) | `"YYYY-MM-DD"` |
| `deprecation` | group | `reason`, `replacedBy` (an id), `sunsetDate` | — |
| `supportedUseCases` | list | `title` (required) and `description` | 1–20 items |
| `interfaces` | list | `type`, `transport`, `specVersion`, `contractRef`, `description`, `inputs`, `outputs` | — |
| `runtime` | list | `kind`, `detail`: what the environment requires (`Node.js >=18`) or who operates it; not the package, image, install command, or host, which are in `publications` | — |
| `setup` | list | `name`, `kind`, `group`, `description`, `secret`, `required`; `[]` means nothing is needed. Items that share a `group` are alternatives: the adopter supplies the required items of one group (for example `jira-cloud` or `jira-server-data-center`); items without a group are always needed | `kind`: `env_var`, `input`, `header`, `system_package`, `software`, `account`, `app`, `setting`, `other` |
| `publications[].platformCompatibility` | list | AI hosts and clients in which that publication has documented or tested support. The only place hosts are stated: the capability supports the union of its publications' hosts. Not languages, runtimes, or operating systems (those are in `runtime`) | Optional per publication; 1–20 values from the fixed list in 4.4; omission means unknown. Omit it for a publication that runs in no AI host |
| `integrations` | list | Systems, products, and frameworks the capability connects to, works against, or plugs into: git forges and CI platforms, products and their deployment variants, frameworks | 1–30 lowercase tokens, words joined with hyphens; not yet a fixed list |
| `dependencies` | list | Ids of other catalogued capabilities it needs (for example an agent that uses an MCP server). Installed software, accounts, and runtimes go in `setup` and `runtime`; systems it connects to go in `integrations` | `[]` means it needs no other catalogued capability, not that nothing else is needed |
| `limitations` | list | Known limitations; `[]` means none are known | — |
| `costInformation` | group | `model`, `details`, `url` | — |
| `components`, `parent` | id links | Package structure (see 1.3) | — |
| `embeddedComponents` | list | Parts that cannot be used on their own | — |
| `relations` | list | Links to related capabilities: `same_as`, `fork_of`, `wraps`, `derived_from`, `distinct_from` | — |
| `provenance` | list | Where each value came from: `native` (the source states it), `linked` (another source states it), `derived` (inferred), `owner`, `curated` | — |
| `x-classification` | group | **[Proposal]** `category`, `subcategories` | See Section 2 |

### 3.4 Completeness levels

Each level includes the levels below it. Every record is reported with its level and with the information it still needs for the next level.

| Level | What it means | Information needed | Usually comes from |
|---|---|---|---|
| `none` | Only the mandatory fields | — | — |
| `discoverable` | It can be found and understood | `description` and `interfaces` | The public source; a curator writes a missing description |
| `assessable` | Reuse can be assessed | Where it runs (`runtime`), `license`, a version, an availability signal, `owner.name` | The public source |
| `adoptable` | A team can adopt it without asking anyone | `setup` (`[]` is allowed), `owner.contact`, `limitations` (`[]` is allowed) | The capability owner |
| `governed` | A risk assessment is recorded | A `riskTier` other than `unassessed`, plus `assessmentReference` | Mission 3 |

**Agreed (2026-11-16):** the catalogue lists only records at `adoptable` or `governed`, and shows each record's level. Records below `adoptable` are kept for enrichment, with the facts they still need, but are not listed.

Mission 4 studied 60 real public records. They reached these levels:

| Invalid | none | discoverable | assessable | adoptable | governed |
|---|---|---|---|---|---|
| 2 | 2 | 25 | 31 | 0 | 0 |

Those were drafts generated from public metadata, without curation. The 22 curated production manifests all reach `adoptable` (2026-11-16): a person read each source and recorded the setup, the owner contact, and the limitations. That is the work the listing threshold asks for.

### 3.5 Missing, unknown, and empty values

| Situation | How to record it |
|---|---|
| A mandatory field | Always present, with a real value. If it is missing, the record is invalid |
| An optional value that is unknown | Leave the field out. Leaving it out means "not provided"; never fill in a guess |
| Explicitly "none" | An empty list, for example `setup: []` or `limitations: []` |
| `null` / empty value | Not allowed |
| Unknown risk | `riskTier: unassessed`. Never treat it as low risk or as approved |
| Sources disagree (for example different versions on npm and Docker) | Keep both values, and flag the difference. Never pick one silently |
| A guessed value | Mark it as guessed (in `provenance`) and confirm it before relying on it |

### 3.6 Maturity definitions (agreed 2026-11-16)

| Value | Definition |
|---|---|
| `prototype` | Demonstrated, but not yet used for real work |
| `pilot` | Used for real work by a limited group, under evaluation |
| `production` | Used in production, and supported for wider adoption |

`lifecycleStatus` describes whether the capability is **available**. `maturity` describes **how proven** it is in real use. The two are independent.

---

## 4. Naming and Identification Standards

**General principles**

| Principle | What it means for the catalogue |
|---|---|
| The id is separate from the location | An id is never built from a URL or a package name, so it survives moves and renames |
| One capability, many publications | The same MCP server on npm, the MCP Registry, and Docker Hub is **one** entry with three publications |
| Match by publication, not by name | Different capabilities often share a name (two unrelated Skills are both called "pdf"), so name matching creates false duplicates |

### 4.1 Naming conventions

| Element | Convention | Example |
|---|---|---|
| Capability id | `namespace/name`, lowercase, words joined with hyphens; the namespace may contain dots; up to 128 characters | `ai-platform/sql-review`, `io.github.microsoft/playwright-mcp` |
| Display name | 3–80 characters; need not be unique; not an id | `SQL Review` |
| Field names | camelCase | `lifecycleStatus` |
| Values from fixed lists | lowercase with underscores | `mcp_server`, `usage_based` |
| Extra organization-specific fields | Start with `x-`, then camelCase | `x-costCenter` |
| AI host, integration, and setup group names | lowercase, words joined with hyphens | `claude-code`, `jira-data-center` |
| Manifest file name | `<name>.capability.yaml`, one capability per file | `sql-review.capability.yaml` |
| Dates | `YYYY-MM-DD`, in quotes | `"2026-11-02"` |

### 4.2 Identifier rules

| # | Rule |
|---|---|
| 1 | Every capability has exactly one id. |
| 2 | An id is assigned **once**, by Mission 5's workflow when a submission is accepted, from a namespace on the registered list that Mission 2 keeps. It is **never changed and never reused**, even after the capability is retired. |
| 3 | An id is **never built from** anything that can change: the URL, the owner, the display name, the version, the status, or the type. |
| 4 | The namespace is a product, a domain, or a verified publisher, **not a team name**, so that a reorganisation does not change ids. |
| 5 | Ids are unique across the whole catalogue, ignoring upper and lower case. |
| 6 | Links between capabilities (dependencies, components, parent, replacement) always use the id, never a URL. |

### 4.3 Identification scenarios

| Scenario | How to handle it |
|---|---|
| Several capabilities in one repository | One id for each; the same `source.url` with a different `source.path` |
| Repository moved or renamed | Only `source` changes; the id stays. `source.repositoryId` (GitHub's permanent numeric id) connects the old and new URLs |
| One capability published in several places | One entry; each place is listed in `publications` with its own name and version |
| A fork, wrapper, or look-alike | A separate entry, linked through `relations` (`fork_of`, `wraps`, `distinct_from`). A wrapper that only adds configuration is also a separate entry, linked with `wraps`: its owner, version, and configuration differ from the original's |
| A repository people use directly (a skill folder, a CI action) | Also list it under `publications`, with the ref they pin: `nativeVersion: main` with `versionScheme: floating`, or `v1` with `tag`. Without a ref it only repeats `source`, and the validator warns (`PUBLICATION_REPEATS_SOURCE`) |
| Any other repository | Only in `source`. `source` is where the capability is maintained; `publications` are what adopters install or connect to |
| An external tool without accessible source code | `source.type: provider` with the provider's URL, and `owner.affiliation: external` |
| Finding the same capability in two sources | Compare publication locators and `source.repositoryId`, **never the name** |

### 4.4 How to write a publication's location (`publications.locator`)

| `publications.kind` | Format | Example |
|---|---|---|
| `package` | Package URL (a standard package address) | `pkg:npm/%40playwright/mcp`, `pkg:pypi/docling` |
| `container_image` | Image name without a tag | `docker.io/mcp/playwright` |
| `registry_entry` | The name used in the registry | `io.github.microsoft/playwright-mcp` |
| `marketplace_entry` | `name@marketplace` | `playwright@claude-plugins-official` |
| `hosted_endpoint`, `repository`, `other` | https URL | `https://agents.example.com/...` |

**Platform compatibility per publication** (decided 2026-11-16, decision register C12 and C14)

- `publications[].platformCompatibility` names **AI hosts and clients only**, from a fixed list: `claude-code`, `claude-desktop`, `codex`, `cursor`, `devin`, `gemini-cli`, `github-copilot`, `windsurf`. Hosts are named by the **agent** that loads the capability, not the editor: MCP servers configured in VS Code are used by GitHub Copilot, so they are `github-copilot`. A new host is added to the list as a minor change of the standard.
- Languages, runtimes, and operating systems (`python`, `nodejs`, `linux`) do not belong here: `runtime` already states them, with versions. A real operating-system restriction goes in `limitations`. Systems the capability connects to (`gitlab`, `jira-cloud`, `langchain`) go in `integrations`.
- For an MCP server, the list names the hosts its documentation covers. Any MCP client that supports its transport may work too, so a host that is not listed is unknown, not incompatible.
- **Hosts are stated only per publication.** There is no capability-wide list: it would be the union of the publications' lists, the same fact stored twice. A catalogue that filters by host checks whether any publication lists it, and the publication that lists it is the one to install. The field is optional for Skills, MCP Servers, and Agents.
- An omitted list means *not provided/unknown*, not incompatible. Do not populate a list from an unconfirmed guess.
- A skill or agent used straight from its repository states its hosts on a `repository` publication with the ref adopters pin.
- A manifest that still has a top-level `platformCompatibility` is rejected, with the hint to move each host to the publication that supports it.
- A publication-specific list must be supported by evidence for that artifact. A directory name or packaging convention alone is not proof of runtime compatibility. Record inferred values using `provenance` and confirm them before relying on them.
- Compatibility is distinct from native packaging format, interface protocol, and organizational approval. This proposal does not introduce a native-format field.
- When multiple artifacts live within one repository, the existing `locator` must identify the publication sufficiently to distinguish them; do not assume that a shared repository URL identifies a unique artifact. Artifact-path modeling remains a separate design decision.

### 4.5 Versioning

| Version | Field | Rule |
|---|---|---|
| Version of this standard | `schemaVersion` | `"MAJOR.MINOR"`, currently `"0.1"`. A minor change only adds optional things; a major change can make existing records invalid |
| Version of the capability | `capabilityVersion` | Optional; Semantic Versioning only (`"1.3.0"`) |
| Version in a publication channel | `publications.nativeVersion` + `versionScheme` | Any scheme: `semver`, `pep440` (Python), `calver` (date-based), `commit`, `tag`, `floating` (for example "latest"), `unversioned`, `other` |

**When to change a capability's version**

| Change | Impact | Version change |
|---|---|---|
| An interface, use case, or component is removed, or the type changes | Breaking | Major (`1.x.x` → `2.0.0`) |
| An interface, use case, component, or dependency is added | Additive | Minor (`1.3.x` → `1.4.0`) |
| Only the description, owner, source, risk, status, limitations, or other details change | Information only | None |
| The version goes down, or the id changes | Not allowed | — |

### 4.6 Availability states (confirmed by Mission 3, 2026-11-16)

| State | Meaning | Can change to |
|---|---|---|
| `experimental` | Available for trial; no promise of stability | `active`, `deprecated`, `retired` |
| `active` | Maintained and offered for use (this is not an approval) | `deprecated` |
| `deprecated` | Still available, but users should move away; a reason is required | `active`, `retired` |
| `retired` | No longer available; its id is never reused | None |

The status that a source itself reports (for example an archived GitHub repository, or a package marked deprecated on npm) is recorded separately, in `source.status` and `publications.status`. If it disagrees with the declared state, the record gets a warning.

---

## 5. Validation Standards

### 5.1 Validation stages

| Stage | What is checked | Scope |
|---|---|---|
| 1. Readability | The file is valid YAML or JSON with no repeated field names | Each file |
| 2. Structure | Mandatory fields, data types, allowed values, formats, the case-dependent rules (3.2), and unknown field names | Each record |
| 3. Consistency | Duplicate ids, sources, and publications; links to other capabilities; parent and component links in both directions; dates; conflicting status signals; differing versions; licenses that need reading; guessed values not yet confirmed; risk state | All records together |
| 4. Completeness | The level reached, and the information missing (3.4) | Each valid record |

### 5.2 Severity of findings

| Severity | Meaning | What the catalogue should do |
|---|---|---|
| Error | The record breaks a rule | Reject the record or quarantine it |
| Warning | The record is valid, but something is probably wrong | Accept it and show the warning |
| Unverified | Something could not be confirmed; it has neither passed nor failed | Accept it and show it as "not verified" |

### 5.3 Validation rules

| Rule | Severity | Code |
|---|---|---|
| The file cannot be read as YAML or JSON | Error | `YAML_SYNTAX_ERROR` |
| The same field appears twice | Error | `DUPLICATE_KEY` |
| The file does not contain a single record | Error | `NOT_A_MAPPING` |
| The record follows a version of the standard that is not supported | Error | `SCHEMA_VERSION_UNSUPPORTED` |
| A mandatory field is missing | Error | `MISSING_REQUIRED_FIELD` |
| A field required in this case (3.2) is missing | Error | `CONDITIONAL_FIELD_REQUIRED` |
| A case-dependent rule is broken | Error | `CONDITIONAL_RULE_VIOLATION` |
| An unknown field name (often a typo) | Error | `UNKNOWN_FIELD` |
| A wrong data type (for example a number instead of text) | Error | `INVALID_TYPE` |
| A value is not in the allowed list | Error | `INVALID_VALUE` |
| A badly formed date, link, or email address | Error | `INVALID_FORMAT` |
| A length or count limit is exceeded | Error | `CONSTRAINT_VIOLATION` |
| Any other structural problem | Error | `SCHEMA_VIOLATION` |
| An unquoted value that some tools misread (for example a date) | Warning | `YAML_PORTABILITY` |
| Two records share an id | Error | `DUPLICATE_ID` |
| A record refers to itself | Error | `SELF_REFERENCE` |
| Two records point to the same source location | Warning | `DUPLICATE_SOURCE` |
| Two records list the same publication | Warning | `DUPLICATE_PUBLICATION` |
| A runtime detail names a publication's package, image, or registry entry | Warning | `RUNTIME_REPEATS_PUBLICATION` |
| A repository publication is the source repository and states no ref | Warning | `PUBLICATION_REPEATS_SOURCE` |
| Only one setup group is declared, so it offers no alternative | Warning | `SETUP_SINGLE_GROUP` |
| A risk assessment is older than 12 months | Warning | `ASSESSMENT_EXPIRED` |
| Evidence behind the record is older than 180 days | Warning | `EVIDENCE_STALE` |
| A link to a deprecated capability | Warning | `REFERENCE_TO_DEPRECATED` |
| A link to a retired capability | Warning | `REFERENCE_TO_RETIRED` |
| A parent and a component do not point to each other | Warning | `PARENT_CHILD_MISMATCH` |
| A date is in the future | Warning | `DATE_IN_FUTURE` |
| Deprecation details are given, but the status is not deprecated | Warning | `DEPRECATION_STATUS_MISMATCH` |
| The declared status conflicts with what the sources report | Warning | `LIFECYCLE_SIGNALS_CONFLICT` |
| The source of a value points to a field that does not exist | Warning | `PROVENANCE_FIELD_NOT_FOUND` |
| The source link does not respond | Warning | `SOURCE_UNREACHABLE` |
| A linked capability is not in the catalogue | Unverified | `UNRESOLVED_REFERENCE` |
| A relation has not been confirmed | Unverified | `RELATION_UNVERIFIED` |
| Publications state different versions | Unverified | `PUBLICATION_VERSIONS_DIFFER` |
| License terms need a person to read them | Unverified | `LICENSE_NEEDS_REVIEW` |
| A guessed value has not been confirmed | Unverified | `DERIVED_VALUE_UNCONFIRMED` |
| No risk assessment is recorded | Unverified | `RISK_UNASSESSED` |
| The source link was not checked | Unverified | `SOURCE_NOT_CHECKED` / `SOURCE_NOT_CHECKABLE` / `SOURCE_NOT_ACCESSIBLE` |
| The record is below the completeness level the catalogue requires | Error (only if a minimum is set) | `COMPLETENESS_BELOW_REQUIRED` |

**Rules when a capability record is updated**

| Rule | Severity | Code |
|---|---|---|
| The id changed | Error | `IDENTITY_CHANGED` |
| The status changed in a way that is not allowed (4.6) | Error | `LIFECYCLE_TRANSITION_NOT_ALLOWED` |
| The version went down | Error | `VERSION_DECREASED` |
| The version change is too small for the change made (4.5) | Error | `INSUFFICIENT_VERSION_BUMP` |
| A declared status was removed | Warning | `LIFECYCLE_STATUS_REMOVED` |
| The versions cannot be compared | Unverified | `VERSION_NOT_COMPARABLE` |

### 5.4 What each finding contains

| Item | Description |
|---|---|
| Severity | Error, warning, or unverified |
| Stage | Structure, consistency, or completeness |
| Code | A fixed code from 5.3, safe to store and filter on |
| Location | The field concerned, for example `/interfaces/0/type`, plus the line and column in the file |
| Message | What is wrong |
| Hint | How to fix it, or what to do next |
| Related records | The ids of other records involved, for example in a duplicate |

### 5.5 Rules for individual fields

| Field | Rule |
|---|---|
| `id` and every id link | `namespace/name`, lowercase, words joined with hyphens, up to 128 characters |
| `name` | 3–80 characters, with no spaces at the start or end |
| `description` | 20–1024 characters |
| All links | Must start with `https://`; up to 2048 characters |
| All dates | `YYYY-MM-DD`, a real calendar date, in quotes |
| `capabilityVersion` | Semantic Versioning without a "v" prefix, in quotes (`"1.3.0"`) |
| `owner.contact` | An email address or an https link |
| `license.expression` | A standard SPDX license code (for example `MIT`, `Apache-2.0`) |
| `publications[].platformCompatibility` | Optional list of 1–20 unique values per publication, from the fixed list of AI hosts (4.4); missing means unknown. A top-level `platformCompatibility` or `intendedAudience` is rejected with a hint (both removed in 0.1, C14 and C15) |
| `integrations` | Optional list of 1–30 unique lowercase tokens (words separated by hyphens) |
| Fixed-list fields | Only the listed values |
| Unknown field names | Rejected (this catches typos), unless they start with `x-` |
| Common field names from other formats | Pointed to the right field: `tags` → `keywords`, `version` → `capabilityVersion`, `homepage` → `documentation`, `author` → `owner`, `repository` → `source` |

### 5.6 Rules for any tool that produces or checks records

| # | Rule | Reason |
|---|---|---|
| 1 | Put dates and version numbers in quotes | Some YAML readers silently turn `2026-10-12` into a date object |
| 2 | Reject repeated field names | Some readers silently keep the last value. For example, `riskTier: high` followed by `riskTier: low` would be read as low |
| 3 | Check date and link formats strictly | Otherwise invalid dates such as `2026-02-30` are accepted |
| 4 | Check each record against the version of the standard it declares | Several versions may exist in one catalogue |

Mission 4 has a working validator that applies all of these rules. Mission 2 can request it, together with a set of sample records for testing.

---

## 6. Open Points between Mission 2 and Mission 4

- **Functional categories:** agree the category and subcategory list and the rules for assigning them (Sections 2.2 and 2.3). Once they are agreed, Mission 4 makes `x-classification` a standard field in 0.2 and keeps a cross-walk to the OASF skill taxonomy (see docs/phase-1-testing/abilities-vocabulary-analysis.md). This is the one controlled vocabulary for what a capability does; there is no separate abilities field.
- **Maturity and types:** agreed on 2026-11-16: `prototype`, `pilot`, `production` (Section 3.6) and the capability types fit the catalogue.
- **Minimum completeness for listing:** agreed on 2026-11-16: `adoptable` or `governed` (Section 3.4).
- **Wrappers:** Mission 4 decided (2026-11-16) that a capability that only adds configuration around another capability is its own catalogue entry, linked to the original with `relations` type `wraps` (4.3). Please confirm that this fits the catalogue.
- **Ids and namespaces:** agreed on 2026-11-16: Mission 5 assigns ids at submission; Mission 2 keeps the registered list of namespaces (products, domains, verified publishers). Please set up that list.
- **Pilot data:** Mission 2 to share at least 5 real internal capabilities (Skills, MCP Servers, Agents), so that both teams can test this standard against real records.
- **AI host names:** hosts are named by agent (4.4). Tell Mission 4 which further hosts the catalogue needs in the fixed list.
- **Missing fields:** Mission 2 to raise any catalogue fields it needs that this document does not cover, for inclusion in the next version.
