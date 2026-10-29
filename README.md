# AI Capability Manifest: Mission 4 proof of concept

A working proof of concept for **Mission 4: AI Capability Intelligence & Standards**, which owns the
common data model and interoperability: how capabilities are represented, described, versioned,
and exchanged so that the other missions operate on consistent information. It contains:
- a machine-readable standard for describing AI capabilities (skills, agents, MCP servers, tools,
  plugins, frameworks, platforms, and more);
- a validator that reports actionable errors and the completeness level each manifest reaches;
- compatibility checks for capability revisions and for schema versions;
- contracts for exchanging capability information between teams.

| Deliverable | Location |
|---|---|
| Canonical manifest schema, v0.1 (JSON Schema Draft 2020-12) | [`schema/0.1/capability.schema.json`](schema/0.1/capability.schema.json) |
| Inter-team contracts: validation report (for the contribution workflow), capability exchange document | [`schema/contracts/`](schema/contracts/) |
| YAML manifests: 8 representative (6 capability types; 2 of them real public capabilities), 5 invalid, plus consistency and compatibility scenarios | [`examples/`](examples/) |
| Field documentation, generated from the schema | [`docs/field-dictionary/0.1.md`](docs/field-dictionary/0.1.md) |
| Rules: identifiers, lifecycle, versioning, compatibility, risk, missing data, extensibility | [`docs/manifest-spec.md`](docs/manifest-spec.md) |
| Boundary and scope review against Missions 1-5 | [`docs/mission-boundaries.md`](docs/mission-boundaries.md) |
| Journey pilot: discovery and reuse journeys tested on a random sample of real capabilities | [`docs/journey-pilot.md`](docs/journey-pilot.md), [`pilot/`](pilot/) |
| Spikes 1-3 research: four journeys on 60 real capability records in seven formats, the evidence behind the 2026-10-23 revision of 0.1 | [`MISSION4_SPIKES_1_TO_3_RESEARCH.md`](MISSION4_SPIKES_1_TO_3_RESEARCH.md), [`research/spikes-1-3/`](research/spikes-1-3/) |
| Validator, compatibility checkers, exchange export (CLI and library) | [`bin/`](bin/), [`src/`](src/) |
| POC report: findings, decisions, traceability, verification, open questions | [`docs/poc-report.md`](docs/poc-report.md) |

> Status: POC; schema 0.1 is an unpublished draft. Several rules are proposals made by this POC,
> because the four spike documents define research questions but contain no findings yet. On
> 2026-10-23 the draft was revised in place to apply the proposals of the Spikes 1-3 research,
> at the Mission 4 lead's direction; those are proposals too. Each rule's provenance is tagged in
> [`docs/manifest-spec.md`](docs/manifest-spec.md). Mission 4 owns
> the structure and rules only. Inventory content, risk classifications, approvals,
> recommendations, and the contribution workflow belong to the other missions
> ([`docs/mission-boundaries.md`](docs/mission-boundaries.md)).

## Quick start

Requires Node.js 22 or later.

```bash
npm install          # ajv, ajv-formats, yaml, semver (exact versions pinned)
npm test             # 206 unit, contract, pilot, research, and CLI tests (node:test)
node bin/capability-manifest.js validate examples/valid
```

Every command is also available as an npm script, for example
`npm run validate -- examples/valid` or `npm run compat -- <previous> <next>`.

## Commands

```text
capability-manifest validate <path...> [--format text|json] [--check-sources] [--require-level <level>]
capability-manifest compat <previous> <next> [--format text|json]
capability-manifest export <path...> [--format text|json] [--out exchange.json]
capability-manifest schema-compat <previous> <next> [--corpus <path>]... [--format text|json]
capability-manifest docs [--out-dir docs/field-dictionary]
```

Exit codes: `0` no errors, `1` validation or compatibility errors, `2` usage or I/O error.
Directories are searched recursively for `.yaml`, `.yml`, and `.json` files. Manifests passed in one
call are validated together, so that duplicate ids and references can be checked across them, and
each is routed to the schema of its own `schemaVersion`.

### Validate a valid manifest

