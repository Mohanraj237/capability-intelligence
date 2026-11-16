# Review: every manifest field against the production reference set

| | |
|---|---|
| Date | 2026-11-13 |
| Updated since | 2026-11-16: C5 applied (AI hosts only, plus `integrations`), C6 resolved by a clarified definition, C12 and C13 added. Then C14 to C16 ([field overlap review](../phase-1-testing/field-overlap-review.md)): the capability-wide `platformCompatibility` and `intendedAudience` were removed as repetitions, and `runtime[].detail` states requirements only. The field lists below are as reviewed on 2026-11-13. The field-by-field test results are in [phase-1-testing](../phase-1-testing/README.md). This review is kept as written |
| Reviewed | Every field of schema 0.1 ([capability.schema.json](../../schema/0.1/capability.schema.json), [field dictionary](../field-dictionary/0.1.md)), down to the second level, 98 fields in all |
| Against | The 22 manifests in [case-studies/production-set/manifests/](../../case-studies/production-set/manifests/): the 16 production capabilities, and the Caveman plugin with its 5 skills |
| Method | A script counted, for each field, how many manifests set it, and which values they use. Every finding below is from those counts or from writing the manifests |
| Status | A review and a set of proposals. It does not change the schema. The Mission 4 team decides |

## 1. Is the metadata finalised?

**No.** Schema 0.1 is an **unpublished draft**. This review is evidence for finalising it, not the
final decision.

| What | Status |
|---|---|
| Schema 0.1 | Unpublished draft, revised in place on 2026-10-23 |
| Mandatory fields | Six (`schemaVersion`, `id`, `name`, `capabilityType`, `source`, `riskTier`). Everything else is optional, with completeness levels on top. This is a POC proposal (open question U1) |
| Open questions U1-U10 | All still open. Phase 1 was to settle them in decision records for a review in the week of 9 November; no decision record is in the repository |
| Vocabularies owned by other missions | Risk tiers (Mission 3), maturity levels and the capability-type list (Mission 2): placeholders, not agreed |
| Trust Framework fields | Not defined. Mission 3 has not said what it needs |
| This review | Finds **11 fields or vocabularies that need a change** (§4), and supporting evidence for 7 of the 10 open questions (§5) |

The core structure held up. All 22 manifests are valid with no errors or warnings. Real capabilities
of six types, published through six kinds of channel, fit without a single unknown field.

## 2. The 22 manifests

| Group | Manifests | Completeness |
|---|---|---|
| The 16 production capabilities | 7 MCP servers, 5 libraries, 1 tool, 1 framework, 1 skill, 1 workflow (at the time of the review the 5 libraries had to be typed `tool`; C1 added `library`) | 16 `adoptable` |
| Caveman plugin | 1 plugin | `adoptable` |
| Caveman skills | 5 skills, each linked to the plugin with `parent` | 5 `assessable`: the skills state no setup or limitations of their own |

## 3. Field-by-field result

98 fields were reviewed (32 top-level, 66 nested).

| Result | Fields | Count |
|---|---|---|
| **Used by all 16** | 48 fields | the core works |
| **Used where it applies** | 32 fields | optional by nature |
| **Used by none of the 22** | 18 fields | §3.3 says why |

### 3.1 Used by every production manifest

`schemaVersion`, `id`, `name`, `description`, `capabilityType`, `source` (`type`, `url`,
`repositoryId`, `status`), `publications` (`kind`, `locator`, `versionScheme`), `owner` (`name`,
`contact`, `affiliation`), `license` (`expression`, `scope`), `documentation`, `keywords`, `riskTier`,
`lastUpdated`, `supportedUseCases`, `intendedAudience`, `interfaces` (`type`, `description`),
`runtime` (`kind`, `detail`), `setup`, `platformCompatibility`, `dependencies`, `limitations`,
`costInformation` (`model`, `details`), and `provenance` (`field`, `method`, `source`, `observedAt`).

Each was fillable from public sources or from reading the README, and each answers a question that
Mission 1, 2, 3, or 5 asks.

### 3.2 Used where it applies

