# What Phase 1 Changed in the Capability Manifest, and Why: Explained

| | |
|---|---|
| **What this is** | A guided explanation of the five changes made to the draft schema 0.1 on 2026-11-13, written for readers who know the manifest only from [research-explained.md](research-explained.md) |
| **Where the changes came from** | Writing 22 manifests for real, maintained capabilities and reviewing every schema field against them ([field review](reviews/field-review-production-set.md)) |
| **Status** | The changes are applied to the **unpublished** draft 0.1 and to the 22 manifests. They are proposals until the Mission 4 team accepts them. Schema 0.1 is still not final |
| **Updated since** | 2026-11-16: C5 was applied (`platformCompatibility` holds AI hosts only, plus a new `integrations` field; breaking), C6 was resolved by clarifying `dependencies` instead of splitting it, and C12 and C13 were added, and C14 to C16 removed repetition (the capability-wide `platformCompatibility` and `intendedAudience` were removed; `runtime[].detail` states requirements only; see the [field overlap review](phase-1-testing/field-overlap-review.md)). Every field was then tested against the 22 manifests ([phase-1-testing](phase-1-testing/README.md)). This page is kept as it was written on 2026-11-13 |

> **How to read the labels.** Every claim in this page has a tag that tells you how firm it is.
>
> - 📘 **Mission rule**: a goal, definition, or rule that Mission 4 set before this work.
> - 📏 **Measured**: counted on the 22 manifests. The counts are reproducible.
> - 💡 **Proposal**: a change made to the draft. **Not yet accepted by the team.**
> - ❓ **Open**: nobody has decided this yet.
> - 🔗 **Connecting the dots**: a short note that links this section to the ones around it.

---

## Contents

1. The short version
2. Words you need first
3. Where the changes came from
4. The five changes
5. How we know the changes are safe
6. What did not change, and why
7. What this means for each mission
8. Before and after, in numbers
9. Decisions still needed
10. The whole story on one page
11. Test yourself
12. Where to read more

---

## 1. The short version

The research of October designed the manifest from **metadata as sources publish it**. In Phase 1 we
wrote manifests for **16 production capabilities and the Caveman plugin**, reading each README by
hand, and checked every field against them.

The structure held up: all 22 manifests were valid, and no capability needed a field that does not
exist. But in five places the schema **had no word for something real**, so the curator had to write
`other`, or squeeze a different kind of thing into an existing value. Each of those five places is
fixed by **adding** a value or an optional field. Nothing was removed or renamed, so every manifest
written before still validates.

| # | Field | What was added | Why, in one line |
|---|---|---|---|
| C1 | `capabilityType` | `library` | Five PDF and search libraries had to pretend to be "tools" |
| C2 | `embeddedComponents[].type` | `skill`, `agent` | Caveman's 17 bundled skills and 3 subagents had to be "other" |
| C3 | `interfaces[].type` | `ci_action` | A GitHub Action had no interface type |
| C4 | `costInformation.model` | `provider_billed` | Free software that calls a paid API was "other" or misdescribed as usage-based |
| C7 | `setup[].kind` (new, optional) | `env_var`, `input`, `header`, `system_package`, `software`, `account`, `app`, `setting`, `other` | "Setup" mixed environment variables with browsers, OS packages, accounts and apps |

The numbering follows the [field review](reviews/field-review-production-set.md), which found eleven
problems (C1 to C11). Only the five that are purely additive and owned by Mission 4 were applied.

---

## 2. Words you need first

| Word | Meaning here |
|---|---|
| **Field** | One named piece of a manifest, such as `capabilityType` or `setup[].kind` (`[]` means "each item of a list") |
| **Allowed values** | Some fields accept only a fixed list of words (an *enumeration*). `capabilityType` must be one of `skill`, `agent`, `mcp_server`, and so on |
| **`other`** | The escape hatch in most lists. It keeps a manifest valid, but tells a consumer nothing. Many `other`s for the same thing mean a word is missing |
| **Additive change** | A change that only adds: a new allowed value, or a new optional field. Old manifests stay valid. The opposite is a *breaking* change |
| **Corpus** | The set of real manifests used to test a schema change |
| **Completeness level** | How much of the important information a manifest states: `discoverable`, `assessable`, `adoptable`, `governed` ([research-explained.md](research-explained.md) §11.3) |
| **Curated** | Filled in by a person who read the sources, as opposed to copied from metadata (`native`) |

