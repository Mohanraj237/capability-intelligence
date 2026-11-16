# Phase 1 tickets

This document holds four tickets, Ticket 1 to Ticket 4, one per workstream in [phase-1-plan.md](phase-1-plan.md). Each ticket is the brief for one teammate; the ticket number matches the spike number.

| Ticket | Brief | Workstream | Open questions |
|---|---|---|---|
| Ticket 1 | Spike 1: Standards Alignment and AI Catalog Interoperability | A – Standards alignment | U7, SemVer/purl stances |
| Ticket 2 | Spike 2: Metadata Model and Structured Capability Descriptions | B – Metadata model | U4, U5, U10 |
| Ticket 3 | Spike 3: Capability Identity, Publications, and Lifecycle | C – Identity and lifecycle | U2, U3, U6 |
| Ticket 4 | Spike 4: Evidence Quality, Completeness Levels, and Consumer Needs | D – Evidence and consumers | U1, U8, U9 |

---

# Spike 1: Standards Alignment and AI Catalog Interoperability

**Mission:** AI Capability Intelligence & Standards

## Objective

Validate how the proposed AI Capability Manifest can reuse or interoperate with existing standards and ecosystems, minimizing duplication while identifying the metadata and conventions that Mission 4 must define independently.

## Research Areas

1. **AI Catalog:** Evaluate whether the proposed manifest should be represented as an AI Catalog entry or support conversion to and from its format.
2. **Existing Capability Formats:** Review selected MCP, Agent Skills, plugin, npm, and Docker capability records to assess how their metadata maps to the proposed manifest.
3. **Semantic Versioning (SemVer):** Determine appropriate versioning conventions for capability versions and compatibility.
4. **Package and Resource Identifiers (purl):** Evaluate whether purl or another identifier convention is suitable for identifying capabilities and their packaged resources.
5. **Metadata Interoperability:** Examine field mappings, conversion feasibility, and information that may be lost when translating between formats.

## Tasks

- Review the relevant AI Catalog specification and the existing Phase 0 standards research.
- Select 10 representative manifests from the agreed sample set.
- Map the selected manifests to the AI Catalog format and produce conversions where feasible.
- Document fields that map directly, require transformation, or cannot be represented.
- Evaluate SemVer and purl conventions against the proposed manifest requirements.
- Recommend what Mission 4 should adopt, adapt, or define independently.

## Deliverables

Submit a concise research document containing:

1. **Standards comparison:** Relevant conventions, metadata coverage, versioning and identifier support, and applicability to Mission 4.
2. **Mapping and conversion results:** Mappings and converted examples for the selected 10 manifests.
3. **Field-loss analysis:** Fields that are lost, transformed, or unsupported during conversion.
4. **Decision recommendations:** Recommendations for AI Catalog interoperability, SemVer, and purl, with supporting evidence.

## Expected Outcome

An evidence-backed recommendation for standards alignment and interoperability that identifies practical reuse opportunities and clarifies which manifest conventions Mission 4 needs to define independently.

---

# Spike 2: Metadata Model and Structured Capability Descriptions

**Mission:** AI Capability Intelligence & Standards

## Objective

Validate whether the proposed metadata model supports meaningful capability discovery, comparison, and reuse, and determine how structured descriptions can improve matching beyond free-text metadata.

## Research Areas

1. **Capability Relationships and Wrappers:** Evaluate whether a capability should represent an individual asset, a wrapper around an asset, or a collection of related assets.
2. **Structured Abilities:** Explore a consistent vocabulary for describing capability abilities, inputs, outputs, and supported use cases.
3. **Unknown and Not-Applicable Values:** Determine how to represent declared absence of information, explicitly absent features, and information that has not been verified.
4. **Discovery and Matching:** Assess whether structured metadata improves the ability to identify relevant capabilities for a given use case.
5. **Description Approaches:** Compare free-text descriptions, A2A-style skill descriptions, and OASF-style structured capability descriptions.

## Tasks

- Review the Phase 0 metadata proposals and relevant findings from the discovery journey.
- Draft structured ability descriptions, including input and output types, for 16 relevant capabilities from the agreed sample.
- Compare free-text, A2A-style, and OASF-style descriptions on a selected set of five capabilities.
- Rerun the agreed discovery-matching experiment using the structured descriptions.
- Compare the results against the Phase 0 baseline, including changes in relevant match precision where measurable.
- Evaluate the proposed wrapper and unknown/not-applicable conventions.
- Recommend the metadata structures and conventions that best support discovery and reuse.

## Deliverables

Submit a concise research document containing:

1. **Metadata model assessment:** Findings on wrappers, structured abilities, and unknown/not-applicable states.
2. **Structured examples:** Draft ability descriptions with input and output types for 16 capabilities.
3. **Approach comparison:** Comparison of free-text, A2A-style, and OASF-style descriptions using the selected examples.
4. **Discovery experiment results:** Comparison against the agreed Phase 0 baseline, including matching precision and limitations.
5. **Decision recommendations:** Recommendations for the metadata model, ability vocabulary, and representation of missing or explicitly absent information.

