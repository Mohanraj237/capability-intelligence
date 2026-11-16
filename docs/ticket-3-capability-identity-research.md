# Ticket 3: Capability Identity, Publications, and Lifecycle

**Mission:** AI Capability Intelligence & Standards  
**Evidence basis:** Phase 0 snapshot 2026-10-22; live sample revisit 2026-11-09; official standards sources reviewed  
**Status:** Research recommendation. This report does not publish or change the manifest schema.

## Executive recommendation

1. Assign each capability a stable catalog identifier once. Use a readable, lowercase namespaced identifier such as `publisher/capability`, with an explicit namespace allocation and collision-resolution process. Never derive it mechanically from a display name, repository URL, or registry coordinate; keep those as references. Do not change or reuse an id after a rename, transfer, or retirement.
2. Keep `source` and `publications[]` separate. `source` identifies the primary maintenance/origin location, including a repository subpath and stable forge id where available. `publications[]` records each registry entry, package, image, marketplace entry, or hosted endpoint. Use relations for forks, wrappers, and replacements.
3. Keep the owner-declared `lifecycleStatus` optional. Preserve source-reported status separately for each source/publication with its channel and observation date. Missing status means unknown/not declared, not active. Neither an active signal nor a valid manifest means approval.

These recommendations follow the observed cross-source links and the availability of lifecycle data in the 60-record sample. Namespace authority and lifecycle semantics still require agreement with Missions 2 and 5 (and Mission 3 for governance implications).

## 1. Identity assessment

The sample shows that display names and channel names are not capability identities. Seven groups of records described the same underlying capability. Declared cross-links plus the same repository and path recovered all 14 judged same-capability pairs without a false merge. Matching native names alone found only 4 pairs, falsely merged 2 pairs, and missed 10 of the 14 true pairs. Two `webapp-testing` skills had identical names and descriptions but different implementations and licenses.

| Identifier approach | Stability and uniqueness | Readability / adoption | Assessment |
|---|---|---|---|
| Native registry or package name | Unique only within its channel; different channels can give one capability different names. Can change with publication or namespace ownership. | Familiar and easy to find in that channel. | Preserve as a publication locator, not the canonical capability id. |
| Assigned readable namespace/name | Stable through source, package, or display-name changes if assigned once. Unique only if namespace ownership and allocation are governed. | Human-readable and practical for references. | Recommended. The namespace must be controlled or delegated; allocation is explicit, not name-derived. |
| URN | RFC 8141 defines a location-independent persistent identifier and a namespace-registration model. Persistence still depends on namespace stewardship and identifier policy. | Globally recognizable format but less familiar to ordinary catalog users; requires allocation and interoperability rules. | A viable federation/projection format if Mission 2 requires globally scoped identifiers, not a prerequisite for the first catalog. |
| UUID or opaque catalog URI | High collision resistance and independent of mutable source coordinates. Another catalog may assign a different identifier to the same capability. | Easy to assign but hard to recognize or type manually. | A sound alternative where opacity is preferred; it still needs cross-catalog linking and a human-readable display name. |
| Forge repository id | GitHub documents that its numeric repository id remains stable across rename/move scenarios; it identifies a repository, not a capability within a monorepo, and is unavailable for remote-only services. | Machine-oriented and forge-specific. | Useful supporting evidence in `source`, never the capability id. |
| Package URL (PURL) | Identifies a package coordinate (and optionally version/subpath), not a capability spanning several distributions. | Standardized and tool-friendly for package ecosystems. | Use as a package publication locator, not as the capability id. |

### Identity convention

- Assign the id through a catalog registration workflow under an authorized namespace. Establish who controls a namespace, how collisions are resolved, and how ownership transfers work.
- Make ids case-insensitively unique; never recycle them. Keep old ids resolvable as aliases if a migration is unavoidable.
- Keep the display `name` mutable and non-unique. Preserve native identifiers as channel-specific publication coordinates.
- Use a repository id plus repository-relative path to recognize a capability in a monorepo. A repository URL alone is mutable and can identify many capabilities.
- Consider URN projection only when an inter-catalog contract needs global identifiers; the AI Catalog draft's `urn:air` form is one proposal, not evidence that every catalog needs to adopt it.

## 2. Sources and publications prototype

The five examples use the existing 0.1 manifest shape: a primary `source` stays separate, and each publication carries its own channel locator and, where available, native version/status. They are based on the October 22 sample and are structural prototypes, not claims that all channel metadata is still current.

