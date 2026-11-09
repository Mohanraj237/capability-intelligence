# Ticket 2: Metadata Model and Structured Capability Descriptions

**Mission:** AI Capability Intelligence & Standards  
**Scope:** The agreed 16 metadata files under `examples/`. They include revisions, a duplicate-ID fork, invalid fixtures, and fictional examples; results are record-level and not evidence of 16 approved, independent assets.

## Objective and executive summary

Evaluate whether the proposed capability manifest and metadata model can represent AI capabilities consistently and support discovery, comparison, and reuse. The study examines capability relationships and wrappers, structured abilities, missing-information states, and alternative description approaches through documentary assessment and two reproducible matching experiments.

The manifest can distinguish adoptable assets/services, managed bundles, components, dependencies, and related forks or wrappers. Structured abilities and typed drafts make behavior explicit, but the local keyword experiment **did not improve matching precision**: original metadata reached 61.3%, compared with 59.4% for structured drafts, both with 100% recall. Scope-aware constraints and evidence handling are needed before claiming better discovery or reuse.

The separate five-capability comparison also found **no retrieval advantage**: free text, simplified A2A style, and OASF-inspired descriptions each achieved 55.6% strict precision and 100% recall. The OASF-inspired artifacts provide more explicit fields, but neither better discovery nor interoperability was demonstrated.

The missing-information model distinguishes omission, meaningful empty lists, unassessed risk, and unverified claims. It lacks a general explicit distinction between unknown and not applicable. Recommend preserving the existing core and provenance, with a separately specified optional field-state sidecar.

## Evidence and method

Reviewed [the existing metadata proposal](../docs/manifest-spec.md), [schema 0.1](../schema/0.1/capability.schema.json), and [prior discovery/granularity findings](../docs/spikes-1-3-research.md). Earlier public-sample research is context, not the baseline for this experiment.

The user confirmed that no prior matching run existed for the agreed 16 files. We therefore established a **new local original-metadata baseline**, not a historical Phase 0 measurement. The [fixed experiment protocol](structured-matching/README.md) compares the same candidates and requests with one lexical matcher. Requests and judgments were authored after the drafts by one reviewer from source metadata; no runtime verification or blind review occurred.

## Metadata model assessment

| Area | Finding | Recommendation |
| --- | --- | --- |
| Asset versus wrapper versus collection | All can represent a capability when independently adoptable/accountable. Packaging alone is not an identity boundary. | One identity per adoption unit; pure configuration wrappers normally become publications, while independent behavior/obligations justify a linked wrapper record. |
| Relationships | Toolkit/Runbook Search demonstrates containment; Incident Triage Agent demonstrates dependencies; agentic Playwright demonstrates a claimed fork. | Use `components`/`parent`, `embeddedComponents`, `dependencies`, and evidence-bearing `relations` for their distinct purposes. |
| Structured abilities | Canonical local terms reduce wording variation; typed ports describe expectations but are not verified runtime schemas. | Retain prose, local vocabulary, proposed types, published media types, and provenance; reference native contracts. |
| Missing and absent values | Omission does not establish none or not applicable. `[]` is a scoped declaration; null is rejected; unverified claims can remain present. | Keep typed fields and existing provenance. Specify optional unknown/not-applicable states without bypassing required fields or converting absent documentation to `[]`. |
| Model gaps | Multi-bundle membership, channel-specific setup, and confirmation-aware completeness need explicit conventions. | Resolve with inventory owners before production changes; do not silently reinterpret current schema behavior. |

Detailed sample evidence, supported representations, illustrative fragments, and the proposed field-state contract: [Relationships and Missing Information Assessment](metadata-model-assessment/results.md).

### Capability relationships and wrappers

Three valid patterns emerge: standalone reusable assets/services, independently managed wrappers that add behavior or adoption obligations, and bundles adopted as a solution. Additional governance, hosting, or interface responsibilities can justify a separate wrapper identity, but packaging or configuration alone does not.

The existing model supports these distinctions through publications, interfaces, relations, components, embedded components, and dependencies. For example, Playwright's configuration-only marketplace entry is a publication; SRE Toolkit is a bundle with Runbook Search as an independently adoptable component; Incident Triage Agent uses dependencies without thereby becoming their owner or a bundle. These mechanisms support consistent representation, but avoiding duplicates still requires evidence-based identity decisions.

### Unknown, not applicable, and explicitly absent information

| State | Meaning and treatment |
| --- | --- |
| Not provided | Optional field omitted; no answer or applicability claim is supplied. |
| Unknown | The answer is explicitly not known. Propose a field-state marker rather than treating omission as a confirmed unknown. |
| Not applicable | The concept does not apply in a stated scope; require a reason. No general core marker currently exists. |
| Declared none | A permitted empty list explicitly declares no entries, within that field's scope. `limitations: []` means no known limitations, not unlimited behavior. |
| Explicitly absent feature | A restriction establishes that behavior is excluded, such as never executing remediation; preserve it as a negative constraint. |
| Unverified | A claim is present but unconfirmed; retain provenance and verification status. |
| Conflicting | Sources disagree; retain attributable alternatives rather than silently selecting one. |
| Blank/null | Not a semantic state. Null is rejected, and empty strings must not substitute for unknown or not applicable. |