| Field | Used by | Comment |
|---|---|---|
| `capabilityVersion` | 14 of 16; 1 of 6 Caveman | Missing only where the capability is used from a moving reference (the skill from `main`, the Action from tag `v1`). `publications[].nativeVersion` carries the version instead. Works |
| `source.path` | 1 of 16; 5 of 6 Caveman | Skills inside a shared repository. Works |
| `source.updatedAt` | 0 of 16; 6 of 6 Caveman | Set from git history for Caveman; for the 16, the release date sits in `publications[].updatedAt` instead. Two places for one fact; see §4, C9 |
| `publications[].status` | 5 of 16 | Only registry entries report a status. Works |
| `publications[].verifiedBy` | 12 of 16 | Records why a channel belongs to the capability. Very useful for identity. Works |
| `interfaces[].transport` | 7 of 16 | MCP servers only. Works |
| `interfaces[].contractRef` | 2 of 16; 6 of 6 Caveman | Skills and the Action, which have a contract file. Works |
| `interfaces[].inputs` / `outputs` | 4 / 1 of 16 | Rarely stated by sources. See §5, U5 |
| `embeddedComponents` | 7 of 16; 1 of 6 Caveman | Tools of MCP servers and libraries, commands, hooks. Works, but see §4, C2 |
| `relations` | 5 of 16 | All `distinct_from`: same name or same company, different capability. Works |
| `parent` / `components` | 5 / 1 Caveman | Bundle and children. Works |
| `costInformation.url` | 1 Caveman | Sources rarely link a price page |
| `provenance[].basis` | 3 of 16; 6 of 6 Caveman | Only for derived values. Works |

### 3.3 Used by none of the 22, and why

| Field | Why it is empty | Verdict |
|---|---|---|
| `lifecycleStatus` | **No source declares one.** The lifecycle signal always came from `source.status` or `publications[].status` | Keep optional. Evidence for U6: lifecycle must be inferable from observed status, because owners do not declare it |
| `maturity` | Assigned by Mission 2 for its own inventory | Keep. Waits for Mission 2's definitions |
| `assessmentReference` (and `id`, `url`, `assessedOn`) | No risk assessment exists; every `riskTier` is `unassessed` | Keep. Waits for Mission 3 |
| `provenance[].confirmedBy` | No owner has confirmed a value | Keep. All 241 provenance entries are unconfirmed; see U8 |
| `deprecation` (and `reason`, `replacedBy`, `sunsetDate`) | No capability in the set is deprecated. The research corpus has an archived one | Keep. Tested there, not here |
| `license.text` | All 22 licenses are SPDX expressions | Keep for prose terms (the research found them) |
| `source.registry`, `source.identifier`, `source.description` | Every source is a repository | Keep. See C9 |
| `publications[].statusMessage` | No channel reported a deprecation message | Keep |
| `interfaces[].specVersion` | No MCP server's README states the MCP specification version it implements | Keep optional; do not expect it |
| `dependencies[].id` | Every `dependencies` is `[]`, yet the capabilities do depend on things | **Change.** See C6 |

## 4. Changes needed

> **Update 2026-11-13:** C1, C2, C3, C4, and C7 have been applied to schema 0.1 and to the 22
> manifests. What changed and why is explained in
> [phase-1-changes-explained.md](../phase-1-changes-explained.md). C5, C6, and C8 to C11 are still
> proposals.

These came from writing real manifests. In each case the schema forced a workaround, a misleading
value, or free text that another mission will need as data.

