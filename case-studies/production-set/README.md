# Production reference set: 22 real capability manifests

Date: 2026-11-13. All real capability manifests of this project are in one folder,
[manifests/](manifests/):
- the 16 capabilities of the production reference set proposed in
  [the sample review](../../docs/reviews/phase-1-sample-review.md) §4, including PR-Agent and MCP
  Atlassian from [the two use cases](../two-use-cases/README.md);
- the **Caveman** plugin for Claude Code and its 5 independently adoptable skills, in
  [manifests/caveman/](manifests/caveman/). They were written on 2026-11-09 from the public
  repository at v4.1.0 ([test results](../../docs/caveman-manifest-test-results.md)). Their test
  scripts stay in [../caveman/](../caveman/) and now read the manifests from here.

Every field of the schema was reviewed against these 22 manifests in
[field-review-production-set.md](../../docs/reviews/field-review-production-set.md).

Every value was read from the capability's public sources on 2026-11-13: the GitHub repository API
and releases, npm or PyPI, the official MCP Registry, Docker Hub, the README, `action.yml` or
`SKILL.md`, and the official documentation. Each manifest's `provenance` list names the source of
every value. Two repository ids (the `webapp-testing` skill and pdf-parse) come from the research
snapshot of 2026-10-22, because the GitHub API rate limit was reached; their provenance says so.

## The 16 manifests

| Need | Manifest | Type | Owner | Version | Runs as |
|---|---|---|---|---|---|
| N1 browser | [playwright-mcp](manifests/playwright-mcp.capability.yaml) | mcp_server | Microsoft Corporation | 0.0.85 | local (npx) |
| N1 browser | [chrome-devtools-mcp](manifests/chrome-devtools-mcp.capability.yaml) | mcp_server | Google LLC | 1.13.0 | local (npx), plugin |
| N1 browser | [browser-use](manifests/browser-use.capability.yaml) | framework | Browser Use | 1.0.3 | Python library, CLI |
| N1 browser | [webapp-testing](manifests/webapp-testing.capability.yaml) | skill | Anthropic | `main` (no version) | agent host |
| N2 GitHub | [github-mcp-server](manifests/github-mcp-server.capability.yaml) | mcp_server | GitHub | 2.1.0 | hosted, container |
| N2 GitHub | [claude-code-action](manifests/claude-code-action.capability.yaml) | workflow | Anthropic | tag `v1` | GitHub Action |
| N2 GitHub | [pr-agent](manifests/pr-agent.capability.yaml) | tool | The PR Agent | 0.50.0 | GitHub Action, CLI, container |
| N2* Jira | [mcp-atlassian](manifests/mcp-atlassian.capability.yaml) | mcp_server | sooperset | 0.24.3 | local (uvx), container |
| N3 search | [brave-search-mcp-server](manifests/brave-search-mcp-server.capability.yaml) | mcp_server | Brave Software, Inc. | 2.1.4 | local (npx), container |
| N3 search | [tavily-mcp](manifests/tavily-mcp.capability.yaml) | mcp_server | Tavily | 0.2.22 | hosted, local (npx) |
| N3 search | [exa-mcp-server](manifests/exa-mcp-server.capability.yaml) | mcp_server | Exa Labs | 3.4.3 | hosted, local (npm) |
| N3 search | [langchain-tavily](manifests/langchain-tavily.capability.yaml) | library | Tavily | 0.2.18 | Python library |
| N4 PDF | [docling](manifests/docling.capability.yaml) | library | Docling Project (LF AI & Data) | 2.150.0 | Python library, CLI |
| N4 PDF | [pdfplumber](manifests/pdfplumber.capability.yaml) | library | Jeremy Singer-Vine | 0.11.10 | Python library, CLI |
| N4 PDF | [unstructured](manifests/unstructured.capability.yaml) | library | Unstructured | 0.27.37 | Python library, container |
| N4 PDF | [pdf-parse](manifests/pdf-parse.capability.yaml) | library | Mehmet Kozan | 2.4.5 | JavaScript library, CLI |

### Caveman (in `manifests/caveman/`)