The current model already goes beyond simple presence/absence through empty-list semantics, `riskTier: unassessed`, provenance, and relation verification. The remaining gap is a general explicit unknown/not-applicable distinction. The proposed `x-fieldStates` sidecar preserves typed business fields, but its contents are not validated or interpreted by existing core consumers. Required fields and assessed-risk rules must not be bypassed.

## Structured examples: all 16 records

The [16 YAML ability drafts](../ability-descriptions/) provide names, descriptions, abilities, typed inputs/outputs, use cases, and source references. [Draft conventions](../ability-descriptions/capability-representations/structured-style/README.md) distinguish declared ports from inferred ones; all type representations remain proposed unless a native contract is inspected.

The [32-term vocabulary](ability-vocabulary.md) standardizes labels such as `sql-review`, `translation`, and `runbook-search` while preserving narrower behaviors. It is a local draft vocabulary, not an externally ratified taxonomy.

Other terms include `document-summarization`, `browser-automation`, `incident-triage`, `unit-test-generation`, and `agent-regression-evaluation`. The generic label `evaluation` is not a canonical term in this vocabulary; narrower labels distinguish agent regression evaluation, prompt/model comparison, and report generation.

Normalization reduces wording variation in the artifacts and makes comparisons easier to inspect; improved retrieval reliability was not demonstrated. Ability labels describe behavior rather than implementation, while separate descriptions preserve domain restrictions. The original manifest schema already supports interface ports and supported use cases, but the draft-level `abilities` vocabulary and proposed type annotations are custom research structures, not newly implemented core schema fields.

## Five-capability approach comparison

Selected SQL Review, Translator, Runbook Search, Playwright MCP, and Agent Evaluation Framework for distinct primary functions. The comparison searches the existing free-text and A2A-style files in `ability-descriptions/capability-representations/` and the OASF-inspired files in `research/description-comparison/oasf-inspired/`. The OASF arm uses these adaptations, not the original custom ability drafts.

| Approach | Finding on the selected artifacts | Limitation |
| --- | --- | --- |
| Free text | Readable summaries include useful context and restrictions. | Roles and constraints need text interpretation. |
| Simplified A2A style | Explicit input/output lists make data roles easy to locate. | These examples omit types and some restrictions; not full Agent Cards. |
| OASF-inspired adaptation | Mappings to OASF v1.1.3 taxonomy nodes expose broad skill categories; local details retain typed ports and constraints. | Not OASF-valid records; mappings may be broader than local abilities and require curation. |

The [qualitative comparison](description-comparison/results.md) includes per-capability observations and conformance boundaries. The [measured three-way results](description-comparison/experiment-results.md) compare all 15 existing artifacts using the same 16 requests, relevance judgments restricted to the five candidates, and one lexical matcher.

| Description approach | Returned pairs | Fully relevant pairs | Partial pairs | Strict precision | Recall |
| --- | --- | --- | --- | --- | --- |
| Free text | 9 | 5 | 3 | 55.6% | 100% |
| Simplified A2A style | 9 | 5 | 3 | 55.6% | 100% |
| OASF-inspired | 9 | 5 | 3 | 55.6% | 100% |

All three returned the same candidate sets for every request. Of the 16 requests, only five have fully relevant candidates in this smaller pool; the other 11 are negative controls. Each approach returned results for three zero-relevant requests. Partial matches count as strict false positives, and recall for zero-relevant requests is undefined, not 100%.

The field inventory provides a separate, measurable distinction: both YAML approaches have **10 named inputs and 6 named outputs** across the five capabilities. The OASF-inspired artifacts additionally provide **16 proposed port types, 16 inference flags, 5 mapped taxonomy nodes, and 5 top-level constraint entries**; the simplified A2A files contain none of those fields. Free text has no explicit port fields, but its prose does describe inputs, outputs, and selected constraints. These counts show explicit information organization, not verified compatibility or superior semantics.

The [method](description-comparison/experiment-method.md), [runner](description-comparison/run.rb), and [machine-readable results](description-comparison/experiment-results.json) retain exact matching evidence and input fingerprints. Existing content differs among approaches, so the results compare the selected artifacts rather than isolating format effects. Authoring time, human readability, native-standard conformance, and interoperability were not measured. The typed ports and constraints are local adaptations, not evidence that native OASF supplies or validates them.

**Conclusion:** retain structured information for inspectability and consistent field access, but do not claim that OASF outperformed free text or A2A in discovery. These five-candidate scores are not directly comparable with the 16-record experiment below because the candidate pool and relevance totals differ.

