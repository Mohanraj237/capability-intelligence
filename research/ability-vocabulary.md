# Ability Vocabulary

Draft vocabulary derived from the 16 ability descriptions in this folder. These are local standard terms, not an externally ratified standard or published API/tool names.

## Naming rules

Use lowercase kebab-case identifiers for behavior, not capability names, interfaces, or versions. Reuse a term when the behavior is equivalent; preserve distinct terms when outputs or actions differ. Put domain restrictions and representation details in `description`, `inputs`, `outputs`, and `source_context`.

For example, "Reviews SQL", "Checks SQL", and "Analyzes SQL changes for review findings" use `sql-review`. A narrower performance check can additionally use `sql-performance-analysis`; explaining a query plan uses `query-plan-explanation`. Standardization does not imply that all SQL Review revisions support the same abilities.

## Standard terms

The first column is the canonical identifier to use in YAML `abilities`. Equivalent wording is guidance for normalization, not a claim that every phrase appears verbatim in the manifests.

| Standard term | Definition | Equivalent wording |
| --- | --- | --- |
| action-item-extraction | Identify follow-up actions from meeting content. | Extract action items; capture meeting follow-ups |
| agent-regression-evaluation | Evaluate agents or skills on repeatable cases to detect regressions. | Run agent regression evaluations; regression-test agent behavior |
| analytics-warehouse-rule-check | Check SQL against analytics data warehouse-specific rules. | Check analytics SQL rules; review warehouse-specific rules |
| browser-automation | Programmatically interact with web pages through a browser. | Automate browser actions; interact with web pages |
| code-search | Find relevant code across repositories. | Semantic code search; search internal repositories |
| data-access-policy-check | Check SQL reads against data-access policy. | Check query access policy; detect unapproved classified PII reads |
| document-summarization | Condense document content into a shorter summary. | Summarize documents; summarize internal documents |
| end-to-end-browser-testing | Perform automated browser-based end-to-end testing workflows. | Automated browser testing; browser E2E testing |
| evaluation-report-generation | Produce reports of evaluation or regression outcomes. | Write evaluation reports; produce regression reports |
| executive-brief-generation | Produce a structured executive-level brief. | Generate executive briefs; create structured executive summaries |
| first-response-planning | Propose initial incident response steps for human confirmation. | Propose first response; draft initial response plan |
| form-interaction | Fill form fields and interact with form controls. | Fill forms; automate form interactions |
| incident-context-correlation | Relate alerts to deployments, logs, metrics, and other incident evidence. | Correlate alert context; summarize related incident evidence |
| incident-triage | Assess a production alert and propose incident severity. | Triage production alerts; propose alert severity |
| incident-triage-checklist | Gather alert context and open an incident triage checklist. | Open triage checklist; gather context for a triage checklist |
| log-query | Query stored logs through read-only tools. | Query logs; retrieve matching log records |
| meeting-summarization | Summarize discussions consumed from meetings. | Summarize meetings; produce meeting notes |
| metric-query | Query stored observability metrics through read-only tools. | Query metrics; retrieve metric data |
| multi-agent-tab-isolation | Keep browser tab interactions isolated between agents using a target identifier. | Isolate tabs by targetId; multi-agent browser tab isolation |
| ownership-aware-result-ranking | Rank code-search results using ownership information. | Ownership-aware ranking; rank code matches by ownership context |
| postmortem-drafting | Draft a blameless incident postmortem from a timeline. | Draft postmortem; generate blameless postmortem draft |
| pre-deploy-safety-check | Block deployment while a SEV-1 incident is open. | Pre-deploy safety hook; block deploys during SEV-1 incidents |
| prompt-model-comparison | Compare prompt or model versions on the same evaluation test set. | Compare prompt versions; compare model versions |
| query-plan-explanation | Explain the query plan of a slow SQL query. | Explain slow-query plan; interpret query plan |
| runbook-search | Locate relevant runbook sections for an alert, service, or symptom, with source links. | Semantic runbook search; retrieve relevant runbook sections |
| screenshot-capture | Capture a browser page image. | Take screenshots; capture page screenshots |
| sql-performance-analysis | Identify SQL performance anti-patterns through static analysis. | Check SQL performance; detect query anti-patterns |
| sql-review | Review SQL changes and report findings with suggested fixes. | Reviews SQL; checks SQL; analyzes SQL changes for review findings |
| trace-query | Query stored observability traces through read-only tools. | Query traces; retrieve trace data |
| translation | Translate content between supported languages. | Translate product documentation; documentation translation |
| uncovered-branch-explanation | Explain code branches that remain uncovered by tests. | Explain coverage gaps; describe uncovered branches |
| unit-test-generation | Generate unit-test source code for changed functions. | Generate unit tests; create tests for changed functions |

## Normalized draft labels

These changes are applied to the YAML descriptions. Historical labels are not additional standard terms.

| Previous label | Standard term | Reason |
| --- | --- | --- |
| internal-document-summarization | document-summarization | Internal documents are a scope restriction, not a separate behavior. |
| product-documentation-translation | translation | Product documentation and supported languages belong in the data descriptions. |
| semantic-code-search | code-search | Semantic search is the method; code identifies the searched resource. |
| semantic-runbook-search | runbook-search | Semantic search is the method; runbooks identify the searched resource. |
| relevant-runbook-section-retrieval | runbook-search | Returning relevant sections is the result of the same search, not a second independent ability in this draft. |
| runbook-retrieval | runbook-search | The Incident Triage Agent locates relevant runbooks through its Runbook Search dependency. |
| production-alert-triage | incident-triage | Production alerts remain documented as the input and scope. |

## Common abilities and boundaries

`sql-review` is shared by all four SQL Review records. `sql-performance-analysis` is explicitly drafted for the baseline and both compatibility revisions; the analytics fork does not declare enough detail to assume it. `data-access-policy-check` is present only in the baseline and compatible revision.

`browser-automation` is shared by Playwright MCP and agentic-playwright-mcp. `runbook-search` is shared by Runbook Search, SRE Toolkit, and Incident Triage Agent, including component/dependency behavior rather than claiming identical interfaces.

Search is a common family, represented by `code-search` and `runbook-search`. Keeping the resource in the label avoids treating different data sources as interchangeable. `log-query`, `metric-query`, and `trace-query` remain separate observability operations.

`document-summarization` and `meeting-summarization` share summarization behavior but differ in source content and workflow. `executive-brief-generation` and `action-item-extraction` describe additional output-specific abilities.

`unit-test-generation` is a specialized code-generation behavior. A generic `code-generation` label is not added because these examples do not establish broader code generation. Likewise, no generic `classification` ability is assumed solely from an incident severity proposal. New terms should be supported by described behavior, not added just to match an illustrative list.

All inferred abilities remain drafts. Vocabulary normalization does not validate the intentionally invalid source fixtures or turn inferred input/output types into verified contracts.