| Manifest | Type | Owner | Version | Completeness |
|---|---|---|---|---|
| [caveman-plugin](manifests/caveman/caveman-plugin.capability.yaml) | plugin | Julius Brussee | 4.1.0 | adoptable |
| [caveman](manifests/caveman/caveman.capability.yaml), [ultracave](manifests/caveman/ultracave.capability.yaml), [megacave](manifests/caveman/megacave.capability.yaml), [caveman-commit](manifests/caveman/caveman-commit.capability.yaml), [caveman-review](manifests/caveman/caveman-review.capability.yaml) | skill (each with `parent` pointing to the plugin) | Julius Brussee | from the plugin | assessable: no setup or limitations of their own |

With Caveman, the folder covers seven capability types (mcp_server, library, plugin, skill,
workflow, framework, tool), six kinds of publication channel (packages on npm and PyPI, container images, the
MCP Registry, hosted endpoints, a plugin marketplace, a repository used directly), a bundle with
child capabilities, and both vendor products and community projects.

## Validation result

```bash
node bin/capability-manifest.js validate case-studies/production-set/manifests --check-sources
```

The folder is searched recursively, so this validates all 22, Caveman included. The results below
are for the 16; Caveman's are in its [test results](../../docs/caveman-manifest-test-results.md).

- **16 of 16 valid**: 0 errors, 0 warnings.
- **16 of 16 sources reachable**.
- **16 of 16 at `adoptable`**: each states what it does, where it runs, its license, a version, a
  lifecycle signal, its owner and contact, its setup, and its limitations. None is `governed`,
  because none has a risk assessment.
- **21 unverified checks**, all expected:

| Check | Count | Manifests | Meaning |
|---|---|---|---|
| `RISK_UNASSESSED` | 16 | all | No risk assessment exists. Mission 3 must assess before any is treated as approved |
| `PUBLICATION_VERSIONS_DIFFER` | 3 | browser-use (PyPI 1.0.3, registry 0.13.11), Tavily MCP (npm 0.2.22, registry 0.2.15), Exa (npm 3.4.3, registry 3.4.1) | The MCP Registry entries lag the packages. Confirm the version before pinning |
| `LICENSE_NEEDS_REVIEW` | 1 | MCP Atlassian | PyPI states no license; MIT was read from the repository |
| `DERIVED_VALUE_UNCONFIRMED` | 1 | webapp-testing | Its repository publication's `platformCompatibility: [claude-code]` is inferred from the Agent Skill format; the source names no host (since 2026-11-16) |

For comparison, the research's drafts of the same kind of public records reached no higher than
`assessable` (levels none 2, discoverable 25, assessable 31 of 60), because native metadata never
states limitations. The difference here is curation: a person read each README and recorded the
setup and limitations, with provenance.

All 22 together: 22 valid, 0 errors, 0 warnings, 35 unverified checks with sources checked; **all 22
`adoptable`** since 2026-11-16, when the five Caveman skills were completed from their own `SKILL.md`
files and folder listings (use cases, `setup: []`, limitations, cost, documentation).

**Updated 2026-11-16:** `platformCompatibility` now lists AI hosts only, and connected systems moved
to `integrations` (decision register C5); PR-Agent's GitHub Action is typed `ci_action`. Then the
[field overlap review](../../docs/phase-1-testing/field-overlap-review.md) moved the hosts into the
publications that support them (13 publications in 9 manifests, re-checked against each README,
C14), removed `intendedAudience` from 16 manifests (C15), and cut the package names, images, and
hosts out of 24 runtime details (C16). All 22
manifests were tested field by field in [docs/phase-1-testing](../../docs/phase-1-testing/README.md).

Outputs: [outputs/validation-report.json](outputs/validation-report.json) and
[outputs/exchange-document.json](outputs/exchange-document.json) cover all 22.

## What the real data showed

