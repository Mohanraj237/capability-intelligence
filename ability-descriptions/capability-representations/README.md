# Five Distinct Capability Representations

These five capabilities cover different primary functions rather than selecting SQL Review revisions or two browser-automation servers.

Each has a free-text description in `free-text`, simplified A2A-style YAML in `a2a-style/`, and a linked existing structured draft in `ability-descriptions/`. No third copy is created.

| Capability | Primary function | Free text | A2A style | Existing structured draft |
| --- | --- | --- | --- | --- |
| SQL Review | Static SQL review | [Text](free-text/sql-review.txt) | [YAML](a2a-style/sql-review.yaml) | [Draft](structured-style/sql-review.ability.yaml) |
| Translator | Language translation | [Text](free-text/translator.txt) | [YAML](a2a-style/translator.yaml) | [Draft](structured-style/translator.ability.yaml) |
| Runbook Search | Information retrieval | [Text](free-text/runbook-search.txt) | [YAML](a2a-style/runbook-search.yaml) | [Draft](structured-style/runbook-search.ability.yaml) |
| Playwright MCP | Browser automation | [Text](free-text/playwright-mcp.txt) | [YAML](a2a-style/playwright-mcp.yaml) | [Draft](structured-style/playwright-mcp.ability.yaml) |
| Agent Evaluation Framework | Agent evaluation and comparison | [Text](free-text/agent-eval-framework.txt) | [YAML](a2a-style/agent-eval-framework.yaml) | [Draft](structured-style/agent-eval-framework.ability.yaml) |

## Format and provenance

The A2A-style files follow the requested `name`, `description`, `inputs`, and `outputs` example. They are simplified comparison descriptions, **not specification-compliant A2A Agent Cards**, and do not claim that these capabilities expose A2A endpoints.

The existing structured ability descriptions are **custom drafts, not verified OASF records**. An OASF-compliant conversion would require a separate schema/taxonomy mapping.

Input/output labels in the simplified files are readable summaries of the linked drafts, not request/response contracts. SQL Review and Runbook Search have explicit ports in their source manifests; other ports are inferred from described behavior. Detailed types, inference markers, source paths, and limitations remain in the linked drafts.

Translator is included for its distinct translation function, but its original metadata is an intentionally invalid fixture. These representations describe its stated behavior; they do not repair or validate that fixture. Playwright MCP performs browser workflows, whereas Agent Evaluation Framework evaluates agents and skills; their primary functions differ despite both having testing-related uses.
