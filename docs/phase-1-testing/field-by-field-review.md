# Field-by-field review of manifest schema 0.1

| | |
|---|---|
| Date | 2026-11-16 |
| Evidence | The Phase 1 tests T1-T11 on 22 real capabilities ([README](README.md), [drafts](drafts/)) |
| Status | Mission 4's verdict on every field. The verdicts become decisions when the Mission 4 team records them in the [decision register](../decision-register.md) |
| Updated | 2026-11-16, after the five Caveman skills were completed: `supportedUseCases`, `setup`, `limitations`, `costInformation`, and `documentation` are now stated by 22 of 22 (removing `setup` or `limitations` drops all 22 to `assessable`), required journey answers are 440 of 440, and provenance has 267 entries (63% from sources, 30% curated). Updated again after the [field overlap review](field-overlap-review.md): `platformCompatibility` is stated only per publication (C14), `intendedAudience` is removed (C15), and `runtime[].detail` states requirements only (C16); provenance now has 280 entries. The per-field figures below are from the first run unless marked |

## 1. How to read this review

Each field gets five answers and a verdict:

- **What** it records, in one line.
- **Why** it exists: which journey or mission needs it.
- **Measured:** how many of the 22 state it, its share of all journey answers (605 answered
  question-instances after the C9 fix; the shares below were measured on the 600 before it, T4), how many answers only it gives ("sole"), what breaks when it is removed
  (T3), and what search, identity, or the AI host recipe show (T5, T6, T8). Every field rejected a
  wrong value in T7, so that is not repeated.
- **Tough question:** the strongest reason to doubt it, and the answer.
- **Verdict:** one of the five below.

| Verdict | Meaning |
|---|---|
| **Core** | Mandatory. Without it a record cannot be identified or trusted |
| **Level fact** | Optional, but a completeness level needs it. It decides what a record is good for |
| **Decision support** | Optional. A journey or a mission reads it to decide |
| **Dormant by design** | No public capability states it, because it records a process that has not happened yet (owner declaration, assessment, deprecation). Kept; tested by examples and unit tests |
| **Informational** | For people reading the record. No check, level, or journey depends on it. Kept; never required |

## 2. The questions asked of every field

1. **What is it?** Can its meaning be defined so that two curators fill it in the same way?
2. **Why is it there?** Which journey question, mission need, or validator rule needs it?
3. **Who supplies it, and at what cost?** Native source, inferred, curator, or owner?
4. **What happens without it?** Does validity, a level, a check, or a journey answer change?
5. **Is it the only source of that fact,** or is it redundant with another field?
6. **Can a machine use it,** or only a person? Does an AI host or a recommender read it?
7. **Does it add noise?** Does it make search or comparison worse?
8. **Is the requirement level right?** Should it be more or less required?
9. **Does it fit every capability type,** or only some?
10. **Does a wrong value get caught?**

## 3. Identity

### `schemaVersion` · Core
- **What:** the version of the standard the record follows, `"0.1"`.
- **Why:** each record is validated against the version it declares; several versions will coexist.
- **Measured:** 22/22. Removed: all 22 invalid. Native counterparts describe the native format's own version, never ours.
- **Tough question:** *Could the version be inferred from the file?* No. A consumer receiving records from several sources must know which rules apply, without guessing.
- **Verdict:** Core. Unchanged.

### `id` · Core
- **What:** the permanent identifier, `namespace/name`.
- **Why:** every link between records, and every system that stores a record, needs a key that survives renames.
- **Measured:** 22/22. Removed: all 22 invalid. T6: ids were never needed to recognise duplicates (publications and repository ids did that), so ids can be assigned freely without breaking identity.
- **Tough question:** *Native formats have names already; why another id?* Native names change with forks and moves (PR-Agent moved organisation), and two unrelated capabilities share names. T6: 22 namesakes, 0 linked.
- **Verdict:** Core. **Open: who allocates namespaces (U3).**

### `name` · Core
- **What:** the display name, 3-80 characters.
- **Measured:** 22/22; 3.7% of journey answers, all sole (J1 "what is it called?"). Search on name alone: recall 0.21, precision 1.00.
- **Tough question:** *Should names be unique?* No. T6 shows names identify nothing; uniqueness would push curators to invent names.
- **Verdict:** Core. Unchanged.

