# Review: the 16 relevant capabilities, and a production-level example set

| | |
|---|---|
| Date | 2026-11-13 |
| Reviewed | The 16 capabilities judged relevant in the Spikes 1-3 research ([spikes-1-3-research.md](../spikes-1-3-research.md) §4.3, §7.4), which [phase-1-plan.md](../phase-1-plan.md) Ticket 2 (experiment E6) uses as its working set |
| Evidence | The GitHub repository API, latest GitHub releases, and npm download counts, all queried on 2026-11-13 |
| Status | A review and a proposal. The Mission 4 team decides |

## 1. Summary

The 16 were never chosen as good examples. The research drew 60 capability records, mostly at
random, from public registries for four test needs (N1 browser automation, N2 GitHub issues and pull
requests, N3 web search, N4 PDF extraction). The 16 are the ones a judge marked **relevant** to those
needs. Random draws bring in whatever the registries contain, so the set mixes mature vendor products
with a fork that has no stars, an archived server, and a proprietary skill.

That was the point of the research. The weak records are what exposed the identity and licensing
problems the schema now handles. As **examples of production capabilities**, though, only 8 of the
16 qualify today. This review:
- rates each of the 16 against six production criteria (§3);
- proposes a production-level set of 16 (§4);
- keeps the weak records as edge cases rather than deleting them (§5).

## 2. Production criteria

A capability is a production-level example when all six hold:

| # | Criterion | Test used here |
|---|---|---|
| P1 | Maintained | Not archived; a push within the last 90 days |
| P2 | Accountable owner | Published by the vendor of the technology or an established organisation, not an anonymous individual |
| P3 | Clear open license | An OSI-approved license stated for the capability |
| P4 | Real adoption | Over 1,000 GitHub stars or 100,000 weekly downloads, or the vendor's own integration |
| P5 | Versioned releases | Tagged releases or registry versions, not only a moving branch |
| P6 | Appropriate for the organisation | Its purpose does not conflict with normal acceptable-use rules |

These thresholds are a reviewer's proposal; Mission 2 owns the real maturity definitions.

## 3. The 16, rated

✅ meets the criterion; ⚠️ partly; ❌ fails.

| Need | Capability | Repository (2026-11-13) | P1 | P2 | P3 | P4 | P5 | P6 | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| N1 | Playwright MCP | microsoft/playwright-mcp: 39.6k stars, Apache-2.0, release v0.0.85 (2026-11-09) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **Keep** |
| N1 | browser-use | browser-use/browser-use: 120.9k stars, MIT, release 1.0.3 (2026-11-12) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **Keep** |
| N1 | `webapp-testing` skill (anthropics) | anthropics/skills: 193.8k stars; no repository license, Apache-2.0 in the skill's LICENSE.txt | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | **Keep**, with the license confirmed per skill |
| N1 | `webapp-testing` skill (awesome-copilot) | github/awesome-copilot: 41.1k stars, MIT; a community collection | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | Replace: a collection entry, not a maintained product |
| N1 | PulseMCP Playwright Stealth | pulsemcp/mcp-servers: 81 stars, MIT | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | **Drop**: built to evade bot detection |
| N1 | agentic-playwright-mcp | TechyAditya/agentic-playwright-mcp: 0 stars, license not detected, a fork | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | **Drop** |
| N1 | Browserbase MCP server | browserbase/mcp-server-browserbase: **archived** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | **Drop**: archived, yet still listed in the Docker catalog |
| N1 | cdp-toolkit | sblattj/cdp-toolkit: 1 star, about 1,200 weekly downloads, MIT | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | **Drop** |
| N1 | devloop | vincentvella/devloop: 2 stars, MIT | ✅ | ❌ | ✅ | ❌ | ⚠️ | ✅ | **Drop** |
| N2 | GitHub MCP server | github/github-mcp-server: 34.4k stars, MIT, release v2.1.0 (2026-11-03) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **Keep** |
| N2 | Claude Code Action | anthropics/claude-code-action: 9.9k stars, MIT, major tag v1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **Keep** |
| N3 | DuckDuckGo search server | nickclyde/duckduckgo-mcp-server: 1.6k stars, MIT, v0.7.0; one individual, not published by DuckDuckGo | ✅ | ❌ | ✅ | ✅ | ✅ | ⚠️ | Replace with a search provider's own server |
| N3 | langchain-tavily | tavily-ai/langchain-tavily: vendor-owned, MIT, PyPI releases only | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | **Keep**: the vendor's own integration |
| N4 | pdf-parse | mehmet-kozan/pdf-parse: Apache-2.0, v2.4.5, **12.6 million weekly downloads**; one individual maintainer | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | **Keep**, flagged: widely used but a single maintainer, last push 2026-05-04 |
| N4 | `pdf` skill (anthropics) | anthropics/skills: "All rights reserved" | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ | **Drop**: proprietary, cannot be reused |
| N4 | docling | docling-project/docling: 70.5k stars, MIT, release v2.150.0 (2026-11-10) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **Keep** |

**Result:** 8 keep, 6 drop, 2 replace.

## 4. Proposed production-level set (16)

The proposed set keeps the four needs, so the research's journeys still apply. It also covers more
capability types than before.

