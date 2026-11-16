# Skills, sub-skills, and agents in the capability manifest

How skills (including skills with sub-skills) are mapped, how a user starts one, and why agents are
described only through A2A today. First version 2026-11-06; **revised 2026-11-09** against the real
Caveman repository. Status: discussion draft. Everything under "Proposed" or "Recommendation" is a
proposal for the Mission 4 team, not a decision, and no schema file was changed.

Test evidence for the Caveman manifests is in [caveman-manifest-test-results.md](caveman-manifest-test-results.md);
the manifests are in [`case-studies/production-set/manifests/caveman/`](../case-studies/production-set/manifests/caveman/) (the test scripts stay in [`case-studies/caveman/`](../case-studies/caveman/)).

Provenance tags, in the style of the other documents in this folder:

| Tag | Meaning |
|---|---|
| **[Project]** | Stated in this repository (file named) |
| **[Caveman]** | Stated in the Caveman repository at commit `3dc497a` (2026-11-09), file named |
| **[External]** | From another public source read on 2026-11-06 or 2026-11-09 (listed in §8). Read through a summarising fetch, so check the source before quoting |
| **[Verified]** | I ran the project's validator or the fact-check script on it |
| **[Inference]** | My interpretation. Check it before relying on it |
| **[Recommendation]** | A proposal |
| **[Open]** | Not decided, or not checked |

## Corrections to the first version

The first version used a README summary of Caveman. The real files contradicted it in six places.

| # | First version said | The repository says |
|---|---|---|
| 1 | `/caveman`, `/ultracave`, `/megacave` are modes of one skill; "lite, full, ultra" are the modes | They are **three separate skills**, each with its own `SKILL.md`. `lite`, `full`, `ultra` and the `wenyan` levels are **legacy aliases** that the code maps forward to them [Caveman: `src/hooks/caveman-config.js`, `LEGACY_MODES`] |
| 2 | A handful of companion skills, subagents and hooks | **22 skills, 3 subagents, 1 command and 4 hooks** ship in the Claude Code plugin |
| 3 | Standalone use of `caveman-commit` and `caveman-review` was based on third-party write-ups | CLAUDE.md states it: "Fully independent skill". It calls `ultracave` and `megacave` "self-contained" [Caveman: `CLAUDE.md`] |
| 4 | An illustrative YAML block, "not a catalog entry" | Replaced by six real manifests that were tested (§3.4) |
| 5 | "I have no real non-A2A agent record yet" | The plugin ships three subagent definitions (`cavecrew-*`); they are one publisher's, so the sample is still thin (§4.1) |
| 6 | Part B cited gaps G8 and G9 | Part A defined only G1-G6. §3.6 and §4.3 now define G1-G12 |

---

## 1. Short answers

| Question | Short answer | Where |
|---|---|---|
| How are skills mapped? | A skill is one capability of type `skill`, with an `agent_skill` interface that points at its `SKILL.md`. The crosswalk reads six front-matter keys. A skill family is a bundle: parts that can be adopted alone get their own manifest (`components` and `parent`), the rest sit inline (`embeddedComponents`). Three tests decide, plus what the owner says. The real Caveman plugin is **1 bundle + 5 skill manifests + 25 inline components**, and all six validate | §3.1, §3.4 |
| How does the user initiate a skill? | The manifest does not model it, on purpose. In Claude Code, the user types `/name`, or the model loads the skill when the request matches its `description`; a skill can forbid the second route (`disable-model-invocation`, true for `ultracave` and `megacave`); a hook can start behaviour with no command at all. Before any of that, an organization-level step has to choose and install the skill, and that is what the manifest serves | §3.2, §3.3 |
| Why is there no "agent as a capability", only A2A? | `agent` is one of the 10 capability types, but the only agent-specific modelling is the `a2a` interface. I found no decision that says agents are A2A-only. It follows from four things: A2A is the only native agent contract that was sampled, the manifest references native contracts instead of restating them, one common core is used for all types, and agent risk metadata belongs to Mission 3 and is deferred | §4.2 |
| What would fix the gaps? | Two small additive changes (allow `skill` and `agent` as embedded types; an interface type for host-loaded agent definitions), extension-field trials (invocation, modes, agent facets), and more evidence on non-A2A agents. None is applied: Phase 1 forbids direct schema edits | §4.5, §6 |

---

## 2. Why these questions get mixed up: three layers

```text
 ORGANIZATION LAYER   need -> find -> compare -> decide -> install -> govern
   Missions 1, 2, 3, 5 consume the manifest here.        <- Mission 4 works here

 HOST LAYER           session start -> descriptions in context -> match the request
   Claude Code, other agent hosts                         -> load the body -> run
   read the NATIVE format (SKILL.md, Agent Card)

 THE CAPABILITY       SKILL.md + scripts + references; a subagent file;
                      an Agent Card + a running service
```