```text
$ node bin/capability-manifest.js validate examples/valid/incident-triage-agent.capability.yaml
VALID    examples/valid/incident-triage-agent.capability.yaml
         ai-platform/incident-triage-agent - agent - validated against schema 0.1
         checks: structure passed, identity passed, references unverified, metadata passed, risk unverified, source unverified
         completeness: discoverable (assessable needs: license)
         UNVERIFIED  SOURCE_NOT_CHECKED  /source (line 15, col 3)
           Source reachability was not checked (offline by default).
           next: Run with --check-sources to attempt an HTTPS reachability check.
         UNVERIFIED  RISK_UNASSESSED  /riskTier (line 22, col 11)
           riskTier is 'unassessed': no risk assessment is recorded. It must not be treated as low risk or as approved.
           next: Request a risk assessment from the governance owners, then record the tier and assessmentReference.
         ... (3 x UNRESOLVED_REFERENCE: its dependencies were not part of this run)

Summary: 1 manifest(s): 1 valid, 0 invalid - 0 error(s), 0 warning(s), 5 unverified check(s)
Completeness of the 1 structurally valid manifest(s): none 0, discoverable 1, assessable 0, adoptable 0, governed 0
Note: Structural validity does not establish that a source is reachable, a dependency is available, or a capability is secure or approved for production.
```

Errors, warnings, and **unverified** checks are kept apart. An unverified check is one this run
could not confirm; it has neither passed nor failed. Validating the whole set
(`validate examples/valid`) resolves those references and reports 8 valid manifests with
0 errors, 1 warning, and 20 unverified checks, at every completeness level from none to governed.

### Invalid manifests: conditional rule and unsupported schema version

```text
$ node bin/capability-manifest.js validate examples/invalid/conditional-requirement-violation.capability.yaml examples/invalid/unsupported-schema-version.capability.yaml
INVALID  examples/invalid/conditional-requirement-violation.capability.yaml
         ai-platform/meeting-notes-agent - agent - validated against schema 0.1
         checks: structure failed, identity skipped, references skipped, metadata skipped, risk skipped, source skipped
         ERROR  CONDITIONAL_FIELD_REQUIRED  /assessmentReference (line 4, col 1)
           Field 'assessmentReference' is required because riskTier is 'low'. Rule: An assessed riskTier must cite the assessment that produced it, so that a tier cannot be self-asserted.
           fix: Add assessmentReference with the assessment record id (for example 'id: RA-2026-0142'), or set riskTier to 'unassessed' if no assessment has been completed.
         ERROR  CONDITIONAL_FIELD_REQUIRED  /deprecation (line 4, col 1)
           Field 'deprecation' is required because lifecycleStatus is 'deprecated'. Rule: A deprecated or retired capability must record why, so that adopters can plan a migration.
           fix: Add a deprecation block with a 'reason' (and 'replacedBy' if a replacement exists), or correct lifecycleStatus.

INVALID  examples/invalid/unsupported-schema-version.capability.yaml
         ai-platform/code-search - service - not validated against any schema
         checks: structure failed, identity skipped, references skipped, metadata skipped, risk skipped, source skipped
         ERROR  SCHEMA_VERSION_UNSUPPORTED  /schemaVersion (line 5, col 16)
           schemaVersion "2.0" is not supported by this validator (supported: 0.1); the manifest was not validated further.
           fix: Use a validator release that supports schema 2.0, or author the manifest against schema 0.1.

Summary: 2 manifest(s): 0 valid, 2 invalid - 3 error(s), 0 warning(s), 0 unverified check(s)
```