### `capabilityType` · Core
- **What:** what kind of capability it is: 11 values, one primary type.
- **Why:** consumers filter by it; conditional rules depend on it (an `mcp_server` must declare an MCP interface).
- **Measured:** 22/22; 3.7% of answers, all sole. Provenance: 9 derived, 2 curated. No native format states it; it is implied by the format.
- **Tough question:** *A capability with several interfaces (Chrome DevTools MCP is an MCP server and a CLI) gets one type. Is that lossy?* No. `interfaces` lists every way of use; the type says how it is primarily adopted.
- **Verdict:** Core. `library` (C1) confirmed by 5 of 22.

## 4. Description

### `description` · Level fact (`discoverable`)
- **What:** what it does and the problem it solves, 20-1024 characters.
- **Measured:** 22/22; 5.9% of answers, 27 sole. Removed: all 22 drop to `none`. Search: name + description gives recall 0.84 and precision 0.92, most of what all fields together reach. Provenance: 16 curated, 6 native.
- **Tough question:** *It is present in all 22, so why not mandatory?* In the 60-record research sample, records without a description existed, and they can still be catalogued and enriched. The level makes the gap visible instead of rejecting the record.
- **Verdict:** Level fact. The most valuable optional field.

### `supportedUseCases` (`title`, `description`) · Decision support
- **Measured:** 17/22; 2.8% of answers (shared with `keywords`). Search: adding it raises recall from 0.84 to 0.89 at the same precision (0.95 at precision 0.86 after the Caveman update), the only field after description that improves search. The 5 Caveman skills lack it, which is why J1 "fits my use case" fails for them.
- **Tough question:** *Should it be a level fact?* The Spike 2 review showed requiring it would block publication, and only 3 of 17 values are traceable to a source. Keep it optional and recommend it for every capability. `description` inside a use case adds nothing to search beyond the title.
- **Verdict:** Decision support; strongly recommended.

### `intendedAudience` · Informational
- **Measured:** 16/22; 2.7% of answers (J1 helpful). No provenance for any value. The 14 values are inconsistent ("developers", "developers using a coding agent", "web developers"), so no consumer can filter on them.
- **Tough question:** *Does it earn its place?* Mission 2 lists the audience in its scope. As free text it helps people, not machines. A role vocabulary would make it filterable; that is Mission 2's call.
- **Verdict:** Informational. Ask Mission 2 whether it needs a vocabulary.
- **Update 2026-11-16: removed (C15).** The overlap review found that all 25 values restate the description, use cases, runtime, or integrations, or say only "developers". The question "who is it for?" is now answered from `supportedUseCases` and `description`. A controlled role list can come with the 0.2 classification.

### `keywords` · Informational
- **Measured:** 17/22; 1.4% of answers, never sole. Search: adding it changes nothing (F1 0.88 before and after). Values are copied from source tags and are mostly generic (`ai`, `mcp`, `claude`, `python`).
- **Tough question:** *Why keep a field that does not improve search?* It is where native tags land, so they are not lost or mistaken for categories (`devops` on Docker Hub). It should not be weighted in matching.
- **Verdict:** Informational. Revisit in 0.2 with Mission 1.

### `documentation` · Decision support
- **Measured:** 17/22; 2.8% of answers, all sole (J3 "where is the documentation?").
- **Verdict:** Decision support. Unchanged.

## 5. Source and distribution

### `source` (`type`, `url`, `path`, `repositoryId`, `status`, `updatedAt`, `registry`, `identifier`, `description`) · Core
- **What:** where the capability is maintained.
- **Measured:** 22/22, all `repository`. `source.repositoryId` 22/22: the only signal that caught all 22 repository renames in T6. `source.path` 6/22: removing it makes the 5 Caveman skills look like duplicate registrations of one repository (5 `DUPLICATE_SOURCE`). `source.status` 22/22, always `active`: for 2 manifests it is the only lifecycle signal (removed: 2 drop from `adoptable` to `discoverable`). `registry`, `identifier`, and `description` are used by none (registry and other source types are absent from this set).
- **Tough question:** *`source` repeats a repository publication in 8 of 22 (C9). Which one is the truth?* T6 shows no double counting and no false link either way. Recommended: `source` is the canonical origin; `publications` lists distribution channels, including a repository only when people install from it directly (Agent Skills, GitHub Actions).
- **Verdict:** Core. **C9 decided on 2026-11-16: option A with five rules** ([analysis](c9-source-and-publications.md)); a repository publication without a ref now raises `PUBLICATION_REPEATS_SOURCE`.

