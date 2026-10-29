# Mission 4: Questions answered (problem, solution, mechanics, proof of concept)

| | |
|---|---|
| Date | 2026-10-23 |
| Answers | The Mission 4 team's questions of 2026-10-23, in four groups: the problem, the solution, how it works, and what the proof of concept (POC) demonstrated |
| Built from | The charter and spike documents; the POC (schema 0.1 as revised on 2026-10-23, validator, contracts, examples); the journey pilot (iteration 1); the Spikes 1-3 research (60 real capability records); the Spike 2 report review; external sources checked on 2026-10-23 (§E) |
| Status | Explanations and evidence. **Nothing here is a decision.** Proposals stay proposals until their owners confirm them |
| Handling | Derived from documents marked "Confidential – Authorized Use Only". Handle it the same way |

Labels used throughout:

| Label | Meaning |
|---|---|
| **[Charter §n]** | The Mission 4 charter (2026-10-16) |
| **[Research §n]** | [spikes-1-3-research.md](spikes-1-3-research.md): 60 real capability records in seven formats, plus 36 A2A Agent Cards, snapshot of 2026-10-22 |
| **[POC]** | The proof of concept in this repository |
| **[Run today]** | A command run on 2026-10-23 while writing this document; its output is quoted |
| **[External]** | An official page checked on 2026-10-23 (listed in §E) |
| **[General knowledge]** | Widely known background that was not checked against a source for this document |
| **[Inference]** | This document's interpretation. Check it before relying on it |
| **[Open]** | Not decided |

## Quick answers

| Question | Short answer | Where |
|---|---|---|
| Teams already use capabilities and the results are not bad. Are context and token management the real problems? | At **runtime**, things largely work, because each host reads its own native format. Context and token cost are real problems, but they belong to the runtime, which is solving them (tool search, code execution, progressive disclosure). Mission 4's problem sits **before** runtime. Teams cannot reliably find, compare, de-duplicate, and decide on capabilities across sources, and every system that tries builds its own mapping. The evidence is from public capabilities; how large the problem is internally has not been measured | §A |
| What is a manifest, what does the market use, and how is it communicated? | A manifest is a small, declarative file that describes something so that tools can act on the description rather than on the thing. Every ecosystem has one (`package.json`, `server.json`, Agent Cards, `SKILL.md`, Backstage `catalog-info.yaml`). They travel through five channels: a file in the repository, a registry publish, a well-known URL, runtime discovery, or a catalog exchange. Mission 4's manifest is a **cross-format record** that references those native manifests instead of replacing them | §B.1 |
| What are YAML and JSON Schema, and why use them? | YAML is the human-friendly text that people write. JSON Schema is the machine-readable rulebook that checks it. Together they give an authoring format people can read and a contract that any language can enforce. The charter proposes both, to be confirmed in Phase 0 | §B.2 |
| What is the first step? What is each field, and why, how, and when? | The first step is drafting the six mandatory fields, preferably from the native metadata that already exists. All 32 top-level fields are explained in §C.2 | §C.1, §C.2 |
| Why a validator, what does it follow, is it in the workflow, what does industry use, and what backs it? | The validator turns the contract into feedback and a machine-readable result. It follows the charter's two-stage model on JSON Schema 2020-12. It is **not in any workflow yet**; Mission 5's validation step is the intended home. Industry uses editor-time schemas, publish-time registry checks, and conformance kits. 206 tests, mutation checks, a second implementation, and scoring against judged real data back the checks | §C.3 |
| Where is the Capability Exchange Document? | It is not stored anywhere. The `export` command generates it on demand. §C.4 shows a real one and how a consumer would use it | §C.4 |
| What did the POC demonstrate, with what framework, and why? | Node.js 22, Ajv, yaml, semver, and `node:test` implement the contract. A journey-first harness tests it on real records. §D.1 lists every demonstration, with today's output and what each one does **not** prove | §D.1 |
| What are the "12 manifests", and how does our testing compare with public and company practice? | They are the journey pilot's drafts: 12 public capabilities sampled at random and drafted automatically. Public practice relies on conformance suites, publish-time validation, and running-system tests. Ours is an offline, journey-scored evaluation on a public snapshot, with one judge. §D.2 compares the two in detail | §D.2 |

---

## A. The problem

### A.1 Two layers: runtime and organization

The question mixes two layers that behave very differently.

```text
 RUNTIME LAYER (one agent, one session, capabilities already chosen)
   agent host (Claude Code, an MCP client, an A2A client)
     reads its NATIVE format: SKILL.md, MCP tools/list, Agent Card
     concerns: context window, tokens, tool selection, latency, execution
     -> mostly works today; the runtimes are actively improving it

 ORGANIZATION LAYER (many teams, many sources, decisions before anything runs)
   developer, inventory (Mission 2), recommender (Mission 1),
   governance (Mission 3), contribution (Mission 5)
     must FIND, COMPARE, DE-DUPLICATE, DECIDE, and GOVERN across formats
     concerns: identity, duplicates, licence, lifecycle, risk, ownership
     -> this is where the evidence shows failures; Mission 4 works here
```

The charter puts Mission 4 in the second layer: "The manifest is a metadata and description
contract, not a runtime execution protocol" [Charter §8].

### A.2 The runtime layer: works, with real token and context costs that runtimes are solving

**Why different formats do not break the runtime.** Each host speaks its own format natively. An
MCP client talks MCP, and a skills host reads `SKILL.md`. A single team using capabilities it has
already chosen therefore rarely notices that formats differ. This is why the results "are not that
bad" [Inference].

**Context and token management are real problems, with published numbers** [External]:

