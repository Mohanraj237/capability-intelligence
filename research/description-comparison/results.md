# Free-Text, A2A-Style, and OASF-Inspired Description Comparison

## Outcome

For the five selected capabilities, free text is the clearest human-readable summary; the simplified A2A-style files make input/output roles easier to locate; an OASF-inspired taxonomy mapping makes capability categories explicit. None alone establishes suitability or interoperability. Retain readable descriptions, add mapped skills and typed ports with provenance, and preserve scope and limitations.

This is the **qualitative approach comparison for Ticket 2**, separate from the [discovery-matching experiment](../structured-matching/results.md). No precision or recall is measured for the three approaches in this section.

The subsequent [measured three-way comparison](experiment-results.md) actually runs the existing 15 artifacts against the same 16 requests, with field coverage, per-request metrics, rankings, and exact matching evidence. All three returned 5 relevant pairs in 9 results: **55.6% strict precision and 100% recall**. This does not support declaring an OASF discovery winner; see the [experimental method](experiment-method.md).

## Scope and method

The selected functions are SQL review, translation, runbook retrieval, browser automation, and agent evaluation. They are different primary functions; browser testing and agent evaluation are not treated as interchangeable.

The comparison inspects the existing free-text and simplified A2A-style files alongside five new OASF-inspired examples. All are grounded in the same original metadata and existing ability drafts. However, the existing simplified A2A files omit details present in the prose and typed drafts. Therefore, differences below describe **these artifacts**, not a controlled demonstration that one serialization format is inherently superior. All three approaches could carry richer descriptions.

| Capability | Free text | Simplified A2A style | OASF-inspired adaptation |
| --- | --- | --- | --- |
| SQL Review | [Text](../../ability-descriptions/capability-representations/free-text/sql-review.txt) | [YAML](../../ability-descriptions/capability-representations/a2a-style/sql-review.yaml) | [YAML](oasf-inspired/sql-review.yaml) |
| Translator | [Text](../../ability-descriptions/capability-representations/free-text/translator.txt) | [YAML](../../ability-descriptions/capability-representations/a2a-style/translator.yaml) | [YAML](oasf-inspired/translator.yaml) |
| Runbook Search | [Text](../../ability-descriptions/capability-representations/free-text/runbook-search.txt) | [YAML](../../ability-descriptions/capability-representations/a2a-style/runbook-search.yaml) | [YAML](oasf-inspired/runbook-search.yaml) |
| Playwright MCP | [Text](../../ability-descriptions/capability-representations/free-text/playwright-mcp.txt) | [YAML](../../ability-descriptions/capability-representations/a2a-style/playwright-mcp.yaml) | [YAML](oasf-inspired/playwright-mcp.yaml) |
| Agent Evaluation Framework | [Text](../../ability-descriptions/capability-representations/free-text/agent-eval-framework.txt) | [YAML](../../ability-descriptions/capability-representations/a2a-style/agent-eval-framework.yaml) | [YAML](oasf-inspired/agent-eval-framework.yaml) |

## What “style” means here

**Free text:** a paragraph describing behavior, data, and selected restrictions. No common field layout or taxonomy is required.

**A2A-style:** the requested simplified `name`, `description`, `inputs`, and `outputs` layout. These are not full A2A Agent Cards or protocol-conformance examples. They do not establish an A2A endpoint, authentication, or native skill definitions. Typed task contracts would require separate work.

**OASF-inspired:** simplified adaptations grounded in **AGNTCY OASF v1.1.3**, pinned to commit `243e9dd1562529fdf59e3eb06db442d69330b14b`. The actual OASF record model includes `name`, `description`, `skills`, `domains`, and `modules`, alongside required record metadata. Here we reuse the name/description concept and map behavior to verified taxonomy nodes. We retain local abilities, typed ports, use cases, and constraints in a clearly labeled `custom_details` section.

The adaptations are **not valid OASF records**: `oasf_reference`, `mapped_skills`, `taxonomy_path`, and `custom_details` are local comparison fields, not asserted OASF record syntax. Taxonomy paths identify source definitions, not computed OASF skill IDs. Domains and native modules are not mapped; required authors, record version, creation time, and native skill representation are not completed. No invented authors, timestamps, or taxonomy IDs are supplied. A production conversion must use the native record representation and a registered extension/module where necessary.

## Findings by capability

| Capability | Free-text observation | A2A-style observation | OASF-inspired observation | Discovery/reuse implication |
| --- | --- | --- | --- | --- |
| SQL Review | Clearly states SQL review, findings, PostgreSQL/MySQL support, and no execution. These facts remain prose. | Separates SQL diff/file content from review findings; omits media types, dialect restrictions, and static-only behavior. | Maps review to Code Quality and Maintenance; keeps `sql-review`, policy checks, typed text ports, and restrictions as local details. The taxonomy node is broader than SQL review. | A code-quality category can shortlist it, but SQL dialect, access policy, and static-only restrictions are needed to distinguish review from query execution. |
| Translator | Clearly names English, German, and Japanese, with unspecified contracts and invalid-fixture caveat. | Separates documentation, source language, target language, and translated output; no types or inference markers. | Maps to Language Translation and retains the supported-language list and inferred string ports. | Translation classification does not imply every language is supported. Spanish must remain unsupported by available evidence. The source fixture remains invalid. |
| Runbook Search | Explains alert/service/symptom queries, JSON results, links, and SRE-wiki-only scope. | Separates query from matches but does not declare JSON representation or the closed corpus. | Maps broadly to Knowledge Management, not Web Search; preserves `runbook-search`, JSON port declarations, and SRE scope. | Knowledge retrieval is discoverable, but taxonomy alone is too broad. Explicit corpus scope prevents treating internal runbook search as general live web search. |
| Playwright MCP | Describes clicking, forms, screenshots, and browser testing; explicitly leaves runtime tool contracts unresolved. | Separates page/action inputs from result/screenshot outputs, but leaves representations and inference unspecified. | Maps directly to Browser Automation and retains specific local behaviors and proposed string/object/binary ports. | Browser automation is not agent regression evaluation. Screenshot bytes are only a conceptual type, not a verified MCP delivery format. Actual tool contracts must be discovered. |
| Agent Evaluation Framework | Describes repeatable CI evaluations, prompt/model comparisons, graders, and reports. | Separates test cases, grader configuration, targets, and report; exact report contents and types are not shown. | Maps to Model and Agent Evaluation and retains proposed array/object ports plus regression/comparison abilities. | The category distinguishes agent evaluation from browser UI testing. Grader configuration, report schema, and model usage costs still determine reuse feasibility. |

