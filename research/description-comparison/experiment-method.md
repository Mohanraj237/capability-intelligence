# Three-Approach Artifact Experiment

## Question and fixed inputs

How do the **existing** free-text, simplified A2A-style, and OASF-inspired descriptions retrieve relevant candidates from the same five-capability pool?

This is the requested as-is comparison, not an equal-information experiment. No description is rewritten for scoring.

Candidates: SQL Review (baseline version), Translator, Runbook Search, Playwright MCP, and Agent Evaluation Framework. The free-text and A2A files are under `ability-descriptions/capability-representations/`; OASF-inspired files are under this folder's `oasf-inspired/`.

The [16 requests, terms, criteria, and metadata-based relevance judgments](../structured-matching/needs.yaml) are reused unchanged. Relevance and partial-relevance sets are intersected with the selected five candidates. Requests whose relevant candidates are outside the pool become additional negative controls. Original evidence notes remain in results for traceability; candidates outside the five are not evaluated.

## Indexed data and matching

| Approach | Searchable values |
| --- | --- |
| Free text | Entire existing paragraph |
| A2A style | `name`, `description`, input names, output names |
| OASF-inspired | `name`, `description`, mapped taxonomy paths/captions, local abilities, input/output values (including proposed types, media types, and inference flags), use cases, and constraints |

YAML keys, file paths, schema-version markers, source references, mapping commentary, source-status notes, uncertainty notes, type-status caveats, and YAML comments are not indexed. Core descriptive port text and constraints remain searchable; negative statements can cause false positives. OASF custom details are deliberately included because they are part of the selected existing representation, not because they are native OASF fields.

All variants use the earlier matcher's rule: lowercase; punctuation/hyphens become spaces; collapse whitespace; whole-word or whole-phrase matches within individual text values; any matching term retrieves a candidate. Score is the number of distinct matched query terms, not occurrences or fields. Tie-break by the same candidate slug across formats. There is no stemming, synonym expansion, taxonomy reasoning, embeddings, language-model judgment, negation handling, or constraint enforcement. Structured input/output roles do not receive special scoring.

## Measures and reproducibility

Strict precision = fully relevant returned / all returned. Recall = fully relevant returned / fully relevant available. Partial matches count separately and do not satisfy the full request. Precision@1 evaluates the top result. Undefined precision or recall is `N/A`; empty relevant sets do not count as successful recall. Aggregate metrics pool request-candidate pairs.

```sh
ruby research/description-comparison/run.rb
```

Outputs:

- `experiment-results.md`: aggregate/per-request scores, result-set differences, ranked candidates, and interpretation.
- `experiment-results.json`: exact field-value evidence, judgments, scores, counts, and SHA-256 fingerprints of all 15 artifacts, requests, method, and runner.

## Limits

The existing files differ in information coverage. Any difference can arise from wording, added content, constraints mentioned in negative form, or taxonomy terms—not the serialization format alone. OASF-inspired fields are custom adaptations, and A2A-style fields are a simplified layout; neither demonstrates native-standard compliance.

Single-reviewer, metadata-based judgments, five hand-selected candidates, and queries authored after the original drafts limit generalization. The runner does not measure authoring effort, human readability, semantic accuracy, interoperability, or runtime suitability. Source metadata includes an intentionally invalid Translator fixture. The output is a measured comparison of the selected artifacts, not proof of a winning standard.
