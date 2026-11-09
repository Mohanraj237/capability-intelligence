# Structured Discovery Matching Experiment

This establishes a **new local baseline**, not a historical Phase 0 result. The agreed corpus is all 16 metadata files in `examples/`, paired with their `ability-descriptions/` drafts through `source_file`.

Run offline from the repository root:

```sh
ruby research/structured-matching/run.rb
```

Outputs: `results.md` (readable findings) and `results.json` (full rankings, matching-field evidence, labels, metrics, and SHA-256 input fingerprints).

## Fixed protocol

- `needs.yaml` fixes 16 requests, term lists, relevance criteria, and expected records before the first run. It was authored **after** the ability drafts existed; this is not independent preregistration. All unlisted records are not relevant for that request. Partial relevance is reported separately and does not count toward strict precision.
- Ground truth comes from original metadata, not actual execution or external documentation. One reviewer authored the requests, drafts, and judgments. The corpus is small and curated; the browser fork's scope and some other behaviors have limited evidence.
- The baseline indexes original names, descriptions, keywords, supported-use-case titles/descriptions, declared interface inputs/outputs (names, descriptions, media types), and embedded-component names/descriptions. Malformed scalar `supportedUseCases` is read as prose, not silently discarded.
- Structured-only indexes draft names, descriptions, ability identifiers, input/output names/descriptions/types/media types, and use cases. Augmented indexes the baseline plus these structured fields.
- All variants use the **same matcher**: lowercase; punctuation/hyphens become spaces; collapse whitespace; match complete words or phrases. Any matching term retrieves a record. Score is the number of distinct request terms found, with no field weighting. Ties sort by original source path. There is no stemming, synonym expansion, embeddings, LLM ranking, or execution.
- IDs, URLs, contacts, comments, provenance, fixture explanations, and source context are not indexed. Fields are matched individually, never across field boundaries. Descriptive caveats inside port descriptions remain searchable, so negation can create false positives.
- The candidate pool is fixed at 16 **records**, not 16 unique assets. Revisions and the duplicate-ID fork are separate records, identified by source path; capability IDs must not merge them. Invalid and deprecated fixtures remain candidates because this experiment measures described functionality, not deployability or approved reuse.

## Measures

Strict precision = relevant retrieved / all retrieved. Recall = relevant retrieved / all relevant. Useful precision includes relevant plus partial results and is separately labeled. Precision@5 uses the returned shortlist size (up to five); no-match precision and zero-relevant recall are `N/A`, not 0% or 100%.

Micro metrics pool counts across request-record pairs. Macro precision averages requests with at least one returned record; macro recall averages requests with at least one relevant record. The three zero-relevant requests also report false-positive counts explicitly. Do not interpret their recall as success.

## Interpretation boundaries

Structured-only is a replacement experiment; augmented is an enrichment experiment. Augmented recall cannot decrease with this OR-based matcher, because it contains every baseline field. Precision can decrease. That mathematical property is not evidence of a better matching algorithm.

These runs compare **representations plus curated content**, not serialization formats alone. Drafts add inferred ports, new wording, and proposed types; any improvement cannot be attributed solely to YAML structure or canonical abilities. Gains require review against source evidence. This does not compare full A2A versus OASF, validate runtime compatibility, or evaluate a production recommender.

No query or draft should be tuned after viewing results without recording a new experiment revision. Re-running produces fingerprints so changed inputs can be identified.
