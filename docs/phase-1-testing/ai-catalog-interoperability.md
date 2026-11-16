# The capability manifest and the AI Catalog: interoperability test (U7)

| | |
|---|---|
| Date | 2026-11-16 |
| Question | Decision register U7: should the manifest be published as an AI Catalog entry type, or only be convertible into one? |
| Standard tested | AI Catalog, Linux Foundation working draft, [github.com/Agent-Card/ai-catalog](https://github.com/Agent-Card/ai-catalog), `specification/ai-catalog.md` at commit `ecade3e` (last changed 2026-11-08) |
| Corpus | The 22 production manifests, plus the two AI Catalogs published by real vendors (exa.ai, github.com) |
| Tooling | [`research/phase-1/ai-catalog/`](../../research/phase-1/ai-catalog/): converter and validator ([`ai-catalog.js`](../../research/phase-1/ai-catalog/ai-catalog.js)), test run ([`run.js`](../../research/phase-1/ai-catalog/run.js)), outputs, live snapshots. Generated detail: [T13 draft](drafts/T13-ai-catalog.md). Regression test: `test/ai-catalog.test.js` |
| Decision | **Accepted 2026-11-16. Interoperable by projection, not a new entry type.** The manifest stays Mission 4's source of truth. It is exported as AI Catalog entries that reference each capability's native artifacts, and it carries the full manifest in an `extensions` member keyed by the schema's `$id` (the "hybrid" projection) |

## 1. What the AI Catalog is, in one paragraph

An AI Catalog is a JSON document (`application/ai-catalog+json`) that lists AI artifacts so that
clients can discover them across protocols. Each **Catalog Entry** has an `identifier`, a `type` (a
media type), and exactly one of `url` (where the artifact document is) or `data` (the document
inline), plus optional `displayName`, `description`, `version`, `tags`, `publisher`, `updatedAt`,
`digest`, `trustManifests` (independent contributors' attestations and provenance, optionally
signed), and `extensions` (namespaced by URL or reverse-DNS). An entry whose type is itself
`application/ai-catalog+json` nests a catalog. There are three conformance levels: Level 1 minimal,
Level 2 with a `host`, Level 3 with signed, publisher-authorised trust manifests. Its core rules
match Mission 4's: **reference native artifacts instead of restating them** (the "authoritative
source" rule), keep identity apart from locations, and ignore unknown members.

## 2. How the manifest maps onto it

| Manifest | AI Catalog | Rule used |
|---|---|---|
| One capability | One Catalog Entry | |
| Several artifacts (a skill's `SKILL.md`, an MCP server's Server Card and packages) | One entry of type `application/ai-catalog+json` whose `data` is a nested catalog with one entry per artifact | The specification's multi-protocol example |
| `id` | `identifier`, as a URI under the catalog operator's control (`https://github.com/Mohanraj237/capability-intelligence/capabilities/<id>`) | Catalog Projection rule 3: an operator that is **not** the publisher **must not** assign `urn:air` identifiers |
| `name`, `description` | `displayName`, `description`, omitted when the referenced artifact carries its own (MCP Server Card, A2A Agent Card) | Authoritative-source rule |
| `capabilityVersion` | `version` (omitted for self-describing artifacts) | Same |
| `keywords` | `tags` | |
| `owner.name` | `publisher.displayName`, with the source's forge account as an unsigned `identifier` | The publisher identifier should be verifiable; none of the 22 has one |
| `lastUpdated` | `updatedAt` (RFC 3339) | |
| `source.url` | A trust manifest `provenance` link (`relation: source`) | |
| `riskTier` + `assessmentReference` (when assessed) | A trust manifest `attestation` | |
| `interfaces[].contractRef` | An artifact entry: `SKILL.md` → `application/agent-skills+md`; MCP Server Card → `application/mcp-server-card+json`; Agent Card → `application/a2a-agent-card+json` | Known types |
| `publications[]` (npm, PyPI, MCP Registry) | An artifact entry with a vendor type and the channel's metadata URL | No known type exists |
| Everything else | `extensions["<schema $id>"]`: the whole manifest | Hybrid projection only |

## 3. Results

### 3.1 Every projection is a valid AI Catalog

| Projection | What the entry carries | Level | Errors | Round trip: manifests identical | Rebuilt manifests valid |
|---|---|---|---|---|---|
| Reference | Native artifacts and the AI Catalog's own members only | 2 | 0 | **0 of 22** | **0 of 22** |
| Manifest as artifact | The manifest as `data`, under a vendor type | 2 | 0 | 22 of 22 | 22 of 22 |
| **Hybrid** | Native artifacts, plus the manifest in `extensions` | 2 | 0 | **22 of 22** | **22 of 22** |

Level 3 (signed, publisher-authorised) is out of reach for any projection made by Mission 4: only a
publisher with a `did:web` identity can sign it, and none of the 22 publishers has one.

### 3.2 What a reference-only projection loses

Of the 88 field paths that at least one of the 22 manifests states, the AI Catalog's own members
keep **11**, partly keep **6**, and lose **71**. (90 and 73 before the 2026-11-16 overlap review
removed the capability-wide `platformCompatibility` and `intendedAudience`; the hosts are now in
`publications[].platformCompatibility`, which is also lost.) Two of the 11 are kept only because the converter
supplies a default (`schemaVersion`, and `source.type: repository`).

| Kept | Partly kept | Lost |
|---|---|---|
| `id` (renamed), `name`, `description`, `capabilityVersion`, `source.url` (as provenance), `owner.name` (as publisher), `keywords` (as tags), `lastUpdated`, `interfaces[].contractRef` | `capabilityType` (9 of 22: only where the artifact type implies it), `interfaces`, `interfaces[].type`, `publications[].kind`, `.locator`, `.nativeVersion` (only npm, PyPI, and the MCP Registry) | `riskTier` (`unassessed` has no equivalent), `license`, `owner.contact` and `.affiliation`, `lifecycleStatus`, `maturity`, `deprecation`, `supportedUseCases`, `runtime`, `setup`, `publications[].platformCompatibility`, `integrations`, `dependencies`, `limitations`, `costInformation`, `components`, `parent`, `embeddedComponents`, `relations`, `provenance`, `documentation`, and channel status and dates |

The lost fields are exactly the ones the other missions need to decide (Mission 1: setup,
limitations, cost, hosts; Mission 3: risk, license, limitations; Mission 2: maturity, relations).
Rebuilt manifests are invalid because two mandatory facts cannot be recovered: `riskTier` in all 22,
and `capabilityType` in 13.

### 3.3 Most artifacts have no known type

The reference projection produces 28 artifact entries for the 22 capabilities. **8 use a type the
specification knows**: 6 `SKILL.md` files and 2 MCP Server Cards. The other 20 need vendor types:
PyPI projects (7), npm packages (6), MCP Registry entries (5), a Claude Code `plugin.json` (1), and a
GitHub Action `action.yml` (1). All 28 URLs returned HTTP 200 on 2026-11-16.

18 publications have no retrievable artifact document at all and survive only in the manifest:
container images (5), hosted MCP endpoints (3; Exa's and GitHub's are still represented, through
their Server Cards), plugin marketplace entries (2), and repositories (8; the skills and actions among them are still represented, through
their `SKILL.md` or `action.yml`).

### 3.4 The AI Catalog in the wild (2026-11-16)

Of the vendors behind the 22 capabilities, two publish an AI Catalog at
`/.well-known/ai-catalog.json`: **exa.ai** and **github.com**. Brave, Tavily, Microsoft
(playwright.dev), and Anthropic do not.

| Host | Entries | Conformance to the 2026-11-08 draft | Agreement with our manifests |
|---|---|---|---|
| github.com | 1: `urn:air:github.com:mcp:github-mcp-server`, an MCP Server Card | Valid, no warnings | The Server Card's `repository.id` is **942771284**, the same as our `source.repositoryId`: independent confirmation of the identity rule. Our projection references the same card URL |
| exa.ai | 3: an MCP Server Card, an OpenAPI document, and a skill | Valid, with 3 warnings: `displayName` and `description` repeat the Server Card's values; the skill uses `application/ai-skill+md`, which is not the specification's `application/agent-skills+md`. It also carries members the draft does not define (`capabilities`, `representativeQueries`, `metadata`, and a singular `trustManifest` from an earlier draft) | Our projection references the same card URL. The Server Card says the hosted server is at **3.5.1**, while npm states 3.4.3 and the MCP Registry 3.4.1. The Exa manifest now records 3.5.1 for the hosted endpoint, the card as its `contractRef`, and the card's `x-api-key` header in `setup` |

So the draft is already in use by large publishers, and already drifting: one of the two catalogs
uses an earlier member and a non-standard type. Interoperability must be tested against a dated
version of the specification, as this test does.

## 4. Answering U7

| Option | Evidence | Verdict |
|---|---|---|
| A. Publish the manifest **as an AI Catalog entry type** (`type: application/vnd...manifest+json`, manifest as the artifact) | Lossless, but an AI Catalog client gets a document it cannot read, instead of the `SKILL.md` or Server Card it understands. Duplicates name, description, and version that native artifacts already carry | Rejected |
| B. **Convertible only**, reference projection | Interoperable, but loses 71 of 88 fields and cannot round-trip; the risk state disappears | Not enough on its own |
| C. **Hybrid projection** (recommended) | Valid Level 2; AI Catalog clients get native artifacts with known types where they exist; Mission 4 consumers get the full manifest from `extensions`; 22 of 22 round-trip unchanged; unknown extensions are ignored by rule, so nothing breaks for other clients | **Recommended** |

**Recommended decision (U7):** the manifest is not proposed as an AI Catalog entry type. Mission 4
exports AI Catalog documents with the hybrid projection, and imports them back without loss.

Rules for the export:

1. One capability, one entry; a nested catalog when it has more than one retrievable artifact.
2. Identifiers: the catalog's own URI for public capabilities, because Mission 4 is not their
   publisher. For **internal** capabilities, where the organisation is the publisher and Mission 5
   assigns the id (U3), use `urn:air:<organisation domain>:<namespace>:<name>`. The registered
   namespace list that Mission 2 keeps should therefore record each namespace's domain.
3. Omit `displayName`, `description`, and `version` when the artifact is an MCP Server Card or an
   A2A Agent Card.
4. Never put `unassessed` into a trust manifest; only an assessed tier becomes an attestation.
5. Carry the full manifest in `extensions` under the schema `$id`.

## 5. What this asks of the manifest, and of others

| Item | Who | Why |
|---|---|---|
| MCP servers link their Server Card in `interfaces[].contractRef` (R10) | Curators (Mission 2) | It is the only known AI Catalog type for MCP servers. Done for Exa and GitHub, the two that publish one |
| Propose known types for packages, registry entries, plugins, and CI actions to the AI Catalog working group | Mission 4 | 20 of 28 artifacts need vendor types today |
| Record a verifiable publisher identity (a domain or `did:web`) for internal capabilities | Mission 5, Mission 2 | Needed for publisher-authorised `urn:air` identifiers and for Level 3 |
| An `export --format ai-catalog` command in the validator's CLI | Mission 4 | The converter exists as research code; productising it is a small step |
| Re-test when the AI Catalog reaches 1.0 | Mission 4 | It is an editor's draft: the specification text changed in 5 commits in the two weeks before this test, 2 of them in substance (catalog and entry objects opened to unrecognized members, ADR-0028) |

## 6. Reproduce

```bash
node research/phase-1/ai-catalog/run.js
node research/phase-1/ai-catalog/run.js --online
node --test test/ai-catalog.test.js
```

The first command is offline and reuses the URL checks of 2026-11-16; the second re-fetches every
artifact URL.