---

## 3. Where the changes came from

### 3.1 From sampling to writing

📘 The October research sampled 60 public records, mostly at random, and tested the schema against
them. Its weak records (an archived server, a fork, a proprietary skill) were valuable: they exposed
identity and licensing problems.

📏 But none of those 60 drafts got past `assessable`, because published metadata never states
limitations. The research could not show what a **complete** manifest of a **good** capability needs.

🔗 Phase 1 filled that gap. The [sample review](reviews/phase-1-sample-review.md) replaced the weak
records with 16 production-level capabilities. Every one of them, plus the Caveman plugin and its
five skills, was then written as a full manifest from its README, registry entry, and repository
([case-studies/production-set/](../case-studies/production-set/README.md)).

### 3.2 The field review

📏 A script counted, for each of the 98 schema fields, how many of the 22 manifests set it and which
values they used. The headline result:

| Result | Fields |
|---|---|
| Used by all 16 production manifests | 48 |
| Used where it applies (optional by nature) | 32 |
| Used by none of the 22 | 18, all explained (mostly fields that other missions fill, such as `maturity` and `assessmentReference`) |

The counts showed **where curators kept reaching for `other`**, and the notes taken while writing
showed **what they meant instead**. That is the evidence behind each change below.

---

## 4. The five changes

Each change follows the same pattern: the problem in plain words, the evidence, the change, and its
effect.

### 4.1 C1: a capability type for libraries

**The problem.** A PDF parser on PyPI is something your **code calls**. A CLI or a GitHub Action is
something a person or an agent **runs**. The schema had only `tool` for both, and `framework` for
"something you build on". Curators had to guess, and two curators could guess differently.

📏 **Evidence.** 6 of the 16 production capabilities are packages that code imports: pdfplumber,
Unstructured, docling, pdf-parse, langchain-tavily, and browser-use. Five were typed `tool` and one
`framework`, with no rule to tell them apart.

💡 **The change.** `library` added to `capabilityType`, and the three neighbouring values defined:

| Value | Means | Example from the set |
|---|---|---|
| `library` | A package that code calls | pdfplumber, docling, pdf-parse |
| `tool` | Something a person or an agent runs | PR-Agent |
| `framework` | A library for building agents or applications on top of it | browser-use |

```yaml
# before                          # after
capabilityType: tool              capabilityType: library
```

**Effect.** The five libraries now say `library`. PR-Agent stays `tool`, browser-use stays `framework`.

❓ Mission 2 owns the capability-type list it catalogues, so it should confirm the value and the
definitions.

### 4.2 C2: bundled skills and subagents

**The problem.** A plugin can bundle parts that are not adopted on their own. The schema let those be
typed `prompt`, `command`, `hook`, `resource`, `tool`, or `other`. A bundled **skill** or **subagent**
had no type, although Agent Skills and subagents are among the most common things plugins ship.

📏 **Evidence.** The Caveman plugin bundles 22 skills, 3 subagents, 1 command, and 4 hooks. Five
skills are independently adoptable and have their own manifests. The other 17 skills and 3 subagents
had to be `other`, with the real kind hidden in the name: `skill:cavecrew`, `agent:cavecrew-builder`.

💡 **The change.** `skill` and `agent` added to `embeddedComponents[].type`, with one rule restated:
a bundled skill that **is** independently adoptable still gets its own manifest and is listed under
`components`, not here.

```yaml
# before                          # after
- name: skill:cavecrew            - name: skill:cavecrew
  type: other                       type: skill
```

**Effect.** 20 Caveman entries changed from `other` to `skill` or `agent`. The `skill:` and `agent:`
name prefixes were kept for now, because the Caveman fact-checking script matches on them; they can
be dropped later.

