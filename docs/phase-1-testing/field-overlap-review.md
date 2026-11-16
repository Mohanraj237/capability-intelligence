# Field overlap review: does any field repeat another? (C14 to C16)

| | |
|---|---|
| Date | 2026-11-16 |
| Question | Which schema 0.1 fields state the same fact, with the same meaning, as another field? A fact stated twice must be kept in sync by hand, and the two copies drift |
| Corpus | The 22 production manifests, the 8 examples, and the native sources they were curated from (READMEs fetched on 2026-11-16) |
| Rule applied | A field stays when it carries a fact that no other field carries, or the same value with a different meaning. It goes, or moves, when its value can be rebuilt from other fields of the same manifest |
| Decisions | **C14** `platformCompatibility` is stated only per publication. **C15** `intendedAudience` is removed. **C16** `runtime[].detail` states requirements only, checked by the new warning `RUNTIME_REPEATS_PUBLICATION`. All three accepted by the Mission 4 lead on 2026-11-16 |

## 1. Summary

| Field | Overlaps with | Same meaning? | Verdict |
|---|---|---|---|
| `platformCompatibility` (capability-wide) | `publications[].platformCompatibility` | Yes: by rule, the union of the publications' lists | **Removed** (C14); hosts are stated per publication only |
| `intendedAudience` | `description`, `supportedUseCases`, `runtime`, `integrations` | Yes: 25 of 25 values restate one of them or say only "developers" | **Removed** (C15); `x-intendedAudience` keeps a value that someone needs |
| `runtime[].detail` | `publications[].locator`, `.platformCompatibility`, `.nativeVersion` | Yes, in 24 of 32 details | **Kept, narrowed** (C16): requirements only, enforced by a warning |
| `capabilityVersion` | `publications[].nativeVersion` | No: the owner's canonical version; the channels disagree in 3 of 15 | Kept |
| `documentation` | `source.url` | No: where to read, not where it is maintained (equal, with `#readme`, in 5 of 22) | Kept |
| `source` | a `repository` publication | Settled by C9 | Kept; `PUBLICATION_REPEATS_SOURCE` warns |
| `lifecycleStatus` | `source.status`, `publications[].status` | No: declared by the owner, versus observed in a channel | Kept |
| `lastUpdated` | `source.updatedAt`, `publications[].updatedAt`, `provenance[].observedAt` | No: four different dates (C11) | Kept |
| `keywords` | `integrations`, hosts, `capabilityType` | No: native tags kept as stated, for display only (R9) | Kept |
| `parent` | the parent's `components` | Same relation, stated in two different documents | Kept; `PARENT_CHILD_MISMATCH` checks both ends |
| `capabilityType` | `interfaces[].type` | No: the primary way it is adopted, versus every way it can be used | Kept |
| `embeddedComponents` | `components` | No: exclusive by definition (independently adoptable or not) | Kept |
| `dependencies`, `setup`, `integrations` | each other | No: other capabilities, what the adopter supplies, systems it works against | Kept |
| `deprecation.replacedBy` | `relations` | No: `relations` excludes the replacement by definition | Kept |
| `supportedUseCases` | `description` | No: the use cases add search recall (0.84 to 0.95, T5) | Kept |

## 2. C14: AI hosts are stated per publication only

**What was repeated.** Since C12, a publication could name the hosts it supports, and the
capability-wide list had to contain every one of them (a conditional rule plus the
`PLATFORM_COMPATIBILITY_MISMATCH` warning). The capability-wide list was therefore, by definition,
the union of the publications' lists: the same fact stored twice, with two rules that existed only
to keep the copies in sync.

**Why the per-publication list is the one to keep.** A host is supported *through a particular
artifact*: a marketplace entry installs into one agent, an npm package is configured in another, a
hosted endpoint is added by URL. Re-checking the 9 manifests that had a capability-wide list against
their READMEs on 2026-11-16:

| Manifest | Publications | Hosts per publication (from the README) | What the capability-wide list hid |
|---|---|---|---|
| Chrome DevTools MCP | npm package; marketplace entry | package: 7 hosts; marketplace: `claude-code` | The marketplace entry works only in Claude Code |
| GitHub MCP Server | registry entry; container image; hosted endpoint | container: 6 (incl. `gemini-cli`); hosted: 6 (incl. `codex`) | Which host uses the hosted endpoint and which the container |
| Tavily MCP | npm package; registry entry; hosted endpoint | package: `claude-desktop`, `cursor`; hosted: `claude-code`, `cursor` | Claude Code is documented only for the hosted endpoint |
| Exa MCP Server | hosted endpoint; registry entry; npm package | hosted: 6 hosts; npm package: none documented | The npm package has no documented host |
| MCP Atlassian | PyPI package; container image | package: 3 hosts (uvx configuration) | The container has no documented host |
| Playwright MCP | registry entry; npm package | package: 7 hosts | |
| Brave Search MCP | npm package; container image | both: `claude-desktop`, `github-copilot` | (nothing: both are the same) |
| Caveman plugin | marketplace entry | `claude-code` | (single publication) |
| webapp-testing | repository | `claude-code` (derived, to be confirmed) | (single publication) |

In 6 of 9, the capability-wide list could not tell an adopter what to install for their host. After
the move, 13 publications in these 9 manifests carry hosts.

**Re-checking also corrected the values.** The capability-wide lists had 25 values; the hosts the
READMEs document per publication add up to 36 in the same 9 manifests (as a union). Added from the
READMEs: Exa `cursor`, `gemini-cli`, `windsurf`; GitHub `claude-code`, `codex`, `gemini-cli`;
MCP Atlassian `github-copilot`; Playwright `claude-code`, `codex`, `gemini-cli`; Chrome DevTools
`codex`, `devin`, `windsurf`. Removed: Tavily `github-copilot`, which its README does not document
(its only VS Code mention is a tutorial for a different extension). Each list has a `native`
provenance entry naming the README section, except the two derived ones.

**What a consumer does now.** "Does it work in my host?" is answered by any publication whose list
contains the host, and "what do I install?" by that publication. The union is one line of code.
Omitting the list still means "not provided", never "incompatible". A capability used straight from
its repository states its hosts on a repository publication with the ref adopters pin (the
`sql-review` example does).

**Schema changes.** The top-level field and its conditional rule are removed; the publication field
carries the full definition and the host vocabulary; `PLATFORM_COMPATIBILITY_MISMATCH` is retired. A
manifest that still has the top-level field gets `UNKNOWN_FIELD` with the hint "move each host to
publications[].platformCompatibility of the publication that supports it", from a new
`x-retiredFields` annotation.

## 3. C15: `intendedAudience` is removed

The 16 manifests that stated it held 25 values, 14 distinct. Every one restates another field or
says nothing a consumer can use:

| Values | Uses | Restates |
|---|---|---|
| `developers` | 7 | Nothing: all 22 capabilities are for developers |
| `developers building agents that need web search` | 3 | `description` and `capabilityType: mcp_server` |
| `developers building browser agents` | 1 | `description` |
| `developers building LangChain agents` | 1 | `integrations: [langchain]` |
| `JavaScript and TypeScript developers` | 1 | `runtime` (Node.js) |
| `developers using a coding agent` | 1 | `runtime` (`agent_host`) |
| `maintainers`, `code reviewers` | 3 | `supportedUseCases` (review pull requests, triage issues) |
| `web developers`, `frontend and QA engineers`, `QA engineers` | 3 | `supportedUseCases` (debugging, performance, testing) |
| `data and ML engineers`, `data engineers` | 3 | `supportedUseCases` (document pipelines, RAG) |
| `project and delivery teams using Jira` | 1 | `integrations: [jira-cloud, jira-data-center]` and `supportedUseCases` |