### `publications` (`kind`, `locator`, `nativeName`, `nativeVersion`, `versionScheme`, `status`, `statusMessage`, `updatedAt`, `verifiedBy`, `platformCompatibility`) · Decision support, and the identity backbone
- **Measured:** 22/22. Removed: 7 manifests drop to `discoverable`, because their only version and lifecycle signals are in publications. T6: 22/22 re-registrations caught through `locator`. T8: `kind` and `locator` give the install command or endpoint in 16 of 22 recipes; the other 6, all skills, load `SKILL.md` through `interfaces[].contractRef`. `versionScheme` 22/22; `unversioned` is the declared answer for the 5 Caveman skills and 3 others.
- **Tough question:** *Should it be mandatory?* No. An internal capability used only from its repository has no channel; `source` is enough. *Is `unversioned` really a version fact?* Yes, as a declared absence like `setup: []`. A consumer must read it as "pin a commit".
- **Subfields:** `nativeName` and `verifiedBy` informational; `statusMessage` dormant; `platformCompatibility` (first run: 1/22, Chrome DevTools MCP) is, since C14, the only place hosts are stated: 13 publications in 9 manifests.
- **Verdict:** Decision support. Unchanged.

## 6. Ownership and terms

### `owner` (`name`, `contact`, `affiliation`) · Level facts
- **Measured:** `name` 22/22, `assessable` fact. `contact` 22/22, `adoptable` fact (removed: 17 drop to `assessable`); 8 of 12 attributed values are curated (usually the issue tracker). `affiliation` 22/22, all `external`.
- **Tough question:** *Is "owner" the accountable owner or the publisher?* For public capabilities it is the publisher; for internal ones it must be the accountable team. Internal records are untested (R6).
- **Verdict:** Level facts. Test internal ownership with Mission 2's capabilities.

### `license` (`expression`, `text`, `url`, `scope`) · Level fact (`assessable`)
- **Measured:** 22/22; 3.7% of answers. `scope: repository` in 7, each raising `LICENSE_NEEDS_REVIEW` (removing `scope` silences that check in all 7). `text` used by none (all 22 have SPDX licenses).
- **Tough question:** *Is the license Mission 4's business?* Only as stated terms. Whether a use is permitted belongs to legal and governance. The open part is who may confirm a repository-wide license applies (C10).
- **Verdict:** Level fact. Unchanged.

### `costInformation` (`model`, `details`, `url`) · Decision support
- **Measured:** 17/22; 7 `provider_billed`, 10 `free`. `details` 17/17 (read by people and Mission 1); `url` 1/22.
- **Verdict:** Decision support. C4 confirmed.

## 7. Status and lifecycle

### `lifecycleStatus` · Dormant by design (`assessable`, one of five signals)
- **Measured:** 0/22. No public owner declares one; the observed status in `source` and `publications` carried the signal every time.
- **Tough question:** *Remove it?* No. The charter requires owner-declared availability, and internal capabilities will declare it. Its transition rules need Mission 3 (U6).
- **Verdict:** Dormant by design.

### `maturity` · Dormant by design
- **Measured:** 0/22. How proven a capability is *in this organisation* cannot come from a public source.
- **Verdict:** Dormant by design. Definitions to be agreed with Mission 2, which assigns the values.

### `deprecation` (`reason`, `replacedBy`, `sunsetDate`) · Dormant by design
- **Measured:** 0/22 (none of the 22 is deprecated). Covered by examples and unit tests.
- **Verdict:** Dormant by design.

### `lastUpdated` · Informational
- **Measured:** 22/22. Removed: nothing changes. Only two dates occur (2026-11-09, 2026-11-13).
- **Tough question:** *Why keep it?* Mission 5 needs the record's date for review cycles, and C11 will use it with `provenance[].observedAt` for a freshness warning, which does not exist yet.
- **Verdict:** Informational. Define the freshness rule (C11).

## 8. Risk

### `riskTier` · Core (`governed`)
- **Measured:** 22/22, all `unassessed`. J4 "has it been assessed?" answered for 0 of 22, as intended: nothing is inferred.
- **Tough question:** *A mandatory field that is always the same value?* That is the point. `unassessed` must be stated, so that no consumer ever reads a missing tier as low risk.
- **Verdict:** Core. Tier names stay placeholders until Mission 3 confirms them.

### `assessmentReference` (`id`, `url`, `assessedOn`) · Dormant by design
- **Measured:** 0/22. Required whenever a tier is assessed.
- **Verdict:** Dormant by design, owned by Mission 3.

## 9. Technical