| Capability / sample evidence | Manifest |
|---|---|
| Microsoft's Playwright MCP server: registry, npm, Docker, and Claude plugin entries. Versions differ across channels, including a floating plugin reference. | [Existing Playwright MCP example](../examples/valid/playwright-mcp.capability.yaml) |
| GitHub MCP server: registry entry, OCI image, hosted endpoint, and marketplace configuration; one maintained repository. | [GitHub MCP prototype](../research/ticket-3/manifests/github-mcp-server.capability.yaml) |
| PulseMCP Playwright Stealth: registry and npm package point to the same subdirectory of a monorepo; the npm `mcpName` links back to the registry entry. | [Playwright Stealth prototype](../research/ticket-3/manifests/playwright-stealth.capability.yaml) |
| Browser Use: PyPI package and MCP Registry entry are explicitly cross-linked; the repository also describes a separate hosted offering, making granularity review important. | [Browser Use prototype](../research/ticket-3/manifests/browser-use.capability.yaml) |
| PDF Generation API MCP server: registry and npm package share a declared `mcpName`; the repository reference returned 404 in the baseline check. | [PDF API prototype](../research/ticket-3/manifests/pdfapi-mcp-server.capability.yaml) |

### Prototype trade-offs

- **One capability, several versions.** Playwright's registry and npm publication reported different versions; its Docker build used a commit pin and its plugin used `latest`. A single top-level version would hide these differences. Keep the native version and scheme on each publication, and do not compare unlike schemes.
- **A source is not another distribution.** A repository may be the source of a package and image without itself being a publication channel. Keeping it in `source` preserves that distinction and supports stable repository ids and monorepo paths.
- **Links are stronger than matching names.** MCP Registry package back-links (`mcpName` / `mcp-name`) and declared repository references linked real pairs. A shared name did not.
- **A link does not prove equivalence by itself.** Registry back-links, a shared repository and path, and same-maintainer evidence supported the sample groups. Forks, wrappers, and replacements must remain separate capabilities/relations unless evidence shows they are the same adoptable artifact.
- **A dead repository locator does not erase the publication identity.** The PDF API example preserves its registry and npm coordinates and records the unavailable repository as an unresolved source reference; it does not invent a replacement repository id.

## 3. Sample drift report

The baseline contains 60 unique capability records across seven packaging formats, sampled on 2026-10-22. The sample was revisited live on 2026-11-09, meeting the ticket's November 5 threshold.

| Observation on revisit | Result |
|---|---:|
| Records in the agreed sample still represented | 60 / 60 |
| Records with an observable metadata change | 15 / 60 |
| Records with a version bump among those changes | 12 |
| Capability ids, repository ids, or publication locators observed to change | 0 |
| Repository references returning 404 | 2 |

The observed changes were concentrated in mutable publication metadata, especially versions. No evidence in this revisit required changing a capability id or replacing a publication locator. A repository 404 only establishes that the checked URL did not resolve at that time; it does not distinguish deletion, access restrictions, or an unrecorded move.

**Limitations:** the sample is public, small, and partly purposive; it is not representative of internal capabilities. A status/version can change between checks, and an unavailable URL is not proof that the capability is retired. The November 9 live-check summary is preserved here, but its raw drift JSON and per-record checker outputs are not present in the current repository snapshot, so the aggregate cannot be independently replayed from this checkout.

## 4. Lifecycle assessment

The baseline found native lifecycle information in only 17 of 60 records, mostly MCP Registry records. Many formats had no lifecycle field; others exposed narrower signals such as an archived-repository flag, package deprecation message, or per-release yank. Requiring every owner to declare status would therefore block registration for many otherwise identifiable capabilities.

| Option | Benefit | Cost / failure mode | Finding |
|---|---|---|---|
| Require an owner-declared status at registration | Every catalog entry appears to have a state. | Sources often do not supply one; a guessed `active` state is misleading. | Reject as a registration requirement. |
| Optional owner-declared status | Allows honest partial records and records owner intent where known. | Some records remain unknown. | Recommend. Omit until the owner declares it; do not default to `active`. |
| Infer owner status from a repository or registry | Fills gaps automatically. | A channel's status has channel-specific meaning; disagreement and stale caches are common. `active` does not mean maintained, safe, or approved. | Do not infer the owner declaration. Preserve observations as separate signals. |