- The charter says the manifest is "a metadata and description contract, not a runtime execution
  protocol" [Project: `docs/mission-understanding.md` §4.2 "Manifest"; `docs/questions-answered.md` §A.1].
- "How does the user start a skill" is a host-layer question. "Which skill should the team have at
  all" is an organization-layer question. Your ticket example touches both (§3.3).
- For each topic below I separate what the capability does at runtime from what the manifest records
  about it.

---

## 3. Part A: skills and sub-skills

### 3.1 What a skill is in the manifest today (what, where)

| Aspect | Today | Source |
|---|---|---|
| Type | `capabilityType: skill`, derived by convention: a `SKILL.md` is a skill | [`pilot/crosswalk.js`](../pilot/crosswalk.js), [`research/spikes-1-3/crosswalk.js`](../research/spikes-1-3/crosswalk.js) lines 170-192 |
| Interface | `interfaces: [{ type: agent_skill, contractRef: <SKILL.md URL> }]`. The manifest references the native file and does not copy it | [schema](../schema/0.1/capability.schema.json) line 639; [manifest-spec](manifest-spec.md) §1 |
| Runtime | `agent_host` ("runs inside an agent host that loads it") | schema line 718 |
| Location | `source.url` plus `source.path` for a skill inside a monorepo | [manifest-spec](manifest-spec.md) §6 table |
| Where the manifest file lives | `<name>.capability.yaml`, one per file. There is no catalog in this repo; storing manifests is Mission 2's job | [manifest-spec](manifest-spec.md) §3; [mission-boundaries](mission-boundaries.md) §3 |

Front-matter keys the crosswalk reads, and what it maps them to [Project: `research/spikes-1-3/crosswalk.js`]:

| `SKILL.md` key | Manifest concept |
|---|---|
| `name` | native name (not the id) |
| `description` | `description` |
| `license` | `license` (text or file pointer) |
| `compatibility` | `runtime` |
| `metadata.version` | version |
| `metadata.author` | maintainer / `owner` |

Keys it does not read (Claude Code front matter, [External] code.claude.com/docs/en/skills):
`when_to_use`, `disable-model-invocation`, `user-invocable`, `argument-hint`, `allowed-tools`,
`context`, `agent`, `paths`, `hooks`, and the `tools` and `model` keys that subagents and some skills
carry. The real Caveman files use three of them (§3.6, G2).

### 3.2 How a user starts a skill (how, when)

Claude Code semantics [External]. Other hosts differ, and each needs checking [Open].

| Trigger | Who decides | Mechanism | Controlled by |
|---|---|---|---|
| Natural language ("analyze this ticket") | The host's model | Descriptions of installed skills are always in context; the model loads a skill's body when the request matches `description` (and `when_to_use`) | `description`, `when_to_use`, `paths` |
| Slash command | The user | Types `/skill-name [arguments]`; plugin skills are also reachable as `/plugin:skill` | `name`, `argument-hint` |
| Hook (automatic) | The plugin | A hook runs on an event and can set state or inject text. Caveman's `UserPromptSubmit` hook parses `/caveman`, `/caveman-commit` and the plugin form `/caveman:caveman-commit` [Caveman: `src/hooks/caveman-parse.js`]; its `SessionStart` hook resolves the default mode from `CAVEMAN_DEFAULT_MODE`, a repo-local config, a user config, then `caveman` [Caveman: `caveman-config.js`] | `hooks` in `plugin.json` |
| Programmatic | Another component | A skill forked into a subagent (`context: fork`, `agent`); a subagent preloading skills (`skills`); one skill telling the model to follow another (Caveman: "`/caveman ultra` and `/caveman wenyan` are aliases: follow the `ultracave` or `megacave` skill instead") | `context`, `agent`, the skill text |
| Organization step | A person or process, before any session | The skill is found, assessed, and installed or enabled | The manifest (Missions 1, 2, 3, 5) |

Two flags restrict the first two rows [External]:

- `disable-model-invocation: true`: the model may not start it, so only the user can. Meant for
  side-effect workflows such as `/deploy`. **Caveman sets it on `ultracave` and `megacave` only**
  [Verified: 2 of 22 skills].
- `user-invocable: false`: hidden from the `/` menu, so only the model starts it. Meant for
  background knowledge.

When things happen:

| When | What happens |
|---|---|
| Install or enable | Organization decision. This is the manifest's moment |
| Session start | Name and description enter context (about 100 tokens per skill, per the Agent Skills spec) [Project: `docs/questions-answered.md` §A.2]. Hooks on `SessionStart` run |
| Request time | The host matches the request against descriptions; a `UserPromptSubmit` hook sees the prompt first |
| Activation | The `SKILL.md` body loads (spec recommends under 5,000 tokens); referenced files and scripts load on demand |
| After compaction | Up to 5,000 tokens per invoked skill are re-attached, within a 25,000-token budget [External] |

