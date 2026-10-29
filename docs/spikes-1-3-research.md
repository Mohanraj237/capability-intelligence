# Mission 4: Spikes 1-3 research: discovery and reuse on real capabilities

| | |
|---|---|
| Date | 2026-10-22; addendum 2026-10-23 (§16) |
| Scope | Spike 1 (standards and ecosystem), Spike 2 (capability definition and metadata model), Spike 3 (identifiers, lifecycle, and versioning), as chartered on 2026-10-16 |
| Method | Journeys first: four journeys and four concrete needs written down before sampling; 60 real capability records in seven packaging formats, plus 36 A2A Agent Cards; one crosswalk per format; the journeys scored against judged relevance and identity |
| Evidence | [`research/spikes-1-3/`](../research/spikes-1-3/): pre-registration, snapshot, scripts, judgments, and generated [results](../research/spikes-1-3/results.md). Reproduce offline with `node research/spikes-1-3/analyze.js` |
| Status | Research findings and proposals. **Nothing in this document is a decision.** Every proposal is labelled and needs the owner named in §12. On 2026-10-23, at the Mission 4 team's direction, the proposals of §11 and §13.1 were applied to the unpublished schema 0.1 draft as POC proposals; §16 records how, and what they produced on the same records. Sections 1-15 describe the schema as it stood on 2026-10-22 |
| Handling | Derived from documents marked "Confidential – Authorized Use Only". Handle it the same way |

## How to read this document

Each statement carries a label that says where it comes from.

| Label | Meaning |
|---|---|
| **[Charter §n]**, **[Spike n]** | Stated in the Mission 4 charter or a spike document (all dated 2026-10-16) |
| **[Project]** | From an existing project artifact: the POC, the journey pilot (iteration 1), or `mission-understanding.md` |
| **[Measured R§n]** | Measured by this research; the number is in [results.md](../research/spikes-1-3/results.md) section n |
| **[Observed]** | Seen directly in a source during this research (a snapshot file, an API response, a README), with its location |
| **[External En]** | From official documentation or a specification, listed in §15 |
| **[Inference]** | This report's interpretation of the evidence. Check it before relying on it |
| **[Recommendation]** | A proposal for a decision. Not decided |
| **[Open]** | Unresolved |

Three caveats apply to every measured result: one person made the relevance and identity
judgments; public capabilities stand in for internal ones; and the sample is small and partly
purposive. §4.4 and §12.3 give the details.

## Contents