| Need | Capability | Type | Owner | Evidence (2026-11-13) | New? |
|---|---|---|---|---|---|
| N1 | Playwright MCP | mcp_server | Microsoft | 39.6k stars, Apache-2.0, v0.0.85 | kept |
| N1 | Chrome DevTools MCP | mcp_server | Google (ChromeDevTools org) | 55.2k stars, Apache-2.0, v1.13.0 (2026-11-11) | **new** |
| N1 | browser-use | framework | Browser Use | 120.9k stars, MIT, 1.0.3 | kept |
| N1 | `webapp-testing` skill | skill | Anthropic | Apache-2.0 per skill | kept |
| N2 | GitHub MCP server | mcp_server | GitHub | 34.4k stars, MIT, v2.1.0 | kept |
| N2 | Claude Code Action | workflow | Anthropic | 9.9k stars, MIT, v1 | kept |
| N2 | PR-Agent | tool | The PR Agent | 16.0k stars, MIT, v0.50.0; [manifest](../../case-studies/production-set/manifests/pr-agent.capability.yaml) | **new** |
| N2* | MCP Atlassian (Jira) | mcp_server | sooperset | 6.1k stars, MIT, v0.24.3; [manifest](../../case-studies/production-set/manifests/mcp-atlassian.capability.yaml) | **new** |
| N3 | Brave Search MCP server | mcp_server | Brave | 1.6k stars, MIT, v2.1.4 (2026-09-17) | **new** |
| N3 | Tavily MCP | mcp_server | Tavily | 2.5k stars, MIT, no GitHub releases | **new** |
| N3 | Exa MCP server | mcp_server | Exa | 5.2k stars, MIT | **new** |
| N3 | langchain-tavily | library | Tavily | MIT, PyPI releases | kept |
| N4 | docling | library | Docling project | 70.5k stars, MIT, v2.150.0 | kept |
| N4 | pdfplumber | library | Jeremy Singer-Vine | 10.9k stars, MIT, v0.11.10; extracts tables | **new** |
| N4 | Unstructured | library | Unstructured | 15.7k stars, Apache-2.0, 0.27.37 (2026-11-06) | **new** |
| N4 | pdf-parse | library | Mehmet Kozan | 12.6M weekly downloads, Apache-2.0, v2.4.5 | kept, flagged |

\* MCP Atlassian is the Jira equivalent of N2 (issues outside GitHub). It is included because it is
use case 1 and its manifest is already done.

Notes on the new entries:
- Four of the new entries are the search or browser vendor's own MCP server. That fixes the main
  weakness of the old set: N3 had no vendor-published server.
- Three of the 16 are still owned by an individual (MCP Atlassian, pdfplumber, pdf-parse). Each is
  kept because its adoption is very high. P2 is flagged on them so that Mission 3 sees the
  single-maintainer risk.
- Tavily MCP and Exa MCP publish no GitHub releases. Their versions must come from npm, which Ticket
  2 should check when it drafts them.
- The stars and versions above are from one day. They show the selection was reasonable; they are
  not a maturity rating.
- None of the 16 has a risk assessment. Production-level here means **well-maintained and well
  described**, not approved. Every manifest stays `riskTier: unassessed` until Mission 3 assesses it.

## 5. What happens to the dropped records

**Keep them in the research snapshot; do not delete them.** The research and the validator's tests
depend on them:

| Dropped record | What it tests |
|---|---|
| agentic-playwright-mcp | A fork claimed in a description (`relations: fork_of`) |
| Browserbase MCP server | An archived source still listed in a catalog (`source.status: archived`) |
| anthropics `pdf` skill | A proprietary license blocking reuse |
| devloop | A registry entry with no license |
| `webapp-testing` (two publishers) | Two different skills with the same name: identity must not merge them |

`test/research.test.js` reproduces the research results from this snapshot, so removing records would
change those results. The proposal is to run **two sets**:
- the **research corpus** (60 records, unchanged), for testing the standard against messy reality;
- a **production reference set** (§4), for examples, demos, and the downstream missions.

## 6. Impact on Phase 1

| Phase 1 item | Impact |
|---|---|
| Ticket 2, E6: draft abilities and input/output types for "16 relevant capabilities" | Use the production set. Its READMEs are better documented, so the drafted abilities are better examples. Eight of the 16 are new and need a snapshot first. |
| Ticket 2: re-run the J1 matcher to see if precision rises | **Keep this on the baseline 60.** J1 precision is measured on the research pools. New capabilities are not in those pools, so mixing sets would make the before-and-after comparison meaningless. |
| Ticket 4, E1 (internal capabilities from Missions 1 and 2) | Unchanged. Public production tools still stand in for internal ones, and the list of 10-20 internal capabilities is still the biggest gap. |
| The frozen `phase1-baseline` | The production set is an addition next to the baseline, not a change to it. |

## 7. Decisions needed

| # | Decision | Owner |
|---|---|---|
| 1 | Accept the six production criteria, or replace them with Mission 2's maturity definitions | Mission 4, with Mission 2 |
| 2 | Accept the 16 in §4 as the production reference set | Mission 4 team |
| 3 | Use the production set for Ticket 2's abilities draft, and the baseline for its precision re-run | Ticket 2 owner |
| 4 | Snapshot the 8 new capabilities and write their manifests, like the two in `case-studies/two-use-cases/` | Mission 4 team. **Done 2026-11-13** for all 16, not only the 8 new ones: every manifest is written and valid, every source is reachable, and all 16 reach `adoptable` ([case-studies/production-set/](../../case-studies/production-set/README.md)) |