### 3.3 Worked example: your ticket request

> "I have shared the ticket details, analyze the ticket and make a plan to implement these changes."

| Step | Layer | What happens | Manifest fields that matter |
|---|---|---|---|
| 0 | Organization | Someone decides the team should have a ticket-to-plan skill. Mission 1 would match this need against manifests | `description`, `supportedUseCases`, `keywords`, `capabilityType`, `interfaces`, `publications[].platformCompatibility` |
| 1 | Host | Session starts; installed skill descriptions are in context | `description` (it is both discovery text and trigger text) |
| 2 | Host | The request arrives. If a description says something like "use when the user shares a ticket and wants an implementation plan", the skill loads. If none matches, the base model answers alone, and nothing reusable was applied | `description` |
| 3 | Host | Body loads; the skill's steps run. Ticket content already in the chat needs no tool. A ticket ID or URL needs a connector (for example an issue-tracker MCP server) | `dependencies`, `setup` (credentials) |
| 4 | Host | A plan is produced; the skill stays in context | `interfaces[].outputs` (if curated) |
| alt | Host | The user types `/plan-ticket <ticket>` and skips the matching in step 2 | none today |

What this shows:

- The sentence you typed is, at the organization layer, a **need** (journey J1 in
  [`pilot/journeys.yaml`](../pilot/journeys.yaml): "Find a capability for a need").