## Cross-approach assessment

| Criterion | Free text in these examples | Simplified A2A style in these examples | OASF-inspired adaptations |
| --- | --- | --- | --- |
| Human readability | Direct narrative; constraints fit naturally. | Short, easy-to-scan input/output roles. | More verbose; taxonomy references and custom details require explanation. |
| Ability consistency | Depends on wording and synonym interpretation. | Names/descriptions remain prose; no controlled vocabulary in the simplified layout. | Verified taxonomy nodes provide broad categories; local terms preserve finer distinctions. Mappings are curated judgments. |
| Input/output clarity | Often stated, but not consistently extractable by field. | Explicit lists show roles, but not schemas or types. | Explicit proposed types and published media types where known; no runtime validation implied. |
| Use-case clarity | Embedded in prose. | Mostly implicit in short descriptions. | Explicit local `use_cases`; these are adaptations, not native OASF fields established here. |
| Constraints and uncertainty | Can express them, but extraction is difficult. | Existing examples omit several restrictions and inference markers. | Local constraints and per-port inference markers make evidence gaps visible; proposed types remain unverified. |
| Discovery potential | Supports lexical or semantic text search. | Consistent layout helps field extraction, but does not itself resolve synonyms or scope. | Taxonomy filtering is possible in principle; relevance still depends on resource, language, and action constraints. Not tested here. |
| Authoring effort | Fewest fields; no taxonomy mapping. | Requires separating input/output roles. | Requires mapping and evidence review plus maintaining local details. This is a qualitative assessment; time was not measured. |
| Interoperability | No structured exchange contract demonstrated. | No full A2A interoperability demonstrated. | No OASF conformance demonstrated; taxonomy alignment is narrower than record compliance. |

## Recommendations

1. Preserve original descriptions and source references. Do not replace useful constraints with short ability labels.
2. Use controlled skills for broad discovery and local ability terms for precise behaviors. Document mappings rather than claiming exact equivalents: Code Quality is broader than `sql-review`; Knowledge Management is broader than `runbook-search`.
3. Keep input/output roles, proposed types, published media types, and inference evidence separate. A declared port is not proof that its proposed type matches the runtime contract.
4. Encode decision-relevant scope explicitly: supported languages, searched corpus, supported SQL dialects, and execution versus proposal. Unknown information must not be interpreted as supported behavior.
5. Treat the simplified A2A and OASF-inspired examples as research artifacts. Adopt full native formats only when a consumer requires them, with pinned versions and validation.

The [earlier matching experiment](../structured-matching/results.md) reported 61.3% strict precision for original metadata and 59.4% for custom structured drafts, both at 100% recall. Those figures **must not be labeled A2A-versus-OASF results**: neither the simplified A2A files nor these new OASF-inspired mappings were experimental arms. They support caution about keyword matching, not a ranking of these formats.

## Source references

Official OASF references inspected for this comparison are pinned to v1.1.3:

- [Record model](https://github.com/agntcy/oasf/blob/v1.1.3/schema/objects/record.json): record attributes and required metadata.
- [Code Quality and Maintenance](https://github.com/agntcy/oasf/blob/v1.1.3/schema/skills/software_engineering/code_quality/code_quality.json): improving and assessing existing code.
- [Language Translation](https://github.com/agntcy/oasf/blob/v1.1.3/schema/skills/language_processing/language_translation/language_translation.json): translating across languages.
- [Knowledge Management](https://github.com/agntcy/oasf/blob/v1.1.3/schema/skills/research_knowledge_productivity/knowledge_management/knowledge_management.json): capturing, organizing, and retrieving knowledge.
- [Browser Automation](https://github.com/agntcy/oasf/blob/v1.1.3/schema/skills/tool_use_automation/browser_automation.json): automating web browsers.
- [Model and Agent Evaluation](https://github.com/agntcy/oasf/blob/v1.1.3/schema/skills/ai_ml_engineering/model_evaluation/model_evaluation.json): measuring model/agent quality.

Capability evidence and typed drafts: [SQL Review](../../ability-descriptions/capability-representations/structured-style/sql-review.ability.yaml), [Translator](../../ability-descriptions/capability-representations/structured-style/translator.ability.yaml), [Runbook Search](../../ability-descriptions/capability-representations/structured-style/runbook-search.ability.yaml), [Playwright MCP](../../ability-descriptions/capability-representations/structured-style/playwright-mcp.ability.yaml), and [Agent Evaluation Framework](../../ability-descriptions/capability-representations/structured-style/agent-eval-framework.ability.yaml). Each links its original `examples/` metadata file.