| Evidence | Figure | Source |
|---|---|---|
| Tool definitions loaded up front | "58 tools consuming approximately 55K tokens before the conversation even starts" (a five-server example) | Anthropic, "Advanced tool use", 2025-11-24 |
| Wrong tool selection | Named as a common failure, especially "when tools have similar names" | Same |
| Runtime fix 1: tool search (`defer_loading`) | "85% reduction in token usage"; accuracy on MCP evaluations "Opus 4 improved from 49% to 74%, and Opus 4.5 improved from 79.5% to 88.1%" (Anthropic's own evaluations) | Same |
| Runtime fix 2: code execution with MCP | "Tool definitions overload the context window" and "Intermediate tool results consume additional tokens"; one example went "from 150,000 tokens to 2,000 tokens" (98.7%) | Anthropic, "Code execution with MCP", 2025-11-04 |
| Runtime fix 3: progressive disclosure in Agent Skills | Only `name` and `description` (about 100 tokens) load at startup; the body (under 5,000 tokens recommended) loads when the skill activates | agentskills.io specification |

**What this means for Mission 4** [Inference]:
- The manifest does not reduce tokens or improve tool selection inside a session, and it should
  not try to. The research keeps tool lists out of the manifest because MCP serves them at
  runtime, and they "can vary by authenticated user, session, configuration" [Research §8.6].
- There are two indirect links, neither of them a reason for Mission 4 to exist:
  - Runtime tool selection fails on similar names, which is the same naming-quality problem that
    hurts discovery across sources.
  - An organization that installs fewer, better-chosen, non-duplicate capabilities loads fewer
    tool definitions.

### A.3 The organization layer: where the evidence shows failures

The Spikes 1-3 research ran four journeys on 60 real public capabilities. The numbers below are
measured, unless marked otherwise.

| What a team tries to do | What happens today | Source |
|---|---|---|
| **Find** a capability for a need | The official MCP Registry searches by "case-insensitive substring search on server names", which it calls "intentionally simple" [External]. For "github", GitHub's own server ranked **12,080 of 29,152**, because every `io.github.*` name matches. "web search" returned nothing. The skills repositories, the plugin marketplace, and the Docker catalog have no search at all (523, 315, and 328 entries) | Research §7.1 |
| **See each capability once** | For the browser need, 9 relevant capabilities came back as **14 entries**. Matching on names **merged 2 pairs of different capabilities** and **missed 10 of 14** true pairs | Research §7.2, §7.3 |
| **Get relevant results** | Searching native metadata found the relevant capabilities, but precision was **36-71%**. Namespaces were read as names, PDF *producers* were returned for "extract text from PDFs", and single-site search was returned for "web search" | Research §7.2 |
| **Decide whether to reuse** | Limitations stated: **0 of 60**. Setup: **13 of 60**. License stated natively: **24 of 60** (26 more only through the repository; 6 need a person to read them). Lifecycle stated natively: **17 of 60** | Research §1.2, §7.5 |
| **Avoid a bad choice** | The most discoverable PDF capability is proprietary. An archived server is still listed as available in a curated catalog. One capability shows four versions at once (0.0.82, 0.0.83, a commit pin, `latest`) | Research §7.4 |
| **Keep references working** | A renamed repository left a stale URL while its numeric id stayed the same. Two publishers ship different skills both named `pdf`. Two skills with identical names and descriptions are different capabilities | Research §10.1, §1.2 |
| **Read risk correctly** | No native format carries a risk assessment (0 of 60, by design). In the POC, a duplicated YAML key made Python's PyYAML read `riskTier: high` followed by `riskTier: low` as `low`, silently | Research §7.5; POC report §7.4 |
| **Trust that metadata is well formed** | Of 36 public A2A Agent Cards, **4** validate against the A2A v0.3.0 schema | Research §7.7 |

### A.4 The problem, stated plainly

> **AI capabilities run well inside the tool that uses them. Across sources, they are hard to
> find, compare, de-duplicate, and decide on. Each source describes them differently, leaves out
> the facts that decide reuse (terms, setup, limitations, lifecycle, risk), and has no shared
> identity. So every system that tries (an inventory, a recommender, governance, a contribution
> workflow) has to build and maintain its own mapping, and may read what is missing as safe.**
>
> [Inference: a synthesis of Charter TL;DR, §1, §6 and Research §1.2]

Who feels it:

| Who | Journey | What goes wrong without a common description |
|---|---|---|
| A developer about to build | Find before building (J1) | Misses what exists, or picks a fork, a wrapper, or a proprietary copy |
| A curator or the inventory (Mission 2) | Recognise duplicates (J2) | Counts one capability two to four times, or merges two different ones |
| A team choosing between candidates | Compare and decide (J3) | Cannot see terms, setup, maintenance, or limitations side by side |
| The recommender (Mission 1) | Enough information (J4) | Ranks on facts that are stated, inferred, or missing, without knowing which |
| Governance (Mission 3) | Risk | Cannot tell "not assessed" from "assessed as low" if the field is absent |
| The contribution workflow (Mission 5) | Registration | Has no machine-readable rule for what a submission must contain |

### A.5 What is not proven, and what would prove or disprove it

- **The size of the problem inside the organization has not been measured.** All the evidence
  above comes from public sources standing in for internal ones [Research §4.4, §12.3]. The
  sources document no internal baseline.
- **Measurements that would settle it** [Inference]; experiments E1 and E4 in Research §13.5
  cover several of them:
  - how many internal capabilities exist, and in how many formats;
  - how often the same capability is registered more than once;
  - what share of internal capabilities state a license, an owner, a lifecycle, and setup;
  - how long a reuse decision takes, and how often it needs someone to ask a question;
  - how many bespoke mappings Missions 1, 2, and 3 already maintain.
- **When the problem would not justify a common manifest** [Inference]:
  - few capabilities;
  - one ecosystem (for example, only MCP servers from one registry);
  - one consumer;
  - no governance requirement.

  In those cases, native metadata plus a list may be enough.

---

## B. The solution

### B.1 What a manifest is, what the market uses, and how manifests travel

**Definition.** A manifest is a small, declarative, machine-readable document. It describes
something (what it is, who owns it, where to get it, how to use it) so that tools can act on the
description instead of opening the thing itself. The word comes from shipping, where a manifest
lists what a container holds without anyone opening it [General knowledge].

**Two kinds of manifest matter here:**

```text
 NATIVE manifests (one per ecosystem; describe one artifact in that ecosystem)
   package.json   server.json   agent-card.json   SKILL.md   plugin.json   action.yml
        \              |               |               |            |           /
         \  referenced, never copied wholesale (contractRef, publications[])   /
          v                                                                    v
 CROSS-FORMAT record (one per capability, across all its publications)
   Mission 4's capability manifest; comparable in spirit to a Backstage catalog
   entity or an AI Catalog entry: identity, publications, relations, reuse facts
   with provenance, completeness level, risk state
```

**What the market uses.** These are the formats the research examined, plus a few widely known
ones for comparison. "Checked" names the source.

| Format | Describes | Where it lives | How it is communicated | How it is validated | Checked |
|---|---|---|---|---|---|
| npm `package.json` | A JavaScript package | In the package | Published with the package to the npm registry; read through the registry API | npm checks the format | Research E23 |
| Python core metadata (from `pyproject.toml`) | A Python package | Built into the package | Uploaded to PyPI; JSON API | PEP rules | Research E22 |
| Kubernetes manifests | Desired state of cluster resources | YAML files in a repository | Applied to the cluster API | The API server checks each resource against its schema | [General knowledge] |
| Backstage `catalog-info.yaml` | Internal software catalog entities (components, APIs, systems) | Repository root by default | A discovery module scans repositories on a schedule and registers the files automatically | Name and reference rules; case-insensitive uniqueness | Research E27; Backstage GitHub discovery docs [External] |
| MCP Registry `server.json` | An MCP server and its packages and endpoints | Next to the server's code | Published with `mcp-publisher` to the MCP Registry; read through the registry API | Namespace authentication, package-ownership back-links, allowed package registries; `POST /v0.1/validate` "Used by `mcp-publisher validate`" | [External]; Research E6-E10 |
| MCP Server Card | A remote MCP server, before connecting | Served by the server | Static discovery document | Extension versioning | Research E5 |
| A2A Agent Card | An agent's identity, skills, interfaces, security | Served by the agent | At `/.well-known/agent-card.json` | Protocol buffers are canonical; JSON schema artifact; A2A TCK tests running agents | Research E11-E14; [External] |
| Agent Skills `SKILL.md` | A skill (instructions, scripts, resources) | The skill's folder | Distributed in repositories or plugins; hosts load name and description at startup | `skills-ref validate` (front matter and naming) | [External] |
| Claude Code `plugin.json` and marketplace | A plugin bundle | Plugin repository; marketplace listing | Installed from a marketplace | `claude plugin validate` | Research E18 |
| Docker MCP catalog `server.yaml` | A containerized MCP server | `docker/mcp-registry` repository | Contributed by pull request; Docker builds and signs the image | Catalog CI; generates `tools.json` by running the server | Research E26 |
| GitHub Actions `action.yml` | A workflow step | Repository root | Referenced as `owner/repo@ref` | GitHub parses it at run time | Research E25 |
| Hugging Face model card | A model: intended uses, limitations, evaluation, license | `README.md` with YAML metadata in the model repository | Shown on the Hub | Hub metadata rules | Spike 2 review §5 |
| AI Catalog (Linux Foundation, editor's draft) | A list of heterogeneous AI artifacts | A catalog document | References native artifacts by media type | Three conformance levels | Research E15-E17 |

**How manifests are communicated: five patterns** [Inference, from the table]:

| Pattern | Example | Strength | Weakness |
|---|---|---|---|
| 1. A file in the repository, found by a crawler | `catalog-info.yaml`, `SKILL.md` | Lives with the code; changes are reviewed with it | Needs discovery; repository-wide facts may not fit one capability |
| 2. Published to a registry with the artifact | `package.json`, `server.json` | Versioned, immutable per release, ownership verified | One channel only; each registry has its own shape |
| 3. Served by the running system at a well-known URL | A2A Agent Card | Always matches the deployment | Only exists while the system runs; no registry |
| 4. Discovered at runtime through the protocol | MCP `tools/list`, `server/discover` | Exact for this session and user | Not usable before connecting; varies per user |
| 5. Exchanged between catalogs | Backstage API, AI Catalog document | One view across sources | Someone must maintain the aggregation |

**Where Mission 4's manifest fits.** It is a pattern-5 record that cites patterns 1-4 as its
evidence:
- `publications[]` lists each channel's native name, version, and status;
- `interfaces[].contractRef` points to the native contract;
- `provenance[]` says where each value came from.

**How it would be communicated is not decided** [Open]. The options the sources raise:
- a manifest file next to the capability, discovered like `catalog-info.yaml`;
- a submission through Mission 5's contribution workflow;
- a draft generated from native metadata by a crosswalk, then confirmed by the owner;
- an exchange document between missions (§C.4), or a projection into an AI Catalog document
  (Research §13.2, recommendation 8).

**Why not adopt one existing format?** The research found that no single format covers the reuse
facts, and that each describes one ecosystem. The closest precedent, the AI Catalog draft,
"references native artifacts instead of redefining them". However, it has no license, lifecycle,
setup, limitations, or dependency fields [Research §1.2 finding 11, §8.1]. The research therefore
recommends that Mission 4 define **only** what no format provides:
- a record that groups all publications of one capability;
- cross-format reuse facts with provenance;
- explicit value states;
- completeness levels;
- the link to governance [Research §8.5].

That is a recommendation, not a decision.

### B.2 YAML and JSON Schema: what they are, and why this pair

**YAML** is a text format for structured data that people can read and write. It uses
indentation instead of brackets and allows comments. Kubernetes manifests, GitHub Actions,
Backstage descriptors, the Docker MCP catalog, and the front matter of `SKILL.md` all use it.
Here is the minimum manifest in YAML, taken from the README:

```yaml
schemaVersion: "0.1"                 # quoted MAJOR.MINOR
id: my-namespace/my-capability       # stable, never changes; not a URL
name: My Capability
capabilityType: skill
source:
  type: repository
  url: https://github.com/example-org/my-repo
riskTier: unassessed                 # an assessed tier also needs assessmentReference
```

**JSON Schema** is a standard vocabulary for describing which shape of data is valid. A schema is
itself a JSON document. It lists required fields, types, allowed values, text patterns, and
conditional rules such as "if this field has value X, then that field is required". Draft 2020-12
is the current version [Research E19]. A YAML manifest is parsed into the same data model as JSON
and then checked against the schema. Here is a real fragment of
`schema/0.1/capability.schema.json`:

```json
"riskTier": {
  "type": "string",
  "enum": ["unassessed", "low", "medium", "high"],
  "description": "... 'unassessed' ... must never be interpreted as low risk or approval ..."
}
...
{
  "description": "An assessed riskTier must cite the assessment that produced it, so that a tier cannot be self-asserted.",
  "if":   { "properties": { "riskTier": { "enum": ["low", "medium", "high"] } }, "required": ["riskTier"] },
  "then": { "required": ["assessmentReference"] }
}
```

How the two work together:

```text
 manifest.yaml (people write and review it)
     |  YAML 1.2 parser: one document, duplicate keys rejected, line/column kept
     v
 data (the same model as JSON)
     |  JSON Schema 2020-12 validator, routed by schemaVersion
     v
 findings: code + JSON Pointer path + line/column + message + fix
```

**Why this pair:**

| Reason | Evidence |
|---|---|
| People can read and review it; comments allowed | The same reason Kubernetes, GitHub Actions, and Backstage chose YAML [General knowledge] |
| The contract is independent of any one language | The same schema gave identical verdicts in Node.js (Ajv) and Python (`jsonschema`) on all 16 example files [POC report §7.4, 2026-10-23] |
| Tooling already exists | Editors validate and auto-complete YAML against JSON Schemas through the YAML language server, which uses the SchemaStore catalog by default and supports 2020-12 [External] |
| The ecosystem already uses it | The MCP Registry validates `server.json` against a JSON Schema; A2A publishes a JSON Schema artifact [Research §8.1] |
| It is versionable | A schema has a `$id` and can live in one directory per version; the POC routes each manifest by its `schemaVersion` |
| The rules live in one place | Hints, lifecycle transitions, completeness levels, and the field dictionary are all read from the schema [POC] |

**What JSON Schema cannot do**, and why the validator also needs code:
- check across files: duplicate ids, the same capability registered twice, references;
- check against the world: whether a repository exists, or an assessment record is real;
- check meaning: whether a description is true.

The POC does these checks in Stage 2 (§C.3).

**Pitfalls the POC found**, and the rules it adopted [POC report §7.4; `docs/manifest-spec.md`
§12]:
- **Unquoted dates.** YAML 1.1 parsers turn an unquoted `2026-10-12` into a date object, so dates
  must be quoted.
- **Duplicate keys.** Duplicate keys must be rejected; PyYAML silently keeps the last one.
- **Formats are annotations by default.** Draft 2020-12 treats `format` as an annotation unless
  the validator enables assertion, so `"2026-02-30"` passes by default.

**Alternatives** [Inference]:

| Alternative | Strength | Why it was not the proposal |
|---|---|---|
| JSON only | No parsing surprises | No comments; harder for people to write |
| TOML (as in `pyproject.toml`) | Simple, typed | Awkward for deeply nested lists; less common in catalog formats |
| Protocol buffers (A2A's canonical form) | Strong typing; code generation | Not meant for people to write by hand |
| A typed model in code (for example Pydantic or TypeScript types) | Very good developer experience in one language | Ties the contract to one language |

**Status.** The charter calls JSON Schema 2020-12 and YAML "proposed ... to be confirmed during
Phase 0" [Charter §3]. The POC adopted both (D1), and the research judged JSON Schema "confirmed
suitable for the validation contract" [Research §8.1]. That is a research finding; the formal
Phase 0 confirmation is still [Open].

---

## C. How it works

### C.1 The first step, and the flow around it

```text
 0. A capability exists, usually with native metadata (package.json, server.json, SKILL.md, ...)
 1. DRAFT the manifest
      by hand: the 6 mandatory fields, then whatever is known
      or from native metadata through a crosswalk, with provenance (pilot/, research/)
 2. ASSIGN the id, once            <- who assigns it is [Open] (Missions 5 and 2, Charter §5)
 3. VALIDATE                       capability-manifest validate
      parse -> Stage 1 structural -> Stage 2 consistency -> completeness level
 4. COMPLETE what the report asks for (owner or curator: setup, limitations, contact, ...)
      and CONFIRM inferred values (provenance confirmedBy)
 5. EXCHANGE                       capability-manifest export -> Capability Exchange Document
 6. CONSUME (Missions 1, 2, 3): read common fields, keep the caveats, key by id
 7. REVISE                         capability-manifest compat <previous> <next>
```

**The first step** for an author is the six mandatory fields: `schemaVersion`, `id`, `name`,
`capabilityType`, `source`, and `riskTier`. They were made the only mandatory fields because
every sampled source can supply them [POC D3, revised 2026-10-23; Research §16.1]. Everything else
raises the completeness level instead of blocking the manifest.

**The first step for the mission** is different. The research recommends starting from the native
metadata that already exists, because a crosswalk fills most discovery facts automatically: 58 of
60 records reached "discoverable" from their own metadata [Research §7.5].

### C.2 Every field: what, why, how, and when

**How a value is supplied** (the provenance methods in the schema):

| Method | Meaning |
|---|---|
| Native | Stated by the capability's own metadata |
| Linked | Read from a source the metadata declares, for example the repository |
| Derived | Inferred by a rule. *Convention* means a rule the source documents; *heuristic* means a value to confirm |
| Owner | Declared by the capability owner |
| Curated | Written by a curator |
| Governance | Recorded by Mission 3 |
| Assigned | Allocated by the catalog or the workflow |

**Availability** is out of the 60 real records in the research (N native, L linked, D derived)
[Research §11.2], unless another source is named.

**When required** uses these levels:
- **M**: mandatory;
- **C**: conditional;
- **D**: discoverable level;
- **As**: assessable level;
- **Ad**: adoptable level;
- **G**: governed level;
- **O**: optional, at no level.

#### 1. Contract and identity

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `schemaVersion` | The version of the manifest contract, quoted `"0.1"` | Selects which rules apply, so old and new manifests can coexist [Charter §7] | Written by the author; n/a | **M**. Changes only when the manifest is migrated to a new schema version |
| `id` | Stable unique id, `<namespace>/<name>`, lowercase, at most 128 characters | Answers "is this the same capability?" (J2). A URL or name is not an identity: a rename broke a URL while the id-like forge number held [Research §10.1] | **Assigned**, never derived from a name or URL; no format has a native capability id | **M**. **Never changes or is reused.** The format (namespaced or URN) is [Open] |
| `name` | Display name, 3-80 characters; not unique | What people see in a result list (J1) | Native (60 of 60); curated when the native names differ | **M**. Changes rarely, and never affects identity |
| `capabilityType` | One of 10: `skill`, `agent`, `mcp_server`, `plugin`, `tool`, `application`, `service`, `workflow`, `framework`, `platform` | "What kind of capability is it?" (J1); used for filtering | Derived from the format (60 of 60: 47 by convention, 13 by heuristic, to confirm) | **M**. A type change counts as breaking for adopters [POC compat] |

#### 2. Discovery

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `description` | What it does and the problem it solves, 20-1,024 characters | "What does it do?" (J1); the main text for search | Native (58 of 60); curated if absent | **D**. Moved from mandatory to the level because 2 of 60 records have none and would otherwise drop out of identity checks [Research §16.2] |
| `keywords` | Search terms, tags, categories | Helps matching; npm calls them keywords, Docker calls them tags | Native (28 of 60) | **O**. Updated with the capability |
| `documentation` | Documentation or home page URL | "Where do I learn more?" | Native 29, derived 27 | **O** |
| `supportedUseCases[]` | Structured use cases (title, description) | "Is it meant for my use case?" Discovery's weakest point: precision 36-71% without them [Research §7.2] | **Curated**. Only 1 of 60 records states them natively (21 of 36 A2A cards list skills) | **O**, as a curation target. Requiring it would block 59 of 60 records [Spike 2 review §4.2] |
| `intendedAudience[]` | Roles it is meant for | Mission 2 tracks audience [Boundaries] | Owner or Mission 2; 0 found natively | **O** |

#### 3. Where to get it

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `source` | The primary location: `type` (repository, registry, provider, other), `url`, `path` (monorepos), `repositoryId` (the forge's stable id), `status`, `updatedAt`; or `registry` and `identifier` | "Where do I get it?" A source is a location, not an identity [Charter §5]. `repositoryId` survives renames | Native 42, derived 12 (repository) | **M**; its subfields are **C** by `type`. Changes when the repository moves, while the id stays (`SOURCE_RELOCATED`) |
| `publications[]` | Every channel that distributes the same capability: `kind`, `locator` (a Package URL, image, registry name, marketplace coordinate, or URL), `nativeName`, `nativeVersion`, `versionScheme`, `status`, `statusMessage`, `updatedAt`, `verifiedBy` | One capability had up to four publications with different names and versions. Declared links plus "same repository and path" linked all 14 judged same-capability pairs, with no false link [Research §7.3] | Native and linked (every record has at least one; 28 of 60 declare more) | **O**. Its status, version, or date counts towards **As**. Changes with every release or new channel |

#### 4. Using it

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `interfaces[]` | How it is used: `type` (mcp, a2a, openapi, agent_skill, cli, library, ui, other), `transport`, `specVersion`, `contractRef`, `description`, `inputs[]` and `outputs[]` with media types | "How does my system use it?" (J3). It references the native contract instead of restating it [Charter §8]. Media types would remove false positives such as PDF producers returned for PDF extraction [Research §7.2] | Native 14, derived 46 (19 of them by heuristic) | **D**. **C**: an `mcp_server` must have an `mcp` interface; `a2a` and `openapi` need a `contractRef` |
| `runtime[]` | Where it runs: `local_process`, `container`, `hosted_service`, `agent_host`, `ci_runner`, `other`, each with a `detail` | "Does it run here?" A local stdio server and a hosted service are adopted very differently: of 37 sampled MCP servers, 22 run only locally and 4 are hosted only [Spike 2 review §4.3] | Native 36, derived 24 | **As** |
| `setup[]` | What the adopter must provide: credentials, environment variables, accounts (`name`, `description`, `secret`, `required`). `[]` declares that nothing is needed | "What does it need?" No native format can say "nothing needed" [Research §6.6] | Native 13 of 60; otherwise **owner** | **Ad** |
| `platformCompatibility[]` | Hosts and platforms it is known to work with (tokens; the vocabulary is not controlled) | Mission 1 judges feasibility | Partly native (5 of 12 in the pilot) | **O** |

#### 5. Deciding on reuse

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `license` | An SPDX `expression` or the terms as `text`, plus `url` and `scope` (capability or repository) | "May we use it?" (J3). The most discoverable PDF skill is proprietary; in a monorepo, the repository's license may not cover the capability [Research §7.4] | Native 24, linked 26; 6 need reading (the validator reports `LICENSE_NEEDS_REVIEW`) | **As**. **C**: `text` is required when there is no `expression` |
| `capabilityVersion` | The capability's own SemVer version, when its owner uses SemVer | Used by `compat` to check the version bump | Owner; native versions go per publication instead | **O**. Any of it, a publication's `nativeVersion`, or its `versionScheme` counts as the **As** version fact. Changes with every release |
| `lifecycleStatus` | The owner's declared state: `experimental`, `active`, `deprecated`, `retired` | "Is it maintained or replaced?" (J3). Separate from maturity, risk, and approval [Charter §6] | **Owner**. Observed signals (registry status, archived repository) go in `publications[].status` and `source.status`; native lifecycle exists for 17 of 60 | **O**. Any lifecycle signal counts towards **As**. Transitions are checked by `compat` (POC proposal; Mission 3 to confirm) |
| `deprecation` | `reason`, `replacedBy` (an id), `sunsetDate` | Adopters need the reason and the successor; no native format records a successor [Research §10.3] | Owner | **C**: required when `lifecycleStatus` is `deprecated` or `retired` |
| `owner` | `name`, `contact` (email or https URL), `affiliation` (internal or external) | "Who maintains it, and how do I reach them?" | Native 25, derived 8 (maintainer); publisher mostly by convention | **O**. `owner.name` counts towards **As** and `owner.contact` towards **Ad** |
| `limitations[]` | Known limitations. `[]` declares that none are known | "What can it not do?" (J3) | **Owner**: 0 of 60 records state limitations | **Ad** |
| `dependencies[]` | Other capabilities it requires, by id. `[]` declares none | Missions 1 and 3 need feasibility and third-party exposure | Owner. Package dependencies (24 of 60) are not capability dependencies | **O**. Stage 2 checks the references |
| `maturity` | `prototype`, `pilot`, `production` | Evidence of real use; Mission 2 tracks it separately from availability | Mission 2; definitions still to agree | **O** |
| `costInformation` | `model` (free, included, subscription, usage_based, chargeback, other), `details`, `url` | Mission 1 ranks by cost where data exists | Owner; 0 found natively | **O**. **C**: `details` is required when `model` is `other` |

#### 6. Trust

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `riskTier` | `unassessed`, `low`, `medium`, `high` (tier names are placeholders until Mission 3 agrees them) | Missing or unassessed risk must never read as low or approved [Charter §6]. Mandatory, so that "not assessed" is always explicit, never an omission | **Governance**. Extractors write `unassessed`, which asserts nothing | **M**. An assessed tier reaches **G**. It changes when Mission 3 records an assessment; expiry is [Open] |
| `assessmentReference` | `id`, `url`, `assessedOn` | An assessed tier must cite its assessment, so that it cannot be self-asserted | Governance; 0 of 60 | **C**: required when `riskTier` is assessed |

There is deliberately **no approval field**: approval belongs to governance and consuming processes
[Charter §6].

#### 7. Relationships

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `components[]` | Independently adoptable child capabilities, by id | A bundle whose parts are adopted on their own [Charter §2] | Owner | **O**. Stage 2 checks reciprocity with `parent` |
| `parent` | The bundle this capability belongs to | The other side of `components` | Owner | **O** |
| `embeddedComponents[]` | Parts that are not independently adoptable: prompt, command, hook, resource, tool, other | Granularity: these get no manifest of their own | Owner | **O** |
| `relations[]` | `type` (`same_as`, `fork_of`, `wraps`, `derived_from`, `distinct_from`), `id` or `locator`, `evidence`, `verified` | Forks, wrappers, and look-alikes fill result lists; two different skills share the name `webapp-testing` [Research §7.3] | Derived or curated; claimed relations are reported as `RELATION_UNVERIFIED` | **O**. **C**: a `locator` is required when there is no `id` |

#### 8. Record-keeping

| Field | What | Why | How it is filled; availability | When required, and when it changes |
|---|---|---|---|---|
| `lastUpdated` | The date this record changed, not the date the capability changed | Freshness of the record. Capability change dates are kept per publication, because "updated" meant five different things across formats [Research §6.3] | Computed or by the author | **O**. Every edit of the manifest |
| `provenance[]` | Per value: `field` (a JSON Pointer), `method`, `basis`, `source`, `observedAt`, `confirmedBy` | The consumer must see stated, linked, inferred, and unknown facts apart (J4). 54 heuristic values in the research drafts are reported for confirmation [Research §16.2] | Computed by a crosswalk, or by the author | **O**. **C**: `basis` is required for derived values |
| `x-...` | Extension fields | Room for local needs without changing the contract | Anyone | **O**. Core consumers ignore them; a useful one can be promoted in a later MINOR version |

**Completeness levels** gather the facts above into four cumulative steps. The validator reports
the level reached and enforces one only on request (`--require-level`) [POC D23; field
dictionary]:

| Level | Adds | Typical supplier | Real records reaching it (of 60, starter drafts) [Research §16.2] |
|---|---|---|---|
| discoverable | description, interface | Native metadata | 25 (plus 31 that go further) |
| assessable | runtime, license, version, lifecycle signal, owner | Native metadata and linked sources | 31 |
| adoptable | setup, owner contact, limitations | Capability owner | 0: no record states limitations |
| governed | an assessed risk tier with its reference | Mission 3 | 0 |

### C.3 The validator

#### Why validate at all

A contract that nobody checks is only a suggestion. The validator does three jobs that people
cannot do reliably at scale:
- **It catches mistakes when they are cheap to fix:** wrong types, typos, a URL used as an id,
  `mcp-server` instead of `mcp_server`.
- **It protects meaning:** an assessed tier without its assessment, a deprecated capability
  without a reason, unassessed risk shown as passed.
- **It checks across records:** the same id twice, the same capability under two ids, broken
  references.

It also reports **what is missing for the next level**, which is the list of questions to put to
an owner (journey J4).

What the benefits look like. These are excerpts from today's runs on three different example
files [Run today]:

```text
ERROR  INVALID_FORMAT  /id (line 3, col 5)
  'https://github.com/example-org/ai-capabilities/tree/main/skills/tra...' does not match the required format for 'id'.
  fix: A URL is a source reference, not a capability identifier: keep it in source.url and assign a stable namespaced id. ...
ERROR  INVALID_VALUE  /capabilityType (line 6, col 17)
  'mcp-server' is not an allowed value for 'capabilityType'.
  fix: Did you mean 'mcp_server'? ...
ERROR  UNKNOWN_FIELD  /tags (line 22, col 1)
  Unknown field 'tags': it is not defined in schema 0.1.
  fix: Use 'keywords': it holds what native formats call 'tags'.
UNVERIFIED  RISK_UNASSESSED  /riskTier (line 22, col 11)
  riskTier is 'unassessed': no risk assessment is recorded. It must not be treated as low risk or as approved.
  next: Request a risk assessment from the governance owners, then record the tier and assessmentReference.
```

#### What it checks, in order

| Step | Checks | Example codes |
|---|---|---|
| Parse (YAML 1.2) | Syntax; one document per file; duplicate keys; values that YAML 1.1 parsers would read as dates or booleans | `YAML_SYNTAX_ERROR`, `DUPLICATE_KEY`, `YAML_PORTABILITY` |
| Stage 1: structural | Routing by `schemaVersion`; required fields; types; allowed values; formats; conditional rules; unknown fields (with "did you mean" and native-name synonyms) | `SCHEMA_VERSION_UNSUPPORTED`, `MISSING_REQUIRED_FIELD`, `CONDITIONAL_FIELD_REQUIRED`, `INVALID_VALUE`, `UNKNOWN_FIELD` |
| Stage 2: consistency, across all manifests validated together | Duplicate ids; the same source (by URL or forge id) or publication under two ids; references to dependencies, components, parent, replacement, and relations; references to deprecated or retired capabilities; parent and child reciprocity; dates in the future; declared lifecycle against observed signals; differing publication versions; claimed relations; license terms that need reading; heuristic values not yet confirmed; risk state; optional source reachability over HTTPS | `DUPLICATE_ID`, `DUPLICATE_PUBLICATION`, `DUPLICATE_SOURCE`, `UNRESOLVED_REFERENCE`, `LIFECYCLE_SIGNALS_CONFLICT`, `PUBLICATION_VERSIONS_DIFFER`, `RELATION_UNVERIFIED`, `DERIVED_VALUE_UNCONFIRMED`, `RISK_UNASSESSED`, `SOURCE_NOT_CHECKED` |
| Completeness | The highest level reached, and the facts each higher level needs | `COMPLETENESS_BELOW_REQUIRED` (only with `--require-level`) |
| Report | Text, or JSON under the validation-report contract 0.1; exit code 0 for no errors, 1 for errors, 2 for usage or I/O errors; the charter's caveat repeated | n/a |

Separate commands check change over time:
- `compat <previous> <next>` checks one capability's revision: changes classified as breaking,
  additive, or metadata-only; the required SemVer bump; identity stability; allowed lifecycle
  transitions.
- `schema-compat <previous> <next> --corpus` checks the schema itself.

#### How the results are meant to be used

| Severity | Meaning | Who acts, and how (proposed) |
|---|---|---|
| error | The manifest violates the contract | The author fixes it; a workflow blocks the submission (exit code 1) |
| warning | Valid, but likely wrong or risky (for example a reference to a deprecated capability) | A reviewer looks at it; nothing blocks |
| unverified | This run could not confirm it: **neither passed nor failed** | Follow-up: request an assessment, confirm an inferred value, check a license, resolve a reference in the inventory |
| completeness level | How much a consumer can rely on | The workflow owner sets a policy, for example "assessable to list, adoptable to recommend" [Inference]. No policy is agreed [Open] |

#### The framework it follows

| Layer | Standard or source | Implementation |
|---|---|---|
| Overall model | The charter's Stage 1 (structural) and Stage 2 (consistency), with errors, warnings, and unverified checks kept apart [Charter §3] | `src/validator.js` |
| Parsing | YAML 1.2 | `yaml` 2.9.1 (`src/yaml-source.js`) |
| Structural rules | JSON Schema Draft 2020-12 | Ajv 8.20.0 in strict mode, with ajv-formats 3.0.1 (`src/structural.js`, `src/schema-registry.js`) |
| Cross-record rules | No external standard; defined by the charter's Stage 2 and the research | `src/consistency.js` |
| Completeness | A schema annotation (`x-completenessLevels`), comparable to the AI Catalog's conformance levels [Research §11.3] | `src/completeness.js` |
| Change rules | Semantic Versioning 2.0.0 for capabilities; MAJOR.MINOR rules for the schema | `src/compatibility.js`, `src/schema-compat.js` |
| Output contract | `schema/contracts/validation-report-0.1.schema.json` | `--format json` |

The MCP Registry's maintainers describe a similar layering for `server.json`: schema validation,
then "ad-hoc semantic validation for logical errors that cannot be enforced by the schema", then
linter rules for best practices [External: registry Discussion #635, 2025-10-08]. The resemblance
supports the design; it was not copied from it.

#### Is it in the workflow?

**Not yet.** Today the validator is a command-line tool and a library. Nothing calls it
automatically, and the repository has no CI [POC report §9]. The intended places are proposals:

```text
 author's editor ----> pre-merge CI in the capability's repo ----> Mission 5 contribution workflow
   (schema hints)        validate --format json                      "validate" step: exit code gates;
                                                                       --require-level per policy;
                                                                       compat in the "improve" step
                                                                              |
                                                                              v
                                                   Mission 2 inventory ingestion: validate before accepting
                                                                              |
                                                                              v
                                                   consumers (Missions 1, 3): validate before use,
                                                   keep the warnings and unverified checks [manifest-spec §13]
```

Mission 5 owns the contribution workflow; Mission 4 offers the report contract and exit codes
[Boundary review §7]. Where exactly the validator runs, and which level each step requires, is
[Open].

#### What the industry uses

| Practice | Example | What it checks | Source |
|---|---|---|---|
| Schema validation while editing and in CI | YAML language server with the SchemaStore catalog (on by default; supports 2020-12); SchemaStore says CI tools can validate any matching file | Shape | [External] |
| Format-specific validators | `skills-ref validate` ("frontmatter is valid and follows all naming conventions"); `claude plugin validate` | Shape and the format's own rules | [External]; Research E18 |
| Publish-time registry validation | MCP Registry: "Publishers must prove ownership of their namespace"; "All packages must include metadata proving the publisher owns them"; only allowed package registries; `POST /v0.1/validate` behind `mcp-publisher validate`. A maintainer noted in October 2025 that the schema "is not automatically applied to servers when they are published" (current status not checked) | Shape and **ownership** | [External] |
| Catalog validation | Backstage: name and reference rules; case-insensitive uniqueness per kind and namespace | Shape and integrity | Research E27 |
| Curated catalog CI | Docker MCP catalog: builds and signs images and generates `tools.json` by running the server | Build and behaviour | Research E26 |
| Conformance kits against a running system | A2A TCK: tests a live agent over gRPC, JSON-RPC, and HTTP+JSON by MUST, SHOULD, and MAY levels, starting from its Agent Card | Runtime behaviour | [External] |
| Test suites for the validators themselves | The official JSON Schema Test Suite, which "implementers of JSON Schema validation libraries can use to test their validators" (Ajv and python-jsonschema are listed) | The validator engine | [External] |

**Where the POC differs** [Inference]:
- It goes further than most native validators on cross-record identity and on honest
  uncertainty: the unverified severity and per-value provenance.
- It has no publish-time ownership verification, because there is no registry; the MCP Registry
  does this.
- It does not test running systems; the A2A TCK does.
- It runs nowhere automatically yet.

#### What backs the checks

| Evidence | What it shows | Status |
|---|---|---|
| 206 automated tests in 39 suites: schema 14, structural 72, consistency 32, completeness 11, compatibility 14, schema-compat 16, exchange 7, consumers 15, pilot 7, research 6, CLI 12 | Each rule behaves as specified on purpose-built inputs | **206 pass** [Run today] |
| Mutation checks: 18 deliberately injected defects in five rounds (2026-10-19 to 2026-10-23), each detected | The tests would catch regressions in the rules that matter, for example "missing risk defaulted to low" | POC report §7.1; not re-run today |
| Second, independent implementation: Python `jsonschema` 4.25.1 with PyYAML | The contract does not depend on the Node.js code: 16 of 16 example verdicts match, and three known divergences are documented | POC report §7.4 (2026-10-23); not re-run today, because `jsonschema` is not installed in this environment |
| Scoring against judged real data | On 60 real records, the validator's duplicate warnings linked **14 of 14** judged same-capability pairs, with **0** false links. Its levels agree with an independent measurement for **56 of 60** | Research §16.2; `npm run research` reproduced it [Run today] |
| `schema-compat` with a corpus | The 2026-10-23 revision kept all 9 manifests that were valid under the earlier draft valid | [Run today] |
| Generated-file tests | The field dictionary and the research results must match the schema and the snapshot | In the test suite |
| A tested engine | Ajv is one of the validators listed by the JSON Schema Test Suite | [External] |

**What does not yet back them:**
- no real author has used the messages;
- the relevance and identity judgments are one person's;
- no internal capabilities have been tested;
- the checks run in no CI.

### C.4 The Capability Exchange Document

#### Where it is generated

The document is **not stored anywhere in the repository**. The `export` command generates it on
demand (`src/exchange.js`):

```bash
node bin/capability-manifest.js export examples/valid                       # summary table on screen
node bin/capability-manifest.js export examples/valid --out exchange.json   # writes the JSON document
```

One was generated while writing this document, from the valid and invalid examples, as a temporary file
(26.5 KB; 8 capabilities and 5 rejected inputs) [Run today]. The summary view from today's run:

```text
ID                                  TYPE        SCHEMA      LEVEL         LIFECYCLE     MATURITY    VERSION  RISK                   OWNER
acme/observability-mcp-server       mcp_server  schema 0.1  adoptable     active        -           -        UNASSESSED             Acme Observability Inc. (external)
ai-platform/sql-review              skill       schema 0.1  governed      active        production  1.3.0    low (RA-2026-0142)     AI Platform Engineering (internal)
microsoft/playwright-mcp            mcp_server  schema 0.1  assessable    -             -           -        UNASSESSED             Microsoft Corporation (external)
sre/sre-toolkit                     plugin      schema 0.1  none          deprecated    -           3.2.0    UNASSESSED             Site Reliability Engineering (internal)
... (8 rows)
UNASSESSED = no risk assessment recorded: not low risk and not approved. "-" = not provided in the manifest.
```

#### What it contains

The structure is defined by `schema/contracts/exchange-document-0.1.schema.json`:

```text
{
  exchangeFormatVersion: "0.1"           which contract this document follows
  generator:      { name, version }       which tool produced it
  schemaVersions: ["0.1"]                 manifest schema versions inside (one document can mix them)
  notice:         "Structural validity does not establish ... approved for production."
  capabilities: [                         one entry per VALID manifest
    { manifest:   { ...exactly as authored, nothing dropped or renamed... },
      validation: { warnings: [codes], unverified: [codes], completeness: "<level>" } }
  ]
  rejected: [                             every INVALID input, so nothing disappears silently
    { file, id, errorCount, errorCodes }
  ]
}
```

A real entry, shortened (the manifest part abbreviated with `...`):

```json
{
  "manifest": {
    "schemaVersion": "0.1",
    "id": "microsoft/playwright-mcp",
    "name": "Playwright MCP",
    "capabilityType": "mcp_server",
    "publications": [
      { "kind": "registry_entry", "locator": "io.github.microsoft/playwright-mcp", "nativeVersion": "0.0.82", "status": "active" },
      { "kind": "package", "locator": "pkg:npm/%40playwright/mcp", "nativeVersion": "0.0.83" },
      "..."
    ],
    "license": { "expression": "Apache-2.0", "scope": "capability" },
    "riskTier": "unassessed",
    "...": "..."
  },
  "validation": {
    "warnings": [],
    "unverified": ["SOURCE_NOT_CHECKED", "PUBLICATION_VERSIONS_DIFFER", "RISK_UNASSESSED"],
    "completeness": "assessable"
  }
}
```

A rejected input: `{ "file": "examples/invalid/unsupported-schema-version.capability.yaml", "id": "ai-platform/code-search", "errorCount": 1, "errorCodes": ["SCHEMA_VERSION_UNSUPPORTED"] }`.

#### What consumers consume, and how they would use it

Consumers read the JSON document. The rules for doing so are in `docs/manifest-spec.md` §13:
1. Check `exchangeFormatVersion`; reject a version you do not support.
2. Validate each manifest against its own `schemaVersion` before use.
3. Read the common fields through **one code path for every capability type**, with no per-type
   mapping, and ignore `x-` fields.
4. Keep `warnings`, `unverified`, and `completeness` with the data. Do not turn "unverified" into
   "passed".
5. Join and reference by `id`, never by URL or native name.
6. Treat a missing or `unassessed` risk tier as unassessed. Never treat a risk tier, or a valid
   manifest, as an approval.

How each mission might use it. These are **illustrations, not agreed integrations** [Inference]:

| Consumer | Possible use |
|---|---|
| Mission 2 (inventory) | Ingest the capabilities into the inventory; show each one's level; send the owner the facts its next level needs; group duplicates using `publications` and `relations` |
| Mission 1 (recommendation) | Consider only capabilities at "assessable" or above; match on description, use cases, keywords, and interfaces; flag those with `LICENSE_NEEDS_REVIEW`; never rank `UNASSESSED` as low |
| Mission 3 (trust) | List the capabilities whose risk is `unassessed`, to plan assessments; check that assessed tiers cite a real assessment record |
| Mission 5 (contribution) | Uses the **validation report** (`validate --format json`) rather than the exchange document, because the report is per submission and carries every finding |

#### Why use it

- **One shape for every type.** A consumer writes one reader, not one per format. This is the
  charter's "without capability-specific field mappings" [Charter §8].
- **Nothing is lost.** Manifests are carried unchanged. The earlier `catalog` command, which
  projected a reduced list, was removed for looking like an inventory [Boundary review §6].
- **Caveats travel with the data**, so a downstream system cannot quietly upgrade "unverified" to
  "fine".
- **Rejections are visible.** An invalid file does not simply vanish.
- **It is versioned**, so the format can evolve.

#### What it is not, and what is open

- It is not an inventory, a ranking, or an approval. It holds no rankings, approvals, or
  assessments [contract schema description].
- **No consumer uses it today.** Whether Missions 1 and 2 accept this shape, and partial (levelled)
  records, is [Open] (Research U9).
- A file snapshot is only one integration path. The alternatives raised in the sources:
  - the library API;
  - a live catalog API, which would be catalog infrastructure that Mission 4 does not own
    [Charter §9];
  - a projection into an AI Catalog document (Research §13.2).

---

## D. What the proof of concept demonstrated

### D.1 Approach documentation

"Framework" means two things in this POC: the **technical stack** that implements the contract,
and the **evaluation method** that tests whether the contract is useful.

#### Technical stack

| Component | Version | Role | Why it was chosen | Alternatives |
|---|---|---|---|---|
| Node.js (ES modules) | 22 (v22.23.2 used) | Runtime for the validator and CLI | The only healthy runtime in the working environment; no build step needed [POC D17] | Python, Java (not available on the path), Go |
| Ajv | 8.20.0, with ajv-formats 3.0.1 | JSON Schema 2020-12 engine, in strict mode | A widely used 2020-12 validator, listed by the JSON Schema Test Suite [External] | Other 2020-12 validators |
| yaml | 2.9.1 | YAML 1.2 parser | Gives YAML 1.2 semantics, line and column positions, and duplicate-key detection [POC D17] | Other YAML libraries, such as js-yaml [General knowledge] |
| semver | 7.8.5 | Version parsing and comparison for `compat` | The standard SemVer library for npm [General knowledge] | Hand-written parsing |
| node:test | built in | Test runner | No extra dependency | Jest, Vitest |
| Python `jsonschema` 4.25.1 and PyYAML 6.0.3 | optional | Independent second implementation | Shows that the contract is language-neutral | Any 2020-12 validator |

Every dependency version is pinned exactly in `package.json`. Whether this stack is the long-term
choice, or one reference implementation among several, is [Open] (D17).

#### Architecture

```text
src/yaml-source.js      parse YAML 1.2; duplicate keys -> error; line/column map; portability warnings
src/schema-registry.js  find schema/<version>/ directories; compile each with Ajv (strict)
src/structural.js       Stage 1: route by schemaVersion; validate; translate errors -> code + pointer + hint
src/consistency.js      Stage 2: identity, sources, publications, references, relations, lifecycle, risk, reachability
src/completeness.js     levels read from the schema's x-completenessLevels
src/validator.js        public API: validateFiles, validateManifests, validateManifestText
src/compatibility.js    compat: one capability's revision
src/schema-compat.js    schema-compat: two schema versions, statically and against a corpus
src/exchange.js         export: Capability Exchange Document
src/field-docs.js       docs: the field dictionary generated from the schema
bin/capability-manifest.js   the CLI that wires these together
```

The schema is the single source of truth. Hints, lifecycle transitions, completeness levels,
native-name synonyms, and the field dictionary are all read from it, so no rule is defined twice
[POC report §4].

#### Evaluation method

| Step | What was done | Where |
|---|---|---|
| 1. Write journeys and needs first | Four journeys (J1 find, J2 recognise duplicates, J3 compare and decide, J4 enough information) and four concrete needs, each with a relevance criterion, written before any capability was looked at | `research/spikes-1-3/needs.yaml` |
| 2. Sample by a rule written in advance | 49 targeted records from seven sources, plus 11 background records and 36 A2A cards; random draws with a fixed seed; purposive additions named in advance; four deviations recorded | Research §4; research README |
| 3. Snapshot | Native metadata only, emails redacted, 2026-10-22; nothing installed or run | `research/spikes-1-3/samples/` |
| 4. Crosswalk with provenance | One mapping per format; every value tagged native, linked, derived (convention or heuristic), or default | `research/spikes-1-3/crosswalk.js` |
| 5. Judge relevance and identity | Ground truth written before the matcher ran (one judge) | `judgments.yaml` |
| 6. Measure the journeys | Precision and recall (J1), identity linking (J2), decision questions (J3), completeness (J4) | `results.md` |
| 7. Compare schemas on the same records | The same 60 records drafted and validated against the 2026-10-22 draft (12 valid) and the revised draft (57 and 58 valid) | Research §7.6, §16 |
| 8. Score the validator itself | Its warnings and levels compared with the judged results | Research §16.2 |

Iteration 1 of the journey pilot (`pilot/`) was the smaller first run of the same idea: 12 random
records and four journeys.

#### Demonstrations, with today's output

**Demo 1: valid manifests and completeness levels** [Run today; condensed, with each file's
completeness line moved beside it]

```text
$ node bin/capability-manifest.js validate examples/valid
VALID    examples/valid/sql-review.capability.yaml            completeness: governed (highest level)
VALID    examples/valid/playwright-mcp.capability.yaml        completeness: assessable (adoptable needs: setup, limitations)
VALID    examples/valid/incident-triage-agent.capability.yaml completeness: discoverable (assessable needs: license)
VALID    examples/valid/sre-toolkit.capability.yaml           completeness: none (discoverable needs: interface)
...
Summary: 8 manifest(s): 8 valid, 0 invalid - 0 error(s), 1 warning(s), 20 unverified check(s)
Completeness of the 8 structurally valid manifest(s): none 1, discoverable 1, assessable 2, adoptable 2, governed 2
```

- *Shows:* validity and usefulness are reported separately, and each manifest says what it needs
  next.
- *Does not show:* that real owners would supply the missing facts.

**Demo 2: actionable errors** [Run today]. `validate examples/invalid/invalid-types-and-values.capability.yaml`
gives 8 errors, each with a line, a column, and a fix:
- unquoted `0.1` read as a number;
- a URL used as an id;
- `mcp-server` with the suggestion "Did you mean 'mcp_server'?";
- `v1.2` as a version;
- `null`;
- `production` as a lifecycle state;
- `19/10/2026` as a date;
- a string where a list is expected.

Across all five invalid examples: 0 valid, 15 errors (POC report §7.2).

- *Shows:* the feedback is specific enough to act on.
- *Does not show:* that authors find it clear; no usability test has been done.

**Demo 3: native names and typos** [Run today]. `tags` is answered with "Use 'keywords': it holds
what native formats call 'tags'", and `lifecyleStatus` with "Did you mean 'lifecycleStatus'?".
The synonyms come from the research's list of different names for the same meaning
[Research §6.2].

**Demo 4: identity across manifests** [Run today]. `validate examples/valid examples/consistency`
reports `DUPLICATE_ID` on both files that declare `ai-platform/sql-review`, and exits with code 1.

- *Shows:* duplicates are caught within one run.
- *Does not show:* global uniqueness, which needs an inventory (Mission 2).

**Demo 5: a real capability, its four publications, and a fork** [Run today]. The two real public
capabilities among the examples:
- `examples/valid/playwright-mcp.capability.yaml` (Microsoft's Playwright MCP server) lists its
  registry entry, npm package, container image, and plugin. The validator reports
  `PUBLICATION_VERSIONS_DIFFER` (0.0.82 against 0.0.83).
- `agentic-playwright-mcp` claims to be a fork. The validator reports `RELATION_UNVERIFIED` ("GitHub
  does not record the repository as a fork") and `DERIVED_VALUE_UNCONFIRMED` for a type inferred
  from keywords.
- *Shows:* real multi-channel identity and honest uncertainty.

**Demo 6: completeness as a gate** [Run today]

```text
$ node bin/capability-manifest.js validate examples/valid --require-level adoptable
INVALID  examples/valid/playwright-mcp.capability.yaml
         ERROR  COMPLETENESS_BELOW_REQUIRED  / (line 10, col 1)
           fix: Provide the missing facts (adoptable: setup, limitations), with their provenance where known.
...
Summary: 8 manifest(s): 4 valid, 4 invalid - 4 error(s), 1 warning(s), 20 unverified check(s)
```

- *Shows:* a workflow could require a level without changing the schema.

**Demo 7: revisions of one capability** [Run today]
- `compat` from `sql-review` 1.3.0 to `1.4.0-compatible` passes: an interface and a use case were
  added, which requires a MINOR bump, and the repository moved with the id unchanged
  (`SOURCE_RELOCATED`).
- The breaking revision fails:

```text
    BREAKING  INTERFACE_REMOVED  interface 'cli' was removed.
    ERROR  LIFECYCLE_TRANSITION_NOT_ALLOWED  lifecycleStatus cannot change from 'active' to 'experimental'.
    ERROR  INSUFFICIENT_VERSION_BUMP  ... require a MAJOR version bump, but capabilityVersion changed from 1.3.0 to 1.4.0 (minor).
Result: FAILED (2 error(s))
```

- *Does not show:* breaking changes inside native contracts, such as an MCP tool schema; it cannot
  see them [POC report §9].

**Demo 8: the schema's own evolution** [Run today]. `schema-compat` from the frozen 2026-10-22
draft to today's draft classifies every difference:
- 12 optional fields added;
- 4 completeness levels added;
- 6 requirements and 1 rule removed (relaxations);
- the widened id pattern marked breaking, because a changed pattern cannot be proven safe.

It then re-validates the corpus: "9 manifest(s) valid under 0.1 re-declared as 0.1: 9 still
valid."

- *Shows:* compatibility is checked, not assumed.

**Demo 9: exchange.** See §C.4.

**Demo 10: journeys on real records** [Run today]

```text
$ npm run research --silent
Analysed 96 distinct records (60 capabilities, 36 agent cards).
  N2: V0 recall 100% precision 36% | V1 recall 100% precision 19% | V2 recall 100% precision 62%
  schema 0.1 of 2026-10-22: 12 of 60 drafts valid; assessable 34 of 60 (17 without inference)
  revised schema 0.1: 57 of 60 drafts valid with the same mapping; 58 of 60 starter-model drafts valid
  validator levels (starter drafts): none 2, discoverable 25, assessable 31, adoptable 0, governed 0; identity via the validator: 14 correct, 0 false, 0 missed
```

- *Shows:* the model carries what journeys J2 and J4 need, on real public data.
- *Does not show:* internal data, or several judges.

#### Demonstrated versus not demonstrated

| Claim | Status | Evidence |
|---|---|---|
| The charter's fields and rules can be expressed and enforced in JSON Schema 2020-12 and YAML | **Demonstrated** | Schema; 206 tests |
| Errors, warnings, and unverified checks are distinguishable and actionable | **Demonstrated** on examples | Demos 1-3 |
| Identity rules handle monorepos, moves, external providers, and bundles | **Demonstrated** on fictional and real examples | Demos 4, 5, 7 |
| One capability can be recognised across its publications | **Demonstrated** on 60 real public records (14 of 14 pairs, 0 false) | Research §16.2 |
| Unassessed risk cannot be read as low or approved | **Demonstrated** in the validator and the exchange view | Demos 1, 9 |
| Downstream consumption without capability-specific mappings | **Partly**: one generic reader in the POC (`test/consumers.test.js`); no real consumer | §C.4 |
| A second implementation agrees | **Demonstrated** on 16 examples (2026-10-23; not re-run today) | POC report §7.4 |
| Real owners will supply the adoptable facts, at acceptable effort | **Not demonstrated** | Research E4 proposed |
| Internal capabilities behave like the public sample | **Not demonstrated** | Research E1 proposed |
| The validator runs in a real workflow | **Not demonstrated**: no CI, no Mission 5 integration | §C.3 |
| Discovery quality improves for real users | **Not demonstrated**: offline matcher, one judge | Research §7.2, §13.5 E2 |
| Performance at scale | **Not measured** (not a requirement) | POC report §9 |

### D.2 The "12 manifests", and how our testing compares

#### First, which manifests exist

The numbers in the documents refer to different sets:

| Set | Count | What they are | Where |
|---|---|---|---|
| Example manifests | 16 files: 8 valid (6 fictional, 2 real public capabilities), 5 invalid, 1 consistency, 2 compatibility | Hand-written to exercise every rule; the charter's "five representative manifests" | `examples/` |
| **Journey pilot drafts (iteration 1)** | **12** | **Automatically drafted from the native metadata of 12 randomly sampled public capabilities** | `pilot/drafts/` |
| Research records | 60 capability records (plus 36 A2A Agent Cards for conformance only) | Drafted automatically and validated three ways; not saved as manifest files | `research/spikes-1-3/` |

#### The 12 pilot manifests

They were sampled at random with a fixed seed (20261022) from three pools on 2026-10-22: 4 of 19
skills in `anthropics/skills`, 4 of the first 5,000 npm packages with the keyword `ai-agent`, and
4 of 47,633 active MCP Registry servers [`pilot/results.md` §1]. `pilot/analyze.js` drafted each one
from its native metadata alone. The validity and level columns below come from today's run
[Run today].

| Ref | Draft id | Format | What it is (its own description, shortened) | Type (derived) | Valid now | Level | Next level needs |
|---|---|---|---|---|---|---|---|
| S1 | `anthropics/mcp-builder` | Agent Skill | Guide for creating high-quality MCP servers | skill | yes | discoverable | runtime, version, lifecycle signal |
| S2 | `anthropics/canvas-design` | Agent Skill | Create visual art in .png and .pdf documents | skill | yes | discoverable | runtime, version, lifecycle signal |
| S3 | `anthropics/pdf` | Agent Skill | Anything with PDF files: read, extract, merge, split, fill forms, OCR | skill | yes | discoverable | runtime, version, lifecycle signal |
| S4 | `anthropics/doc-coauthoring` | Agent Skill | Structured workflow for co-authoring documentation | skill | yes | discoverable | runtime, license, version, lifecycle signal |
| N5 | `npm/cdp-toolkit` | npm package | A lightweight chrome-devtools-mcp alternative: MCP server and CLI that drives browser tabs | mcp_server | yes | discoverable | runtime, lifecycle signal |
| N6 | `usejunior/provider-gmail` | npm package | Gmail API email provider for email-agent-mcp | tool | yes | discoverable | runtime, lifecycle signal |
| N7 | `chantezy/mcp-product-design` | npm package | Product-design workflow tools for AI agents, as an MCP server | mcp_server | yes | discoverable | runtime, lifecycle signal |
| N8 | `striderlabs/mcp-ubereats` | npm package | MCP server that lets AI agents order food delivery | mcp_server | yes | discoverable | runtime, lifecycle signal |
| M9 | `today.theclarity/clarity-today` | MCP Registry entry | News briefing, latest stories, search | mcp_server | yes | discoverable | runtime, license |
| M10 | `io.github.sidneybissoli/sih-br-mcp` | MCP Registry entry | Brazilian hospital-admissions data (DATASUS SIH/SUS, 1992-2025) | mcp_server | yes | discoverable | runtime, license |
| M11 | `io.github.vincentvella/devloop` | MCP Registry entry | Browser and dev-server logs on one timeline, for coding agents | mcp_server | yes | discoverable | runtime, license |
| M12 | `io.github.bluwork/kontra-mcp` | MCP Registry entry | "Tenth Man" structured contrarian analysis | mcp_server | yes | discoverable | runtime, license |

How to read this:
- **All 12 are valid today; 4 were valid against the 2026-10-22 draft.** The other 8 failed only
  because no source states `lifecycleStatus`, which is no longer mandatory [`pilot/results.md`;
  POC report §7.1].
- **All 12 stop at "discoverable".** Part of the reason is that no source states the missing facts
  (licenses for MCP entries, versions for skills, lifecycle outside the registry). Part of it is
  that the iteration-1 crosswalk predates the `runtime` field and never fills it [Observation from
  today's output: `runtime` is unmet in all 12]. The research harness, which does fill `runtime`,
  brings 31 of 60 records to "assessable" [Research §16.2].
- **The ids and owners were inferred**, for example the repository owner for skills. Each draft
  records this in its provenance, so these are drafts for an owner to confirm, not registrations.
- **What they test:** "Can a valid manifest be drafted from the metadata a team already
  maintains?", and which journey questions that metadata can answer. They were not written to fit
  the schema, which is the weakness of the hand-written examples.

#### How public projects and companies test this kind of standard

| Approach | What it tests | Public example | Source |
|---|---|---|---|
| Specification conformance suites | Whether an implementation follows the specification | JSON Schema Test Suite (for validators); A2A TCK (for agents) | [External] |
| Publish-time validation and ownership checks | Whether each submitted record is well formed and owned by its publisher | MCP Registry namespace and package-ownership verification; `mcp-publisher validate` | [External] |
| Editor and CI linting against schemas | Whether files are well formed while being written | YAML language server with SchemaStore | [External] |
| Build-and-run checks in curated catalogs | Whether the artifact actually builds and starts | Docker MCP catalog (builds images, generates `tools.json` by running servers) | Research E26 |
| Rollout on real repositories and users | Adoption, coverage, data quality, user satisfaction | Backstage discovery registers `catalog-info.yaml` across an organization's repositories automatically | [External] for the mechanism; how companies measure rollouts is [General knowledge], not checked |
| Search evaluation with judged relevance | Whether people find the right things | Standard information-retrieval practice: several judges, agreement statistics, many queries | [General knowledge] |

#### Where our testing differs

| Dimension | This POC and its research | Typical public or company practice | Consequence |
|---|---|---|---|
| Data | A public snapshot from one day: 60 records, 12 in the pilot | Live registries, or the organization's own catalog | Internal behaviour unknown (A1) |
| Who judges relevance | One person, judgments written before the matcher ran | Several judges, or real user behaviour | Possible bias; E2 proposed |
| What is measured | Whether metadata is **present** and journey questions are answerable; offline precision and recall | Task success, adoption, time saved | Usefulness to people not shown |
| Runtime behaviour | Nothing installed or run | Conformance kits test running systems | Says nothing about whether capabilities work |
| Ownership | Not verified; ids assigned by the harness | Registries verify namespaces and packages | Trust in the publisher not established |
| Continuity | Run by hand | CI on every change, and publish-time gates | Regressions are caught only when someone runs the tests |
| **Pre-registration** | Journeys, needs, and the sampling rule written before sampling; deviations recorded | Rarely documented publicly for catalog standards [Inference] | **A strength**: results are harder to tune after the fact |
| **Provenance and negative controls** | Every value tagged; a names-only matcher kept as a negative control (2 false merges, 10 of 14 missed) | Uncommon in format specifications [Inference] | **A strength**: it shows why identity needs declared links |
| **Validator scored against ground truth** | The validator's own warnings compared with the judged identity groups | Validators are tested against the specification, not against usefulness | **A strength**: links the contract to the journeys |

**Next tests the research proposes** (proposals, not commitments) [Research §13.5]:

| Experiment | What it would do | What it answers | Effort |
|---|---|---|---|
| E1 | Run the harness on 10-20 internal capabilities, with journeys from Missions 1 and 2 | Whether internal capabilities behave like the public sample | 1-2 weeks |
| E2 | Add a second judge and paraphrased queries | Bias in the relevance judgments | 1-2 days |
| E3 | Project 10 records into an AI Catalog document | What the external envelope lacks | 1 day |
| E4 | Have five owners complete the adoptable facts, timed | The curation cost of the adoptable level | About a week, elapsed |
| E5 | Re-snapshot after two weeks | Drift between publications | 1 hour plus the wait |
| E6 | Draft use cases from documentation and have owners confirm them | Whether documentation-assisted drafting is accurate enough | 2-3 days |

---

## E. Sources

### Project sources (paths relative to the project root)

| Source | Used for |
|---|---|
| `docs/charter/Mission 4 AI Capability Intelligence & Standards.docx` | Charter positions (§3, §6, §8, §9) |
| [spikes-1-3-research.md](spikes-1-3-research.md), [research/spikes-1-3/](../research/spikes-1-3/) | All measured results from 60 real records; standards comparison; experiments |
| [docs/reviews/spike-2-report-review.md](reviews/spike-2-report-review.md) | Use-case requiredness; MCP server runtime split; Hugging Face model cards |
| [docs/field-dictionary/0.1.md](field-dictionary/0.1.md), [schema/0.1/capability.schema.json](../schema/0.1/capability.schema.json) | Field definitions, conditional rules, completeness levels |
| [docs/manifest-spec.md](manifest-spec.md) | The validation contract (§11), interoperability rules (§12), consumer guidance (§13) |
| [docs/poc-report.md](poc-report.md) | Decisions D1-D26, verification (§7), limitations (§9) |
| [docs/mission-boundaries.md](mission-boundaries.md) | Ownership; the Mission 5 integration point |
| [pilot/results.md](../pilot/results.md), [pilot/drafts/](../pilot/drafts/) | The 12 pilot manifests |
| [schema/contracts/exchange-document-0.1.schema.json](../schema/contracts/exchange-document-0.1.schema.json) | The exchange document's structure |
| [README.md](../README.md) | Commands and examples |

### External sources checked on 2026-10-23

- Anthropic engineering, advanced tool use (Tool Search Tool; 2025-11-24): https://www.anthropic.com/engineering/advanced-tool-use
- Anthropic, "Code execution with MCP: Building more efficient agents" (2025-11-04): https://www.anthropic.com/engineering/code-execution-with-mcp
- Agent Skills specification (progressive disclosure; `skills-ref validate`): https://agentskills.io/specification
- MCP Registry official API (search behaviour; `POST /v0.1/validate`): https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md
- MCP Registry official-registry requirements (namespace and package ownership; allowed registries): https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md
- MCP Registry Discussion #635, "Improving the quality of server entries published to the Official MCP Registry" (2025-10-08): https://github.com/modelcontextprotocol/registry/discussions/635
- A2A Protocol Technology Compatibility Kit: https://github.com/a2aproject/a2a-tck
- JSON Schema Test Suite: https://github.com/json-schema-org/JSON-Schema-Test-Suite
- YAML language server (SchemaStore integration; JSON Schema draft support): https://github.com/redhat-developer/yaml-language-server
- SchemaStore: https://www.schemastore.org/
- Backstage, GitHub discovery: https://backstage.io/docs/integrations/github/discovery/

The research's external references E1-E28 (retrieved 2026-10-22) are listed in Research §15.3
and were not re-checked for this document.
