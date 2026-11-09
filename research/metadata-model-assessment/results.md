# Metadata Model Assessment: Relationships and Missing Information

## Outcome and evidence boundary

A capability should represent an **independently adoptable and accountable unit**, not automatically a repository, package, wrapper, or individual ability. A unit may be a standalone asset/service, a behavior-changing wrapper, or an adoptable bundle. Packaging-only wrappers should normally be publications of the underlying capability.

Keep omission for information not supplied, meaningful empty lists for declared absence, and provenance for claims and verification. The current model does **not** explicitly distinguish unknown from not applicable. Recommend a field-state sidecar for those cases rather than strings such as `"unknown"` in typed fields.

This is a documentary assessment of the existing schema, specification, earlier research, and agreed 16 example records. It does not validate runtime behavior or change the schema. Earlier public-sample findings are supporting evidence, not measurements on these 16 records. Sources: [manifest specification §§5–6](../../docs/manifest-spec.md), [schema 0.1](../../schema/0.1/capability.schema.json), and [prior research §§9.1–9.5](../../docs/spikes-1-3-research.md).

## Research Area 1: Capability relationships and wrappers

### What counts as a capability?

| Question | Finding | Recommended boundary |
| --- | --- | --- |
| Is a capability an asset? | Often: SQL Review is an independently usable skill; Acme Observability is a provider-hosted service without accessible source. | One record for an adoptable unit with identity, adoption interface, ownership, and lifecycle. A repository is a source, not the unit by default. |
| Is a capability a wrapper? | Sometimes. A wrapper can add independent behavior, configuration, policy, interface adaptation, or hosting obligations. | Give it a separate ID when its adoption or accountability differs materially. A label of “wrapper” alone is insufficient. |
| Is a capability a collection? | Yes, when consumers adopt the collection as a managed bundle, as with SRE Toolkit. | Give the bundle its own record; reference independently adoptable children and describe non-adoptable parts inline. |
| Is every ability a capability? | No. Browser automation, screenshot capture, and form interaction describe behaviors of Playwright MCP. | Keep abilities within a capability unless they are separately published/adoptable units. |

Decide identity using adoption, behavior, and accountability together. Different interfaces or package channels do not by themselves imply different capabilities. Different maintainer responsibilities, security boundaries, terms, or independently managed lifecycle can justify a separate wrapper/service even when its function looks similar.

### Boundary cases in the agreed examples

| Evidence | Assessment | Representation and discovery consequence |
| --- | --- | --- |
| [SQL Review](../../examples/valid/sql-review.capability.yaml) is a skill with Agent Skill and CLI interfaces. | One asset, multiple consumption interfaces. | One ID and record; `interfaces` describes access. Do not duplicate the capability for the CLI. |
| [Playwright MCP](../../examples/valid/playwright-mcp.capability.yaml) lists registry, npm, Docker, and marketplace publications. The marketplace entry only configures the server. | Packaging/configuration wrapper is represented as another publication of the same capability. | Keep one functional identity with `publications`; retain native names and channel versions. Do not inflate result counts with every channel. |
| [agentic-playwright-mcp](../../examples/valid/agentic-playwright-mcp.capability.yaml) claims a fork and adds multi-agent tab isolation. | Distinct behavior and publisher justify its own record; origin remains an unverified claim. | Own ID with `relations.type: fork_of`, target ID, evidence, and `verified: false`. Do not merge it into Microsoft Playwright or invent a verified fork relationship. |
| [SRE Toolkit](../../examples/valid/sre-toolkit.capability.yaml) includes Runbook Search and three inline parts. [Runbook Search](../../examples/valid/runbook-search.capability.yaml) is independently adoptable and names its parent. | Adoptable bundle with a standalone child plus embedded prompt/command/hook. | `components` references Runbook Search; reciprocal `parent` identifies the bundle; `embeddedComponents` describes non-adoptable parts. The deprecated bundle does not imply the active child is deprecated. |
| [Incident Triage Agent](../../examples/valid/incident-triage-agent.capability.yaml) depends on runbook, observability, and roster capabilities. | Dependency-consuming agent, not automatically a bundle or wrapper. | Use `dependencies`, not `components` merely because another capability is called. A missing roster record is unresolved, not a nonexistent dependency. |
| [Acme Observability](../../examples/valid/observability-mcp-server.capability.yaml) exposes a hosted endpoint with subscription terms and no accessible code. | Independently adoptable service; a code repository is unnecessary. | `source.type: provider`, publications, runtime, and setup identify adoption. A hosted service is not automatically a wrapper of an unknown implementation. |
| SQL Review baseline and two [compatibility revisions](../../examples/compatibility/) share an ID; the [analytics fork](../../examples/consistency/duplicate-id.capability.yaml) improperly reuses it. | Revisions are versions of one identity; the fork illustrates an identity error. | Compare revisions historically, not as simultaneous current inventory entries. Allocate a distinct fork ID before real registration. The experiment kept all four separate by source file for fixture-level evaluation. |