Recommended owner-declared values are `experimental`, `active`, `deprecated`, and `retired`. Treat them as availability/lifecycle states, separate from maturity, risk, and approval. A transition policy can allow `experimental` to become active, deprecated, or retired; `active` to become deprecated; and `deprecated` to return to active or move to retired. Retired ids are terminal and never reused. Mission 5 should own the declaration workflow; Mission 3 should confirm any governance consequences.

Record external signals without translating them silently into the owner's value: MCP Registry status and message, npm deprecation and message (which can apply to a version/range), GitHub archive state, PyPI release-yank or project-level status, and channel publication dates. Keep the channel, original value/message, and observation time. A machine-readable `replacedBy` relation is preferable to burying a successor in prose.

## 5. Cross-mission decisions and recommendation

| Decision area | Mission 2 | Mission 5 |
|---|---|---|
| Namespace allocation and authority | Confirm consumers can store and resolve the proposed readable id; select a catalog-wide or federated namespace based on consumer requirements. | Define registration, namespace authorization/delegation, collision checks, immutable assignment, transfer, and alias handling. |
| Publication identity and grouping criteria | Confirm ingestion can use explicit back-links, repository id plus subpath, and a reviewable relation instead of name matching. | Define registration evidence and curation for ambiguous links, wrappers, forks, and replacements. |
| Lifecycle field requirements | Confirm consumers can ingest an absent declaration and display per-channel observations without collapsing them. | Define status-declaration authority, reason/successor requirements, and resolution for retired ids. |

**Recommended decision:** retain an assigned, readable, immutable capability id; keep the primary `source` separate from a repeatable `publications[]`; represent source/publication identifiers and versions in their native forms; and make owner lifecycle declaration optional while preserving observed channel signals separately. This approach supports multi-source discovery without treating a mutable name, package, repository, or endpoint as the capability itself.

## Sources checked

- [IETF RFC 8141: Uniform Resource Names](https://www.rfc-editor.org/rfc/rfc8141) — persistent, location-independent URN intent and namespace model.
- [AI Catalog specification draft](https://github.com/Agent-Card/ai-catalog/blob/main/specification/ai-catalog.md) — optional artifact identifiers and the proposed `urn:air:{publisher}:{namespace}:{name}` form.
- [MCP Registry `server.json` specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md) and [official registry requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md) — server entries, repository subfolders, namespace authentication, and package ownership verification.
- [GitHub: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) — redirects, repository moves, and the warning that action references do not redirect.
- [Package URL specification](https://github.com/package-url/purl-spec) — package coordinates across ecosystems.
- [PEP 792: Project status markers](https://peps.python.org/pep-0792/) — project-level `active`, `archived`, `quarantined`, and `deprecated` semantics and limitations of existing PyPI status signals.
- [npm deprecate](https://docs.npmjs.com/cli/v11/commands/npm-deprecate) — deprecation may apply to package versions/ranges and carries a message.
- [Backstage descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format) — a deployed catalog precedent for namespaced entities, owner, and lifecycle fields.

The full sample methodology, baseline judgments, and source snapshots are in the [Spikes 1-3 research](./spikes-1-3-research.md) and [sample results](../research/spikes-1-3/results.md).

## 6. Tests and result evidence

The following checks were run from the repository root. Full command output is retained in the linked logs.

| Check | Command | Result | Output |
|---|---|---|---|
| Five publication prototypes against schema 0.1 | `node bin/capability-manifest.js validate examples/valid/playwright-mcp.capability.yaml research/ticket-3/manifests` | 5 valid, 0 invalid, 0 errors, 0 warnings. The 11 unverified checks are expected: sources were not network-checked, risk is explicitly unassessed, and Playwright's publication versions differ. | [Prototype validation log](../research/ticket-3/reports/prototype-validation.log) |
| Frozen baseline analysis | `npm run research` | Analyzed 96 distinct records (60 capabilities and 36 Agent Cards); the validator linked 14 identity pairs with no false or missed pairs. The generated results are in [results.md](../research/spikes-1-3/results.md). | [Baseline analysis log](../research/ticket-3/reports/baseline-analysis.log) |
| Complete project test suite | `npm test` | 206 tests passed, 0 failed. | [Full test-suite log](../research/ticket-3/reports/full-test-suite.log) |

These checks establish that the prototypes conform structurally to the current draft and that the frozen baseline analysis and project tests pass. They do not prove live source reachability or runtime behavior. The November live-drift aggregate above remains a prior-run summary: its per-record raw output is not available in this checkout and cannot be reproduced by these offline checks.