1. [Executive summary and key findings](#1-executive-summary-and-key-findings)
2. [Review of the three existing spikes](#2-review-of-the-three-existing-spikes)
3. [Selected discovery and reuse user journeys](#3-selected-discovery-and-reuse-user-journeys)
4. [Representative capabilities and source references](#4-representative-capabilities-and-source-references)
5. [Existing metadata comparison matrix](#5-existing-metadata-comparison-matrix)
6. [Common concepts, inconsistencies, and metadata gaps](#6-common-concepts-inconsistencies-and-metadata-gaps)
7. [Discovery and reuse validation results](#7-discovery-and-reuse-validation-results)
8. [Findings from standards and ecosystem research](#8-findings-from-standards-and-ecosystem-research)
9. [Capability definition and granularity findings](#9-capability-definition-and-granularity-findings)
10. [Identifier, lifecycle, and versioning findings](#10-identifier-lifecycle-and-versioning-findings)
11. [Proposed starter metadata model with evidence and rationale](#11-proposed-starter-metadata-model-with-evidence-and-rationale)
12. [Trade-offs, risks, assumptions, and unresolved questions](#12-trade-offs-risks-assumptions-and-unresolved-questions)
13. [Recommendations for the next phase](#13-recommendations-for-the-next-phase)
14. [Updated or refined spike deliverables](#14-updated-or-refined-spike-deliverables)
15. [References and supporting evidence](#15-references-and-supporting-evidence)
16. [Addendum: the proposals applied to schema 0.1 (2026-10-23)](#16-addendum-the-proposals-applied-to-schema-01-2026-10-23)

---

## 1. Executive summary and key findings

### 1.1 The question and how it was tested

Mission 4 exists so that people and systems can discover, compare, and reuse AI capabilities from
many sources using one consistent description [Charter TL;DR, §1]. The concern behind this
research is that the work so far defined metadata without showing that the metadata delivers
those outcomes [Project: review, 2026-10-22].

This research therefore started from what users try to do, not from fields:

1. **Four journeys** (§3): find a capability before building one (J1); recognise the same
   capability across sources (J2); compare candidates and decide (J3); judge whether there is
   enough information, and know what to ask (J4).
2. **Four concrete needs**, each with a relevance criterion, written down before any capability
   was looked at: drive a browser to test a web application (N1); read and update GitHub issues
   and pull requests (N2); live web search with citable URLs (N3); extract text and tables from
   PDF files (N4). They refine the use cases that iteration 1 of the journey pilot pre-registered.
3. **Real capabilities** (§4): 49 targeted publications drawn by a pre-registered rule from seven
   sources (the official MCP Registry, npm, three Agent Skills repositories, the official Claude
   Code plugin marketplace, the Docker MCP catalog, PyPI, and GitHub Actions), 11 distinct
   background records from iteration 1, and 36 A2A Agent Cards found in public repositories.
4. **One crosswalk per format** (§5), with the provenance of every value: stated by the record
   (native), read from a source the record declares (linked), or derived by a documented
   convention or by a heuristic.
5. **The journeys run against the result** (§7), scored against relevance and identity judgments
   made from each capability's own documentation.

### 1.2 Key findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **The sources' own discovery is weak, so discovery depends on how consumers normalize metadata.** The official MCP Registry searches name substrings only and returns results alphabetically; for "github", GitHub's own server is at rank 12,080 of 29,152, because every `io.github.*` namespace matches. npm's results for "playwright mcp" mix the vendor's package with forks and wrappers. | [Measured R§2]; [External E10] |
| 2 | **A shared core already exists in native metadata**: a name (60 of 60 records), a description (58), a source repository (54, 42 of them stated natively), a version (47, but none of the 11 Agent Skills), and documentation (56). This is close to the charter's mandatory candidates, as iteration 1 also found. | [Measured R§3]; [Project: pilot F9] |
| 3 | **The facts that decide reuse are the least available.** Setup and credentials are stated for 13 of 60 records, limitations for 0, risk for 0, and lifecycle natively for 17, almost all of which are MCP Registry entries. A license is stated natively for only 24; another 26 have one only through their source repository, and 6 have terms that need reading (proprietary text or a pointer to a file). | [Measured R§3, R§8] |
| 4 | **Publications of one capability can be linked reliably from metadata that exists, but not from names.** Declared links (packages in `server.json`, npm's `mcpName`, PyPI's `mcp-name` marker, container images, hosted endpoints) together with "same repository and same path" recovered all 14 same-capability pairs, with no false merge. Matching on native names alone merged two pairs of different capabilities and missed 10 of the 14 pairs. Schema 0.1 had a single `source` and could not hold these publications (revised 2026-10-23, §16). | [Measured R§6] |
| 5 | **Identical discovery metadata does not mean the same capability.** Two Agent Skills named `webapp-testing`, with identical names and descriptions, differ in runtime (Python scripts versus Node.js), bundled files, and license (an Apache-2.0 file versus none). | [Observed: samples/supplementary.json]; [Measured R§6] |
| 6 | **Lexical discovery over native metadata finds relevant capabilities but returns much noise**: precision 36-71% across the needs. Each kind of false positive points to a missing or misused concept: namespaces read as names (fixing it raised N2 precision from 36% to 62%), operation direction (PDF producers and viewers returned for "extract text from PDFs"), and scope (single-site search returned for "web search"). Adding documentation text recovers capabilities with thin metadata, but cuts precision. | [Measured R§5] |
| 7 | **Schema validity and usefulness are independent.** 12 of 60 automatically drafted schema-0.1 manifests are valid against the 2026-10-22 draft. 29 invalid drafts are nevertheless assessable from their metadata, mostly because of a single missing `lifecycleStatus`; 7 valid drafts are not assessable, for example because that draft has no license field. | [Measured R§9] |
| 8 | **Native formats are not reliably conformant, and conformance proves little.** Of 36 public `agent-card.json` files, 4 validate against the A2A v0.3.0 schema and 4 have every field that A2A v1.0.1 marks required; 3 declare version 1.x but use the pre-1.0 layout. One conformant card states that it is not an A2A agent. | [Measured R§4] |
| 9 | **Lifecycle is rarely machine-readable.** Deprecation appears in prose (a README notice on `openai/skills`; "(Archived)" in Docker catalog titles; Browserbase's README), or as npm messages that name no successor. An archived repository was still listed as available in a curated catalog. | [Observed]; [Measured R§3] |
| 10 | **Identity breaks in the ways the charter anticipated, and in ways it did not.** A stored repository URL went stale after a rename while the repository's numeric id did not change. Two publishers ship different skills with the same name (`pdf`). Forks are republished as separate registry entries, and a hosting service republishes a vendor's server under its own namespace. The POC's id pattern rejected real, registry-verified namespaces that start with a digit (until the revision, §16). One capability shows three versions at once across its publications (0.0.82, 0.0.83, and a commit pin). | [Measured R§6]; [Observed] |
| 11 | **An emerging standard already takes the approach the evidence supports.** The Linux Foundation's AI Catalog draft, built by members of the MCP and A2A communities, references native artifacts instead of redefining them. It keeps identifiers separate from registry coordinates and defines conformance levels. It does not cover license, lifecycle, setup, limitations, or dependencies. MCP Server Cards deliberately leave tools out of static metadata. | [External E15-E17, E5] |

### 1.3 What the evidence implies

The chain the charter asks for (journeys → evidence → a minimal model) leads to these conclusions
[Inference]:

- **The starter model is small, and most of it can be filled automatically.** Name, description,
  publications, type, interface, runtime, license, version, lifecycle signals, publisher, and
  documentation make 58 of 60 records discoverable and 34 assessable from metadata that already
  exists. 17 of the 34 need no heuristic at all (§7.5).
- **Schema 0.1, as it stood on 2026-10-22, was stricter than the evidence in some places, and
  missing things in others.** It made `lifecycleStatus`, `owner.contact`, and `lastUpdated`
  mandatory, although few sources state them, and it allowed one `source` only. It had no field
  for license, publications, relations, or provenance, all of which the journeys needed.
- **The fields that would make discovery and comparison good have to be curated.** Structured
  abilities, input and output media types, setup (including "none needed"), and limitations are
  owner or curator input; no native format supplies them. The model should mark them as such,
  not make them mandatory.
- **The identifier question is less urgent than the publication question.** Once each
  capability carries its publications (with their native names) and relations, the choice
  between a readable namespaced id and a URN matters mainly for allocation and stability, not
  for discovery or linking. The choice can stay provisional (§10.2).

The proposed starter model is in §11; the recommendations are in §13. §16 records their
application to schema 0.1 on 2026-10-23: on the same records, the revised validator accepts 58 of
60 drafts (12 before), links all 14 judged same-capability pairs with no false link, and reports
the completeness levels that §7.5 measured for 56 of the 60.

---

## 2. Review of the three existing spikes

### 2.1 What each spike asks

The three spike documents were re-extracted on 2026-10-22. Their last-modified dates are still
2026-10-16, and they still contain only objectives, research areas, tasks, and deliverables
[Spike 1-3]. This research keeps their scope; it adds evidence to each.

| | Spike 1: Standards and ecosystem | Spike 2: Capability definition and metadata model | Spike 3: Identifiers, lifecycle, and versioning |
|---|---|---|---|
| **Objective** | "Identify existing standards and formats that can be reused to define a common, machine-readable AI Capability Manifest" | "Define what constitutes an AI capability and identify the metadata required to describe it consistently across different capability types" | "Define a reliable approach for uniquely identifying AI capabilities and managing their lifecycle, versions, and compatibility" |
| **Research areas** | Agent Skills; MCP; A2A Agent Cards; JSON Schema; Semantic Versioning | Definition and granularity; capability types; mandatory, conditional, and optional fields; missing-data semantics; consumer requirements (discovery, recommendation, interoperability, risk) | Identifiers (readable namespaced, URN-style, others); source references kept separate from ids; lifecycle states and transitions; schema versus capability versioning; compatibility |
| **Tasks** | Review each standard's purpose, structure, and applicability; distinguish metadata formats from runtime protocols; identify reusable fields, conventions, and limitations; identify gaps that require a manifest; recommend reuse, adaptation, or independent definition | Review representative capabilities and their metadata; propose a definition and granularity model; prepare a field dictionary (purpose, type, requirement level); identify fields that vary by type; highlight gaps and unresolved decisions | Evaluate ids for monorepos; test renamed or moved repositories, external tools and APIs, and bundles; define parent and child references; recommend lifecycle states and transitions; evaluate SemVer or an alternative; identify breaking changes, compatibility, and migration |
| **Deliverables** | Comparison table; reuse recommendations; gap analysis; a practical approach for v0.1 with references | Capability definition and granularity rules; type recommendations; field dictionary; missing-data rules; recommendations and open questions | Identifier recommendation; scenario analysis; lifecycle model; versioning strategy; compatibility guidelines; open questions |
| **Expected outcome** | A standards-based recommendation that avoids reinventing formats or protocols | A proposed definition and metadata model to guide v0.1 | A proposed identifier, lifecycle, and versioning strategy for v0.1 |
| **Findings recorded** | None | None | None |

### 2.2 Assumptions the spikes make

None of these is stated in the spikes; each is read from how the tasks are framed [Inference].

| Spike | Implicit assumption | What the evidence shows |
|---|---|---|
| 1 | The listed standards cover the formats capabilities actually arrive in | Real capabilities also arrive as npm and PyPI packages, Claude Code plugins, Docker catalog entries, and GitHub Actions; a cross-protocol catalog standard (AI Catalog) has appeared since the charter (§8) |
| 1 | A standard can be judged by reading its specification | Conformance in practice differs from the specification: 4 of 36 Agent Cards conform (§7.7) |
| 2 | Requiredness can be settled in a field dictionary | What can be required depends on what sources supply; `lifecycleStatus` alone made 45 of 60 drafts invalid against the 2026-10-22 draft (§7.6) |
| 2 | Consumer requirements are known | Consumer needs were taken from documents, not from journeys or from the missions [Project: `mission-understanding.md` A2] |
| 3 | A capability has one identifier and one source | The same capability has two to four publications with different native names and versions (§7.3) |
| 3 | Scenarios can be analysed hypothetically | Every scenario in the charter occurs in the sample, together with others the charter does not list (§10.1) |

### 2.3 Dependencies and overlaps

- **Dependencies.** Spike 1 decides what can be reused, and therefore which fields Spike 2 needs to
  define. Spike 2's granularity rules decide what gets an identifier in Spike 3. Spike 4
  consumes all three [Project: `docs/poc-report.md` §2.2].
- **Overlaps.** Semantic Versioning appears in both Spike 1 (as a standard) and Spike 3 (as a
  versioning strategy). "Reusable fields" (Spike 1) and the field dictionary (Spike 2) cover the
  same ground. Compatibility appears in Spike 1 ("validation/versioning support") and in Spike 3.
  Consumer requirements (Spike 2) overlap the coordination points that the charter assigns to
  the other missions [Charter §9].

### 2.4 Where practical validation is missing

Taken together, the three spikes describe what to read and what to decide. None of them asks
whether the result lets a user find, compare, or choose a capability [Inference]:

1. **No journey.** No task tests discovery, comparison, or a reuse decision.
2. **Little real data.** Only Spike 2's first task ("review representative AI capabilities")
   touches real capabilities.
3. **No availability measure.** No task asks which fields sources can actually supply, or at what
   curation cost.
4. **No cross-source identity test.** Spike 3's scenarios do not ask how to recognise the same
   capability published in several places, which turned out to be common (§7.3).
5. **No conformance check in the wild.** Spike 1 reads specifications, but does not check how
   closely published metadata follows them.

### 2.5 Do the three spikes, taken together, prove the intended outcome?

Not as chartered [Inference]. They would produce a well-reasoned model, but no evidence that the
model enables discovery and reuse. The journey harness used here (pre-registered needs, a
sampling rule, a crosswalk with provenance, judged relevance, and journey metrics) provides that
evidence. It is small enough to run inside the spikes rather than after them. §13 and §14
propose how to add it without changing who owns which spike.

---

## 3. Selected discovery and reuse user journeys

### 3.1 Journeys

The task proposed five candidate scenarios. Comparing candidates and deciding whether to reuse,
adapt, or build are one activity in practice, so they were merged into J3. Iteration 1's journey
"register a capability with little effort" [Project: `pilot/journeys.yaml`] is not repeated as a
journey; its measure (does a valid manifest result from native metadata?) is kept in §7.6. The
journeys and their questions are in [needs.yaml](../research/spikes-1-3/needs.yaml).

| | J1 Find before building | J2 Recognise duplicates and overlaps | J3 Compare and decide | J4 Enough information, and what to ask |
|---|---|---|---|---|
| **User and goal** | A developer about to build an agent integration, looking for something that already meets the need | The same developer, or a curator keeping a list of approved capabilities, who must not count one capability twice | A team with two or more candidates, deciding to reuse, adapt, or build | A consumer of shared metadata (a recommender, a reviewer) |
| **Problem** | Capabilities are spread across registries, catalogues, and repositories, each searched differently | The same capability is published in several places under different names; forks and wrappers look like originals | Facts that decide reuse are scattered, inconsistent, or missing | Some facts are stated, some inferred, some missing, and the consumer cannot tell which |
| **Information needed** | What it does; what kind it is; how it is used | Native names, source repositories, declared publications, fork and wrapper relations | Interface, runtime, setup, dependencies, limitations, terms, version, maintenance, publisher | The provenance of each fact, and which facts need an owner or governance |
| **Expected flow** | State the need → search all sources → see one list of candidates, each capability once | Group entries by declared links and source repository → link forks and wrappers → keep different capabilities apart | Shortlist → compare the decision questions side by side → decide, or ask for missing facts | For each fact: stated, linked, inferred, or unknown → confirm the inferred, ask for the unknown, leave risk to governance |
| **Evidence of success** | Every relevant capability found; few irrelevant ones; each capability shown once | Correct pairs found; no false merge; derivatives linked, not merged | Each question answered with its source, or marked unknown; blockers named | The share of records that reach each completeness level; a specific list of what to ask |
| **Measured gaps** | Precision 36-71%; namespaces matched as names; no input or output types; no scope (§7.2) | Schema 0.1, as of 2026-10-22, could not hold several publications; forks and copies are recorded only in prose (§7.3) | Setup unknown for most candidates; limitations unknown for all; versions disagree across publications (§7.4) | 34 of 60 records assessable, 0 adoptable without owner input, 0 governed (§7.5) |

### 3.2 Needs

Each need names what a developer would type, and a relevance criterion judged from the
capability's own documentation [needs.yaml].

| Need | Statement | Relevant when the capability... | Partial when it... |
|---|---|---|---|
| N1 | Let our coding agent open our web application in a real browser, click through a flow, fill in forms, and take screenshots | lets an agent drive a real browser interactively | automates a browser but cannot be used by an agent directly, or fetches or scrapes pages without interaction |
| N2 | Let an agent read and update GitHub issues and pull requests | gives an agent read and write operations on issues and pull requests | is GitHub-related but narrower, or read-only |
| N3 | Give an agent live web search with result URLs it can cite | runs web searches and returns results with URLs | fetches a given URL without searching, or searches one site or a closed corpus |
| N4 | Extract the text and tables from PDF files inside an agent workflow | reads PDFs and returns their text, and tables where present | converts documents to text without table handling |

---

## 4. Representative capabilities and source references

### 4.1 How the sample was drawn

The sampling rule was written before sampling [needs.yaml, "Sampling rule"]:

1. **Searchable registries** (official MCP Registry; npm): the first result page for the need's
   query.
2. **Listings without search** (Agent Skills in anthropics/skills, openai/skills, and
   github/awesome-copilot, counted as one listing; the official Claude Code plugin marketplace;
   the Docker MCP catalog): the entries whose name, title, or description contains one of the
   need's terms.
3. **At most two entries per source per need**: the vendor's own publication of the technology
   the need names (Microsoft's Playwright MCP server for N1, GitHub's MCP server for N2), then
   random draws with a fixed seed.
4. **Purposive additions named in advance** for packaging types that have no searched source:
   three PyPI framework integrations (browser-use, langchain-tavily, docling) and one GitHub
   Actions workflow (anthropics/claude-code-action).
5. **Cross-listings**: when a selected record declares another publication of itself, that
   publication was snapshotted too.
6. **A2A Agent Cards**: the JSON files among the first 50 GitHub code-search results for the file
   name `agent-card.json`, as a separate conformance sample.
7. **Background**: iteration 1's 12 randomly drawn capabilities, unchanged.

Four deviations are recorded in the [README](../research/spikes-1-3/README.md#deviations-from-the-pre-registered-rule).
The two that matter: the npm vendor test was too broad and selected `@github/mcp-registry`, which
is GitHub's SDK for the MCP Registry, not its MCP server (kept, judged not relevant). And GitHub's
registry entry lay beyond the 30 pages the first script searched, so it was added afterwards as
the purposive record the rule calls for.

### 4.2 Composition

| Format | Targeted | Background | Selection of the targeted records |
|---|---|---|---|
| MCP Registry entry (`server.json`) | 10 | 4 | 2 purposive, 7 random, 1 cross-listing |
| npm package (`package.json`) | 10 | 4 | 2 purposive, 6 random, 2 cross-listings |
| Agent Skill (`SKILL.md`) | 8 | 3 | 8 random, from three publishers |
| Claude Code plugin (marketplace entry, `plugin.json`, `.mcp.json`) | 7 | 0 | 2 purposive, 5 random |
| Docker MCP catalog entry (`server.yaml`) | 8 | 0 | 2 purposive, 6 random |
| PyPI package (core metadata) | 5 | 0 | 3 purposive, 2 cross-listings |
| GitHub Action (`action.yml`) | 1 | 0 | 1 purposive |
| **Capability records** | **49** | **11** | **60 distinct** |
| A2A Agent Card (`agent-card.json`) | 36 | | conformance sample |

The capability types covered are MCP servers, skills, plugins, agents (A2A), a workflow (GitHub
Action), tools and libraries (npm, PyPI), and hosted services (registry entries with remote
endpoints only). Every record, with its source URL and the step that selected it, is listed in
[results.md §1](../research/spikes-1-3/results.md#1-sample). The snapshot is in
`research/spikes-1-3/samples/` (email addresses redacted).

### 4.3 The capabilities judged relevant

These are the capabilities against which J1, J3, and J4 are scored [judgments.yaml]. Entries
that are the same capability are grouped.

| Need | Capability | Publications in the sample |
|---|---|---|
| N1 | Microsoft Playwright MCP server | Registry `io.github.microsoft/playwright-mcp` (N1-01); npm `@playwright/mcp` (N1-03); Docker `playwright` (N1-09); plugin `playwright` (N1-07) |
| N1 | PulseMCP Playwright Stealth | Registry `com.pulsemcp/playwright-stealth` (N1-02); npm `playwright-stealth-mcp-server` (N1-45) |
| N1 | agentic-playwright-mcp (a fork) | npm (N1-04) |
| N1 | Two different `webapp-testing` skills | anthropics/skills (N1-06); github/awesome-copilot (N1-05) |
| N1 | Browserbase MCP server (archived) | Docker `browserbase` (N1-10) |
| N1 | browser-use | PyPI (N1-41); registry `com.browser-use/browser-use` (N1-49) |
| N1 | cdp-toolkit; devloop | npm (B05); registry (B11), both from iteration 1 |
| N2 | GitHub MCP server | Registry `io.github.github/github-mcp-server` (N2-50); Docker `github-official` (N2-19); plugin `github` (N2-17) |
| N2 | Claude Code Action | GitHub Action `anthropics/claude-code-action` (N2-44) |
| N3 | DuckDuckGo search server (community) | Docker `duckduckgo` (N3-30) |
| N3 | langchain-tavily | PyPI (N3-42) |
| N4 | pdf-parse; the anthropics `pdf` skill; docling | npm (N4-34); skill (N4-35); PyPI (N4-43) |

Records judged partial or undetermined, with the reason for each, are in
[judgments.yaml](../research/spikes-1-3/judgments.yaml). One record (`redfox-ai-search-mcp`) could not
be judged at all: neither its metadata nor its README says what it searches.

### 4.4 Limitations of the sample

- **Purposive where it matters.** The vendor publications and the PyPI and Actions records were
  chosen, not drawn. That makes the identity journey (J2) testable, and it is labelled on every
  record.
- **Selected by the same terms that J1 searches with.** Most targeted records entered the sample
  because a source's search or listing matched the need's terms. J1 recall is therefore close to
  100% by construction for those records. It is informative only for the records that were not
  selected by the terms: the purposive additions and the background (§7.2).
- **Public capabilities stand in for internal ones.** Internal catalogues, registries, and
  formats (for example Backstage-style service catalogues) were not available.
- **Metadata only.** Nothing was installed or run. Tool lists exist only where the Docker catalog
  generated them by running the server.
- **One day.** Registries change by the hour; the snapshot is from 2026-10-22.

---

## 5. Existing metadata comparison matrix

### 5.1 Where each concept lives in each format

Each cell gives the native field and, in brackets, how many records of that format state it. A
dash means that no field exists; "derived" means that the concept follows from the format or from
context. The counts come from [results.md §3 and §4](../research/spikes-1-3/results.md#3-metadata-availability-by-format)
[Measured R§3, R§4]. The format definitions are cited in §8.

| Concept | MCP Registry (14) | npm (14) | Agent Skill (11) | Claude Code plugin (7) | Docker catalog (8) | PyPI (5) | GitHub Action (1) | A2A Agent Card (36) |
|---|---|---|---|---|---|---|---|---|
| Native name or id | `name`, reverse-DNS with a verified namespace (14) | `name` (14) | `name`, must match the folder (11) | `name`, scoped to the marketplace (7) | `name` (8) | `Name` (5) | `owner/repo` (1) | - (no id field) |
| Display name | `title` (7) | - | - | `displayName` (1) | `about.title` (8) | - | `name` (1) | `name` (26) |
| Description | `description` (14) | `description` (14) | `description` (11) | `description` (7) | `about.description`, optional (6) | `Summary` (5) | `description` (1) | `description` (27) |
| Structured abilities | - (tools only at runtime) | - | - (prose: "use this skill when...") | - | `tools.json`, generated by running the server (1) | - | - | `skills[]` (21) |
| Keywords or tags | - | `keywords` (10) | - | `category`, `tags`, `keywords` (7) | `meta.category`, `meta.tags` (8) | `Keywords` (3) | - | `skills[].tags` (10) |
| Capability type | derived from format (14) | derived: MCP only if `mcpName` or wording says so (14) | derived (11) | derived (7) | derived (8) | derived (5) | derived (1) | derived (36) |
| Interface or protocol | `packages[].transport`, `remotes[].type` (14) | derived from `mcpName`, keywords, `bin` (14) | derived: Agent Skills (11) | derived: plugin, plus `.mcp.json` servers (7) | `type` (8) | derived (5) | derived: Actions step (1) | `supportedInterfaces[]` (v1.0) or `url` (v0.3) (21) |
| Where it runs | `registryType`, `runtimeHint`, `remotes` (14) | `engines` (8) | `compatibility` (0) | `.mcp.json` command or URL (7) | `image`, `run.allowHosts` (8) | `Requires-Python` (5) | `runs.using` (1) | endpoint (derived) |
| Setup and credentials | `environmentVariables[]` with `isSecret`, `isRequired`; remote `headers` (7) | - | - | `userConfig`, `${...}` placeholders (1) | `config.secrets`, `config.env`, `oauth` (4) | - | required `inputs` (1) | `securitySchemes` (2) |
| Dependencies | - (packages are publications, not dependencies) | `dependencies` (packages) (13) | - (prose) | plugin `dependencies`; MCP servers it runs (6) | - | `Requires-Dist` (packages) (5) | - | - |
| Limitations | - | - | - | - | - | - | - | - |
| License | - (7 via repository) | `license`, SPDX (13) | `license`, free text or file pointer (5; 5 more via repository) | `license` (2; 5 more via repository, repository-wide) | - (7 via repository; catalog policy only) | `License-Expression` or `License` (4; 1 via repository) | - (1 via repository) | - |
| Version | `version`, unique and immutable per publication (14) | `version`, SemVer (14) | - (0) | `version`, not checked against SemVer (5) | `source.commit` pin (8) | `Version`, PEP 440 (5) | release tags (1) | `version`, free text (22) |
| Lifecycle | registry `status`: active, deprecated, deleted (14) | `deprecated` message per version (0 in the sample) | - (one repository uses folder tiers; one deprecates in its README) | - (marketplace `renames` map) | - ("(Archived)" in titles; 1 archived repository) | `Classifier` Development Status (3) | - (repository archived flag) | - |
| Last updated | `updatedAt`, `publishedAt` (14) | publish time (14) | - (11 via last commit) | - (3 via repository) | - (8 via repository) | upload time (5) | release date (1) | - |
| Publisher | namespace, verified by the registry (14) | scope or account, owned on npm (14) | repository owner (11) | marketplace owner (7) | catalog operator (8) | - | repository owner (1) | `provider.organization`, self-declared (11) |
| Maintainer | - | `author`, `maintainers` (14) | `metadata.author` (0) | `author` (7) | owner of `source.project` (derived, 8) | `Author`, `Maintainer` (4) | `author` (0) | - |
| Source repository | `repository` (url, `subfolder`, forge `id`) (11) | `repository` (11) | its location (11) | `source` (7) | `source.project`, `commit` (8) | `Project-URL` (5) | the repository (1) | - |
| Other publications declared | `packages[]`, `remotes[]` (14) | `mcpName` (3) | - | MCP server it runs (in `.mcp.json`) | `image` (8) | `mcp-name:` marker (3) | - | - |
| Documentation | `websiteUrl` (7) | `homepage` (10) | the SKILL.md (11) | `homepage` (7) | derived from `source.project` | `Project-URL` (5) | repository (1) | `documentationUrl` (10) |
| Risk assessment | - | - | - | - | - | - | - | - |

### 5.2 Normalized concepts, availability, and classification

The four classes the task asks for:
- **Present**: the source states it.
- **Derivable**: it can be read from a linked source or derived by a rule.
- **Owner input**: it needs the owner or a curator.
- **Absent**: no source supplies it, and it may need to be introduced.

| Concept | Journey questions | Native (of 60) | Linked or derived | Class | Inconsistencies observed |
|---|---|---|---|---|---|
| Native name | same-as | 60 | | Present | Machine names carry namespaces (`io.github.*`) and scopes; A2A cards have no id |
| Display name | what | 17 | | Present in four formats | Docker titles are editorial ("GitHub (Archived)"); A2A `name` is a display name |
| Description | what | 58 | | Present | Docker descriptions are optional and only "provide a better description than the upstream project" [External E26]; quality varies from 17 characters to a paragraph; identical descriptions on different capabilities |
| Structured abilities | what, compare | 1 (plus 21 of 36 cards) | | Absent in most formats; owner input | A2A "skills" are abilities of an agent, not Agent Skills; MCP tools exist only at runtime |
| Keywords | what | 28 | | Present in four formats | Category semantics differ (Docker files Playwright under "devops") |
| Capability type | kind | 0 | 60 derived (47 by convention, 13 by heuristic) | Derivable | npm and PyPI packages say whether they are MCP servers only through `mcpName`, the PyPI marker, or wording |
| Interface | interface | 14 | 46 derived | Derivable | Transport names differ across protocols (`stdio`, `streamable-http`; `JSONRPC`, `GRPC`, `HTTP+JSON`) |
| Where it runs | runs-where | 36 | 24 derived | Present or derivable | Expressed as a package type, an engine range, a container image, or a hosted endpoint |
| Setup and credentials | setup | 13 | | Present in four formats; otherwise owner input | No format can state "no credentials needed" |
| Dependencies | depends | 24 (packages) | | Present as packages; capability-level dependencies need the owner | Package dependencies, capability dependencies, and service dependencies are different things |
| Limitations | limits | 0 | | Absent; owner input | One skill describes limitations in its prose body |
| License | terms | 24 | 26 linked | Present or derivable; 6 need reading | SPDX expressions, free text, file pointers, repository-wide licenses, a copy without the original's license file |
| Version | version | 38 | 1 linked, 8 derived | Present except for skills | SemVer, PEP 440, commit pins, git tags, dates; versions differ across publications of one capability |
| Lifecycle | maintained | 17 | 2 derived or linked | Present in two formats; otherwise absent or prose | Registry "active" means listed, not maintained; deprecations name no successor |
| Last updated | maintained | 33 | 23 linked | Present or derivable | A publish date, a registry update, a commit date, or a repository push, all called "updated" |
| Publisher | who | 7 | 48 by convention | Derivable by convention | The listing operator, the publisher, and the maintainer are often different parties |
| Maintainer | who | 25 | 8 by heuristic | Present in four formats | Self-declared author ("Microsoft") versus verified publisher (Anthropic's marketplace) |
| Source repository | same-as | 42 | 12 derived | Present | Stale URLs after renames; HTTP 404 for private or deleted repositories; monorepo paths |
| Other publications | same-as | 28 | | Present in four formats | Each format has its own locator syntax |
| Documentation | what | 29 | 27 derived | Present or derivable | |
| Risk assessment | risk | 0 | | Absent by design (governance) | |

---

## 6. Common concepts, inconsistencies, and metadata gaps

### 6.1 Concepts that are genuinely common

Name, description, a source location, documentation, and (outside Agent Skills) a version
appear in every format, under different field names [Measured R§3]. Together with type and
interface, which the format itself implies, they form the extractable core that iteration 1
found [Project: pilot F9]. This sample adds four formats, and the core still holds.

### 6.2 Different names for the same meaning

| Concept | Field names observed |
|---|---|
| Display name | `title`, `about.title`, `displayName`, `name` (action.yml, A2A) |
| Description | `description`, `Summary`, `about.description` |
| Discovery terms | `keywords`, `tags`, `category`, `meta.tags`, `skills[].tags` |
| Publisher | registry namespace, npm scope, repository owner, marketplace `owner`, `provider.organization` |
| Source | `repository`, `Project-URL`, `source.project`, plugin `source` |
| Setup | `environmentVariables`, `headers`, `config.secrets`, `oauth`, `inputs`, `userConfig`, `securitySchemes` |
| Lifecycle | `status`, `deprecated`, Development Status classifier, `archived`, folder tiers, "(Archived)" in a title |

### 6.3 The same names with different meanings

| Term | Meanings observed | Why it matters |
|---|---|---|
| **skill** | An Agent Skill (a packaged folder of instructions) [External E1]; an A2A `AgentSkill` (an ability an agent declares) [External E11]; an OASF skill (a taxonomy node) [External E28] | A consumer that maps "skills" between formats mixes capabilities with abilities |
| **name** | A machine identifier (registry, npm, Agent Skills, plugins); a display label (A2A, action.yml) | Name-based identity merges different capabilities (§7.3) |
| **version** | A release of the software (npm, PyPI); a publication of registry metadata, where a prerelease suffix marks a metadata-only update [External E8]; a pinned plugin version; a floating major tag (`v1`); a commit pin | "Which version is current" has different answers in different places for one capability |
| **active** | Listed and not deprecated by the publisher (MCP Registry) | It does not mean maintained: no registry entry in the sample was anything but active |
| **author** | The party credited in a listing (the `playwright` plugin's author is "Microsoft"), as against the party who published the listing (Anthropic) | Accountability and trust attach to different parties |
| **updated** | A registry publication, a package publish, a commit, a repository push, a release | A freshness signal means different things in different places |
| **license** | An SPDX expression; free text ("Proprietary. LICENSE.txt has complete terms"); a file pointer; a repository-wide license detected by the forge | Only SPDX expressions can be compared automatically |
| **tables, search, browser** | Database tables (S3 Tables) versus tables in PDFs; domain search, vector search, and site search versus web search; "runs in a browser" versus "drives a browser" | These produce most of J1's false positives (§7.2) |

### 6.4 Information specific to some capability types

| Type or format | Type-specific information | Generalizes to |
|---|---|---|
| MCP server (registry, Docker) | Transports; remote endpoints; environment variables; network egress (`allowHosts`) | interface, runtime, setup |
| A2A agent | Protocol bindings and versions; input and output media types; security schemes; skills with examples | interface, runtime, setup, abilities, inputs and outputs |
| Claude Code plugin | Components (skills, commands, agents, hooks, MCP and LSP servers); `userConfig`; dependencies on other plugins | interface, setup, dependencies, components |
| Agent Skill | `compatibility`; `allowed-tools`; bundled scripts and their runtime | runtime, dependencies |
| GitHub Action | `inputs` and `outputs`; `runs.using`; triggers | interface, setup, runtime |
| Packages (npm, PyPI) | Engine and Python version ranges; package dependencies; `bin` | runtime, dependencies |

Each type-specific item maps onto a few cross-type concepts (interface, runtime, setup,
dependencies), and the details stay in the native contract. A different core per type is not
needed [Inference].

### 6.5 Essential, useful, and unreliable information

| | Concepts | Basis |
|---|---|---|
| **Essential for discovery (J1)** | name, description, type, interface, publications | Needed to show a candidate at all; available for 58 of 60 records |
| **Essential for a reuse decision (J3)** | license and terms, lifecycle or maintenance signal, version, publisher or maintainer, runtime, setup | The blockers and gaps in §7.4 are all of this kind |
| **Useful but not essential** | keywords, display name, documentation, dependencies, structured abilities, input and output types | Improve ranking and comparison; their absence did not block any journey |
| **Cannot reliably be extracted** | limitations; setup where none is declared; capability-level dependencies; successors of deprecated capabilities; risk | No native field, or prose only |
| **Unreliable even when present** | lifecycle "active"; self-declared authors; Docker categories; version labels in Agent Cards; any value from a single publication when others disagree | §6.3, §7.7 |

### 6.6 Gaps

1. **Limitations** are stated by no format (0 of 60).
2. **Setup** is stated by 13 of 60, and nothing can say "none needed".
3. **Input and output media types** are stated only by A2A cards. The PDF false positives in J1
   show the cost (§7.2).
4. **Relations** between capabilities (same as, fork of, wraps, replaced by, client of) appear
   only as package links, plugin configuration, a forge fork flag, or prose.
5. **Machine-readable lifecycle** exists only in the MCP Registry and in PyPI classifiers, and
   no format records a successor.
6. **Risk** is absent everywhere, by design: it belongs to Mission 3 [Charter §6].

---

## 7. Discovery and reuse validation results

### 7.1 How the sources' own search behaves

[Measured R§2]

| Source | What its search does | Result for the needs |
|---|---|---|
| Official MCP Registry | "Case-insensitive substring search on server names", which the registry calls "intentionally simple" and leaves richer search to subregistries [External E10] | "playwright": 13 entries, Microsoft's at rank 8 among forks and wrappers. "github": 29,152 results, GitHub's own server at rank 12,080, because the namespace `io.github` matches every GitHub-verified publisher. "web search": no results, because no name contains the phrase |
| npm | Relevance-ranked text search | "playwright mcp": the vendor package at rank 2, among a fork ("Fork of official Playwright MCP"), a wrapper ("Wrapper for @playwright/mcp"), and three near-identical "experimental-browser-use-playwright-mcp" packages under different scopes |
| Agent Skills repositories, plugin marketplace, Docker catalog | No search; a listing to browse | 523, 315, and 328 entries. Terms in descriptions match many entries (90 of the 523 skills match an N2 term) |

Discovery quality therefore depends on the consumer: the inventory (Mission 2) and the
recommender (Mission 1) [Inference]. What Mission 4 controls is whether the metadata those
consumers receive lets them do better than the sources' own search. §7.2 tests exactly that.

### 7.2 J1: find a capability for a need

**Method.** A transparent term matcher ran over every distinct record (60 capability records and
36 agent cards), using each need's pre-registered terms as whole words. Score weights: name or
title 3; keywords, tags, tools, or agent skills 2; description 1; documentation text 0.5 (V1
only). Three index variants were compared:
- **V0**: native fields only;
- **V1**: native fields plus documentation text (README, long description, SKILL.md body);
- **V2**: native fields, with registry namespaces and npm scopes treated as the publisher, not as
  part of the name.

The matcher only checks whether metadata allows a capability to be found; it ranks nothing
for use, which is Mission 1's work [Project: `docs/mission-boundaries.md` §3].

[Measured R§5]

| Need | Variant | Retrieved | Recall (relevant) | Precision (relevant or partial) | Precision in the top 5 | Capabilities found / entries returned for them |
|---|---|---|---|---|---|---|
| N1 browser | V0 | 21 | 14 of 14 | 71% | 100% | 9 / 14 |
| | V1 | 29 | 14 of 14 | 52% | 100% | 9 / 14 |
| N2 GitHub | V0 | 22 | 4 of 4 | 36% | 40% | 2 / 4 |
| | V1 | 43 | 4 of 4 | 19% | 100% | 2 / 4 |
| | V2 | 13 | 4 of 4 | 62% | 100% | 2 / 4 |
| N3 web search | V0 | 19 | 1 of 2 | 53% | 80% | 1 / 1 |
| | V1 | 28 | 2 of 2 | 39% | 80% | 2 / 2 |
| N4 PDF | V0 | 13 | 3 of 3 | 38% | 80% | 3 / 3 |
| | V1 | 15 | 3 of 3 | 33% | 80% | 3 / 3 |

V2 equals V0 for N1, N3, and N4, because no namespace or scope there contains a search term.

**How to read recall.** Most targeted records entered the sample because their source matched the
same terms (§4.4), so recall near 100% is partly built in. The informative results are the
misses, the false positives, and the records that were not selected by the terms:
- The **background records** (iteration 1's random sample) contributed two relevant N1
  capabilities, cdp-toolkit and devloop. Both were found, through "browser".
- The **purposive** langchain-tavily (N3) was **missed** by native fields. Its summary, "An
  integration package connecting Tavily and LangChain", never says "search"; only its README
  does.

**Why the false positives occur**, and what metadata would prevent them [Measured R§5; Inference]:

| Need | False positives | Cause | Metadata that would prevent it |
|---|---|---|---|
| N2 | 9 of 14 (V0): eight `io.github.*` registry entries and the `@github/` SDK | The namespace or scope was matched as part of the name | Publisher kept separate from name. V2 does this: precision rose from 36% to 62%, and the top 5 became all useful |
| N4 | 5 of 8: PDF viewers and generators (react-pdf; one PDF-generation API, listed twice; canvas-design; a page-capture skill); 2 more matched "tables" as database tables | No format outside A2A says what a capability *accepts* and what it *produces* | Input and output media types (A2A `defaultInputModes` and `defaultOutputModes`; schema 0.1 `interfaces[].inputs` and `outputs`) |
| N1 | 6: pdf-parse ("run directly in your browser"); four agent cards (three for browser-based sites, one using "e2e" in another sense); a plugin that "opens your browser for OAuth" | "browser" mentioned in another sense | Structured abilities (A2A skills, MCP tools) rather than free text |
| N3 | Of 19 results, 8 were not useful and 1 undetermined; of the 10 useful ones, 9 search a single site or a closed corpus, and only 1 searches the web | "search" is generic: domain, vector, site, and web search look alike | Structured abilities that state scope ("search the web" versus "search this site") |

**Two further observations:**
- **Duplicates fill the results list.** N1's 9 relevant capabilities came back as 14 entries.
  Grouping publications of one capability (J2) is what turns entries into a list of capabilities.
- **Documentation text is a mixed blessing.** V1 recovered langchain-tavily, but N2's precision
  fell from 36% to 19%, and N1's from 71% to 52%. Documentation is a source for *drafting*
  abilities with confirmation, not a substitute for them in the index [Inference].

### 7.3 J2: the same capability across sources

**Method.** Seven groups of entries were judged to be the same capability, with the evidence for
each [judgments.yaml]. Judgment criterion: the same software or service from the same
maintainer, differing only in packaging, channel, or hosting. A wrapper that adds nothing but
configuration counts as the same capability; a fork or a rewrite does not. Rules that use only
metadata were then scored on every pair of capability records.

[Measured R§6]

| Rule | Correct pairs | False pairs | Missed pairs (of 14) |
|---|---|---|---|
| Declared links only (packages in `server.json`; `mcpName` and `mcp-name` back-links; container images; shared hosted endpoints; the npm package a plugin runs) | 11 | 0 | 3 |
| Same repository and same path only | 7 | 0 | 7 |
| **Declared links + same repository and path** | **14** | **0** | **0** |
| Same native name only (negative control) | 4 | 2 | 10 |

**What made it work.** The MCP Registry requires every package to prove ownership through a
back-link: `mcpName` in package.json, an `mcp-name:` marker in a PyPI or Cargo README, or an OCI
label [External E9]. A consumer that follows declared links can therefore group publications
without guessing. Repository identity needs both the repository and the path, because of
monorepos (`pulsemcp/mcp-servers`, `anthropics/skills`, the plugin marketplace).

**Name matching fails.** Its two false pairs are different capabilities: the two `webapp-testing`
skills (§9.2, case 3), and the third-party `@fre4x/github` server paired with GitHub's plugin. It
also missed 10 of the 14 true pairs, because publications of one capability have different native
names (`io.github.microsoft/playwright-mcp`, `@playwright/mcp`, `playwright`).

**Derivatives** are recorded only partly, and in different places [Measured R§6; Observed]:

| Kind | Example | Where it is recorded |
|---|---|---|
| Fork, recorded by the forge | Registry `io.github.dinesh-nalla-se/playwright-mcp` (same description as Microsoft's entry, its own npm package and image); `io.github.Seey215/tavily-mcp`; `io.github.triuzzi/brave-mcp`, a fork of Chrome DevTools MCP despite its name | The GitHub fork flag only |
| Fork, claimed in prose only | `agentic-playwright-mcp`: "an independent fork of Playwright MCP. It is not a Microsoft package." | README and description; GitHub does not record a fork |
| Republication by a host | `ai.smithery/brave` declares Brave's own repository, under Smithery's namespace | Shared repository URL |
| Wrapper | The `playwright` and `github` plugins contain only MCP configuration for the vendor's server | `.mcp.json` |
| Replacement | Browserbase's archived server points to its hosted service | README only |
| Same name and description, different capability | The two `webapp-testing` skills | Nowhere |

**What schema 0.1 could represent on 2026-10-22.** One `source` per manifest [Project:
`docs/manifest-spec.md` §4]. The four multi-publication capabilities in this sample would need
either one manifest per publication, with nothing to link them, or one manifest that drops all but
one publication. It had no field for fork, wrapper, replacement, or "same as" relations
[Inference]. The revision of 2026-10-23 adds `publications[]` and `relations[]`; through them the
validator links all 14 pairs (§16.2).

### 7.4 J3: compare candidates and decide

For each need, the relevant capabilities were compared on the twelve decision questions. The
facts of all publications of a capability were merged, keeping each fact's provenance
[Measured R§7].

**Blockers** (reuse cannot be justified from metadata alone):

| Need | Capability | Blocker |
|---|---|---|
| N1 | Browserbase MCP server | Archived ("This repository is archived and no longer maintained" [Observed: README]), yet listed in the Docker catalog |
| N1 | anthropics `webapp-testing` | Terms only by file reference ("Complete terms in LICENSE.txt"); the file is Apache-2.0, so a license-detection step would resolve it |
| N1 | devloop | No license in the registry entry; this background record has no repository snapshot |
| N4 | anthropics `pdf` skill | Proprietary: "© 2025 Anthropic, PBC. All rights reserved." [Observed: LICENSE.txt]. This is the most discoverable PDF capability in the sample, and it cannot be reused under open terms |

The other twelve of the 16 relevant capabilities have no blocker from metadata. **Every capability has
gaps**:
- **Limitations** are stated for none.
- **Setup** is not stated for 11 of 16. For several (Playwright, cdp-toolkit, pdf-parse, docling)
  probably none is needed, but nothing can say so.
- **No stated maintainer** for 3: Browserbase and DuckDuckGo are listed only by the Docker catalog,
  whose maintainer is a heuristic, and langchain-tavily's PyPI metadata names none.
- **Versions disagree across publications** for 2:
  - Microsoft's Playwright server is 0.0.82 in the registry, 0.0.83 on npm, a commit pin in the
    Docker catalog, and whatever `@latest` resolves to in the plugin.
  - GitHub's server is 2.0.3 in the registry and a commit pin in the Docker catalog.

**Merging publications helps somewhat.** For 3 of the 4 multi-publication capabilities, the merged
record answers one more question than the best single publication. In each case the registry or
catalog entry supplies the setup (environment variables, or the API-key header of a hosted
endpoint), and the package or plugin supplies the dependencies. The main value of linking
publications is deduplication (J1) and finding conflicts, not more facts [Measured R§7; Inference].

### 7.5 J4: enough information, and what to ask

Completeness levels reached by each record from its own metadata [Measured R§8]:

| Level | Facts required | Records (of 60) |
|---|---|---|
| Discoverable | what, kind, interface | 58 |
| Assessable | also where it runs, terms, version, maintenance, publisher | 34 |
| Assessable without heuristics | as above, every fact stated natively, by a linked source, or by a documented convention of the source | 17 |
| Adoptable (proposed, §11.3) | also setup (including "none"), maintainer contact, limitations (including "none known") | 0, because no record states limitations |
| Governed | also an assessment reference | 0 |

| Question | Native | Linked | Derived by convention | Derived by heuristic (to confirm) | Unknown (to ask) |
|---|---|---|---|---|---|
| what | 58 | 0 | 0 | 0 | 2 |
| kind | 0 | 0 | 47 | 13 | 0 |
| interface | 14 | 0 | 27 | 19 | 0 |
| where it runs | 36 | 0 | 24 | 0 | 0 |
| setup | 13 | 0 | 0 | 0 | 47 |
| dependencies | 24 | 0 | 0 | 0 | 36 |
| limitations | 0 | 0 | 0 | 0 | 60 |
| terms | 24 | 26 | 0 | 0 | 10 |
| version | 38 | 1 | 8 | 0 | 13 |
| maintenance | 33 | 23 | 0 | 0 | 4 |
| who | 25 | 0 | 34 | 0 | 1 |
| risk | | | | | 60 (governance) |

**Patterns by format.** No Agent Skill reaches "assessable", because the format has no version
field. npm packages reach it 13 times out of 14, but never without heuristics, because only
`mcpName` says that a package is an MCP server. These per-format patterns are the kind of
evidence Spike 2's field dictionary needs [Measured R§8].

### 7.6 Schema 0.1 validity versus journey outcomes

Each record was drafted into a schema-0.1 manifest by one mechanical mapping
(`draftManifest` in [analyze.js](../research/spikes-1-3/analyze.js)) and validated with the POC's
validator [Measured R§9]. The schema is the 0.1 draft of 2026-10-22, kept as
`research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json`; §16 repeats the test on
the revised schema.

| | Assessable from metadata | Not assessable |
|---|---|---|
| **Valid against schema 0.1** | 5 | 7 |
| **Invalid** | 29 | 19 |

| Error | Drafts | Reading |
|---|---|---|
| `MISSING_REQUIRED_FIELD /lifecycleStatus` | 45 | Only the MCP Registry, PyPI, and archived repositories supply lifecycle |
| `CONDITIONAL_FIELD_REQUIRED /capabilityVersion` | 10 | Registry-like sources without a SemVer version (Docker commit pins, unversioned plugins). Mapping the catalog and the marketplace as registries is this mapping's choice |
| `MISSING_REQUIRED_FIELD /lastUpdated` | 4 | Plugins in a shared repository have no capability-specific date |
| `INVALID_FORMAT /id` | 3 | The 2026-10-22 id pattern requires every segment to start with a letter, so registry-verified namespaces such as `io.github.0xmortuex` are rejected (the revision accepts them, §16) |
| `MISSING_REQUIRED_FIELD /owner/contact` | 3 | No repository, homepage, or bug tracker |
| Description too short or missing | 4 | "GitHub MCP server" (17 characters) is below the 20-character minimum; two Docker entries have no description |
| `CONDITIONAL_FIELD_REQUIRED /deprecation` | 1 | Archived, with no reason recorded anywhere |

What this shows [Inference]:
- **Validity is not usefulness.** The `@playwright/mcp` package, pdf-parse, docling, and
  claude-code-action are all invalid, yet assessable. Seven valid drafts cannot be assessed: for
  example, registry entries whose license can only be found by following the repository link,
  for which the 2026-10-22 draft has no field.
- **The mandatory set, not the data, makes most drafts invalid.** As in iteration 1 (8 of 12
  drafts failed only on `lifecycleStatus`), one mandatory field that sources do not supply decides
  validity for most real capabilities.

### 7.7 A2A Agent Cards in practice

There is no registry of A2A agents to sample from, and "the current A2A specification does not
prescribe a standard API for curated registries" [External E13]. Public `agent-card.json` files
were sampled instead: 36 JSON files among the first 50 of 2,600 indexed [Measured R§4].

| Check | Cards (of 36) |
|---|---|
| Valid against the A2A v0.3.0 JSON Schema | 4 |
| Have every field that A2A v1.0.1 marks REQUIRED in `a2a.proto` | 4 |
| Declare a protocol version | 11 |
| Declare 1.x but use the pre-1.0 layout (no `supportedInterfaces`) | 3 |
| Name a provider | 15 |
| List skills | 21 |
| Point at `http://` or `localhost` | 2 |

**Conformance proves little.** The Aptos Explorer card is valid under both versions, yet it states
that "this host does not expose an A2A JSON-RPC task endpoint" [Observed]. Many files under the
name follow unrelated layouts: SDK examples, website "agent cards", and a 97 KB card for an MCP
server. Validating a native card must be done per declared version, and even then it shows
shape, not a working agent [Inference].

The v1.0 JSON Schema that A2A publishes is a non-normative artifact generated from the
protocol-buffer definition [External E11]. The schema retrieved here has no `required` lists, so
v1.0.1 conformance was checked against the fields that `a2a.proto` marks REQUIRED.

### 7.8 What could not be tested

| Scenario | Why not | What would test it |
|---|---|---|
| Internal capabilities, catalogues, and journeys | Not reachable from the working environment | Pilot iteration 2 with Missions 1 and 2 |
| Tool-level metadata from running MCP servers | Running third-party code was out of scope | Installing a few servers in a sandbox; MCP `tools/list` |
| AI Catalog documents and MCP Server Cards in the wild | None observed in the sample; both are recent | Watch adoption; project the sample into an AI Catalog document (§13, experiment E3) |
| Consumers' handling of schema evolution | No real consumer integrated | An integration with Mission 1 or 2 |
| Relevance judged by several people | One judge | A second judge on the same pool; agreement statistics |
| Curation effort for owner-input facts | No owners were available | Ask three to five owners to complete the "adoptable" facts, and time it |

---

## 8. Findings from standards and ecosystem research

### 8.1 Comparison table (Spike 1 deliverable)

Statuses and versions were checked against the official sources on 2026-10-22 (§15).
"In the sample" says how much real metadata of that kind was examined.

| Standard, version, status | Purpose | Metadata it covers | Validation and versioning support | Metadata or runtime | In the sample | Relevance to Mission 4, from the evidence |
|---|---|---|---|---|---|---|
| **Agent Skills** (agentskills.io) [E1] | Packaging instructions, scripts, and resources as a skill | `name` (lowercase, at most 64 characters, matching the folder), `description` (at most 1024), `license`, `compatibility`, `metadata` (string map), `allowed-tools` (experimental) | `skills-ref validate`; no version field (the spec's example puts `version` in `metadata`) | Metadata (a file format) | 11 skills from three publishers | The native contract for skills. Cross-format concepts are name, description, and license. Version, lifecycle, maintainer, and terms beyond a file pointer are missing |
| **MCP** 2026-07-28, current [E2-E4] | Runtime protocol between AI applications and servers | `server/discover`: supported versions, capabilities, `serverInfo` (name, version), instructions; tools, resources, prompts listed at runtime | Date-based protocol versions ("the last date backwards incompatible changes were made"); a feature lifecycle (Active, Deprecated, Removed) with a deprecation window of at least twelve months (ninety days under an expedited-removal exception) | Runtime | Not run | Reference it; do not copy it. `serverInfo` "is self-reported... SHOULD NOT rely on it for security decisions" [E4]. The deprecation window is a precedent for schema deprecation (Spike 3) |
| **MCP Registry `server.json`**, dated schemas 2025-07-09 to 2025-12-11, plus a draft; the registry is "currently in preview" [E6-E10] | Registry entry for an MCP server | `name` (reverse-DNS; the namespace is verified by GitHub sign-in for `io.github.*`, or by a DNS or HTTP check of the domain), `title`, `description`, `version` (unique and immutable per publication), `repository` (url, source, `subfolder`, and the forge's `id`, which "should remain stable across repository renames and may be used to detect repository resurrection attacks"), `websiteUrl`, `packages[]` (registry type, identifier, version, transport, environment variables with `isSecret` and `isRequired`), `remotes[]`, `icons`, `_meta`. The registry adds `status` (active, deprecated, deleted), `statusMessage`, and dates. No license, keywords, or support contact | JSON Schema, plus registry checks: namespace authentication, package-ownership back-links, allowed package registries. SemVer recommended, any string allowed, ranges prohibited | Metadata | 14 entries using four schema versions; 24 more examined in three registry families | The closest native match to the identity and publication part of the manifest. Reuse its namespace verification and back-links as evidence of who published what |
| **MCP Server Cards** (SEP-2127, Final, Extensions Track) [E5] | Static, pre-connection discovery of *remote* MCP servers | Identity (name, version, description, title, icons, repository, websiteUrl), remote endpoints, supported protocol versions, `_meta` | Extension versioning ("breaking changes require a new extension identifier"); clients should prefer live `server/discover` values | Metadata for runtime connection | None observed | Reference it for remote endpoints. Its rationale for leaving out tools ("a static document cannot reliably represent this surface") applies to the manifest too |
| **A2A Agent Card** v1.0.1 (v1.0.0 released 2026-03-12) [E11-E14] | Self-description of an agent server | `name`, `description`, `supportedInterfaces[]` (url, binding, protocol version), `provider`, `version`, `documentationUrl`, `capabilities`, `securitySchemes`, default input and output modes, `skills[]` (id, name, description, tags, examples, modes), `signatures`. No id, license, or lifecycle | Protocol buffers are canonical; the JSON artifact is non-normative. v1.0 broke v0.3 (`url` replaced by `supportedInterfaces`, `protocolVersion` moved, enumeration values renamed); served at `/.well-known/agent-card.json` | Metadata served by the runtime | 36 public cards (§7.7) | The native contract for agents. Reuse `skills[]` as structured abilities and the modes as input and output types. Validate per declared version. No registry API exists |
| **AI Catalog**, Linux Foundation working repository, editor's draft (spec text last changed 2026-10-01) [E15-E17] | A typed, nestable container for discovering heterogeneous AI artifacts | Entry: `identifier` (open; `urn:air:{publisher}:{namespace}:{name}` recommended), `type` (a media type), `url` or `data`, `displayName`, `description`, `tags`, `version`, `updatedAt`, `publisher`, `trustManifest` (identity, attestations, provenance; `did:web`), `extensions`; nested catalogs; three conformance levels | `specVersion` "Major.Minor": minor versions add optional fields, consumers ignore unknown fields, and reject unknown major versions; an identifier is unique per (identifier, version) | Metadata (a discovery and trust envelope) | None observed | The strongest structural precedent for Mission 4. It references native artifacts instead of redefining them, keeps artifact identity apart from registry coordinates (ADR-0021), and defines conformance levels. It deliberately defers dependencies (ADR-0002) and has no license, lifecycle, setup, or limitations fields; its own plugin mapping lists `license` as "no direct core equivalent" |
| **JSON Schema** 2020-12, current [E19] | Validating JSON data | Structure, types, allowed values, conditional rules | `format` is an annotation unless assertion is enabled [Project: F3] | Validation | Used by the POC, the MCP Registry, and the A2A artifact | Confirmed suitable for the validation contract. Cross-record rules (identity, relations) need code, as the POC's Stage 2 already does |
| **Semantic Versioning** 2.0.0 [E20] | Version precedence and compatibility | MAJOR.MINOR.PATCH with pre-release and build metadata; "Major version zero (0.y.z) is for initial development. Anything MAY change at any time." | Precedence rules | Versioning | 38 of 60 versions parse as SemVer; 15 of the 28 registry and npm versions are below 1.0.0 | Use it to compare versions when they parse; do not require it. Record the scheme |
| **npm `package.json`** | Package metadata | `name`, `version` (SemVer), `description`, `keywords`, `license` (SPDX), `repository`, `homepage`, `bugs`, `author`, `maintainers`, `engines`, `bin`, per-version `deprecated` [E23], `mcpName` | npm checks the format | Metadata | 14 packages | The main source of licenses (13 of 14). Package dependencies are not capability dependencies |
| **Python core metadata** 2.6 (May 2026) and version specifiers (PEP 440) [E22] | Package metadata | `Name`, `Version`, `Summary`, `Keywords`, `Classifier` (Development Status), `License-Expression` (SPDX), `Project-URL`, `Requires-Dist`, `Requires-Python` | PEP 440 versions, which are not SemVer | Metadata | 5 packages | A source for licenses and runtimes. Development Status mixes maturity and lifecycle |
| **Claude Code plugin manifest and marketplace** [E18] | Plugin packaging and distribution | `name` (the only required field), `displayName`, `version` ("not checked against semver"), `description`, `author`, `homepage`, `repository`, `license` (SPDX), `keywords`, `dependencies` (plugins), component paths (skills, commands, agents, hooks, MCP and LSP servers), `userConfig`. The marketplace adds `owner`, `source`, `category`, `strict`, `renames` | `claude plugin validate` | Metadata | 7 plugins | A source for bundles, wrappers, and plugin dependencies. Identity is scoped to the marketplace (`name@marketplace`) |
| **Docker MCP catalog `server.yaml`** [E26] | Curated catalog of MCP servers as containers | `name`, `image`, `type`, `meta` (category, tags), `about` (title, icon; description optional), `source` (project, commit), `config` (secrets, environment, parameters), `oauth`, `run.allowHosts`; `tools.json` generated by running the server | Catalog CI; Docker-built images "include cryptographic signatures, provenance tracking, SBOMs" | Metadata | 8 entries | A source for setup, runtime, and trust signals. Lifecycle and license live outside the entry |
| **GitHub Actions `action.yml`** [E25] | Workflow step metadata | `name`, `description`, `runs` (required), `author`, `inputs`, `outputs`, `branding` | Versions are git references (a commit SHA is safest; major tags float) | Metadata | 1 action | A source for setup (inputs) and runtime. No version or license field |
| **OASF** v1.1.0 (AGNTCY) [E28] | Records describing agentic applications | `name`, `version`, `schema_version`, `description`, `authors`, `created_at`, `skills` (taxonomy, required), `domains`, `locators`, `modules` | Versioned schema; taxonomy identifiers | Metadata | Not a native format of the sampled ecosystems | A candidate vocabulary for structured abilities, not a source |
| **Package URL** (ECMA-427, 1st edition December 2025) [E21] | Identifying a package across ecosystems | `pkg:type/namespace/name@version?qualifiers#subpath` | A standard syntax; adopted in CycloneDX and SPDX SBOMs and in OSV | Identification | (applied to locators) | A normalized syntax for package publications, including a subpath for monorepos. It identifies packages, not capabilities |
| **Backstage descriptor format** [E27] | Internal software catalogue entities | `kind`, `metadata.namespace` and `name` (unique per kind and namespace, case-insensitive), `owner` (display only), `lifecycle` (open set: experimental, production, deprecated), relations (`dependsOn`, `subcomponentOf`, `providesApis`); `metadata.uid` "not to be seen as stable" | Validation rules for names and references | Metadata | Not sampled (internal) | The likely shape of internal catalogue entries in iteration 2. Precedent for case-insensitive uniqueness and typed relations |

### 8.2 What existing formats already solve

- **Publishing and verifying who published what.** The MCP Registry verifies namespaces and
  package ownership [E7, E9]. npm and the forge own scopes and repositories; the AI Catalog defines
  `did:web` publisher identity [E15].
- **Describing protocol interfaces.** MCP, Server Cards, and A2A cards cover transports, endpoints,
  authentication, and (for A2A) abilities and media types.
- **Versioning releases.** Every package registry versions its artifacts; the MCP Registry makes
  each publication immutable [E8].
- **Licensing.** npm and PyPI carry SPDX expressions; the forge detects repository licenses.
- **Discovery envelopes.** The AI Catalog lists heterogeneous artifacts by media type, with trust
  metadata.

### 8.3 What can be reused without transformation

These can be referenced, or copied as they are, with their provenance: native names; descriptions;
SPDX license expressions; native version strings (with their scheme); package identifiers
(normalized as purls); repository URLs with the forge's repository id; registry status; A2A media
types; environment variables marked `isSecret`; documentation URLs [Inference, from §5].

### 8.4 What needs normalization

Display name versus machine name; publisher versus listing operator versus maintainer;
transports and bindings; the meaning of each date; license forms (text and file pointers to SPDX
where detection is possible); lifecycle vocabularies (§10.3); version schemes; locator syntaxes
(§5.2).

### 8.5 Gaps that genuinely require a common manifest

Mission 4 should own only what no existing format or envelope provides [Inference]:

1. A record that groups **all publications of one capability**, with relations to forks,
   wrappers, replacements, and services.
2. **Cross-format reuse facts with provenance**: license with its scope, lifecycle signals,
   setup (including "none"), limitations, input and output types.
3. **Explicit value states**: unknown, declared none, conflicting, unverified.
4. **Completeness levels** tied to the journeys.
5. The **link to governance** (Mission 3's assessment), with the rule that unassessed is never
   low [Charter §6].

Everything else should be referenced, not restated. The AI Catalog's "authoritative source" rule
(omit a value that the referenced artifact carries, to avoid drift [E15]) is the right precedent:
this sample shows that drift happens, with three versions of one capability at once.

### 8.6 Metadata concerns versus runtime protocol concerns

| Concern | Belongs to | Evidence |
|---|---|---|
| Which tools a server exposes, their schemas, annotations | Runtime (MCP `tools/list`) | Tools "can vary by authenticated user, session, configuration" [E5]; the Docker catalog lists tools only by running servers [E26] |
| Protocol version negotiation and capabilities | Runtime (`server/discover`, Agent Card interfaces) | [E3, E4, E11] |
| Where to connect, how to authenticate | Native metadata for connection (Server Card, Agent Card, `server.json` remotes) | [E5, E6, E11] |
| Identity, publications, relations | Metadata (the manifest and catalog) | §7.3 |
| Terms, lifecycle, setup, limitations, abilities | Metadata (the manifest), mostly curated | §7.5 |
| Trust attestations and signatures | Metadata envelope (AI Catalog Trust Manifest, Agent Card signatures, Docker image signing) | [E15, E11, E26] |
| Risk assessment | Governance (Mission 3), referenced | [Charter §6] |

### 8.7 Reuse, adapt, or define

[Recommendation, for Spike 1 to confirm]

| Standard | Recommendation |
|---|---|
| Agent Skills, MCP `server.json`, Server Cards, A2A Agent Card, Claude Code plugin, Docker catalog, action.yml, npm, PyPI | **Reference** as native contracts; maintain one crosswalk per format, versioned |
| JSON Schema 2020-12 | **Reuse** for the validation contract, with format assertion and the POC's YAML rules [Project: `docs/manifest-spec.md` §12] |
| SemVer 2.0.0 | **Reuse** to compare versions when they parse; record the scheme; do not require it |
| Package URL | **Adopt** for package publication locators |
| AI Catalog | **Align**: make the manifest projectable into a catalog entry; reuse its identifier and projection rules; take part in, or track, the draft; do not define a competing envelope |
| OASF taxonomy | **Evaluate** as a vocabulary for abilities with Mission 2; do not require it |
| Common manifest | **Define** only the gaps in §8.5 |

---

## 9. Capability definition and granularity findings

### 9.1 What makes a separately discoverable and reusable capability

The charter defines a capability as "an independently adoptable AI-related asset, tool, service,
or solution that can be described and managed as a distinct unit" [Charter §2]. The sample shows
what "independently adoptable" means in practice. Three tests decide most cases [Inference]:

1. **Adoption.** Can a consumer adopt it on its own, through a package, an endpoint, an install
   command, or a file? If not, it is a component.
2. **Software.** Does adopting it give different functions from other entries? If it gives the
   same functions, it is a publication of the same capability; wrappers that add only
   configuration count as the same.
3. **Accountability.** Does it have its own maintainer and terms? A fork or a copy with its own
   maintainer is a separate capability, related to its origin.

### 9.2 Boundary cases from the sample

| # | Case | Evidence | Proposed treatment [Recommendation] |
|---|---|---|---|
| 1 | A plugin that only configures someone else's server (`playwright`, `github`) | `.mcp.json` only; author "Microsoft" or "GitHub", listed by Anthropic | The same capability: a publication of type "marketplace" with a `wraps` relation, not a new capability |
| 2 | A plugin that bundles skills and two remote MCP servers (`forge-skills`) | `plugin.json` declares `skills` and `mcpServers` [Observed: N3-28] | A bundle. The hosted MCP servers are independently adoptable, so they are separate capabilities linked as components; the skills are embedded unless published elsewhere |
| 3 | Two skills with the same name and description (`webapp-testing`) | Different body, runtime, files, and license (§7.3) | Two capabilities. A `derivedFrom` relation only if provenance is known |
| 4 | A library that is also an MCP server and a hosted service (browser-use) | The registry entry declares the PyPI package and a hosted endpoint | One capability with three publications. The hosted service has its own setup (an API key) and is recorded as a publication of kind "endpoint" |
| 5 | A client of a third-party service (langchain-tavily) | Needs `TAVILY_API_KEY` (README) | Its own capability, with a `clientOf` relation to the service. The service may be a capability in its own right |
| 6 | A workflow that embeds an agent (claude-code-action) | `action.yml` with 39 inputs; runs Claude in GitHub Actions | A capability of type workflow. Its dependency on a model provider is a service dependency |
| 7 | An archived server replaced by a hosted service (Browserbase) | README only | Two capabilities with a `replacedBy` relation; the archived one is deprecated with a reason |
| 8 | A fork republished under another namespace (`dinesh-nalla-se/playwright-mcp`) | GitHub fork; same description as the original | A separate capability with a `forkOf` relation |
| 9 | One repository holding many capabilities (anthropics/skills, the plugin marketplace, `pulsemcp/mcp-servers`) | Paths differ; repository-wide license and push dates do not describe one capability | Each path is a capability. Repository-wide facts are recorded as such (§5.1) |
| 10 | An A2A agent with several skills | `skills[]` in the card | One capability; A2A skills are abilities, not capabilities |
| 11 | Repository tiers (`openai/skills` `.system`, `.curated`, `.experimental`) | README defines the tiers; the repository is deprecated in favour of openai/plugins | Tiers are lifecycle or maturity signals of the listing, not separate capabilities |

### 9.3 Do different capability types need different metadata?

The core is the same for every type. What differs is concentrated in four concepts (interface,
runtime, setup, dependencies), each of which the native contract details (§6.4). This supports a
single common core with conditional rules per interface (as schema 0.1 already has for `mcp_server`
[Project: `docs/manifest-spec.md` §4]), and does not support separate requirement profiles per type
[Inference]. Conditional rules that the evidence supports:

| When | Then | Evidence |
|---|---|---|
| A publication is a package | It carries a package locator and a native version | npm, PyPI, `server.json` packages |
| A publication is a hosted endpoint | It carries an endpoint URL and its authentication | Remote registry entries; plugins with a `url` |
| The interface is MCP or A2A | It references the native contract (`server.json`, Server Card, Agent Card) | [E5, E6, E11] |
| The capability wraps or bundles others | It lists the relations | §9.2 cases 1-2 |

### 9.4 Representing missing, unknown, and unverified information

No sampled format distinguishes these states. Setup and dependencies are simply absent, whether
the capability needs none or the publisher did not say [Measured R§3]. The proposal, a
[Recommendation] for Spike 2:

| State | Meaning | Example from the sample |
|---|---|---|
| stated | The record's own metadata says so | npm `license: Apache-2.0` |
| linked | A source the record declares says so | The forge's license for a registry entry |
| derived (convention) | A rule the source documents yields it | A SKILL.md is a skill; a registry namespace is a verified publisher |
| derived (heuristic) | Inferred from wording or context; confirm before relying on it | Keywords mention MCP |
| declared none | The owner states there is none | Not expressible in any sampled format |
| unknown | Nothing says | Setup for 47 of 60 |
| not applicable | The concept does not apply | A version for a hosted endpoint that has none |
| conflicting | Sources disagree | 0.0.82 versus 0.0.83 |
| unverified | Claimed, not checked | "Fork of official Playwright MCP" |

Schema 0.1's rules (omit for "not provided", `[]` for "declared none", no `null` [Project: D5])
remain sound for a single source. The evidence adds provenance per value and the "conflicting" and
"unverified" states, which arise only when several sources describe one capability.

### 9.5 Unresolved questions for Spike 2

- Is a pure wrapper (case 1) a publication or a capability? The evidence favours a publication,
  but Mission 2's inventory may need to count it [Open].
- Where does a bundle's own identity end and its components' begin, when a plugin's skills are
  not published anywhere else (case 2) [Open]?
- Should hosted services that capabilities depend on (Tavily, a model provider) be capabilities
  in the inventory [Open, with Mission 2]?

---

## 10. Identifier, lifecycle, and versioning findings

### 10.1 Scenario analysis on real cases

Every scenario the charter and Spike 3 name occurs in the sample [Measured R§6; Observed].

| Scenario | Real case | What happens to identity |
|---|---|---|
| Several capabilities in one repository | anthropics/skills (20 SKILL.md files); the plugin marketplace (315 plugins); `pulsemcp/mcp-servers` | Only the repository and the path together identify a capability. Repository-wide facts (license, push date) mislead |
| Repository renamed or moved | `anthropics/claude-plugins-public` renamed `anthropics/claude-plugins-official`: the stored homepage URL is stale, still redirected by HTTP 301, and the repository id (1100776768) is unchanged. MCP reference servers moved to `modelcontextprotocol/servers-archived`, while the Docker catalog still builds them from the old repository | URLs go stale; the forge's numeric id survives. GitHub redirects web and git traffic, but "will not redirect calls to an action hosted by a renamed repository", and redirects stop if the old name is reused [E24]. The MCP Registry records the forge id for this reason: it detects a repository deleted and recreated under the same name [E6] |
| A whole repository deprecated in favour of another | openai/skills: "This repository is deprecated", pointing to openai/plugins, which uses another manifest format and does not carry the same skills one to one | Capability continuity is not guaranteed across a move |
| External capability without accessible source | Remote-only registry entries (a market-entry site search, a stack generator, an OCR service run through Apify); GitHub's hosted endpoint `api.githubcopilot.com/mcp/`; 5 of the 49 GitHub repository references checked return HTTP 404 | A provider endpoint is the only locator; a missing source cannot be told apart from a private one |
| Bundle with independently adoptable components | `forge-skills` (skills plus two hosted MCP servers) | Components need their own identities and a link to the bundle |
| Several source references for one capability | Microsoft's Playwright server: a registry name, an npm package, a Docker image built from the repository, a plugin. Four names, three versions | One capability, several publications |
| Capability updates and schema evolution | 436 published versions of `@playwright/mcp`; four `server.json` schema versions in use at once; A2A 0.3 to 1.0 broke the card layout | Consumers must route by schema version (as the POC does) and record each publication's version |
| Duplicate or conflicting entries | Docker lists both `github` ("GitHub (Archived)") and `github-official`; the registry lists forks and hosted republications next to vendor entries; two publishers' skills are both named `pdf`, with proprietary and Apache-2.0 licenses | Identity cannot rest on names; it must rest on declared links, repository and path, and relations |

### 10.2 Identifier approaches compared

| Approach | Monorepo | Rename or move | No source | Several publications | Name collisions | Real-world names | Main risk |
|---|---|---|---|---|---|---|---|
| Native name as id (`io.github.microsoft/playwright-mcp`) | Yes (registry names are per server) | Survives a repository move, not a namespace change | Yes | No: each channel has its own name | Avoided within one registry only | Uppercase and digits occur | Ties identity to one channel |
| Readable namespaced id (POC D8: `<namespace>/<name>`) | Yes | Yes (assigned once) | Yes | Yes, if publications are listed | Avoided if namespaces are allocated | The pattern rejects digit-first segments (3 drafts) | Namespace allocation; temptation to rename |
| URN (`urn:air:{publisher}:{namespace}:{name}`, AI Catalog) [E15] | Yes | Yes | Yes | Yes | Avoided by publisher domains | Requires a domain | Needs the publisher's authorization; projection rules |
| Opaque catalog-assigned id (a UUID or URI, as AI Catalog operators may assign) [E16 ADR-0021] | Yes | Yes | Yes | Yes | Avoided | Any | Unreadable; two catalogs may assign different ids to one artifact |
| Forge repository id | No (repository-level) | Yes: stable across renames, and changes if a repository is deleted and recreated under the same name [E6] | No | No | n/a | n/a | Not a capability id; strong evidence for linking and for detecting a reused name |
| Package URL for publications [E21] | Yes (with subpath) | No (contains the name) | No | One per publication | n/a | Normalizes case per type | Identifies packages, not capabilities |
| Content hash | No | Yes | Yes | No | Separates copies | n/a | Changes with every edit |

Implications for Spike 3 [Inference]:
- **Separate three things**: the capability's identifier, its publications (native names and
  locators, normalized as purls where possible), and its relations.
- **The identifier is assigned, not derived.** Every derivation from a mutable name (a repository
  URL, a display name, a package name) failed in at least one real case above.
- **The readable-versus-URN choice can stay provisional.** With publications carried
  separately, it affects allocation and stability, not discovery or linking. The AI Catalog's
  `urn:air` and projection rules [E15] are the strongest external precedent, and should be
  evaluated before Mission 4 publishes its own format.
- **Whatever the format:** case-insensitive uniqueness (as Backstage does [E27]); segments may
  start with a digit; and a migration mechanism for changed primary ids (which the AI Catalog
  also leaves undefined [E15]).

### 10.3 Lifecycle evidence

| Source | Vocabulary | Machine-readable? | Successor recorded? |
|---|---|---|---|
| MCP Registry | `active`, `deprecated`, `deleted`, with `statusMessage` [E10] | Yes | In the message only |
| npm | `deprecated` message, per version or range [E23] | Yes, as text | No: the archived reference servers say "Package no longer supported. Contact Support..." [Observed] |
| PyPI | Development Status classifiers (in the sample: Alpha, Beta, Production/Stable), which mix maturity with lifecycle [E22]; a `yanked` flag per release in the JSON API [Observed] | Yes | No |
| GitHub | `archived` flag | Yes | No |
| Docker catalog | "(Archived)" in titles | No (text) | No |
| Agent Skills | None; one repository uses folder tiers, one a README notice | No | In prose |
| Claude Code marketplace | `renames` map (10 entries) | Yes, for renames | Rename target only |
| A2A | None | n/a | n/a |
| Backstage | `lifecycle`: an open set (experimental, production, deprecated) [E27] | Yes | No |
| MCP specification (protocol features) | Active, Deprecated, Removed; at least twelve months deprecated before removal [E3] | Yes | Migration path documented |

What this implies [Inference]:
- **Lifecycle should be recorded as observed signals with provenance**: registry status, a
  deprecation message, an archived repository. An owner's declared status is one more signal,
  not a precondition for registration.
- **"Active" never means "approved"** [Charter §6], and in the registry it does not even mean
  "maintained".
- **A `replacedBy` relation is needed.** No source records successors in machine-readable form.
- **The POC's transition table [Project: D9] governs owner declarations only.** Observed signals
  can change at any time, in any direction, because a source changed. The table needs Mission 3's
  confirmation, as already noted [Project: D21].

### 10.4 Versioning evidence

| Observation | Evidence |
|---|---|
| Version schemes vary | SemVer (38 records); PEP 440 (PyPI, compatible here); commit pins (8); git tags with a floating major (1); none (13: all 11 skills and two plugins); dates in A2A cards ("2026-09-25", "2026.07.01") [Measured] |
| Pre-1.0 versions are common | 15 of the 28 registry and npm versions are 0.x, including `@playwright/mcp` 0.0.83, for which SemVer promises nothing about compatibility [E20] |
| Versions are per publication, and drift | 0.0.82 in the registry versus 0.0.83 on npm for one capability; the registry advises aligning them, and using pre-release suffixes for metadata-only republication [E8] |
| Floating references hide the version | The plugin runs `@playwright/mcp@latest`; a GitHub Action published both `v1` and `v1.0.258` |
| Registry versions are immutable | "Once published, the version string (and other metadata) cannot be changed" [E8] |
| Schema-versioning precedents agree with the POC | MCP dates protocol revisions; A2A uses SemVer majors; `server.json` uses dated schemas; the AI Catalog uses Major.Minor with "ignore unknown fields" and "reject unknown majors" [E15], which matches the POC's rules [Project: D10] |

What this implies [Inference]:
- **For `capabilityVersion`**: record each publication's native version and its scheme; compare
  versions only when both parse; never require SemVer.
- **For `schemaVersion`**: the POC's rules (MAJOR.MINOR, immutable once published, tolerant reading
  of a newer MINOR, explicit rejection of an unsupported MAJOR) are corroborated by independent
  standards. The MCP specification's twelve-month window is a concrete precedent for the open
  question of the deprecation window [Project: Q15].

### 10.5 Compatibility guidelines the evidence supports

[Recommendation, for Spike 3 to confirm]
- A change to a capability's interface is breaking only if the native contract changes; the
  manifest cannot detect that alone [Project: F5]. Record the native contract's version, and leave
  compatibility of tools to the runtime.
- A change of publications (a new package, a moved repository, a new endpoint) is not a breaking
  change to the capability's identity.
- Consumers key on the capability id, never on a URL or a native name [Project:
  `docs/manifest-spec.md` §13]. The rename case shows why.

### 10.6 What to decide now, and what can wait

| Decide before publishing 0.1 | Can wait for evidence |
|---|---|
| Identity is separate from publications and relations | Readable namespaced id or URN; namespace allocation (with Missions 5 and 2) |
| The id pattern accepts verified real namespaces (digits; case-insensitive uniqueness) | Transition rules for owner-declared lifecycle (with Mission 3) |
| Versions are recorded per publication, with their scheme | The deprecation window for schema versions |
| Schema versioning follows the POC rules | Whether to adopt `urn:air` (AI Catalog not final) |

---

## 11. Proposed starter metadata model with evidence and rationale

**Status: a proposal for Spikes 2 and 3 to evaluate [Recommendation].** On 2026-10-23 it was
applied to schema 0.1 at the Mission 4 team's direction, in the form §16.1 describes, which
differs from this section in places; it remains a proposal. Field names here are illustrative.

### 11.1 Principles, each from evidence

1. **Reference native metadata; restate only what consumers need across formats.** Copies drift:
   one capability shows three versions [§7.4; Charter §8; E15].
2. **Separate identity, publications, and relations.** One capability had up to four
   publications; names collide; URLs go stale [§7.3, §10.1].
3. **Every value carries its provenance and its state.** The consumer must see stated, linked,
   inferred, and unknown facts [§7.5, §9.4].
4. **Require only what every source can supply; level the rest.** Requiredness follows
   availability and journey need [§7.6].
5. **Lifecycle is observed; governance is referenced.** No inferred risk; no approval field
   [Charter §6; §10.3].

### 11.2 Fields

The "Available" column counts the 60 capability records (N native, L linked, D derived)
[Measured R§3]. "Level" says where a field becomes required (§11.3).

| Field | Answers (journey) | Available | Main native sources | Supplied by | Level |
|---|---|---|---|---|---|
| `schemaVersion` | Which contract applies | n/a | | Mission 4 | Always |
| `id` | Is this the same capability? (J2) | No native capability ids | | Assigned by the catalog or the contribution workflow, under Mission 4's rules | Always |
| `name` | What is it called? (J1) | 60 N | `title`, `name`, `displayName`, `about.title` | Native | Discoverable |
| `description` | What does it do? (J1) | 58 N | `description`, `Summary` | Native; curated if absent | Discoverable |
| `publications[]`: kind, locator (purl or URL), native name, native version, verified by, observed at | Where do I get it? Same as? (J2, J3) | 60 (at least one each); 28 declare more | registry name, packages, remotes, `mcpName`, `mcp-name`, image, plugin source | Native and linked | Discoverable (at least one) |
| `capabilityType` | What kind is it? (J1) | 60 D (47 by convention) | the format | Derived; heuristic values confirmed | Discoverable |
| `interfaces[]`: protocol, transport or binding, contract reference | How is it used? (J3) | 14 N, 46 D | `packages[].transport`, `remotes`, `supportedInterfaces`, the format | Native and derived | Discoverable |
| `sourceRepository`: url, path, forge id | Same as? Survives renames? (J2) | 42 N, 12 D | `repository`, `Project-URL`, `source.project`, location | Native and linked | Recommended |
| `publisher`: name, verified by | Who publishes it? (J3, J4) | 7 N, 48 D | namespace, scope, forge owner, marketplace owner | Derived by convention | Assessable |
| `runtime` | Where does it run? (J3) | 36 N, 24 D | `registryType`, `remotes`, `engines`, `Requires-Python`, `image`, `runs.using` | Native and derived | Assessable |
| `license`: SPDX expression or text, scope (capability or repository) | May we use it? (J3) | 24 N, 26 L | `license`, `License-Expression`, forge detection, bundled file | Native and linked; owner if absent | Assessable |
| `version` (per publication): text, scheme | Which version is current? (J3) | 38 N, 9 L or D; none for skills | `version`, tags, commit | Native; "unversioned" stated explicitly | Assessable |
| `lifecycle`: observed signals (state, source, message, date), declared status | Is it maintained or replaced? (J3, J4) | 17 N, 2 D or L; plus 56 update dates | registry status, npm `deprecated`, classifiers, archived flag | Native and linked; owner declaration | Assessable (at least one signal or a recent change) |
| `documentation` | Where do I learn more? | 29 N, 27 D | `websiteUrl`, `homepage`, `Project-URL` | Native | Recommended |
| `keywords` | Does it match my terms? (J1) | 28 N | `keywords`, `tags`, `category` | Native | Optional |
| `maintainer`: name, contact | Who maintains it, and how do I reach them? (J3) | 25 N, 8 D | `author`, `maintainers` | Native; owner | Adoptable |
| `setup`: secrets, environment, accounts, or "none" | What does it need? (J3) | 13 N | `environmentVariables`, `config.secrets`, `inputs`, `userConfig`, `securitySchemes` | Native; owner | Adoptable |
| `limitations`, or "none known" | What can it not do? (J3) | 0 | none | Owner | Adoptable |
| `relations[]`: sameAs, forkOf, wraps, bundles or componentOf, replacedBy, clientOf, dependsOn | Forks, wrappers, replacements, dependencies (J2, J3) | Computed for 14 of 14 identity pairs; others in prose | declared links, the forge, `.mcp.json`, curation | Computed and curated | Optional |
| `abilities[]` (structured use cases) | Is it meant for my use case? (J1, J3) | 1 natively; 21 of 36 A2A cards | A2A `skills`, Docker `tools.json`, curation | Curated or derived with confirmation | Optional (curation target) |
| `inputs` and `outputs` (media types) | Does it read or produce this? (J1) | 0 outside A2A | A2A modes | Curated | Optional |
| `assessment`: state (`unassessed` by default), reference | Has it been assessed? (J4) | 0 | Mission 3 | Governance | Governed |
| `provenance` per value: method, source, observed at, confirmed by | Can I rely on it? (J4) | All values | the crosswalk | Computed | Always |
| `recordUpdated` | When did this record change? | n/a | | Computed | Always |

**Deliberately left out of the starter core**, with the reason for each:
- **Tool lists** belong to the runtime [E5].
- **Maturity, intended audience, and cost** are owned by Missions 1 and 2 as content. Iteration 1
  found none of them in 12 records [Project: pilot F12]. In this sample only PyPI classifiers
  touch two of them: Development Status and "Intended Audience :: Developers", in 3 of 5 packages
  [Observed]; nothing states cost. They stay optional in schema 0.1.
- **`techStack`**: no journey asked for it.
- **Risk values**: owned by Mission 3.

### 11.3 Completeness levels instead of a fixed mandatory set

| Level | Adds | Measured (of 60) | Owner or role |
|---|---|---|---|
| Discoverable | id, name, description, at least one publication, type, interface | 58 | Automatic from native metadata |
| Assessable | runtime, license, version (or "unversioned"), a lifecycle signal or recent change, publisher | 34 (17 without heuristics) | Automatic, with confirmation of heuristic values |
| Adoptable | setup (including "none"), maintainer contact, limitations (including "none known") | 0 | Capability owner, through Mission 5's workflow |
| Governed | assessment reference | 0 | Mission 3 and the designated governance owners |

The levels refine iteration 1's proposal (discoverable, adoptable, governed) [Project: pilot
§4] with an automatic "assessable" level. They parallel the AI Catalog's Minimal, Discoverable,
and Trusted levels [E15]. The validator would report the level reached instead of rejecting
records below it. This is the change the iteration-1 pilot flagged: it changes what "mandatory"
means in the validation contract [Project: Q3].

### 11.4 Worked example from real data

Microsoft's Playwright MCP server, as its four sampled publications describe it. All values are
from the snapshot; the shape is illustrative, not a schema.

```yaml
schemaVersion: "x.y"                         # illustrative
id: <assigned by the catalog>                # never derived from a name or URL
name: Playwright MCP                         # curated: the native names are "Playwright Tools for MCP", "@playwright/mcp", "Playwright"
description: "Browser automation and end-to-end testing MCP server by Microsoft. Enables Claude to interact with web pages, take screenshots, fill forms, click elements, and perform automated browser testing workflows."
  # provenance: native, plugin marketplace entry (the registry and npm say only "Playwright Tools for MCP")
capabilityType: mcp_server                   # derived, convention: server.json format
interfaces:
  - protocol: mcp
    transport: stdio                         # native: server.json packages[0].transport
    contractRef: io.github.microsoft/playwright-mcp   # the MCP Registry entry
publications:
  - kind: registry
    locator: io.github.microsoft/playwright-mcp
    nativeVersion: "0.0.82"                  # native; status active since 2026-09-18
    verifiedBy: registry namespace (GitHub account microsoft)
  - kind: package
    locator: pkg:npm/%40playwright/mcp
    nativeVersion: "0.0.83"                  # native; published 2026-09-28
    verifiedBy: mcpName back-link to the registry entry
  - kind: container
    locator: docker.io/mcp/playwright
    nativeVersion: commit 2d446f9e1b79       # convention: source.commit; image built and signed by Docker
  - kind: marketplace
    locator: playwright@claude-plugins-official
    nativeVersion: latest                    # runs npx @playwright/mcp@latest
    relation: wraps                          # configuration only
sourceRepository: { url: "https://github.com/microsoft/playwright-mcp", forgeId: 952688112 }
publisher: { name: microsoft, verifiedBy: MCP Registry namespace }
maintainer: { name: Microsoft Corporation }  # native: npm author; contact not stated
license: { expression: Apache-2.0, scope: capability }   # native (npm); the forge agrees
version: { conflicting: ["0.0.82 (registry)", "0.0.83 (npm)", "commit (Docker)", "latest (plugin)"] }
lifecycle:
  signals: [{ state: active, source: MCP Registry status, since: "2026-09-18" }]
runtime: [local process (Node.js >=18, npx), container image, Claude Code host]
setup: unknown                               # nothing states it, not even "none"
limitations: unknown
relations:
  - { type: forkedBy, target: agentic-playwright-mcp, evidence: README claim, verified: false }
  - { type: forkedBy, target: io.github.dinesh-nalla-se/playwright-mcp, evidence: GitHub fork flag }
assessment: { state: unassessed }
level: assessable                            # adoptable needs setup, contact, and limitations from the owner
```

### 11.5 What changes relative to schema 0.1

| | Schema 0.1 on 2026-10-22 [Project] | Proposal | Evidence |
|---|---|---|---|
| **Keep** | `schemaVersion` and its routing; `name`; `description`; `capabilityType`; `interfaces` with `contractRef`; `riskTier` and `assessmentReference` semantics (unassessed never low); `dependencies`, `components`, and `parent` by id; `deprecation.replacedBy`; `limitations`; the `x-` extension rule; the missing-data rules for single values | Keep, as fields of the starter model | §7, §9.4 |
| **Change** | A single `source` | `publications[]` plus `sourceRepository` (with the forge id) | §7.3 |
| | A mandatory `owner` with contact and affiliation | `publisher` (verified) and `maintainer`, with contact at the adoptable level | §7.4, §7.5 |
| | A mandatory `lifecycleStatus` | Observed lifecycle signals, plus an optional declared status, required at the assessable level | 45 of 60 drafts fail on it; §10.3 |
| | A mandatory `lastUpdated` with an ambiguous meaning | `recordUpdated` for the record, and dates per publication | Q24 [Project]; §6.3 |
| | `capabilityVersion` (SemVer only) | Native version and scheme per publication | §10.4 |
| | The id pattern | Allow segments that start with a digit; case-insensitive uniqueness; the format stays provisional | 3 drafts; §10.2 |
| | A fixed mandatory set | Completeness levels, reported by the validator | §7.6, §11.3 |
| **Add** | | `license` with its scope; `documentation`; `keywords`; `relations[]`; per-value provenance and states; `setup` with "none"; input and output media types (already possible in `interfaces[].inputs` and `outputs`) | §7.2-§7.5 |
| **Defer** | `maturity`, `intendedAudience`, `costInformation` | Optional, outside the starter core, until Missions 1 and 2 supply them | No native field, apart from coarse PyPI classifiers (§11.2) |

§16.1 records how each row was applied on 2026-10-23.

---

## 12. Trade-offs, risks, assumptions, and unresolved questions

### 12.1 Trade-offs

| Choice | Benefit | Cost |
|---|---|---|
| Reference native metadata rather than copy it | No drift; less to maintain | Consumers must follow references, or a catalog must cache them |
| Several publications per capability | Matches reality; deduplicates discovery | More complex records; publications must be kept current |
| Provenance on every value | Honest uncertainty; targeted curation | Larger records; tooling needed to write them |
| Completeness levels | Every capability can enter; records improve over time | Consumers must handle partial records; "mandatory" means something new |
| Assigned (not derived) ids | Stable across renames and moves | Needs an allocation process (Missions 5 and 2) |
| Aligning with the AI Catalog | Interoperability with MCP and A2A ecosystems | The draft may change; Mission 4 does not control it |

### 12.2 Risks

| Risk | Likelihood, from the evidence | Mitigation |
|---|---|---|
| Public evidence does not represent internal capabilities | Unknown | Iteration 2 with internal capabilities (§13) |
| One judge biased relevance and identity | Possible; judgments preceded the matcher, and the borderline ones are marked partial | A second judge on the same pool |
| Curation cost of the adoptable level is too high | Likely to matter: limitations 0 of 60, setup 13 of 60 | Measure owner effort before making the level a requirement anywhere |
| Derived values are trusted as stated facts | Possible | Provenance on every value; heuristic values flagged for confirmation |
| The AI Catalog changes or is not adopted | Possible: it is a draft | Align by projection, not by dependency |
| Native formats keep evolving | Observed: four `server.json` schemas in use, A2A 1.0 breaking | Versioned crosswalks; version detection per format |
| Scope creep into inventory, ranking, or extraction at scale | Present: the harness ranks and crawls in miniature | Keep the harness a test instrument; production indexing belongs to Mission 2, ranking to Mission 1 [Charter §9] |

### 12.3 Assumptions

- **Needs and judgments.** The four needs and their relevance criteria are realistic for the
  organization's developers. They came from iteration 1, not from Missions 1 and 2.
- **Packaging formats.** The sampled formats are the ones internal capabilities use, or will
  use. Internal service catalogues are not represented.
- **Native metadata is the starting point.** Owners will confirm derived values and supply
  owner-input facts if asked at the right moment (Mission 5's workflow). This was not tested.
- **The judgments are reasonable.** The relevance criteria and identity judgment were applied
  consistently by one person; see [judgments.yaml](../research/spikes-1-3/judgments.yaml).

### 12.4 Unresolved questions

| # | Question | Who |
|---|---|---|
| U1 | Adopt completeness levels in place of a fixed mandatory set, before publishing 0.1? Applied to the draft on 2026-10-23 (§16); still to confirm | Mission 4 team, with Mission 5 |
| U2 | Replace `source` with `publications[]` and add `relations[]` in 0.1? On 2026-10-23, `publications[]` and `relations[]` were added beside `source`; whether to fold `source` into `publications` is open | Spike 3, Mission 4 team |
| U3 | Readable namespaced id or URN (possibly `urn:air`); who allocates namespaces? | Spike 3, with Missions 5 and 2 |
| U4 | Is a configuration-only wrapper a publication or its own inventory entry? | Spike 2, with Mission 2 |
| U5 | Which abilities vocabulary, if any (free text, A2A-style skills, OASF)? | Spike 2, with Missions 1 and 2 |
| U6 | How are owner declarations of lifecycle constrained, and by whom? | Spike 3, with Mission 3 |
| U7 | Should the manifest be published as an AI Catalog entry type, or only be projectable into one? | Spike 1, Mission 4 team |
| U8 | What curation effort per capability is acceptable for the adoptable level? | Mission 4 with Mission 5 |
| U9 | Do Missions 1 and 2 accept partial (levelled) records in their ingestion? | Missions 1 and 2 |
| U10 | Is "declared none" for setup and limitations owner-asserted only, or verifiable? | Spike 2 |

---

## 13. Recommendations for the next phase

All are [Recommendation]s. They preserve each spike's ownership; §14 places them in the spike
deliverables.

### 13.1 Essential before implementation, or before publishing 0.1

1. **Decide the requiredness model.** Use completeness levels reported by the validator, rather
   than ten mandatory fields; move `lifecycleStatus`, `owner.contact`, and `lastUpdated` to level
   requirements. Evidence: 45 of 60 drafts fail on `lifecycleStatus`, and 29 invalid drafts are
   assessable (§7.6).
2. **Model publications and relations.** Replace the single `source` with `publications[]` and a
   `sourceRepository` that carries the forge id; add `relations[]`. Evidence: §7.3, §10.1.
3. **Add provenance and value states.** Evidence: §7.5, §9.4.
4. **Add `license` (with its scope) and `documentation`.** Promote input and output media types in
   the guidance. Evidence: §7.2, §7.4.
5. **Fix the id pattern; keep the id format provisional.** Accept registry-verified namespaces;
   make uniqueness case-insensitive; never derive ids from names or URLs. Evidence: §7.6, §10.2.
6. **Keep runtime primitives out of the manifest.** Reference native contracts; restate only
   cross-format facts. Evidence: §8.6.

Status on 2026-10-23: recommendations 1-5 were applied to the 0.1 draft at the Mission 4 team's
direction, as POC proposals (§16.1); the revision keeps to recommendation 6. They remain
recommendations for the spikes to confirm.

### 13.2 In parallel with a small discovery prototype

7. **Run pilot iteration 2 with this harness** on 10-20 internal capabilities and 3-5 journeys from
   Missions 1 and 2, with two judges and two query wordings per need.
8. **Project the starter records into an AI Catalog document** (Level 1) and record what is lost
   (experiment E3 below). Track the draft through the MCP and A2A communities.
9. **Agree vocabularies with their owners**: capability types and abilities with Mission 2;
   assessment references with Mission 3.
10. **Measure owner effort** for the adoptable level with three to five owners, through Mission 5's
    workflow.

### 13.3 Activities that risk over-engineering the model

- Debating requiredness and structure for fields that no journey needed and that no sampled format
  has a field for, apart from coarse PyPI classifiers: maturity, cost, audience, `techStack`.
- Designing tool-level or skill-level schemas: these belong to the native contracts and the
  runtime.
- Choosing between namespaced ids and URNs before publications are modelled.
- Per-type requirement profiles beyond the conditional rules in §9.3.
- Building search, ranking, or crawling beyond the test harness: those belong to Missions 1 and 2
  [Charter §9].

### 13.4 Decisions that can stay provisional

The id format and namespace allocation; transition rules for declared lifecycle; the abilities
vocabulary; the schema deprecation window; the risk-tier names (Mission 3); and whether to adopt
`urn:air`.

### 13.5 Early experiments that reduce uncertainty

| # | Experiment | Answers | Effort |
|---|---|---|---|
| E1 | Iteration 2 on internal capabilities with this harness | A1 (public stands in for internal); U9 | 1-2 weeks with Missions 1 and 2 |
| E2 | A second judge and a paraphrased query per need | Bias in J1; recall beyond the sampling terms | 1-2 days |
| E3 | Project 10 starter records into an AI Catalog document | U7; what the envelope lacks | 1 day |
| E4 | Owners complete the adoptable facts for 5 capabilities | U8; curation effort | 1 week, elapsed |
| E5 | Re-snapshot the same records after two weeks | Drift between publications; stale lifecycle | 1 hour, plus the wait |
| E6 | Draft abilities from documentation for 10 records, and have owners confirm them | U5; whether documentation-assisted drafting is accurate enough | 2-3 days |

---

## 14. Updated or refined spike deliverables

The evidence justifies additions to each spike, not changes of scope or ownership
[Recommendation].

| Spike | Keep (as chartered) | Add, with the evidence that justifies it |
|---|---|---|
| **1 Standards and ecosystem** | Comparison table; reuse recommendations; gap analysis; v0.1 approach | (a) Extend the research areas to the formats the sample contains (npm, PyPI, Claude Code plugins, the Docker catalog, GitHub Actions) and to discovery envelopes (AI Catalog, MCP Server Cards) (§8.1). (b) One versioned crosswalk per format, with measured availability (§5). (c) A conformance check of published metadata against its specification, where a schema exists (§7.7). (d) A table of metadata versus runtime responsibilities (§8.6). (e) A position on the AI Catalog (§8.7) |
| **2 Definition and metadata model** | Definition and granularity rules; type recommendations; field dictionary; missing-data rules; open questions | (a) Field-dictionary columns for measured availability, provenance, who supplies the value, and level (§11.2). (b) Value states including "declared none", "conflicting", and "unverified" (§9.4). (c) A catalogue of boundary cases from real examples (§9.2). (d) Completeness levels as the requiredness model (§11.3). (e) A journey question traced to every field |
| **3 Identifiers, lifecycle, and versioning** | Identifier recommendation; scenario analysis; lifecycle model; versioning strategy; compatibility guidelines; open questions | (a) Scenario analysis on the real cases in §10.1 alongside the hypothetical ones. (b) A publications and relations model, decided before the id format (§10.2). (c) Identity-linking rules with measured accuracy, including a name-only negative control (§7.3). (d) A mapping from native lifecycle vocabularies to normalized states, with `replacedBy` (§10.3). (e) Per-publication versions with their scheme (§10.4). (f) Namespace-verification precedents (MCP Registry, AI Catalog) |

**Suggested sequence** [Inference]:
1. Spikes 1 and 2 run together, both using the journey harness in `research/spikes-1-3/`.
2. Spike 3 decides publications and relations first and the id format last.
3. Spike 4's validator keeps its structure; since 2026-10-23 it also reports completeness levels
   and identity links (§16). Its acceptance test becomes a rerun of the harness on internal
   capabilities (iteration 2), as the POC report already recommends
   [Project: `docs/poc-report.md` §11, recommendation 1].

---

## 15. References and supporting evidence

### 15.1 Project sources

| Source | Path |
|---|---|
| Mission 4 charter; Spike 1-4 documents (2026-10-16) | `docs/charter/Mission 4 AI Capability Intelligence & Standards.docx`; `docs/charter/Spike 1 ... .docx` to `docs/charter/Spike 4 ... .docx` |
| Mission understanding (2026-10-22; updated 2026-10-23) | [mission-understanding.md](mission-understanding.md) |
| POC report, rules, field dictionary, boundary review | [docs/poc-report.md](poc-report.md), [docs/manifest-spec.md](manifest-spec.md), [docs/field-dictionary/0.1.md](field-dictionary/0.1.md), [docs/mission-boundaries.md](mission-boundaries.md) |
| Journey pilot, iteration 1 | [docs/journey-pilot.md](journey-pilot.md), [pilot/](../pilot/) |
| Schema 0.1 | [schema/0.1/capability.schema.json](../schema/0.1/capability.schema.json), revised 2026-10-23; the draft this report evaluated is `research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json` |

### 15.2 Evidence produced by this research

| File | Content |
|---|---|
| [research/spikes-1-3/README.md](../research/spikes-1-3/README.md) | Reproduction steps, deviations, limitations |
| [research/spikes-1-3/needs.yaml](../research/spikes-1-3/needs.yaml) | Pre-registered journeys, questions, needs, sampling rule |
| [research/spikes-1-3/judgments.yaml](../research/spikes-1-3/judgments.yaml) | Relevance, identity groups, derivatives, rationale |
| [research/spikes-1-3/results.md](../research/spikes-1-3/results.md) | Generated results (cited as R§n) |
| `research/spikes-1-3/samples/` | Snapshot: `index.json` (the sources' search results), `records/` (50 records), `supplementary.json` (documentation text, identity cases), `a2a-cards.json`, `renames.json` |
| `research/spikes-1-3/*.js` | `fetch.js`, `fetch-supplementary.js`, `fetch-renames.js` (network); `crosswalk.js`, `analyze.js` (offline) |
| `research/spikes-1-3/reference/` | The A2A v0.3.0 JSON Schema; since 2026-10-23 also the schema 0.1 draft of 2026-10-22 and the 9 manifests that were valid under it (`examples-2026-10-22/`), the baseline for §16 |
| [test/research.test.js](../test/research.test.js) | Since 2026-10-23: keeps `results.md` and `results.json` in sync with the snapshot, and checks the §7.6 and §16 numbers |

Verification on 2026-10-22: `node research/spikes-1-3/analyze.js` regenerated the results from
the snapshot. `npm test` passed 157 of 157 tests (Node.js v22.23.2), which confirms that the
project's existing code was not affected. No existing file was changed.

Verification on 2026-10-23, after the proposals were applied (§16): `npm run research` regenerated
the results, including R§10. `npm test` passed 206 of 206 tests (Node.js v22.23.2). In a mutation
check, five defects injected into the new code one at a time were each detected. The independent
Python validator (`jsonschema` 4.25.1) agreed with the POC on all 16 examples. `schema-compat`
from the 2026-10-22 draft to the revision kept all 9 manifests that were valid under the draft
valid. That day's draft and manifests are kept in `research/spikes-1-3/reference/`.

### 15.3 External sources

All retrieved on 2026-10-22.

| Ref | Source |
|---|---|
| E1 | Agent Skills specification. https://agentskills.io/specification |
| E2 | MCP specification 2026-07-28, key changes. https://modelcontextprotocol.io/specification/2026-07-28/changelog |
| E3 | MCP versioning (current revision 2026-07-28; feature states). https://modelcontextprotocol.io/specification/versioning |
| E4 | MCP `server/discover`. https://modelcontextprotocol.io/specification/2026-07-28/server/discover |
| E5 | SEP-2127, MCP Server Cards (Final). https://modelcontextprotocol.io/seps/2127-mcp-server-cards |
| E6 | MCP Registry `server.json` reference, schema changelog, and draft schema. https://github.com/modelcontextprotocol/registry/tree/main/docs/reference/server-json |
| E7 | MCP Registry, official registry requirements. https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md |
| E8 | MCP Registry, versioning published servers. https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/versioning.mdx |
| E9 | MCP Registry, package types and ownership verification. https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/package-types.mdx |
| E10 | MCP Registry, official registry API (search, status). https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md |
| E11 | A2A v1.0.1 specification (`a2a.proto`; JSON artifact note). https://github.com/a2aproject/A2A/tree/v1.0.1/specification |
| E12 | A2A, what's new in v1. https://github.com/a2aproject/A2A/blob/v1.0.1/docs/whats-new-v1.md |
| E13 | A2A, agent discovery. https://github.com/a2aproject/A2A/blob/v1.0.1/docs/topics/agent-discovery.md |
| E14 | A2A v0.3.0 JSON Schema. https://github.com/a2aproject/A2A/blob/v0.3.0/specification/json/a2a.json |
| E15 | AI Catalog specification, editor's draft. https://github.com/Agent-Card/ai-catalog/blob/main/specification/ai-catalog.md (specification last changed 2026-10-01, commit 769b174); https://ai-catalog.io/ |
| E16 | AI Catalog ADRs 0002 (defer dependencies), 0004 (no bundle concept), 0006 (single URL), 0021 (identity separate from registry coordinates, proposed). https://github.com/Agent-Card/ai-catalog/tree/main/adr |
| E17 | AI Catalog mappings (Claude Code plugins, MCP servers, OCI, xRegistry). https://github.com/Agent-Card/ai-catalog/tree/main/docs/mappings |
| E18 | Claude Code plugin manifest reference. https://code.claude.com/docs/en/plugins-reference |
| E19 | JSON Schema specification (current: 2020-12). https://json-schema.org/specification |
| E20 | Semantic Versioning 2.0.0. https://semver.org/spec/v2.0.0.html |
| E21 | Package URL, ECMA-427 1st edition (December 2025), and the purl specification. https://www.ecma-international.org/publications-and-standards/standards/ecma-427/ ; https://github.com/package-url/purl-spec |
| E22 | Python core metadata specification. https://packaging.python.org/en/latest/specifications/core-metadata/ |
| E23 | npm deprecate. https://docs.npmjs.com/cli/v11/commands/npm-deprecate |
| E24 | GitHub, renaming a repository. https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository |
| E25 | GitHub Actions metadata syntax. https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax |
| E26 | Docker MCP registry, contributing guide. https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md |
| E27 | Backstage descriptor format. https://backstage.io/docs/features/software-catalog/descriptor-format |
| E28 | OASF v1.1.0 record object. https://github.com/agntcy/oasf/blob/v1.1.0/schema/objects/record.json ; https://docs.agntcy.org/oasf/open-agentic-schema-framework/ |

---

## 16. Addendum: the proposals applied to schema 0.1 (2026-10-23)

On 2026-10-23 the Mission 4 team asked for the analysis to be carried into the code and documents
[Project: team request, 2026-10-23]. The proposals of §11 and §13.1 were applied to the unpublished schema
0.1 draft in place, following the team.s earlier decision to keep one schema version and to revise
0.1 while it is unpublished [Project: POC D20]. They are POC proposals for Spikes 2 and 3 to
confirm, not spike conclusions. The draft that §7.6 evaluated, and the manifests that were valid
under it, are kept in `research/spikes-1-3/reference/`. The rules are in
[docs/manifest-spec.md](manifest-spec.md) (tagged [R §n]); the decisions are POC D3, D4, D5,
D8, D9, D11, and D23-D26 in [docs/poc-report.md](poc-report.md).

### 16.1 What was applied

| Proposal | Applied as [Project] | Difference from the proposal |
|---|---|---|
| §13.1 rec 1: completeness levels; `lifecycleStatus`, `owner.contact`, `lastUpdated` move to levels | Six mandatory fields (`schemaVersion`, `id`, `name`, `capabilityType`, `source`, `riskTier`). Levels in the schema's `x-completenessLevels`: discoverable, assessable, adoptable, governed. The validator reports the level of every manifest, and enforces one only with `validate --require-level` | `description` moved to the discoverable level as well, as §11.2 proposes, because 2 of 60 records have none (§16.2). `owner` as a whole is optional; `owner.name` counts towards assessable |
| §13.1 rec 2: publications and relations | `publications[]` (kind, locator, native name, native version and its scheme, status and message, date, `verifiedBy`); `source.repositoryId`, `source.status`, `source.updatedAt`; `relations[]` (`same_as`, `fork_of`, `wraps`, `derived_from`, `distinct_from`). Stage 2 reports shared publications, and shared sources matched by URL or repository id | `source` was kept as the primary reference beside `publications`, rather than replaced, to keep the change small; there is no separate `sourceRepository`. Folding `source` into `publications` remains U2 |
| §13.1 rec 3: provenance and value states | `provenance[]` per value: `native`, `linked`, `derived` (with a `convention` or `heuristic` basis), `owner`, `curated`. Stage 2 reports heuristic values without `confirmedBy`, claimed relations, conflicting lifecycle signals, and publications with different versions | "Declared none" keeps the existing `[]` rule, and "unknown" is omission |
| §13.1 rec 4: license and documentation | `license` (SPDX `expression` or `text`, with `url` and `scope`), `documentation`; also `keywords`, `runtime[]`, `setup[]`, and `interfaces[].transport` from §11.2 | Input and output media types were already possible in `interfaces[].inputs` and `.outputs`; only their descriptions changed |
| §13.1 rec 5: id pattern | Segments may start with a digit; ids are lowercase, so uniqueness is case-insensitive | The format stays `<namespace>/<name>`, provisionally |
| §11.5: `lastUpdated` has two meanings | `lastUpdated` is the record's date; the dates a capability changed are recorded per publication and for the source | Kept the name `lastUpdated` instead of `recordUpdated` |
| §11.5: `capabilityVersion` is SemVer only | `capabilityVersion` stays SemVer, and optional; native versions are recorded per publication with a `versionScheme` | None |
| §10.3: lifecycle as observed signals | `lifecycleStatus` is the owner's optional declaration, and the transition table governs only it; channels' statuses go in `publications[].status` and `source.status` | None |
| §6.2: different names for one meaning | The schema's `x-synonyms` lists native names; an unknown field such as `tags` or `homepage` is answered with the manifest field to use | Not proposed in §11; a direct use of §6.2 |

### 16.2 Results on the same records

The same 60 records were validated three times [Measured R§10]:

| Run | Drafting | Schema | Valid drafts |
|---|---|---|---|
| A (§7.6) | The §7.6 mapping | 0.1 draft of 2026-10-22 | 12 of 60 |
| B | The same mapping | Revised 0.1 | 57 of 60 |
| C | Starter-model drafts: publications, provenance, observed lifecycle signals, and the new fields; ids assigned by the harness, never derived from names; no native value shortened | Revised 0.1 | 58 of 60 |

- **What still fails.** In run B, two descriptions are outside the 20-1,024 character limits, and
  one archived record has no deprecation reason. In run C, the same two descriptions fail: N2-14
  states 17 characters, and N1-08 states 1,221. The three ids that the old pattern rejected are
  accepted.
- **Identity through the validator.** The duplicate-publication and duplicate-source warnings link
  all 14 judged same-capability pairs in run C, with no false link. That is the same result as the
  best rule of §7.3 ("declared links + same repository and path"). Publications alone link 11
  pairs, missing the three links of the Docker build of Microsoft's Playwright server, which is
  linked only through its repository; sources alone link 7.
- **Completeness levels.** In run C: invalid 2, none 2 (no description), discoverable 25,
  assessable 31, adoptable 0, governed 0. They agree with §7.5's measurement for 56 of the 60
  records. Two of the other four are the two invalid drafts. The remaining two (N2-47, N4-43) are
  PyPI records whose only maintainer value is the crosswalk's placeholder "authors listed by email
  only"; the drafts do not count it as an owner, while §7.5 did [Inference: a drafting choice, not
  a schema effect].
- **What the validator asks for next** (run C): for the adoptable level, limitations (31),
  an owner contact (31), and setup (23); for the assessable level, a version (13, the skills and
  unversioned plugins), a license (8), a lifecycle signal (4), and an owner (3); for the
  discoverable level, a description (2). This is the "what must be asked" of J4 (§7.5), produced
  by the validator.
- **Values to confirm.** 54 values inferred by a heuristic are reported as unconfirmed: interfaces
  18, documentation links 16, capability types 12, and owners 8. §7.5 counts 19 heuristic interface
  answers and 13 heuristic types; the difference is N2-14, which is invalid in run C. 14 license
  statements are reported as needing review: terms in prose, or a license read from the whole
  repository.
- **Sensitivity: keeping `description` mandatory.** Run C with `description` mandatory accepts 56
  drafts and links 11 of the 14 pairs. The two Docker entries without a description become
  invalid, Stage 2 does not check invalid manifests, and so the Docker build of the Playwright
  server is not linked to its other publications. This is why `description` was moved to the
  discoverable level.
- **Iteration 1.** The pilot's 12 drafts are all valid against the revision (4 were before)
  [Project: `pilot/results.md`].

### 16.3 What this shows, and what it does not

[Inference]
- The mandatory set is no longer the main cause of invalidity. The two drafts that still fail
  state descriptions the schema cannot hold, which is a content question for their publishers or
  curators.
- On the same records, the validator's own checks reproduce the journey results for J2 (identity)
  and J4 (levels, and what to ask). That is evidence that the revised model carries what those
  journeys need. J1 and J3 do not depend on the schema, and were not re-run through it.
- It does not show that internal capabilities behave the same (assumption A1), that these levels
  suit Missions 1, 2, and 5 (U1, U9), or that owners will supply the adoptable facts (U8).
  Experiments E1 and E4 (§13.5) remain the way to find out. The drafts are mechanical, nobody
  confirmed their heuristic values, and the judgments are one person's (§4.4).