Run `validate examples/invalid` to see every invalid example. The output includes:
- a missing mandatory field;
- a wrong type, such as unquoted `0.1` or `null`;
- a disallowed value (`mcp-server` gets "Did you mean 'mcp_server'?");
- a URL used as an id;
- an unknown field (`lifecyleStatus` gets "Did you mean 'lifecycleStatus'?");
- a field name from a native format (`tags` gets "Use 'keywords': it holds what native formats call
  'tags'.");
- an accepted `x-` extension field.

`--format json` produces the [validation-report contract](schema/contracts/validation-report-0.1.schema.json),
intended for automation such as the validation step of the contribution workflow. Each finding has
`severity`, `stage`, `check`, `code`, `path` (a JSON Pointer), `line`, `column`, `message`, and
`hint`; findings about shared sources and publications list the other manifests' ids in `related`.
Each result carries its `completeness`.

### Completeness levels

Only six fields are mandatory: `schemaVersion`, `id`, `name`, `capabilityType`, `source`, and
`riskTier`. Every source can supply them. Above that, the validator reports the highest
completeness level a manifest reaches, and what the next level needs:

| Level | Adds |
|---|---|
| discoverable | a description and an interface |
| assessable | runtime, license, a version, a lifecycle signal, an owner |
| adoptable | setup, an owner contact, limitations (an empty list declares none) |
| governed | an assessed risk tier with its assessment reference |

Levels are reported, not enforced, unless a caller requires one:

```text
$ node bin/capability-manifest.js validate examples/valid/playwright-mcp.capability.yaml --require-level adoptable
INVALID  examples/valid/playwright-mcp.capability.yaml
         microsoft/playwright-mcp - mcp_server - validated against schema 0.1
         checks: structure passed, identity passed, references passed, metadata failed, risk unverified, source unverified
         completeness: assessable (adoptable needs: setup, limitations)
         ERROR  COMPLETENESS_BELOW_REQUIRED  / (line 10, col 1)
           The manifest reaches completeness level 'assessable'; this validation requires 'adoptable'.
           fix: Provide the missing facts (adoptable: setup, limitations), with their provenance where known.
         UNVERIFIED  SOURCE_NOT_CHECKED  /source (line 19, col 3)
           Source reachability was not checked (offline by default).
           next: Run with --check-sources to attempt an HTTPS reachability check.
         UNVERIFIED  PUBLICATION_VERSIONS_DIFFER  /publications (line 23, col 3)
           Publications state different versions: 0.0.82 (io.github.microsoft/playwright-mcp), 0.0.83 (pkg:npm/%40playwright/mcp). Which one an adopter gets depends on the channel.
           next: Expected while channels publish at different times. Confirm the current version with the owner before comparing or pinning versions.
         UNVERIFIED  RISK_UNASSESSED  /riskTier (line 59, col 11)
           riskTier is 'unassessed': no risk assessment is recorded. It must not be treated as low risk or as approved.
           next: Request a risk assessment from the governance owners, then record the tier and assessmentReference.

Summary: 1 manifest(s): 0 valid, 1 invalid - 1 error(s), 0 warning(s), 3 unverified check(s)
```

`playwright-mcp` describes a real capability from four of its public publications: an MCP
Registry entry, an npm package, a container image, and a plugin. Each publication states its own
version, and no source states its setup or limitations.

### Consistency across manifests

```bash
node bin/capability-manifest.js validate examples/valid examples/consistency   # DUPLICATE_ID on both files, exit 1
node bin/capability-manifest.js validate examples/valid --check-sources        # opt-in network check of https sources
```

Stage 2 also recognises one capability registered twice. It reports two manifests that list the
same publication (`DUPLICATE_PUBLICATION`), or the same source, matched by URL or by the forge's
repository id, which survives renames (`DUPLICATE_SOURCE`). It also flags claimed relations,
conflicting lifecycle signals, and values that were inferred and not yet confirmed.

### Compatibility between two revisions of a capability

```text
$ node bin/capability-manifest.js compat examples/valid/sql-review.capability.yaml examples/compatibility/sql-review.1.4.0-breaking.capability.yaml
Compatibility: examples/valid/sql-review.capability.yaml -> examples/compatibility/sql-review.1.4.0-breaking.capability.yaml
  capabilityVersion: 1.3.0 -> 1.4.0 (minor); required bump: MAJOR
  backward compatible: no; versioning: inconsistent; lifecycle: not_allowed; identity: stable
  Changes:
    BREAKING  INTERFACE_REMOVED  interface 'cli' was removed.
    BREAKING  USE_CASE_REMOVED   use case 'Check queries against the data-access policy' was removed.
    METADATA  METADATA_UPDATED   description changed.
  Findings:
    ERROR  LIFECYCLE_TRANSITION_NOT_ALLOWED  /lifecycleStatus
      lifecycleStatus cannot change from 'active' to 'experimental'.
      fix: Allowed transitions from 'active': deprecated.
    ERROR  INSUFFICIENT_VERSION_BUMP  /capabilityVersion
      INTERFACE_REMOVED, USE_CASE_REMOVED require a MAJOR version bump, but capabilityVersion changed from 1.3.0 to 1.4.0 (minor).
      fix: Set capabilityVersion to 2.0.0 or later, or restore what was removed.
Result: FAILED (2 error(s))
```

The compatible revision (`sql-review.1.4.0-compatible.capability.yaml`) passes. It adds an
interface and a use case with a MINOR bump, and it moves the repository: `source.url` changes while
the id stays the same.

### Compatibility between schema versions

`schema-compat <previous> <next> [--corpus <path>]` is for the schema itself: run it whenever the
schema changes. It works with registered versions such as `0.1` or with schema files, such as an
unregistered draft. It classifies every difference as breaking, additive, relaxation, or
annotation-only, and derives the version bump required. These changes are breaking:
- a removed field or value;
- a new required field or conditional rule;
- a tightened constraint;
- a removed lifecycle transition.

With `--corpus`, the manifests that are valid under `<previous>` are re-declared as `<next>` and
validated again; any regression makes the change breaking. For example, when the boundary-review
fields were added to the 0.1 draft, it confirmed the change was additive and that every existing
example stayed valid (see `docs/poc-report.md` §7.2). The research revision of 2026-10-23 was
checked against the draft and examples of 2026-10-22, which are kept for this purpose:

```bash
node bin/capability-manifest.js schema-compat research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json 0.1 \
  --corpus research/spikes-1-3/reference/examples-2026-10-22
```

It reports relaxations and additions, and classifies the widened id pattern as breaking, because a
changed pattern cannot be proven to accept every earlier value. All 9 earlier manifests stay valid.

### Exchanging capability information

```text
$ node bin/capability-manifest.js export examples/valid
ID                                  TYPE        SCHEMA      LEVEL         LIFECYCLE     MATURITY    VERSION  RISK                   OWNER
acme/observability-mcp-server       mcp_server  schema 0.1  adoptable     active        -           -        UNASSESSED             Acme Observability Inc. (external)
ai-platform/agent-eval-framework    framework   schema 0.1  adoptable     active        pilot       0.9.0    UNASSESSED             AI Platform Engineering (internal)
ai-platform/incident-triage-agent   agent       schema 0.1  discoverable  experimental  -           0.4.0    UNASSESSED             AI Platform Engineering (internal)
ai-platform/sql-review              skill       schema 0.1  governed      active        production  1.3.0    low (RA-2026-0142)     AI Platform Engineering (internal)
microsoft/playwright-mcp            mcp_server  schema 0.1  assessable    -             -           -        UNASSESSED             Microsoft Corporation (external)
sre/runbook-search                  tool        schema 0.1  governed      active        -           2.1.0    medium (RA-2026-0097)  Site Reliability Engineering (internal)
sre/sre-toolkit                     plugin      schema 0.1  none          deprecated    -           3.2.0    UNASSESSED             Site Reliability Engineering (internal)
techyaditya/agentic-playwright-mcp  mcp_server  schema 0.1  assessable    -             -           1.2.2    UNASSESSED             techyaditya (external)

Exchange document 0.1: 8 capability manifest(s), 0 rejected input(s).
UNASSESSED = no risk assessment recorded: not low risk and not approved. "-" = not provided in the manifest.
A risk tier is not an approval; approval is decided by governance processes, not by the manifest.
```

`export --out exchange.json` writes a
[Capability Exchange Document](schema/contracts/exchange-document-0.1.schema.json). It contains:
- the valid manifests exactly as authored;
- each manifest's warnings, unverified checks, and completeness level;
- the rejected inputs.

This is the format through which inventory content (owned by Mission 2) reaches other missions. It
holds no rankings, approvals, or assessments, and it is not an inventory. The summary view reads
the same fields for every capability type, and it never shows a missing or unassessed risk tier
as low.

### Journey pilot: discovery and reuse on real capabilities

The pilot tests the metadata model against journeys rather than against fictional examples. It
uses 12 public capabilities sampled at random (Agent Skills, npm packages, and MCP Registry
entries). It drafts a manifest for each from its native metadata alone, then measures how much
metadata is shared and which journey questions can be answered.

```text
$ node pilot/analyze.js
Drafted 12 manifests (12 valid as drafted); wrote pilot/drafts/ and pilot/results.md.
  Find a capability for a need: all required questions answerable for 4 of 12
  Decide whether it can be reused here: all required questions answerable for 0 of 12 (apart from governance: 4)
  Check whether something similar exists before building: all required questions answerable for 4 of 12
  Register a capability with little effort: all required questions answerable for 12 of 12
```

Against the schema of 2026-10-22, 4 of the 12 drafts were valid; the other 8 failed only because no
source states a `lifecycleStatus`.

The numbers are in [`pilot/results.md`](pilot/results.md) and the interpretation, with schema
proposals, in [`docs/journey-pilot.md`](docs/journey-pilot.md). Each capability's drafted manifest
is in `pilot/drafts/`; validate one to see what a person would still need to add. Commands:
- `npm run pilot` reruns the analysis offline from the snapshot;
- `npm run pilot:sample` draws a new sample and uses the network.

### Spikes 1-3 research harness

The research behind the 2026-10-23 revision ran four journeys on 60 real capability records in
seven formats: the MCP Registry, npm, Agent Skills, the Claude Code plugin marketplace, the Docker
MCP catalog, PyPI, and GitHub Actions. It also checked 36 A2A Agent Cards. `npm run research`
regenerates its results offline from the snapshot and validates the same records three ways: with
the schema of 2026-10-22, with the revised schema, and as starter-model drafts:

```text
$ npm run research --silent
Analysed 96 distinct records (60 capabilities, 36 agent cards).
  ...
  schema 0.1 of 2026-10-22: 12 of 60 drafts valid; assessable 34 of 60 (17 without inference)
  revised schema 0.1: 57 of 60 drafts valid with the same mapping; 58 of 60 starter-model drafts valid
  validator levels (starter drafts): none 2, discoverable 25, assessable 31, adoptable 0, governed 0; identity via the validator: 14 correct, 0 false, 0 missed
Wrote research/spikes-1-3/results.md and results.json.
```

The report is [`MISSION4_SPIKES_1_TO_3_RESEARCH.md`](MISSION4_SPIKES_1_TO_3_RESEARCH.md), and the
reproduction notes are in [`research/spikes-1-3/README.md`](research/spikes-1-3/README.md).

## Writing a manifest

This section covers the manifest format only; how manifests are submitted and reviewed is defined by
the contribution workflow (Mission 5).

```yaml
schemaVersion: "0.1"                 # quoted MAJOR.MINOR
id: my-namespace/my-capability       # stable, never changes; not a URL
name: My Capability
capabilityType: skill                # skill | agent | mcp_server | plugin | tool | application | service | workflow | framework | platform
source:
  type: repository                   # repository | registry | provider | other
  url: https://github.com/example-org/my-repo
  path: skills/my-capability         # for monorepos
riskTier: unassessed                 # an assessed tier (low | medium | high) also needs assessmentReference
# The fields above are mandatory. The fields below raise the completeness level.
description: What the capability does and the problem it solves.   # discoverable
interfaces:                                                         # discoverable
  - type: agent_skill
runtime:                                                            # assessable
  - kind: agent_host
license:                                                            # assessable
  expression: Apache-2.0
capabilityVersion: "1.0.0"                                          # assessable (or a publication's nativeVersion)
lifecycleStatus: experimental                                       # assessable (or a status or date a channel reports)
owner:
  name: My Team                                                     # assessable
  contact: my-team@example.com                                      # adoptable
  affiliation: internal                                             # internal | external
setup: []                                                           # adoptable: [] declares that nothing needs setting up
limitations: []                                                     # adoptable: [] declares that none are known
lastUpdated: "2026-10-22"                                           # the date of this record; quote dates
```

This manifest reaches the adoptable level; only a recorded risk assessment would make it governed.
The other optional fields appear in the examples:
- `maturity`, `intendedAudience`, `platformCompatibility`, and `costInformation` in
  `examples/valid/sql-review.capability.yaml` and `examples/valid/agent-eval-framework.capability.yaml`;
- `publications`, `keywords`, `documentation`, and `provenance` in
  `examples/valid/playwright-mcp.capability.yaml`;
- `relations` in `examples/valid/agentic-playwright-mcp.capability.yaml`.

Then run `node bin/capability-manifest.js validate path/to/manifest.yaml`. The
[field dictionary](docs/field-dictionary/0.1.md) describes every field, conditional rule, and
completeness level.

## Using the schema from other languages

The schema uses only standard Draft 2020-12 keywords, plus `x-` annotations that other validators
ignore, so any compliant validator can enforce it. It was cross-checked with Python
`jsonschema` 4.25.1 and PyYAML 6.0.3, routing each manifest by its `schemaVersion`, and all 16
example verdicts matched (`python3 interop/python/crosscheck.py`, last run 2026-10-23). The
completeness levels are an annotation (`x-completenessLevels`) that other validators ignore; a
consumer that needs them reads the annotation, or the validator's report. Python consumers should enable
format checking and reject duplicate keys (see `docs/manifest-spec.md` §12):

```python
import json, yaml
from jsonschema import Draft202012Validator, FormatChecker

manifest = yaml.safe_load(open("examples/valid/sql-review.capability.yaml"))
schema = json.load(open(f"schema/{manifest['schemaVersion']}/capability.schema.json"))
errors = list(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(manifest))
```

## Project layout

```text
schema/<version>/capability.schema.json  manifest schema, one directory per version (currently 0.1)
schema/contracts/                         validation-report and exchange-document contracts
src/schema-registry.js                    discovers schema versions, compiles them with Ajv (strict mode)
src/yaml-source.js                        YAML 1.2 parsing with line/column positions, portability checks
src/structural.js                         Stage 1: version routing, schema validation, actionable messages
src/consistency.js                        Stage 2: ids, sources, publications, references, relations, lifecycle
                                          signals, versions, license, provenance, dates, risk, reachability
src/completeness.js                       completeness levels from the schema's x-completenessLevels
src/validator.js                          public API (validateFiles, validateManifests, validateManifestText)
src/compatibility.js                      revision compatibility: change impact, lifecycle, SemVer bump
src/schema-compat.js                      schema-version compatibility: static classification and corpus check
src/exchange.js                           Capability Exchange Document
src/field-docs.js                         generates docs/field-dictionary/<version>.md from the schemas
src/format.js                             text output
bin/capability-manifest.js                CLI
examples/                                 valid, invalid, consistency, and compatibility manifests
pilot/journeys.yaml                       journey pilot: journeys, questions, and discovery use cases
pilot/sample.js, pilot/samples/           random sampler (network) and its snapshot of native metadata
pilot/crosswalk.js                        native formats (SKILL.md, server.json, package.json) -> manifest concepts
pilot/analyze.js                          drafts, coverage, journey answerability -> pilot/results.md, pilot/drafts/
research/spikes-1-3/                      Spikes 1-3 research: pre-registered needs, snapshot, crosswalk for seven
                                          formats, judgments, analysis -> results.md; reference/ keeps the
                                          2026-10-22 schema draft and the manifests valid under it
interop/python/crosscheck.py              second, independent implementation (optional; Python)
test/                                     node:test suites: schema, structural, consistency, completeness,
                                          compatibility, schema-compat, exchange, consumers, pilot, research, CLI
```

## Changing the schema

- **While schema 0.1 is an unpublished draft**, edit `schema/0.1/capability.schema.json` in place,
  then check the change with `schema-compat`. Compare a copy of the previous draft against the edited
  file, with a corpus of the manifests that were valid under it (`--corpus examples`, or a copy of
  them if the examples change too, as in `research/spikes-1-3/reference/`). Regenerate the field
  dictionary with `npm run docs`, the pilot and research results with `npm run pilot` and
  `npm run research`, then run `npm test`.
- **Once a version is published, it is immutable.** Copy `schema/<version>/` to the next version,
  set `properties.schemaVersion.const`, and make the changes there. Additive changes and relaxations
  need a MINOR version; breaking changes need a MAJOR version. The registry discovers the new
  directory and routes manifests that declare it, and older versions stay supported until they are
  removed. `npm run docs` then writes one field dictionary per version, including its changes since
  the previous version.