- A skill's `description` does two jobs: it is the text a catalog searches, and the text the host
  matches against. The `pdf` sample ends with a trigger sentence ("If the user mentions a .pdf file
  or asks to produce one, use this skill", [`pilot/samples/skills/pdf.json`](../pilot/samples/skills/pdf.json)),
  and so do Caveman's: `caveman-commit` says 'Use for "write a commit", "commit message", /commit or
  /caveman-commit'.
- The manifest has no field for "how do I start it" (slash name, auto or manual). Hosts differ, and
  a core field would encode one host's behaviour. Today the answer is the `contractRef` link to the
  `SKILL.md`, plus an `x-invocation` extension in the Caveman manifests (G4).
- Description length is **not** a problem for this family: the longest of the 22 skill descriptions is
  293 characters, against the manifest's 1,024 cap. The cap that bites is the 300-character cap on
  *embedded* component descriptions, and it bit once, on a subagent (G5). The earlier suspicion that
  trigger text would collide with the 1,024 cap is not supported by this sample [Verified].

### 3.4 Skills with sub-skills: the real Caveman plugin

The subject is the Caveman plugin for Claude Code, plugin version 4.1.0, installed as
`caveman@caveman` [Caveman: `.claude-plugin/plugin.json`, `marketplace.json`]. I read the repository
at commit `3dc497a` as data and ran nothing from it.

#### What the plugin contains

The marketplace entry has `"source": "./"`, so the plugin root is the repository root. Claude Code
auto-discovers every `skills/*/SKILL.md` with no allowlist, every `agents/*.md`, and every
`commands/*.md`; `plugin.json` declares only four hooks [Caveman: `CLAUDE.md`; Verified: S4].

| Group | Count | Members | How they start | Independent? |
|---|---|---|---|---|
| Voice skills | 3 | `caveman`, `ultracave`, `megacave` | `/caveman`; `/ultracave` or `/caveman ultra`; `/megacave` or `/caveman wenyan`. The last two are user-only | `ultracave` and `megacave`: "self-contained", each "maps 1:1 to a stored mode". `caveman` also ships alone as `dist/caveman.skill` and via `npx skills add` |
| One-shot skills | 2 | `caveman-commit`, `caveman-review` | Slash command or description match | "Fully independent skill" |
| Helpers | 3 | `caveman-compress` (has Python scripts, sends file text to a model provider), `caveman-help`, `caveman-stats` (reads what a hook recorded) | Slash command | The repo calls compress a "sub-skill"; stats needs the hooks |
| Delegation | 1 + 3 | Skill `cavecrew`; subagents `cavecrew-investigator`, `-builder`, `-reviewer` | Model delegates | Part of one set |
| Cloud and CLI drivers | 7 | `caveman-setup`, `-discover`, `-manage`, `-optimize`, `-evidence-review` (serve Caveman Cloud), `-learn` (needs the Caveman CLI), `-explore` (local, read-only) | Description match | The first six need Cloud or the CLI. `-explore` runs locally with `Read`, `Glob`, `Grep`; CLAUDE.md groups it with the drivers but I did not check whether it works alone |
| Work patterns | 6 | `investigate-first`, `lean-build`, `surgical-patch`, `safe-refactor`, `migration`, `verify-and-stop` | Description match | Generic, "ship with the plugin" |
| Command | 1 | `caveman-init` (the `.toml` stubs in `commands/` are Codex and Gemini only) | `/caveman-init` | Part of the plugin |
| Hooks | 4 | `SessionStart`, `SubagentStart`, `UserPromptSubmit`, `SessionEnd` | Events | Part of the plugin |

Outside the plugin manifest but in the same repository [Caveman]: the CLI (`@caveman-ai/cli`), the
proxy, the engine, an MCP server, `browse`, `shrink`, SDKs, a browser extension, and three other host
packagings (a Codex plugin, a Cursor plugin, a Gemini extension, each at 4.1.0). Caveman Cloud is
separate commercial software with no source in the repository.

#### Modes are skills

The hooks store one of seven mode ids: `off`, `caveman`, `ultracave`, `megacave`, `commit`, `review`,
`compress`. The default is `caveman`; `manual` is accepted as a startup policy. `commit`, `review` and
`compress` are "independent modes" with their own slash commands [Caveman: `caveman-config.js`,
`caveman-parse.js`; Verified: M1-M3]. So a mode is not a setting of one skill; it is a state that a
skill sets. The manifest has no concept for modes, so the real bundle carries them in an extension
field, `x-modes`, which the schema accepts and ignores [Verified: T1, T4]. The abilities vocabulary
that might replace it is still open (U5).

#### Which parts get their own manifest

Rule used: a part gets a manifest when the repository itself calls it independent or self-contained
(this is the adoption test of [Project: `docs/spikes-1-3-research.md` §9.1], answered by the owner);
everything else stays inline. The software and accountability tests do not separate the parts: all
share one maintainer and one license.

| Result | Parts | Why |
|---|---|---|
| Own manifest, linked to the bundle with `parent` / `components` (5) | `caveman`, `ultracave`, `megacave`, `caveman-commit`, `caveman-review` | The repository says so (CLAUDE.md), or ships the part alone |
| Inline in `embeddedComponents` (25) | 17 skills, 3 subagents, 1 command, 4 hooks | Not stated to be independent, or tied to the plugin's hooks, the CLI, or Cloud |

This is a judgment. The validator reports `/components` as `DERIVED_VALUE_UNCONFIRMED` until the owner
or a curator confirms it, which is the right outcome [Verified]. The inline skills could be promoted
with no schema change, if the owner says they can be adopted alone.

#### The manifests

| File | Id | Type | Level |
|---|---|---|---|
| [`caveman-plugin.capability.yaml`](../case-studies/production-set/manifests/caveman/caveman-plugin.capability.yaml) | `juliusbrussee/caveman-plugin` | plugin | adoptable |
| [`caveman.capability.yaml`](../case-studies/production-set/manifests/caveman/caveman.capability.yaml) | `juliusbrussee/caveman` | skill | assessable |
| [`ultracave.capability.yaml`](../case-studies/production-set/manifests/caveman/ultracave.capability.yaml) | `juliusbrussee/ultracave` | skill | assessable |
| [`megacave.capability.yaml`](../case-studies/production-set/manifests/caveman/megacave.capability.yaml) | `juliusbrussee/megacave` | skill | assessable |
| [`caveman-commit.capability.yaml`](../case-studies/production-set/manifests/caveman/caveman-commit.capability.yaml) | `juliusbrussee/caveman-commit` | skill | assessable |
| [`caveman-review.capability.yaml`](../case-studies/production-set/manifests/caveman/caveman-review.capability.yaml) | `juliusbrussee/caveman-review` | skill | assessable |

Excerpt of the bundle (the file is 293 lines; comments mark what is left out):

```yaml
schemaVersion: "0.1"
id: juliusbrussee/caveman-plugin
name: Caveman (Claude Code plugin)
description: >-
  Ultra-compressed communication mode. Shortens prose while preserving technical terms, code,
  commands, and exact errors.
capabilityType: plugin
capabilityVersion: "4.1.0"
source:
  type: repository
  url: https://github.com/JuliusBrussee/caveman
  repositoryId: "1201173969"
  status: active
  updatedAt: "2026-11-09"
publications:
  - kind: marketplace_entry
    locator: caveman@caveman
    nativeName: caveman
    nativeVersion: "4.1.0"
    versionScheme: semver
    updatedAt: "2026-11-06"
owner: { name: Julius Brussee, contact: "https://github.com/JuliusBrussee/caveman/issues", affiliation: external }
license: { expression: Apache-2.0, scope: repository }   # url omitted here
riskTier: unassessed
# ... documentation, keywords, supportedUseCases (8), interfaces (2), runtime (2), setup (3) ...
limitations:
  - Every skills/*/SKILL.md ships to every plugin user with no allowlist, so all 22 skill descriptions compete for activation on ordinary work.
  - The caveman-compress skill sends the full text of the named file to the model provider its script is configured for (claude CLI, Anthropic API or an OpenAI-compatible endpoint) and needs python3.
  # ... five more ...
components:
  - id: juliusbrussee/caveman
  - id: juliusbrussee/ultracave
  - id: juliusbrussee/megacave
  - id: juliusbrussee/caveman-commit
  - id: juliusbrussee/caveman-review
embeddedComponents:
  - name: skill:cavecrew          # 17 skills like this; the kind is carried in the name (G1)
    type: other
  # ... 16 more skills ...
  - name: agent:cavecrew-builder  # no description: the native text is 301 characters, the cap is 300 (G5)
    type: other
  # ... 2 more agents, command:caveman-init (type command), 4 hooks (type hook) ...
# ... provenance (22 entries) ...
x-modes:
  storedModes: ["off", caveman, ultracave, megacave, commit, review, compress]
  startupOnly: [manual]
  defaultMode: caveman
  # legacyAliases: lite, full, ultra, wenyan, wenyan-lite, wenyan-full, wenyan-ultra
```

Every value traces to a file in the Caveman repository or to the GitHub API, and the manifest's
`provenance` block says which. Notable choices:

- `license.scope: repository`, because Apache-2.0 is stated for the repository as a whole
  [Caveman: `LICENSING.md`]. The validator keeps this unverified.
- No `lifecycleStatus` and no `maturity`: the owner declares neither. `source.updatedAt` and the
  publication date supply the lifecycle signal.
- The five skills carry `versionScheme: unversioned` on their publication, because no skill has its
  own version.
- Data egress and credentials are in `limitations` and `setup` as text (G7).

### 3.5 Approaches to modelling a skill family

| # | Approach | How it looks | Strengths | Weaknesses | Used for Caveman |
|---|---|---|---|---|---|
| S1 | One manifest, parts inline | `embeddedComponents` | One record; no id management | Cannot type a part as `skill` or `agent`; parts invisible to search and risk review | **Yes**: 25 parts |
| S2 | Bundle plus child manifests | `components` / `parent` [Verified] | Each adoptable part is findable, versioned and assessable on its own; reciprocity is checked | More ids to allocate (U3); more records to keep current | **Yes**: 5 parts |
| S3 | Sub-skills as abilities of one capability | A structured abilities list | Matches how A2A treats its "skills" (abilities, not capabilities; case 10 in research §9.2) | No field yet; vocabulary undecided (U5) | **No**: Caveman's modes turned out to be skills, so S2 fits; S3 stays relevant for argument forms such as `/caveman ultra` |
| S4 | Flat, unlinked manifests | Each sub-skill standalone | Simplest | The family is lost; `relations` cannot express "part of" | No; never recommended |

[Recommendation] Use S2 for parts the owner says are independent, S1 for the rest, and revisit S3
once U5 is decided. The split is cheap to change: promoting an inline skill to its own manifest needs
no schema change.

### 3.6 Gaps found in Part A

| # | Gap | Evidence | Effect |
|---|---|---|---|
| G1 | `embeddedComponents[].type` allows `prompt, command, hook, resource, tool, other` only. `skill` and `agent` are rejected | [Verified: mutation V2]; schema line 861. In the real bundle, **20 of 25** embedded components (17 skills, 3 agents) are typed `other` | A sub-skill or subagent is invisible to type filters. The kind is carried in the name (`skill:`, `agent:`) as a workaround  **Resolved 2026-11-13:** `skill` and `agent` were added to the schema ([phase-1-changes-explained.md](phase-1-changes-explained.md), C2). |
| G2 | The crosswalk reads six front-matter keys and ignores invocation and permission keys | `research/spikes-1-3/crosswalk.js` lines 170-192. Caveman uses `disable-model-invocation` (2 skills), `tools` (1 skill, `caveman-explore`) and `model` (1 skill, 2 of 3 subagents) | A catalog cannot tell a user-only skill from an auto-loaded one, or see which tools or model it asks for |
| G3 | The interface list has no plugin type; the plugin crosswalk records component kinds as strings (`component: skills`) and does not list the skills | crosswalk line 215. The real bundle uses `type: other` with a `contractRef` to `plugin.json` and still reaches **adoptable** | Semantic loss only; a consumer filtering on interface type finds nothing for plugins |
| G4 | No home for "how to start it" | `x-invocation` is accepted [Verified: T1]; it records the one front-matter flag on the five child skills | Mission 1 cannot tell the user which command to type, unless it reads the extension |
| G5 | Description caps differ by place: 1,024 for a capability, 300 for an embedded component | The longest skill description is 293. `cavecrew-builder`'s is **301**, so it is omitted [Verified: V6] | A native value that does not fit is dropped; 1 of 25 embedded components |
| G6 | Modes have no structured home | `x-modes` carries seven mode ids and seven legacy aliases [Verified: M1, M2] | Modes are searchable only through the extension or free text |
| G7 | Data egress and credentials exist only as prose | `caveman-compress` "sends the file's full text to the model provider"; `caveman-setup` needs `CAVE_API_KEY`. They went into `limitations` and `setup` text | Mission 3 cannot query them (see R4) |
| G8 | One capability ships in several host packagings, each with its own manifest and version | Claude Code plugin, Codex plugin, Cursor plugin, Gemini extension, all 4.1.0 [Caveman] | The bundle is scoped to the Claude Code plugin and lists one publication. Whether the others are publications of it or separate capabilities is open (U4, U18) |
| G9 | `dependencies` can only name capabilities that have manifests | Six skills need the Caveman CLI or Cloud, which have none here | The dependency is text in `limitations` |
| G10 | The repository holds a CI mirror of part of `skills/` | `plugins/caveman/skills/` has six folders: five byte-identical to `skills/`, and `caveman-stats`, which differs [Verified] | The manifests point at `skills/` ("single source of truth" per CLAUDE.md). Manifesting both paths would trigger `DUPLICATE_SOURCE` for one skill |

---

## 4. Part B: agents

### 4.1 What exists today

| Item | Finding | Source |
|---|---|---|
| Type | `agent` is one of 10 `capabilityType` values | schema line 49 |
| Type-specific rule | None for `agent`. Only `mcp_server` has one (it must declare an `mcp` interface) | schema lines 258-267 |
| A2A rule | An `a2a` interface must carry `contractRef` (the Agent Card URL) | schema lines 677-684 |
| Examples | One agent manifest in the repository: the fictional hosted `incident-triage-agent`, A2A | [`examples/valid/incident-triage-agent.capability.yaml`](../examples/valid/incident-triage-agent.capability.yaml) |
| Real data, A2A | 0 agents among the 12 pilot drafts (7 `mcp_server`, 4 `skill`, 1 `tool`). The 36 public A2A Agent Cards were a **conformance sample**, not capability records; 4 of 36 validate against A2A v0.3.0 | `pilot/drafts/`; research §4.2, §7.7 |
| Real data, non-A2A | **New:** the Caveman plugin ships three subagent definitions as Markdown files with front matter (`name`, `description`, and `model: haiku` on two). They are typed `other` inside the bundle. One publisher, so the sample is thin | [`case-studies/caveman/`](../case-studies/caveman/); [Caveman: `agents/*.md`] |
| Evidence about running agents | "There is no registry of A2A agents to sample from"; no agent was run | research §7.7; `docs/mission-understanding.md` §6.5 |
| Non-A2A agent as its own capability | Fits only as `interfaces.type: other` [Verified: probe, 2026-11-06]. The validator accepts it and the manifest says nothing agent-specific | §7 |

So your observation is right in substance, with one correction: agent exists as a capability **type**.
What is missing is agent-specific **content**; the only agent-specific description is the A2A card.

### 4.2 Why agents are A2A-only today (why)

I found no document that records "agents are A2A-only" as a decision [Open: ask the original authors].
These are the reasons the documents support [Inference]:

| # | Reason | Evidence |
|---|---|---|
| R1 | **Reference, don't restate.** The manifest points to a native contract. A2A's Agent Card is the one standard, machine-readable agent contract in the sample, so "agent" got the A2A interface and nothing else | Decision D14, [`docs/poc-report.md`](poc-report.md) line 185; manifest-spec §1 |
| R2 | **No evidence about other agents.** The seven sampled formats (MCP Registry, npm, Agent Skills, Claude Code plugins, Docker MCP catalog, PyPI, GitHub Actions) contain no agent-definition format. Agents entered only as Agent Cards for conformance. The Caveman case adds three subagent files, but from one publisher | research §4.2; §4.1 above |
| R3 | **One common core.** Per-type metadata differs only in four concepts (interface, runtime, setup, dependencies); separate requirement profiles per type are not supported by the evidence. `mcp_server` has a rule because the registry verifies it | research §9.3 |
| R4 | **Agent risk belongs to Mission 3.** "Data handling, access controls, model risks" is a deliberate gap until the Trust Framework defines its criteria. Autonomy, permissions, and model choice are the main agent-specific risk facets. The Caveman case shows the cost: its data-egress facts are free text (G7) | [`docs/mission-boundaries.md`](mission-boundaries.md) §5 line 99; manifest-spec §4 "Still deferred" |
| R5 | **Abilities vocabulary is open.** What an agent can do (A2A `skills[]`) maps to abilities, which wait on U5. Ticket 2 compares free text, A2A-style, and OASF-style | [`docs/phase-1-spike-briefs.md`](phase-1-spike-briefs.md) lines 68-86 |
| R6 | **Coverage is not promised.** "Support for every platform or capability type is not assumed" | [`docs/mission-understanding.md`](mission-understanding.md) §4.2 "Capability type" |

### 4.3 What "agent as a capability" would need

An agent differs from a skill in kind: a skill is a static file a host loads; an agent is a
decision-making component with a model, tools, and often a running service [Inference]. Facets a
reader would ask about, against what the manifest holds:

| Facet | Question a reader asks | Today | Verdict |
|---|---|---|---|
| Interface | How do I call it? | `a2a` with `contractRef`; anything else is `other` | A2A fine; Markdown-defined agents have no type (**G11**) |
| Runtime | Where does it run? | `runtime`: `hosted_service` or `agent_host` | Works |
| Model | Which model or provider does it use? | None. `dependencies` accepts capability ids only, and a model provider is "a service dependency" (research §9.2 case 6). The subagent files state `model: haiku` natively | Gap (**G12**) |
| Tools and permissions | What can it touch? | `dependencies` approximates the tools; no permission scope. `caveman-explore` states `tools: Read, Glob, Grep` natively | Gap (**G12**); overlaps Mission 3 access controls |
| Composition | Which skills or subagents does it use or delegate to? | `dependencies` / `components`. In Caveman the `cavecrew` skill names its three subagents in its description | Partial |
| Autonomy | Does it act without a human? | Free-text `limitations` ("Proposes actions only; it never executes remediation steps") | Gap: unqueryable |
| Abilities | What tasks does it take? | `supportedUseCases`; A2A card skills via `contractRef` | Partial; U5 |
| State and data | What does it keep? | None | Gap; Mission 3 |

Gaps added here: **G11** no interface type for host-loaded agent definitions (the Caveman subagents
use `other`); **G12** model and tools facets exist in native files and have no field.

### 4.4 Approaches

| # | Approach | Change | Strengths | Weaknesses |
|---|---|---|---|---|
| B1 | Status quo | none | No work; nothing to be wrong | Agents without an Agent Card are unrepresentable beyond `other` |
| B2 | Add an interface type for host-loaded agent definitions (a name like `agent_definition`, mirroring `agent_skill`) | Additive enum value | Small; matches how skills are handled; covers subagent files | Evidence is three files from one publisher; needs more |
| B3 | Allow `skill` and `agent` as `embeddedComponents[].type` | Additive enum values | Fixes G1; **20 of 25** embedded components in the real bundle are affected | None significant |
| B4 | Core agent block (model, tools, delegates, autonomy) with a conditional rule for `type: agent` | New optional fields plus a rule | Queryable agent facets | A per-type profile, against R3; needs Mission 3 input on risk facets |
| B5 | `x-agent` extension fields first | None to the schema | Trial without commitment; the spec already says to use `x-` for deferred Mission 3 metadata | Not standardized; consumers may diverge |

### 4.5 Recommendation

1. **B3 now**, as a decision record in Ticket 2. It is cheap, and the Caveman case measures its
   effect: 20 of 25 inline components.
2. **More evidence before B2**: collect about 10 agent definitions from at least three publishers
   (Claude Code subagent files, plugin `agents/` folders) and draft manifests for them. The Caveman
   three are the start. This fits in Ticket 2's drafting work, or in E1 (internal capabilities) in
   Phase 2 [Recommendation].
3. **B5 for facets** (`model`, `tools`, autonomy) until Mission 3's Trust Framework says which agent
   facets it needs; **B4 only then**.
4. Keep A2A as the reference for hosted agents. Do not widen it.

Phase 1 forbids direct schema edits ([`docs/phase-1-plan.md`](phase-1-plan.md), rule 2), so each
item enters as a decision record and is merged on Nov 9 if accepted. The README's "Changing the
schema" section gives the procedure (`schema-compat`, `npm run docs`, `npm test`).

---

## 5. What, why, how, when, where, who

| | Skills and sub-skills | Agents |
|---|---|---|
| **What** | `capabilityType: skill`; interface `agent_skill`; `SKILL.md` referenced by `contractRef`. Families are bundle plus children, or inline parts. Caveman: 1 bundle, 5 skill manifests, 25 inline parts | `capabilityType: agent`; the only agent-specific piece is the `a2a` interface and its Agent Card. Caveman's three subagents sit inline as `other` |
| **Why** | Reference native formats; one common core; independently adoptable parts get their own record (tests 1-3, answered by the owner's own statements) | R1-R6 in §4.2: no non-A2A evidence until now, one core, Mission 3 owns agent risk |
| **How** | Crosswalk reads six keys; family via `components` / `parent` / `embeddedComponents`; invocation and modes in `x-` extensions. Users start a skill by request match, `/name`, or a hook | Describe by `contractRef` to the card; non-A2A agents as `other`; facets are not modelled |
| **When** | Install: organization decision. Session start: descriptions load, `SessionStart` hooks run. Request: match. Activation: body loads | A2A agents are called at task time over the protocol; file-defined agents are delegated to by a host. Neither moment is in the manifest |
| **Where** | `SKILL.md` in the skill's repository folder; manifests as `<name>.capability.yaml`; catalog storage is Mission 2 | Agent Card at a well-known URL on the running service (it exists only while the service runs); subagent definitions as Markdown files in the repository |
| **Who** | Capability owners fill content and confirm the split; Mission 4 owns structure; Mission 1 matches needs; the host starts skills | Same, plus Mission 3 for agent risk facets |

---

## 6. Open questions

Names are proposals; U1-U10 already exist in [`docs/phase-1-plan.md`](phase-1-plan.md).

| Proposed # | Question | Suggested owner |
|---|---|---|
| U11 | Should `embeddedComponents[].type` include `skill` and `agent`? (B3, G1) | Ticket 2 (B), next to U4 |
| U12 | Are modes abilities, a state set by a skill, or an extension? Caveman's seven mode ids are the test case (G6) | Ticket 2 (B), with U5 |
| U13 | Is "how to start it" a core field, an `x-` extension, or left in `SKILL.md`? Needs Mission 1's view on whether recommendations should say which command to type (G4) | Ticket 2 (B), with Mission 1 |
| U14 | Should the 300-character cap on embedded descriptions equal the 1,024 cap on a capability? One of 25 embedded Caveman components did not fit (G5). The 1,024 cap held for all 22 skill descriptions | Ticket 4 (D) |
| U15 | Are file-defined, non-A2A agents in scope for 0.1? Needs a larger sample (B2, G11) | Ticket 2 (B), Missions 1 and 2 |
| U16 | Which agent facets does Mission 3 need (model, permissions, autonomy, data egress)? (G7, G12) | Mission 3, through Ticket 4 (D) |
| U17 | Where is the line between `agent` and `workflow`? (`claude-code-action` is a workflow that embeds an agent, research §9.2 case 6) | Ticket 2 (B) |
| U18 | One capability in several host packagings (Claude Code, Codex, Cursor, Gemini): publications of one capability, or separate capabilities? Extends U4 (wrapper) (G8) | Ticket 2 (B) and Ticket 3 (C) |
| U19 | Does the owner confirm the component split (5 own manifests, 25 inline)? The validator reports `/components` as unconfirmed | Mission 5's contribution workflow; the owner of Caveman |
| U20 | Should the Caveman CLI, proxy, engine and MCP server get manifests, so that dependencies can be expressed instead of described (G9)? | Mission 2 |

---

## 7. How this was checked

- **Read:** README, schema, `docs/manifest-spec.md`, `docs/spikes-1-3-research.md` (§4, §6, §7.7, §9),
  `docs/questions-answered.md` (§A), `docs/mission-boundaries.md`, Phase 1 plan and briefs, both
  crosswalks, the skill and plugin samples, and the example manifests. For Caveman: `plugin.json`,
  `marketplace.json`, `package.json`, `CLAUDE.md`, `LICENSING.md`, `README.md`, `docs/HONEST-NUMBERS.md`,
  all 22 `SKILL.md` front matters, the 3 subagents, the hooks configuration, `caveman-config.js` and
  `caveman-parse.js`, and several skill bodies.
- **Tested:** the six Caveman manifests passed schema validation, source reachability, a Python
  cross-check, the exchange contract, 44 fact checks against the repository and the GitHub API, and
  22 deliberate-error mutation tests. Results: [caveman-manifest-test-results.md](caveman-manifest-test-results.md).
- **Earlier probes (2026-11-06):** an embedded `skill` or `agent` type is rejected (the same finding
  as mutation V2); an `agent` manifest with `interfaces: [{ type: other }]` and `runtime: agent_host`
  is valid.
- **Not checked:** which of the 17 inline skills could be adopted alone; how other hosts (chat apps,
  Copilot, Codex) let a user start a skill; whether any of the 60 research records is an agent in its
  own right (the sample table lists none by format, but I did not inspect each record); the plugin was
  not installed or run.

---

## 8. Sources

Repository: [`schema/0.1/capability.schema.json`](../schema/0.1/capability.schema.json) ·
[`docs/manifest-spec.md`](manifest-spec.md) ·
[`docs/spikes-1-3-research.md`](spikes-1-3-research.md) ·
[`docs/questions-answered.md`](questions-answered.md) ·
[`docs/mission-boundaries.md`](mission-boundaries.md) ·
[`docs/phase-1-plan.md`](phase-1-plan.md) ·
[`docs/phase-1-spike-briefs.md`](phase-1-spike-briefs.md) ·
[`research/spikes-1-3/crosswalk.js`](../research/spikes-1-3/crosswalk.js) ·
[`pilot/journeys.yaml`](../pilot/journeys.yaml) ·
[`case-studies/caveman/`](../case-studies/caveman/).

External:

- Claude Code skills (read 2026-11-06): <https://code.claude.com/docs/en/skills>
- Caveman repository, commit `3dc497a7f858c774d6e15b25e8c6120ef3a0eda8`, tag `v4.1.0` (read 2026-11-09): <https://github.com/JuliusBrussee/caveman>
- Agent Skills specification (via the project's own citation): <https://agentskills.io/specification>