## Expected Outcome

An evidence-backed metadata recommendation demonstrating how the proposed manifest can represent capabilities consistently and improve discovery, comparison, and reuse.

---

# Spike 3: Capability Identity, Publications, and Lifecycle

**Mission:** AI Capability Intelligence & Standards

## Objective

Validate how capabilities should be identified, referenced across multiple sources, and described throughout their lifecycle without creating unnecessary duplication or unstable identifiers.

## Research Areas

1. **Capability Identity:** Evaluate stable identifiers, readable namespaced identifiers, URNs, and the need for namespace allocation.
2. **Sources and Publications:** Assess whether source information should remain a standalone field or be represented through a publications model that supports multiple references.
3. **Lifecycle Status:** Evaluate whether lifecycle status should be owner-declared, optional, or required, and how its values should be interpreted.
4. **Record Drift:** Examine how capability metadata changes over time and the implications for identifiers, source references, and manifest maintenance.
5. **Cross-Mission Requirements:** Identify implications for capability discovery, registration, and consumption by other missions.

## Tasks

- Review the Phase 0 identity, source, and lifecycle proposals.
- Revisit the agreed sample of 60 capability records on or after November 5, 2026, and compare the results with the October 22 baseline.
- Document changes in record availability, metadata fields, identifiers, and source references where observable.
- Prototype representing source information through a `publications[]` structure on five selected manifests.
- Compare readable namespaced identifiers, URNs, and alternative identifier approaches against stability, uniqueness, and practical adoption requirements.
- Evaluate lifecycle declaration options and their effect on records with incomplete or unavailable lifecycle information.
- Identify decisions requiring agreement from Missions 2 and 5.
- Recommend an identity, publication, and lifecycle approach supported by the evidence.

## Deliverables

Submit a concise research document containing:

1. **Identity assessment:** Comparison of identifier approaches, including stability, uniqueness, and namespace considerations.
2. **Publications prototype:** Five example manifests demonstrating the proposed `publications[]` representation and its trade-offs.
3. **Sample drift report:** Comparison of the 60-record sample against the Phase 0 baseline, documenting observable changes and limitations.
4. **Lifecycle assessment:** Options and recommendations for lifecycle values and declaration requirements.
5. **Decision recommendations:** Proposed conventions and outstanding cross-mission decisions.

## Expected Outcome

A practical recommendation for stable capability identity, multi-source references, and lifecycle representation that supports reliable discovery and cross-system interoperability.

---

# Spike 4: Evidence Quality, Completeness Levels, and Consumer Needs

**Mission:** AI Capability Intelligence & Standards

## Objective

Validate how capability metadata completeness should be assessed, how reliably capabilities can be evaluated for discovery and reuse, and whether the proposed completeness approach meets the needs of downstream consumers.

## Research Areas

1. **Completeness Model:** Compare fixed mandatory fields with completeness levels that distinguish different degrees of metadata readiness.
2. **Evaluation Reliability:** Assess whether independent evaluators reach consistent judgments when assessing capability discovery and identity.
3. **Owner Effort:** Estimate the effort required for capability owners to provide important metadata, particularly setup instructions and limitations.
4. **Downstream Consumer Requirements:** Validate whether Missions 1, 2, and 5 can consume and act on the proposed completeness levels.
5. **Evidence and Confidence:** Determine how to distinguish verified information, unverified information, and explicit declarations that information is unavailable or not applicable.

## Tasks

- Review the Phase 0 completeness proposal and the evidence gathered from the discovery and identity journeys.
- Independently evaluate the agreed Phase 0 discovery and identity cases before reviewing the original judgments.
- Compare the independent judgments with the original results and document agreement, disagreements, and likely causes.
- Conduct a small owner-effort pilot with three to five capability owners, where feasible, focusing on setup instructions and limitations.
- Record completion time, difficulties, missing information, and practical barriers; treat the results as exploratory rather than representative of all owners.
- Consult Missions 1, 2, and 5 on whether the proposed completeness levels meet their consumer requirements.
- Compare completeness levels with a fixed mandatory-field approach, considering discovery quality, usability, and implementation complexity.
- Recommend which fields should be mandatory and whether completeness levels should be adopted, amended, or deferred.

## Deliverables

Submit a concise research document containing:

1. **Completeness assessment:** Comparison of completeness levels and fixed mandatory fields, including practical trade-offs.
2. **Evaluation agreement report:** Independent assessment results, agreement measures, disagreements, and limitations.
3. **Owner-effort findings:** Results from the owner pilot, including completion times and observed metadata gaps.
4. **Consumer feedback:** Findings from Missions 1, 2, and 5, including unresolved requirements.
5. **Decision recommendations:** Recommendations for completeness levels, mandatory fields, evidence states, and outstanding consumer decisions.

## Expected Outcome

An evidence-backed completeness and evaluation approach that balances metadata quality, discovery effectiveness, owner effort, and the needs of downstream missions.