| Finding | Where | Why it matters |
|---|---|---|
| **Write access by default** | GitHub MCP server, MCP Atlassian, Claude Code Action, PR-Agent | Agents act with the token's permissions. Read-only switches exist (`GITHUB_READ_ONLY`, `READ_ONLY_MODE`) and are recorded in `setup` |
| **Telemetry on by default** | Chrome DevTools MCP (Google usage statistics; CrUX lookups), Unstructured (analytics pings) | Both document an opt-out, recorded in `setup` and `limitations` |
| **Code or content sent to a third party** | Claude Code Action, PR-Agent, browser-use (model providers); Brave, Tavily, Exa, langchain-tavily (search APIs) | A trust assessor needs to know where data goes; each says so in `limitations` |
| **Hosted and local forms of one capability** | GitHub MCP server, Tavily MCP, Exa | One manifest with several `publications` instead of several inventory entries |
| **Same name, different capability** | `webapp-testing` (Anthropic and awesome-copilot); browser-use library and Browser Use Cloud; Unstructured library and platform; langchain-tavily and Tavily MCP | Recorded as `distinct_from` relations, so the inventory does not merge them |
| **Floating versions in official instructions** | Playwright and Chrome DevTools (`@latest`), PR-Agent (`@main`), Claude Code Action (`@v1`), the skill (`main`), several `:latest` images | Each limitation says to pin a version for production |
| **Breaking major versions** | browser-use 1.0, pdf-parse v2, Brave Search 2.x | Recorded as limitations, so Mission 1 can warn adopters of old code |
| **Single maintainers** | pdfplumber, MCP Atlassian, pdf-parse | Kept because adoption is very high; flagged for Mission 3 |
| **API key in a URL** | Tavily's hosted-server example | Keys in query strings can end up in logs |

## Choices a curator made

These are `curated` in `provenance` and should be confirmed by the Mission 4 team:
- **Capability types.** Libraries (pdfplumber, Unstructured, docling, pdf-parse, langchain-tavily)
  are `library`, a value added on 2026-11-13 ([Phase 1 changes](../../docs/phase-1-changes-explained.md),
  C1); before that they had to be `tool`. PR-Agent stays `tool` (something that runs), and browser-use
  stays `framework`, because it is for building agents.
- **Ids under the publisher's namespace.** For example `anthropics/webapp-testing` for a skill inside
  the `anthropics/skills` repository, and `chromedevtools/chrome-devtools-mcp` for the GitHub
  organisation ChromeDevTools. Id assignment is still an open question for Missions 5 and 2.
- **Bundled skills are not listed.** Chrome DevTools MCP ships separately adoptable skills; under the
  granularity rules they would get manifests of their own.
- **Claude Code Action has no `capabilityVersion`.** It is used from the moving major tag `v1`,
  recorded as a publication with `versionScheme: tag`.
- **Open-source products only.** browser-use, Unstructured, and PR-Agent have commercial siblings;
  the manifests describe the open-source capability and link the commercial one with `distinct_from`.

## Relation to the other example sets

| Set | Purpose | Data |
|---|---|---|
| [`examples/`](../../examples/) | Exercise every validator rule | Hand-written, mostly fictional |
| [`research/spikes-1-3/`](../../research/spikes-1-3/) | Test the standard against messy reality | 60 records as sampled on 2026-10-22, including archived, forked, and proprietary ones |
| **This folder** | Production-level examples for demos and for Missions 1, 2, 3, and 5 | 16 real, maintained capabilities, curated on 2026-11-13 |

`playwright-mcp` exists in both `examples/valid/` (the research snapshot, `assessable`) and here
(curated, `adoptable`) under the same id. Validate the two folders separately, or the duplicate-id
check will correctly report them.

## Still not set

`riskTier` stays `unassessed` (Mission 3), `maturity` is for Mission 2, and `lifecycleStatus` is for
the owner. None of the sources declares a lifecycle status; the lifecycle signal comes from
`source.status` and `publications[].status`.

These are snapshots. Several projects released within the last week. Re-check versions,
publications, and limitations before relying on them, and update `lastUpdated` and the `observedAt`
dates when you do.

## Regenerate the outputs

From the repository root:

```bash
node bin/capability-manifest.js validate case-studies/production-set/manifests --check-sources --format json > case-studies/production-set/outputs/validation-report.json
node bin/capability-manifest.js export case-studies/production-set/manifests --out case-studies/production-set/outputs/exchange-document.json
```
