# How should a manifest describe what a capability can do? (U5)

| | |
|---|---|
| Date | 2026-11-16 |
| Question | Decision register U5: should schema 0.1 adopt a vocabulary for abilities (what a capability can do, what it takes in, what it gives back)? |
| Evidence | Six public standards and formats read at their sources; 36 public A2A Agent Cards; 2 live AI Catalogs; the 22 production manifests; the Phase 1 search test (T5) |
| Decision | **Accepted 2026-11-16. No new ability field in 0.1.** Abilities are stated by four existing fields, each tested. A **controlled functional classification** (Mission 2's category list, cross-walked to OASF) is the one vocabulary worth adding, as a standard field in 0.2 once Mission 2 agrees the list |

## 1. Why the question matters

A recommender (Mission 1) and an AI host both need to know what a capability does, in a form a
machine can match. Free text is easy to write and hard to match consistently; a controlled
vocabulary is easy to match and hard to keep complete. The question is which of these the manifest
should carry, and where the line is between describing a capability and restating its runtime
contract (which Mission 4's principles forbid).

## 2. What the public standards do

Read at their sources on 2026-11-16.

| Standard | Where abilities live | Structure | Controlled vocabulary? | Source |
|---|---|---|---|---|
| **A2A Agent Card** | `skills[]` on the card | `id`, `name`, `description`, `tags` (all four required), `examples`, `input_modes`, `output_modes` (media types), `security_requirements` | No: tags are free keywords | `a2aproject/A2A`, `specification/a2a.proto`, `message AgentSkill` |
| **MCP** | `tools/list` at runtime | `name`, `title`, `description`, `inputSchema`, `outputSchema` (JSON Schema), `annotations`: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` | No | `modelcontextprotocol`, `schema/2025-11-25/schema.ts`, `interface Tool`, `interface ToolAnnotations` |
| **MCP Server Card** | Not at all: tools are left out because a static document cannot reliably represent them | - | - | SEP-2127; the two live cards (Exa, GitHub) carry no tool list |
| **Agent Skills** (`SKILL.md`) | `description` only: "what the skill does and when to use it", up to 1,024 characters; optional `compatibility`, `metadata`, experimental `allowed-tools` | Free text | No | `agentskills/agentskills`, `docs/specification.mdx` |
| **OASF** (Open Agentic Schema Framework, AGNTCY) | `skills` and `domains` annotations on a record, also meant for Agent Cards and AI Catalog entries | A taxonomy with numeric ids: **513 skills in 18 top-level categories**, plus 202 domains | **Yes** | `agntcy/oasf`, `schema/skills/`, version `1.2.0-dev` |
| **AI Catalog** | Not defined. Exa's live catalog adds members the draft does not define: `capabilities` (its tool names) and `representativeQueries` (example requests) | Ad hoc | No | Section 3.4 of [ai-catalog-interoperability.md](ai-catalog-interoperability.md) |
| **OpenAPI** | Operations (`operationId`, `summary`, `tags`) | Per operation | No | (referenced, not restated, through `contractRef`) |
| **Mission 2's model capabilities CSV** | Benchmark capabilities of **models** (coding, reasoning, ...) | Categories with scores | Yes, but for models | [research/mission-2/model_capabilities.csv](../../research/mission-2/model_capabilities.csv); analysed in mission-4-context-and-architecture.md §18. It describes models, not adoptable capabilities |

Two patterns stand out:

- **Runtime contracts already hold the detailed abilities** (MCP tools with schemas, A2A skills).
  They change with each release, and the MCP community decided a static document should not copy
  them. The manifest should **link** them (`interfaces[].contractRef`), not restate them.
- **The only controlled vocabulary is OASF**, and it is a moving target (`1.2.0-dev`).

## 3. What real records show

### 3.1 Free tags do not converge (36 public A2A Agent Cards)

| Measure | Value |
|---|---|
| Cards that declare skills | 21 of 36 |
| Skills | 82 |
| Skills with tags | 40 |
| Distinct tags | 108, of which **93 are used only once** |
| Skills with examples | 20 |
| Skills with input or output modes | 25; mostly `text/plain` and `application/json`, but also non-media-type values such as `text` and `file` |

A required free-text `tags` field, as A2A has, produced 108 tags that almost never repeat. A
consumer cannot filter on that. The same happened with `intendedAudience` in our 22 manifests
(14 inconsistent values, all restating other fields; the field was removed on 2026-11-16, C15).

### 3.2 The 22 production manifests

| Field | Stated in | What the tests showed |
|---|---|---|
| `supportedUseCases` (title, description) | **22 of 22**, 62 use cases | The strongest field for search after the description: recall 0.84 to 0.95 (T5). Similar to A2A's skill `examples` and Exa's `representativeQueries` |
| `embeddedComponents` (tools, commands, sub-skills) | 8 of 22, 24 tools | Answers J5 "which tools does it expose?"; adds nothing to search. Names and descriptions only, as MCP and A2A expose them |
| `interfaces[].inputs` / `outputs` | 4 / 1 of 22, all the PDF libraries | Media types (`application/pdf`, `text/markdown`), already validated as IANA media types |
| `interfaces[].contractRef` | 10 of 22 | Links the native contract that holds the full abilities: `SKILL.md`, MCP Server Card, `plugin.json`, `action.yml` |
| `keywords` | 17 of 22 | Free tags from sources; no search gain |

### 3.3 Does a controlled vocabulary cover these capabilities?

The 22 capabilities were mapped by hand to the most specific OASF skill (a curator judgment, made
from each manifest's description and use cases):

| Capabilities | OASF skill (path under `schema/skills/`) | Fit |
|---|---|---|
| playwright-mcp, chrome-devtools-mcp, browser-use | `tool_use_automation/browser_automation` | Good |
| webapp-testing | `software_engineering/software_testing/end_to_end_testing` | Good |
| brave-search, exa, tavily-mcp, langchain-tavily | `research_knowledge_productivity/web_search/web_search` | Good |
| docling, pdfplumber, unstructured, pdf-parse | `research_knowledge_productivity/document_processing/document_parsing` | Good |
| github-mcp-server | `software_engineering/version_control/pull_request_management`, `research_knowledge_productivity/project_task_management/issue_tracking` | Good |
| mcp-atlassian | `research_knowledge_productivity/project_task_management/issue_tracking` | Good |
| pr-agent, claude-code-action, caveman-review | `software_engineering/code_quality/code_review` | Good |
| caveman-commit | `software_engineering/version_control/version_control` | Approximate |
| caveman, ultracave, megacave, caveman-plugin | none: "make replies terse to save output tokens" has no skill; the nearest is `language_processing/language_generation/summarization`, which is a different thing | **Gap** |

**18 of 22 fit an OASF skill well, 1 approximately, 4 not at all.** The seven search needs of
the Phase 1 protocol map to OASF skills for six of seven (N7, token reduction, has none). So a
controlled vocabulary would make filtering consistent across curators for most capabilities. It
would not replace free text, because new kinds of capability (like Caveman) appear before any
taxonomy names them.

## 4. Options

| Option | For | Against | Verdict |
|---|---|---|---|
| A. Adopt **A2A-style skills** (`id`, `name`, `description`, `tags`, `examples`, modes) as a manifest field | Familiar to agent builders | Restates the Agent Card and MCP tool lists that the native contracts already hold and keep current; free tags do not converge (93 of 108 used once) | Rejected |
| B. Copy **MCP tool schemas** into the manifest | Machine-precise | Changes with every release; the MCP community left tools out of the static Server Card for exactly this reason | Rejected |
| C. Adopt **OASF skill ids** now | The only controlled taxonomy; covers 18 of 22 well | `1.2.0-dev`, not stable; a 513-entry taxonomy is heavy for contributors; misses new kinds of capability | Defer: cross-walk now, adopt when OASF is stable |
| D. **Keep the four existing fields** (`supportedUseCases`, `embeddedComponents`, `interfaces[].inputs`/`outputs`, `contractRef`) and add **one controlled functional classification** owned by Mission 2, cross-walked to OASF | Each existing field is tested and filled; one short controlled list gives consistent filtering; the cross-walk keeps export to OASF, A2A, and AI Catalog open | The classification needs Mission 2's agreement before it becomes a standard field | **Recommended** |

## 5. Recommended decision (U5)

1. **No new ability field in schema 0.1.** Abilities are stated by:
   - `supportedUseCases`: what it is for, in words; **recommended for every capability**, the
     best-performing search field;
   - `embeddedComponents`: the tools, commands, and sub-skills it exposes, by name and description;
   - `interfaces[].inputs` / `outputs`: what it takes and returns, as IANA media types, where that
     matters (document converters, data tools);
   - `interfaces[].contractRef`: the native contract that holds the precise, current abilities
     (MCP Server Card or tools, A2A Agent Card skills, `SKILL.md`, OpenAPI).
2. **Functional classification:** Mission 2's proposed category list (12 categories with
   subcategories, `x-classification` in the [Mission 2 guidance](../mission-2-standards-guidance-v0.1.md))
   is the controlled vocabulary. It stays an `x-` extension in 0.1 and becomes a standard field in
   **0.2**, once Mission 2 agrees the list. Mission 4 keeps a cross-walk from each category to OASF
   skills, starting with the table in §3.3.
3. **Trust-related abilities** (MCP's `readOnlyHint`, `destructiveHint`, `openWorldHint`) belong to
   the trust fields deferred to 0.2 with Mission 3 (C8): "can it change data?" is the same question.
4. **Revisit OASF** for 0.2 or later when it publishes a stable 1.x.

## 6. What this changes

Nothing in schema 0.1. The standard and the Mission 2 guidance state the four fields as the way to
describe abilities, and the cross-walk in §3.3 is kept for 0.2.

## 7. Limits

- The OASF mapping in §3.3 is one curator's judgment.
- The A2A sample is the 36 cards found by a code search on 2026-10-22, not a random sample of all
  agents.
- No ranking experiment was run with a controlled vocabulary: with a single curator assigning both
  the categories and the relevance judgments, such a test would only measure the curator.