Other evidence: no value had a provenance entry (all curated, none from a source); the only native
counterpart is PyPI's "Intended Audience" classifier, which is almost always "Developers"; it
answered one helpful (not required) journey question, "Who is it intended for?", and it was not a
search field in T5. That question is now answered from `supportedUseCases` and `description`, for
all 22 manifests instead of 16.

If Mission 1 or 2 later needs to filter by role, the answer is a **controlled** role vocabulary,
proposed for 0.2 together with the functional classification (U5), not free text. Until then,
`x-intendedAudience` keeps a value as an extension field, which the validator accepts and core
consumers ignore.

## 4. C16: `runtime` states what the environment requires

`runtime` stays at the top level: a capability without publications (an internal one used from its
source) still runs somewhere, and the `assessable` level needs it. But its free-text `detail`
repeated publications. Of the 32 runtime entries in the 22 manifests, **24 details repeated a
publication**: the package name or install command (15), the container image (5), the AI hosts or
the endpoint's domain (4). The repeated value drifts when the publication changes (`pip install
'browser-use==1.0.3'` pinned a version that `nativeVersion` already records).

Resolution:

- `runtime[].detail` states what the environment requires or who operates it: `Node.js >=18`,
  `Python >=3.10,<4.0`, `Hosted by Exa.`, a CI runner and its trigger. The schema's own example
  `docker.io/mcp/playwright` was replaced.
- The new consistency warning `RUNTIME_REPEATS_PUBLICATION` flags a detail that names a
  publication's locator, package name, or native name. On the original 32 details it flagged 18 of
  the 24; the other 6 (host names, endpoint domains, a CI action reference) were corrected by review.
- After the change, 28 entries have a detail, 4 container entries have none (the image is the
  publication), and the warning reports 0.

Install extras that are real requirements stay, without the package name ("PDF support needs the
pdf extra").

## 5. Fields kept, and why they are not repetitions

- **`capabilityVersion`** equals one publication's version in all 15 manifests that state it, but
  publications disagree in 3 (Exa 3.5.1, 3.4.1, 3.4.3; Tavily; browser-use). No rule can pick the
  canonical version from the channels; the owner states it, and the compatibility check compares it.
- **`documentation`** is the source README (with `#readme`) in 5 of 22. Same value, different
  meaning: it answers "where do I read about it?" (sole answer to J3), and a consumer cannot know
  that the README is the documentation unless someone says so.
- **`parent` and `components`** state one relation from both ends, in two documents. A consumer that
  finds a skill in search must see its bundle without loading every manifest. The validator checks
  that both ends agree, so they cannot drift silently.
- **The dates and statuses** have different meanings and different sources (C9, C11), and the
  validator compares them instead of copying them.

## 6. What changed

| Area | Change |
|---|---|
| Schema | Top-level `platformCompatibility` and `intendedAudience` removed, with their conditional rule; `publications[].platformCompatibility` carries the full definition; `runtime` and `runtime[].detail` definitions narrowed; `x-retiredFields` answers the two removed fields |
| Validator | `PLATFORM_COMPATIBILITY_MISMATCH` retired; `RUNTIME_REPEATS_PUBLICATION` added; `UNKNOWN_FIELD` uses `x-retiredFields` hints |
| 22 manifests | 9 moved their hosts to 13 publications, re-checked against the READMEs; 16 lost `intendedAudience`; 24 runtime details corrected; `lastUpdated` 2026-11-16. All 22 valid, all `adoptable`, 0 warnings |
| Examples | `sql-review` (and its two 1.4.0 revisions) states its host on a tagged repository publication; the Playwright example's runtime cleaned and its marketplace entry given its host |
| Tests | 226 tests, 225 pass (the known Windows path test, R4); new tests for each rule |
| Compatibility | Against the Phase 1 baseline schema (2026-10-23), the breaking changes are now `FIELD_REMOVED` `intendedAudience`, `FIELD_REMOVED` `platformCompatibility`, and `REQUIREMENT_ADDED` `assessmentReference.assessedOn`. Schema 0.1 is unpublished, so no published record breaks |