### `interfaces` (`type`, `transport`, `contractRef`, `specVersion`, `description`, `inputs`, `outputs`) · Level fact (`discoverable`)
- **Measured:** 22/22. Removed: 7 MCP servers become invalid, the other 15 drop to `none`. `type` 22/22, the protocol an AI host speaks. `transport` 7/7 MCP servers. `contractRef` 8/22 (all 6 skills, the plugin, the Action) and 0 of 7 MCP servers. `specVersion` 0/22. `inputs` 4/22, `outputs` 1/22.
- **Tough question:** *An AI host needs the exact launch command and arguments. Should the manifest carry them?* No. MCP's `server.json` already states them ("describe, do not copy"). **Recommendation:** MCP servers should set `contractRef` to their `server.json`, as skills already point to `SKILL.md`.
- **Tough question:** *`inputs`/`outputs` are almost never filled. Remove them?* They are the only structured place for media types (U5 abilities). Keep them optional and decide U5 with Missions 1 and 2.
- **Verdict:** Level fact. Add the `contractRef` guidance for MCP servers.

### `runtime` (`kind`, `detail`) · Level fact (`assessable`)
- **Measured:** 22/22. Removed: all 22 drop to `discoverable`. `kind`: 14 local process, 8 agent host, 5 container, 3 hosted, 2 CI runner. `detail` 22/22, free text with versions and start commands, readable by people only.
- **Verdict:** Level fact. Unchanged.
- **Update 2026-11-16 (C16):** 24 of 32 details repeated a publication (package name or install command, image, hosts, endpoint). `detail` now states only what the environment requires or who operates it; `RUNTIME_REPEATS_PUBLICATION` warns otherwise.

### `setup` (`name`, `kind`, `description`, `secret`, `required`) · Level fact (`adoptable`)
- **Measured:** 17/22 (3 declare `[]`); 5.7% of answers, 34 sole. Removed: 17 drop to `assessable`. T8: `name`, `kind`, `secret`, and `required` give the host the environment variables and secrets to ask for. `kind` covers the external dependencies `dependencies` could not hold (Chrome, poppler, model API keys).
- **Tough question:** *Can a host tell what is really required?* Not always. MCP Atlassian needs *either* a Cloud username and token *or* a Data Center token, so all three are `required: false`. Exa needs OAuth *or* an API key. **C13, decided 2026-11-16:** `setup[].group` names alternatives; 5 of 22 manifests use it.
- **Verdict:** Level fact. C13 applied.

### `platformCompatibility` · Decision support (conditional)
- **What:** the AI hosts and clients it has documented or tested support for, from a fixed list.
- **Measured:** 9/22; 3.0% of answers, 18 sole (J1 and J5 "does it work in my host?"). Required when a publication names hosts (1/22). The other 13 have no host: libraries, CI tools, and skills whose sources name none.
- **Tough question:** *MCP servers work in any MCP client. Is the list misleading?* It is "documented hosts". A missing host is unknown, never incompatible, and the standard says so.
- **Verdict:** Decision support. Settled on 2026-11-16 (C5, C12).
- **Update 2026-11-16: moved into `publications` (C14).** By C12's rule the top-level list was the union of the publications' lists, so the fact was stored twice. Hosts are now stated only in `publications[].platformCompatibility`, re-checked against each README; the J1 and J5 host questions read that field and are answered for the same 9 manifests.

### `integrations` · Decision support
- **Measured:** 6/22; 6 sole answers (J3 "which systems does it work with?"). Holds what the old platform list mixed in: git forges, Jira deployments, frameworks.
- **Verdict:** Decision support. Vocabulary not yet controlled.

### `dependencies` (`id`) · Decision support
- **Measured:** 16/22, all `[]`; 0 real ids. T2 showed the `[]` was read as "needs nothing" although all 16 need something.
- **Resolution:** every external need found by the field review now has a structured place: installed software and packages in `setup[].kind`, accounts and keys in `setup`, the runtime in `runtime`, connected systems in `integrations`. So `dependencies` keeps one meaning: other **registered capabilities** (an agent that uses an MCP server). The definition was clarified on 2026-11-16. No breaking change is needed.
- **Verdict:** Decision support. **C6 resolved by clarification.**

### `limitations` · Level fact (`adoptable`)
- **Measured:** 17/22; 5.7% of answers, 34 sole. Removed: 17 drop to `assessable`. 16 of 17 are curated, the highest curation cost of any field. Search: adding it **lowers precision from 0.92 to 0.81**, because limitations name other technologies ("needs Chrome", "Jira Server").
- **Tough question:** *Is the most expensive field worth it?* Yes. It is where write access, telemetry, and data egress are recorded (the input for Mission 3, C8), and it answers J5 "what can go wrong?". It must not be used for matching.
- **Verdict:** Level fact. Tell Mission 1 not to index it for matching.