### Representation rules

| Situation | Current supported mechanism | Recommendation |
| --- | --- | --- |
| Same asset, different packaging/channel | `publications` and `interfaces` | Reuse identity; retain channel-specific metadata. |
| Independent behavior-changing wrapper | Separate record plus `relations` with `type: wraps` and `id` or `locator` | Explain what is added and who owns it; state evidence and verification. Use `fork_of` when provenance is a fork, not just an adapter. |
| Adoptable collection | `components`, child `parent`, and `embeddedComponents` | Distinguish containment from dependency. Do not expose all child functions as direct bundle ports without evidence. |
| Required external capability | `dependencies` | Describe a required dependency rather than claiming equivalent behavior or ownership. |
| Unknown relation target identity | Relation `locator` instead of a made-up ID | Keep target locatable and unverified until identity is established. |

Existing bundle fragment, preserved from SRE Toolkit:

```yaml
components:
  - id: sre/runbook-search
embeddedComponents:
  - name: postmortem-template
    type: prompt
    description: Prompt template that drafts a blameless postmortem from an incident timeline.
```

Illustrative relation fragment for a separately managed wrapper, **not a new observed sample**:

```yaml
relations:
  - type: wraps
    id: microsoft/playwright-mcp
    evidence: A curator must document the adapter behavior and target before registration.
    verified: false
```

This fragment is not a complete manifest. It does not assert an actual wrapper or verification event.

### Model limitations and open decisions

- Configuration-only wrapper identity is an open inventory decision in the earlier research (U4). Recommend publication by default, with an exception for independently governed adoption/security/hosting obligations. This recommendation is not an enforced schema rule.
- `parent` is singular while a reusable component can belong to several bundles. `components` can reference the same child from multiple bundles, but reciprocal-parent expectations need a deliberate multi-membership convention before production use.
- Global `setup` and `limitations` can blur differences between package, container, and hosted publications. Preserve channel scope in descriptions now; evaluate publication/interface-scoped requirements as a future schema change.
- Separate interfaces on one capability do not prove equivalent tool behavior. Native contracts and scoped evidence are still needed.
- Matching through components/dependencies should disclose the path: “available through a bundle” or “used internally by an agent” is not the same as a directly callable operation.

## Research Area 3: Unknown, not applicable, blank, and explicitly absent values

### State distinctions

| State | Meaning | Current model | Recommended interpretation |
| --- | --- | --- | --- |
| Not provided | This record supplies no answer; applicability and knowledge are unresolved. | Optional field omitted. | Do not infer none, unsupported, free, safe, or not applicable. |
| Unknown | The information is explicitly not known after inquiry/review. | Ordinary optional fields are omitted, indistinguishable from not provided; risk has `unassessed`. | Record field-specific knowledge state and evidence in a sidecar. |
| Not applicable | A concept does not apply in a stated context. | Usually omitted; no general explicit marker. `versionScheme: unversioned` handles one specific version case. | Require a reason and scope. Do not equate “not supplied” with inapplicability. |
| Declared none | A scoped collection explicitly has no entries. | `[]` for permitted fields, including `dependencies`, `setup`, `limitations`, and `components`. | Attribute the declaration. `limitations: []` means no limitations known, not an unlimited capability. |
| Explicitly absent feature | A known behavior is not supported, distinct from unknown support. | Restrictions can be stated in `limitations`; no general feature-state model. | Keep a negative constraint with evidence. Never search its negated wording as proof of support. |
| Unverified | A value or claim exists, but confirmation is absent. | `provenance`, heuristic `basis`, missing `confirmedBy`; relations with `verified: false`. | Preserve the value and uncertainty. Verification is separate from presence/applicability. |
| Conflicting | Sources assert different values. | Publication versions and lifecycle signals retained; validator reports discrepancies. | Preserve source-scoped alternatives; do not choose a value silently. |
| Blank/null | Empty entry, YAML key with no value, or literal null; no defined semantic state. | `null` is rejected. Empty strings are field-specific and must not be used as state markers. | Reject as invalid content or resolve through an explicit ingestion workflow; never automatically turn it into declared none. |

Example: `setup:` with nothing after it parses as null. `setup: []` explicitly declares no setup items. Omitting `setup` means no answer is supplied. These are not interchangeable.

### Evidence from the samples