| # | Field | What happened | Evidence | Proposal | Owner |
|---|---|---|---|---|---|
| C1 | `capabilityType` | No value for a library. Five libraries were typed `tool`; browser-use was typed `framework`; the line between the two is not defined | 6 of 16 | Add `library`, or define `tool` and `framework` so that a curator can choose consistently | Mission 4, with Mission 2 (it owns the type list) |
| C2 | `embeddedComponents[].type` | No value for a bundled skill or subagent. Caveman's 17 embedded skills and 3 subagents are typed `other`, with the kind written into the name (`skill:...`) | 20 `other` values | Add `skill` and `agent` | Mission 4 |
| C3 | `interfaces[].type` | No value for a GitHub Action or for comment commands on a pull request; both typed `other` | 3 of 22 | Add `ci_action`. Comment commands can stay `other` | Mission 4 |
| C4 | `costInformation.model` | No value for "free software, paid service": an MIT server that calls a paid search or model API | 7 of 16 have the pattern: 5 typed `other` (Brave, Tavily MCP, Exa, langchain-tavily, browser-use) and 2 typed `usage_based`, which wrongly suggests the publisher charges (PR-Agent, Claude Code Action) | Add `provider_billed`, or record software cost and service cost separately | Mission 4, with Mission 1 (ranks by cost) |
| C5 | `platformCompatibility` | 26 different tokens that mix MCP hosts (`claude-desktop`), operating systems (`linux`), languages (`python`), frameworks (`langchain`), forges (`gitlab`), runtimes (`aws-lambda`), and products (`jira-cloud`) | 26 tokens in 17 manifests | Split into `hosts`, `operatingSystems`, and `integrations`, each with a controlled vocabulary; or keep one list with a published token vocabulary | Mission 4, with Missions 1 and 2 |
| C6 | `dependencies` | Only references to other manifests are allowed, so all 16 say `[]` ("none"), although they need Chrome, Docker, poppler, a model API, or a Jira site. Those ended up in `setup` | 16 of 16 `[]` | Allow external dependencies by locator (like `relations[].locator`), or rename the field `capabilityDependencies` so that `[]` is not read as "no dependencies" | Mission 4; matters to Mission 3 (third-party dependencies) |
| C7 | `setup[].name` | One free-text name covers six different things: environment variables, Action inputs, system packages, installed software, accounts, and apps | 11 of 40 setup items are not environment variables | Add `setup[].kind`. Applied with nine values: the six kinds observed (`env_var`, `input`, `system_package`, `software`, `account`, `app`) plus `header`, `setting`, and `other`, which the field's existing description already named | Mission 4, with Mission 5 (setup is asked at submission) |
| C8 | Trust information | Write access, telemetry, and data sent to third parties are only in `limitations` text | Write access by default: 4; telemetry on by default: 2; code or content sent to a provider: 7 | Do not define fields yet. Give Mission 3 this list as the concrete case for its Trust Framework metadata (`permissions`, `dataEgress`, `telemetry`) | **Mission 3** |
| C9 | `source` versus `publications` | For 8 of 22 manifests, a `repository` publication repeats `source`. The source's date sits in `source.updatedAt` for Caveman and in `publications[].updatedAt` for the rest | 8 duplicates | Fold `source` into `publications[]` with one marked as the source of truth. This is evidence for U2 | Spike 3 (U2) |
| C10 | `license.scope` | `repository` scope is reported for review even when the repository holds one package (MCP Atlassian), and for all 6 Caveman manifests | 7 of 22 | Keep the check. Allow a curator to confirm scope through `provenance[].confirmedBy`, so the finding can be closed | Mission 4 |
| C11 | `lastUpdated` versus `observedAt` | Every manifest has one `lastUpdated` but about 11 `observedAt` dates. Two values (the skill and pdf-parse repository ids) are older than the rest | 2 of 22 | Keep both. Have the validator warn when an `observedAt` date is much older than `lastUpdated` | Mission 4 |

## 5. Evidence for the open questions

| Question | What the 22 manifests show |
|---|---|
| **U1** Completeness levels instead of a fixed mandatory set | Supported. The levels separated 17 adoptable from 5 assessable records, and named exactly what is missing (setup and limitations for the Caveman skills) |
| **U2** Fold `source` into `publications` | Supported. 8 duplicates, and dates in two places (C9) |
| **U3** Id format and who allocates | Still open. The curator chose ids such as `anthropics/webapp-testing` for a skill inside `anthropics/skills`, and `chromedevtools/...` for an organisation named ChromeDevTools. Nobody allocated them |
| **U5** Abilities vocabulary | `inputs` and `outputs` were set for only 4 and 1 of 16. Sources do not state media types, so abilities would have to be curated |
| **U6** Constraints on owner-declared lifecycle | No owner declared a lifecycle (0 of 22). The observed status carries the signal |
| **U8** Curation effort | 241 provenance entries across 22 manifests, about 11 per manifest; 67 are `curated`. Time was not measured |
| **U10** "Declared none" | `setup: []` for 3 libraries and `dependencies: []` for 16 are curator assertions, not owner ones. For dependencies, "none" is misleading (C6) |

U4 (wrappers), U7 (AI Catalog), and U9 (do Missions 1 and 2 accept partial records) are not
answered by this set.

## 6. Recommendation

1. **Do not publish 0.1 as it is.** Apply C1, C2, C3, C4, and C7 first. They are additive (new
   values or an optional field). `schema-compat` should confirm that, and all 22 manifests would
   stay valid.
2. **Decide C5, C6, and C9 with the owning spikes.** They change the shape of existing fields.
3. **Send C8 to Mission 3** as the concrete input its Trust Framework needs.
4. **Use the 22 manifests as the regression corpus** for every schema change, with
   `schema-compat --corpus case-studies/production-set/manifests`.