## 10. Structure

### `components`, `parent` · Decision support
- **Measured:** Caveman only (1 plugin with 5 component skills). Removing either raises `PARENT_CHILD_MISMATCH` or loses J2 "part of a package?".
- **Verdict:** Decision support. Unchanged.

### `embeddedComponents` (`name`, `type`, `description`) · Decision support
- **Measured:** 8/22: 24 tools, 17 skills, 5 commands, 4 hooks, 3 agents, 1 resource. 7 sole answers to J5 "which tools does it expose?". Search: adds nothing.
- **Verdict:** Decision support. C2 confirmed.

### `relations` (`type`, `id`, `locator`, `evidence`, `verified`) · Decision support
- **Measured:** 5/22, all `distinct_from`, all verified (for example PR-Agent versus Qodo's commercial product). `fork_of`, `wraps`, `derived_from`, and `same_as` do not occur in the production set; they are covered by the research sample and the examples.
- **Verdict:** Decision support. The wrapper question (U4) needs Mission 2.

## 11. Data quality

### `provenance` (`field`, `method`, `basis`, `source`, `observedAt`, `confirmedBy`) · Decision support
- **Measured:** 22/22; 242 entries in the first run, about 11 per manifest: 39% native, 26% linked, 7% derived, 27% curated, 0% owner (now 267: 36%, 27%, 7%, 30%, 0%). It is the only answer to J4 "where does each fact come from?". `basis` marks the 18 derived values; 2 heuristic values raise `DERIVED_VALUE_UNCONFIRMED`. `confirmedBy` 0/22.
- **Tough question:** *Is 11 entries per manifest too much effort?* Two thirds can be written by a crosswalk, not a person. The real cost is the curated 27%. Measure owner time before deciding (U8).
- **Verdict:** Decision support. U8 and U10 need real owners.

## 12. Summary of verdicts

| Verdict | Fields (top level) |
|---|---|
| Core (6) | `schemaVersion`, `id`, `name`, `capabilityType`, `source`, `riskTier` |
| Level fact (10 facts) | `description`, `interfaces` (`discoverable`); `runtime`, `license`, `owner.name`, a version (`capabilityVersion` or a publication's version), a lifecycle signal (`assessable`); `setup`, `owner.contact`, `limitations` (`adoptable`) |
| Decision support (11) | `publications` (including the per-publication hosts), `supportedUseCases`, `documentation`, `costInformation`, `integrations`, `dependencies`, `components`, `parent`, `embeddedComponents`, `relations`, `provenance` |
| Dormant by design (5) | `lifecycleStatus`, `maturity`, `deprecation`, `assessmentReference`, plus the sub-fields listed in the README |
| Informational (2) | `keywords`, `lastUpdated` |
| Removed as repetitive (2) | `platformCompatibility` (top level; now per publication, C14), `intendedAudience` (C15) |

**No field failed every test.** Two fields were removed afterwards because they repeated other
fields, not because they failed a test ([field overlap review](field-overlap-review.md)). The two
remaining informational fields are cheap (copied or dated automatically).

## 13. Recommendations arising

| # | Recommendation | Kind | With |
|---|---|---|---|
| 1 | C6: resolve by the clarified definition (applied 2026-11-16) | Description only | Mission 4 team |
| 2 | C9: `source` is the canonical origin; `publications` are channels (**decided** 2026-11-16) | Rules and a warning | Mission 4 team |
| 3 | C13: `setup[].group` for alternative items (**decided and applied** 2026-11-16) | Additive | Mission 5 for its form |
| 4 | MCP servers set `interfaces[].contractRef` to their `server.json` | Authoring guidance | Mission 2 (curation) |
| 5 | Index `name`, `description`, `supportedUseCases` for matching; never `limitations` | Consumer guidance | Mission 1 |
| 6 | Recommend `supportedUseCases` and `setup` for every skill | Authoring guidance | Mission 5 |
| 7 | Test internal capabilities: owner, affiliation, maturity, lifecycle (R6) | Evidence | Mission 2 |
| 8 | `keywords` stay descriptive (R9); `intendedAudience` removed (C15). If a role filter is needed, propose a controlled role list with the 0.2 classification | Decided 2026-11-16 | Missions 1 and 2 |