🔗 This is the same distinction as [skills-and-agents-modelling.md](skills-and-agents-modelling.md)
makes: adoptable alone means a manifest; bundled means an embedded component.

### 4.3 C3: an interface type for CI actions

**The problem.** `interfaces[].type` says *how* a capability is used: `mcp`, `agent_skill`, `cli`,
`library`, `openapi`, and so on. A GitHub Action is used as a step in a workflow file, with inputs
defined in `action.yml`. None of the values fit.

📏 **Evidence.** Claude Code Action could only say `other`. (PR-Agent's comment commands and the
Caveman plugin's plugin interface are also `other`; see §6.)

💡 **The change.** `ci_action` added: "a step in a CI workflow, such as a GitHub Action, whose inputs
form the contract". It is not named after GitHub, so GitLab CI components or Azure Pipelines tasks
fit too.

```yaml
# before                          # after
interfaces:                       interfaces:
  - type: other                     - type: ci_action
    contractRef: .../action.yml       contractRef: .../action.yml
```

**Effect.** Claude Code Action now says `ci_action`. Mission 1 can match "I want something that runs
in my pipeline" without reading descriptions.

### 4.4 C4: free software, billed service

**The problem.** Many AI capabilities are **free open-source code that calls a paid API**. The Brave
Search MCP server is MIT-licensed, but every query is billed under your Brave Search API plan. The
cost list had `free`, `included`, `subscription`, `usage_based`, `chargeback`, and `other`:
- `free` is wrong: using it costs money;
- `usage_based` is misleading: the capability's publisher does not charge; a third party does;
- `other` is honest but useless to a consumer that ranks by cost.

📏 **Evidence.** 7 of the 16 production capabilities have this pattern: Brave, Tavily MCP, Exa, and
langchain-tavily (search APIs); browser-use, PR-Agent, and Claude Code Action (model APIs). Five had
been typed `other` and two `usage_based`.

💡 **The change.** `provider_billed` added: "the capability itself is free, but every use calls a
third-party service that bills the adopter under its own plan". The `details` text still says which
provider and whether a free tier exists.

```yaml
# before                          # after
costInformation:                  costInformation:
  model: other                      model: provider_billed
  details: The server is free...    details: The server is free...
```

**Effect.** All seven now say `provider_billed`. No `other` is left in `costInformation.model`.

❓ Mission 1 ranks by cost, so it should confirm that this distinction helps it.

### 4.5 C7: what kind of setup item

**The problem.** `setup` lists what an adopter must provide before a capability works. It had only a
free-text `name`, which the schema described as "an environment variable, a header, an account, or a
setting". In practice the list held very different things:

| Kind | Example from the set |
|---|---|
| Environment variable | `GITHUB_PERSONAL_ACCESS_TOKEN`, `BRAVE_API_KEY` |
| Input of a CI action | `anthropic_api_key` in Claude Code Action |
| Operating-system package | `poppler-utils`, `tesseract-ocr` for Unstructured |
| Other installed software | Google Chrome for Chrome DevTools MCP; Python Playwright for the skill |
| Account or API key with a service | "Exa account (OAuth) or API key" |
| App to install | the Claude GitHub App |

📏 **Evidence.** 11 of the 40 setup items in the 22 manifests are not environment variables. A
consumer could only tell them apart by guessing from the spelling of the name.

💡 **The change.** An **optional** field `setup[].kind` with the values `env_var`, `input`, `header`,
`system_package`, `software`, `account`, `app`, `setting`, and `other`.

```yaml
setup:
  - name: poppler-utils
    kind: system_package        # new
    description: System package needed to process PDFs and images.
    required: true
```

**Effect.** All 40 setup items now have a kind: 29 `env_var`, 3 `software`, 3 `system_package`,
2 `input`, 2 `account`, 1 `app`. Mission 5's submission form can ask the right question for each
kind ("which environment variable?" versus "which OS package?"), and Mission 1 can tell an adopter
"you will need Docker and Chrome" separately from "you will need two API keys".

---

## 5. How we know the changes are safe

📏 Every check below was run on 2026-11-13.

| Check | Result |
|---|---|
| `schema-compat` between the previous draft and the revised draft | **Additive (non-breaking).** Five changes: one optional field added, four lists of allowed values extended |
| Corpus check: every manifest valid under the old draft, re-validated under the new one | **32 of 32 still valid** (the 22 production-set manifests, 8 examples, 2 compatibility samples) |
| The 22 manifests, with the new values, and with `--check-sources` | **22 valid, 0 errors, 0 warnings**, every source reachable; 17 `adoptable`, 5 `assessable` (unchanged) |
| The 8 fictional examples | 8 valid (unchanged) |
| Field dictionary | Regenerated from the schema ([field-dictionary/0.1.md](field-dictionary/0.1.md)) |
| `npm test` | 204 of 206 pass. The two failures are the known Windows-only test issues (path separators and line endings), not schema problems |
| Caveman: Python cross-check (`crosscheck.py`) | 6 of 6 valid under Python `jsonschema` too; Python and Node.js agree |
| Caveman: mutation tests | Every one of the 22 mutation edits still finds its target text. One mutation (V2) tested that `skill` was *not* allowed; it now uses the invalid value `subskill`. The full mutation and fact-check runs need a local clone of the Caveman repository and were not re-run |

`schema-compat` also gave one expected warning: an additive change would normally need a new MINOR
version (0.2). The team decided on 2026-10-20 to keep one unpublished draft and revise it in place
until 0.1 is published, as was done on 2026-10-23. The previous draft is kept for comparison at
[research/phase-1/reference/capability-0.1-2026-10-23.schema.json](../research/phase-1/reference/capability-0.1-2026-10-23.schema.json).

---

## 6. What did not change, and why

The field review found eleven problems. Six were **not** applied, on purpose.

| # | Problem | Why it was not applied now |
|---|---|---|
| C5 | `platformCompatibility` mixes 26 kinds of tokens: hosts, operating systems, languages, forges, products | Fixing it means splitting or restricting an existing field, which is **breaking**. Needs agreement with Missions 1 and 2 |
| C6 | `dependencies` can only point to other manifests, so all 16 say "none" although they need Chrome, Docker, or a model API | Changes the meaning of an existing field. Matters most to Mission 3 (third-party dependencies) |
| C8 | Write access, telemetry, and data sent to third parties are only free text | **Mission 3 owns the assessment criteria.** Mission 4 adds fields only once the Trust Framework says what it needs. The evidence (write access in 4, telemetry in 2, data egress in 7) goes to Mission 3 as input |
| C9 | `source` repeats a `repository` publication in 8 of 22 manifests | This is open question U2, owned by the identity research (Spike 3) |
| C10 | A repository-wide license is always flagged for review | Needs a way to record a curator's confirmation; a validator change, not a schema change |
| C11 | `observedAt` dates can be much older than `lastUpdated` | A validator warning, not a schema change |

Two `other` values also remain, deliberately:
- PR-Agent's **comment commands** (`/review` on a pull request) are a real interface, but one example
  is not enough to name a new type;
- the Caveman **plugin** interface. A `plugin` interface type may be worth adding, but the capability
  type `plugin` already says what it is.

🔗 The rule used: apply a change now only if it is **additive**, **owned by Mission 4**, and backed
by **more than one real capability** (or, for C3, by a contract format that many CI systems share).

---

## 7. What this means for each mission

| Mission | What changes for it |
|---|---|
| 1 Recommendation | Can filter libraries from runnable tools (C1), CI steps from MCP servers (C3), and warn when a "free" capability bills through a third party (C4). Can list prerequisites by kind (C7) |
| 2 Landscape | Gets a `library` type for its catalogue (C1) and bundled skills it can count (C2). Should confirm C1, because it owns the type list |
| 3 Trust | Nothing is decided for it. The C8 evidence is its input for the Trust Framework fields. `setup[].kind` shows at a glance which items are credentials or accounts |
| 5 Contribution | The submission form can ask a kind-specific question per setup item (C7). Existing submissions stay valid, because `kind` is optional |

---

## 8. Before and after, in numbers

📏 Counted on the 22 manifests before and after the changes.

| Measure | Before | After |
|---|---|---|
| `other` in `embeddedComponents[].type` | 20 | **0** |
| `other` in `costInformation.model` | 5 | **0** |
| `other` in `interfaces[].type` | 3 | 2 (see §6) |
| Libraries typed as `tool` | 5 | **0** (now `library`) |
| Setup items whose kind is stated | 0 of 40 | **40 of 40** |
| Manifests valid | 22 of 22 | 22 of 22 |
| Breaking changes | | **0** |

---

## 9. Decisions still needed

| # | Decision | Who |
|---|---|---|
| 1 | Accept C1, C2, C3, C4, and C7 into 0.1 | Mission 4 team |
| 2 | Confirm `library` and the `tool` / `library` / `framework` definitions | Mission 2 |
| 3 | Confirm that `provider_billed` helps ranking | Mission 1 |
| 4 | Decide C5 and C6 (breaking) before 0.1 is published | Mission 4, with Missions 1, 2, and 3 |
| 5 | Say which trust metadata the Trust Framework needs (C8) | Mission 3 |
| 6 | Settle the open questions U1 to U10. The field review adds evidence for U1, U2, U5, U6, U8, and U10 | Phase 1 ticket owners |

❓ Schema 0.1 is **not** final. These changes make it fit real capabilities better. Publishing it
still waits on items 4 to 6.

---

## 10. The whole story on one page

1. The October research tested the schema against **messy, sampled** metadata.
2. Phase 1 tested it against **complete manifests of 22 real, maintained capabilities**.
3. The structure held: **22 of 22 valid**, no missing fields.
4. In five places curators had **no word for something real** and wrote `other` or the wrong value.
5. Each was fixed by **adding** a value or an optional field: `library`, `skill` and `agent`,
   `ci_action`, `provider_billed`, and `setup[].kind`.
6. `schema-compat` confirms the changes are **additive**; **32 of 32** earlier manifests stay valid.
7. Six further problems are **not** fixed yet, because they are breaking or owned by another mission.
8. Schema 0.1 stays an **unpublished draft** until the team, Missions 1 to 3, and the open questions
   settle the rest.

---

## 11. Test yourself

1. A Python package that agents import to parse PDFs: which `capabilityType`?
2. An MIT-licensed MCP server whose every call is billed by a search API: which cost model?
3. A plugin bundles a skill that users can also install on its own. Is it an `embeddedComponent` of
   type `skill`?
4. Why was `platformCompatibility` not fixed, although it was the messiest field?
5. Why does Mission 4 not add a `dataEgress` field, although 7 capabilities send data to third
   parties?

<details>
<summary>Answers</summary>

1. `library`.
2. `provider_billed`.
3. No. An independently adoptable skill gets its own manifest and is listed under `components`.
   Only skills that are not adopted alone are embedded components of type `skill`.
4. Fixing it changes an existing field, which is a breaking change, and Missions 1 and 2 use it.
5. Mission 3 owns the assessment criteria. Mission 4 adds trust fields once the Trust Framework says
   which it needs; defining them first would mean setting the criteria.

</details>

---

## 12. Where to read more

| Topic | Document |
|---|---|
| The evidence for every change | [reviews/field-review-production-set.md](reviews/field-review-production-set.md) |
| Why these 16 capabilities | [reviews/phase-1-sample-review.md](reviews/phase-1-sample-review.md) |
| The 22 manifests | [case-studies/production-set/](../case-studies/production-set/README.md) |
| The schema and its field dictionary | [schema/0.1/capability.schema.json](../schema/0.1/capability.schema.json), [field-dictionary/0.1.md](field-dictionary/0.1.md) |
| The draft before these changes | [research/phase-1/reference/capability-0.1-2026-10-23.schema.json](../research/phase-1/reference/capability-0.1-2026-10-23.schema.json) |
| The October research, explained | [research-explained.md](research-explained.md) |
| The Phase 1 plan and tickets | [phase-1-plan.md](phase-1-plan.md), [phase-1-spike-briefs.md](phase-1-spike-briefs.md) |