| Example | What can be concluded | What must not be concluded |
| --- | --- | --- |
| [SQL Review](../../examples/valid/sql-review.capability.yaml) has `setup: []` and `dependencies: []`. | The metadata declares no adopter setup items and no other capability dependencies. | No runtime, host, package, or operational prerequisites of any kind exist. Dependency scope is capability references. |
| [Playwright MCP](../../examples/valid/playwright-mcp.capability.yaml) omits setup and limitations. | Those facts are not supplied by this snapshot. | It needs no setup or has no limitations. |
| [Acme Observability](../../examples/valid/observability-mcp-server.capability.yaml) omits `capabilityVersion` but declares `versionScheme: unversioned`. | Its hosted publication has no published version under the stated scheme. | Every hosted service is unversioned, or all version-related metadata is inapplicable. |
| [agentic-playwright-mcp](../../examples/valid/agentic-playwright-mcp.capability.yaml) retains an unverified fork claim and heuristic provenance. | Claimed lineage and inferred type are available with uncertainty. | A resolved target confirms the relation, or inference proves behavior. |
| [Playwright MCP](../../examples/valid/playwright-mcp.capability.yaml) records npm 0.0.83, registry 0.0.82, commit and floating publications. | Channel-specific versions differ; each remains attributable. | One authoritative “latest version” can be silently selected. |
| [Incident Triage Agent](../../examples/valid/incident-triage-agent.capability.yaml) says it never executes remediation. | Execution is explicitly excluded by the documented behavior. | Mentioning remediation makes it suitable for automated remediation. |
| [Translator invalid fixture](../../examples/invalid/invalid-types-and-values.capability.yaml) uses `owner.contact: null`. | The manifest has invalid contact content. | The owner intentionally declared contact unknown or inapplicable. |

### Recommended convention: retain typed fields plus a state sidecar

Do not wrap every scalar in a status object, put `"unknown"` in booleans/numbers, or weaken required fields. Retain the current core and provenance. Explore a versioned **`x-fieldStates` extension** for optional unknown/not-applicable facts, using JSON Pointer paths, state, reason, scope where needed, and evidence/attribution when available.

Illustrative optional-field convention:

```yaml
# Proposed sidecar; core setup and capabilityVersion are omitted here.
# This is not an observed capability or a complete manifest.
x-fieldStates:
  - field: /setup
    state: unknown
    reason: Setup requirements have not been established from the available documentation.
  - field: /capabilityVersion
    state: not_applicable
    scope: Hosted publication with an explicitly unversioned contract.
    reason: No capability-level release version is assigned in this illustrative case.
```

This is a **proposal**, not a standard implemented by schema 0.1. The schema accepts top-level `x-` fields without validating their contents, and core consumers ignore them. A future consumer/schema contract must enforce:

1. States apply only where omission is allowed; they cannot satisfy mandatory or conditional requirements.
2. A field marked unknown/not applicable must not simultaneously contain a contradictory core value. Scope must disambiguate publication-specific cases.
3. Not applicable requires a rationale; unknown is used only when explicitly assessed as unknown. Otherwise leave it not provided.
4. Present values use existing provenance and verification mechanisms; unverified is not confused with absent.
5. Empty-list declarations need an attributed, scoped basis, preferably an owner declaration. A failed lookup or missing documentation never generates `[]`.
6. Neither sidecar markers nor empty lists automatically increase adoption confidence. Current completeness treats allowed present empty lists as stated; confirmation-aware adoption is a proposed consumer enhancement.

For `interfaces`, `supportedUseCases`, `relations`, and `provenance`, empty lists are not universally valid: these fields require at least one entry when present. Preserve field-specific cardinality.

Use `riskTier: unassessed` for unassessed risk; it is not low risk and cannot be marked not applicable to bypass governance. Explicit false behaviors can be recorded in limitations now, with typed constraint extensions considered later.

## Implications for discovery and reuse

The [matching experiment](../structured-matching/results.md) retrieved Incident Triage Agent for live web search after adding `runbook-search`; its internal dependency does not establish a general web-search interface. The Spanish translation and remediation controls also demonstrate that word presence is insufficient.

Recommended flow: shortlist by ability, then check resource scope, supported language, execution behavior, direct versus delegated access, lifecycle, and evidence. An explicitly contradictory constraint rejects suitability; missing or unverified evidence yields **needs confirmation**, not a positive match. A compatibility decision must still inspect native contracts.

## Decision recommendations

Adopt the independently adoptable-unit boundary, existing relationship mechanisms, source-scoped publications, typed fields, and provenance. Prefer publication-only treatment for configuration wrappers unless independent obligations justify a distinct record. Preserve omission versus empty lists versus negated behavior. Pilot an optional field-state sidecar without changing the existing examples or treating its presence as schema validation.

Before production adoption, obtain inventory-owner agreement on wrapper identity, multi-bundle membership, and declaration authority. Define and validate a field-state contract, then evaluate constraint-aware matching as a **new experiment revision**, keeping the existing baseline unchanged.