## Discovery experiment results

Sixteen requests cover supported needs and three unsupported controls. Relevance is judged against original descriptions, use cases, and component evidence. All unlisted records are not relevant; partial matches do not count toward strict precision.

| Representation searched | Returned request-record pairs | Relevant pairs | Strict precision | Recall |
| --- | --- | --- | --- | --- |
| Original metadata baseline | 31 | 19 | 61.3% | 100% |
| Custom structured drafts | 32 | 19 | 59.4% | 100% |
| Original plus drafts (supporting arm) | 32 | 19 | 59.4% | 100% |

Structured precision decreased by **1.9 percentage points** with no relevant-match gain. The added `runbook-search` ability retrieved Incident Triage Agent for live web search despite its internal runbook scope. Both approaches also produced unsuitable matches for Spanish translation and automatic remediation. Resource, language, and execution constraints must be evaluated, not just keywords.

Structured drafts make abilities, ports, use cases, and inference evidence explicit and inspectable. This is a representational benefit, not a measured significant improvement in explainability, comparability, or reuse outcomes. More fields alone cannot establish suitability.

Recall is pooled over requests with relevant records; zero-relevant controls have undefined recall and explicit false-positive counts. Revisions and the duplicate-ID fork remain separate source records. Invalid/deprecated fixtures are retained for described-function testing, not endorsed for adoption. Augmented is a superset OR-search, so its recall cannot decrease; this is not algorithmic improvement.

See [full results and rankings](structured-matching/results.md), [machine-readable evidence](structured-matching/results.json), and [requests/judgments](structured-matching/needs.yaml). This does not demonstrate type compatibility, statistical generalization, A2A/OASF interoperability, or production suitability.

## Assessment of model support

| Capability of the model | Assessment |
| --- | --- |
| Identity, version, and lifecycle representation | Supported by the current manifest; schema validity does not prove correct inventory identity or maintenance. |
| Relationships, wrappers, bundles, and dependencies | Supported mechanisms exist; wrapper boundaries and multi-bundle membership still need owner agreement. |
| Multi-channel publications and interfaces | Supported; channel-specific setup and behavioral differences may need finer scoping. |
| Provenance and verification | Supported for attributable claims; not all example values have confirmed evidence. |
| Structured abilities and typed descriptions | Demonstrated by custom drafts and OASF-inspired mappings, not fully integrated or native-standard-validated schema features. |
| Discovery and comparison | Metadata can supply comparison inputs; tested keyword retrieval did not improve with richer descriptions. |
| Unknown/not-applicable distinction | Proposed optional convention; requires a defined consumer and validation contract. |

## Decision recommendations

1. Retain a common manifest core for independently adoptable units; separate publication identity, wrapper lineage, containment, and dependencies.
2. Preserve original prose alongside structured abilities. Map broad external taxonomy categories explicitly rather than relabeling local YAML as a native standard.
3. Add evidence-backed scope constraints for resource corpus, languages, dialects, and execution versus proposal. Missing or unverified support should require confirmation.
4. Preserve field-specific omission and empty-list rules; reject null as a state marker. Pilot a documented `x-fieldStates` contract for optional unknown/not-applicable facts, with reason, scope, and attribution.
5. Separate functional match, verified compatibility, lifecycle, and governance approval. A plausible or complete metadata record is not automatically reusable.
6. Do not select a description standard solely from these retrieval scores: the three approaches tied. Prefer explicit roles, evidence, and constraints for inspection, and require native-schema validation and consumer evaluation before claiming interoperability.
7. Assign stewardship of the draft ability vocabulary: review additions, define aliases and deprecations, and maintain versioned external-taxonomy mappings. Separately define port naming/type and use-case conventions; they are not yet controlled vocabularies established by this study.

## Future work and remaining validation

The research artifacts cover the requested areas; production decisions remain provisional. Follow-up validation should include owner review of wrapper boundaries and absence declarations, a validated field-state contract, inspected native port schemas, and a separately versioned constraint-aware experiment with independently judged/held-out requests. Preserve this baseline rather than tuning it to manufacture improvement.

Extend evaluation to broader real inventories with distinct assets, diverse requests, and independent relevance review. Measure constraint-aware precision/recall, information-maintenance effort, and actual compatibility/reuse decisions before making production-scale or interoperability claims.

## Conclusion

Recommend the capability-centered manifest as a **provisional foundation for further adoption and validation**, preserving source descriptions, identity, relationships, publications, and provenance. The study demonstrates how the selected records can be described and inspected consistently; it does not demonstrate scalable discovery, improved precision, or successful runtime reuse.

Structured ability drafts and OASF-inspired mappings provide useful explicit organization, but are not proof of interoperability. Vocabulary governance, field-state handling, scoped constraints, and consumer validation are the next steps toward a reliable capability intelligence model. Adoption should be conditional on those agreements and evaluations, rather than justified by an unmeasured claim that one description approach is strongest.
