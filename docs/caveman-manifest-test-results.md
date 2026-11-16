# Caveman plugin manifest: test results

> **Updated 2026-11-16:** the five skill manifests now reach `adoptable` (use cases, `setup: []`, limitations, cost, and documentation, from each `SKILL.md` and folder listing); their publications state the `main` ref (decision C9); the plugin's name prefixes were dropped (R1); `source.updatedAt` follows the latest push. Re-run against a fresh clone: 44 of 44 fact checks (online included) and 22 of 22 mutations detected. The results below are as of 2026-11-09.

Date: 2026-11-09. The real manifests for the Caveman plugin for Claude Code, tested against schema
0.1. They are in [`case-studies/production-set/manifests/caveman/`](../case-studies/production-set/manifests/caveman/) (the test scripts stay in [`case-studies/caveman/`](../case-studies/caveman/)); the modelling reasoning is in
[skills-and-agents-modelling.md](skills-and-agents-modelling.md).

## 1. Verdict

| # | Test | What it shows | Result |
|---|---|---|---|
| T1 | Schema and consistency validation (Node.js) | The manifests are well formed and consistent with each other | **6 of 6 valid**, 0 errors, 0 warnings, 20 unverified |
| T2 | Same, with `--check-sources` | The repository URL is reachable | **6 of 6 sources passed** |
| T3 | Required completeness level | How complete each manifest is | The bundle reaches **adoptable**; the five skills reach **assessable** |
| T4 | Independent validation (Python `jsonschema`, PyYAML) | The verdicts do not depend on one implementation | **Agrees**; the report conforms to its contract |
| T5 | Exchange export | Another team can consume the set | **6 exported, 0 rejected**; conforms to the exchange contract |
| T6 | Fact check against the repository | The values are true, not just well formed | **44 of 44** |
| T7 | Mutation tests | The checks can fail | **22 of 22** deliberate errors caught |
| T8 | Existing project tests | Nothing else broke | 204 of 206 pass; the same 2 fail without these files |

Passing T1 means the manifests follow the schema. It does not mean the values are true (that is T6),
that the plugin works, or that it is approved. Section 5 lists what these tests do not cover.

## 2. What was tested

| Item | Value |
|---|---|
| Subject | The Caveman plugin for Claude Code, plugin version **4.1.0** (`caveman@caveman`) |
| Repository | https://github.com/JuliusBrussee/caveman, commit `3dc497a7f858c774d6e15b25e8c6120ef3a0eda8` (2026-11-09 01:48 UTC), tag `v4.1.0` |
| Schema and tool | Manifest schema 0.1 (revision of 2026-10-23); `capability-manifest` 0.1.0 |
| Manifests | 6 files, 540 lines: one plugin bundle and five skills |
| Method | The repository was cloned into an isolated folder and read as data. Nothing from it was run. Each value was taken from a file in the repository or from the GitHub API, and the manifest's `provenance` block says which |

What the manifests contain:

| Manifest | Type | Level | What it holds |
|---|---|---|---|
| `juliusbrussee/caveman-plugin` | plugin | adoptable | The bundle: identity, license, publication `caveman@caveman` v4.1.0, runtime, setup, 7 limitations, cost, 5 `components`, 25 `embeddedComponents`, `x-modes` |
| `juliusbrussee/caveman` | skill | assessable | The base voice skill |
| `juliusbrussee/ultracave` | skill | assessable | Maximum compression; `disable-model-invocation: true` |
| `juliusbrussee/megacave` | skill | assessable | Classical Chinese; `disable-model-invocation: true` |
| `juliusbrussee/caveman-commit` | skill | assessable | Terse Conventional Commits |
| `juliusbrussee/caveman-review` | skill | assessable | One-line review findings |

The 25 embedded components in the bundle: 17 skills, 3 subagents, 1 command, 4 hooks. With the five
skills above that accounts for all 22 skills in `skills/`.

The ids use the GitHub owner as namespace. Who allocates namespaces is open (U3), so they are
provisional.

## 3. Results

### T1. Validation (offline)

```text
$ node bin/capability-manifest.js validate case-studies/production-set/manifests/caveman
Summary: 6 manifest(s): 6 valid, 0 invalid - 0 error(s), 0 warning(s), 20 unverified check(s)
Completeness of the 6 structurally valid manifest(s): none 0, discoverable 0, assessable 5, adoptable 1, governed 0
exit=0
```

The 20 unverified checks are not failures. They are things this run could not confirm:

| Code | Count | Meaning here |
|---|---|---|
| `SOURCE_NOT_CHECKED` | 6 | Offline run. Resolved by T2 |
| `RISK_UNASSESSED` | 6 | No risk assessment exists. It must not be read as low risk |
| `LICENSE_NEEDS_REVIEW` | 6 | Apache-2.0 was read for the repository as a whole (`scope: repository`), so it may not cover each part |
| `DERIVED_VALUE_UNCONFIRMED` | 2 | Two judgments of mine, not stated by the owner: `/components` (which skills are independent) and `/runtime` (Node.js and Python prerequisites). The owner or a curator must confirm them |

The reciprocity check passed: the bundle's `components` list the five skills, and each skill names
the bundle as `parent`.

### T2. Source reachability

```text
$ node bin/capability-manifest.js validate case-studies/production-set/manifests/caveman --check-sources
checks: ... source passed        (6 of 6)
Summary: 6 manifest(s): 6 valid, 0 invalid - 0 error(s), 0 warning(s), 14 unverified check(s)
```

Unverified checks fell from 20 to 14: exactly the six `SOURCE_NOT_CHECKED`.

### T3. Completeness levels

| Manifest | Level reached | Next level needs |
|---|---|---|
| `caveman-plugin` | adoptable | governed: a risk assessment (Mission 3) |
| the five skills | assessable | adoptable: `setup`, `limitations` |

`--require-level adoptable` passes for the bundle (exit 0) and fails for the five skills (exit 1,
`COMPLETENESS_BELOW_REQUIRED`). That result is correct: no source states setup or limitations for the
individual skills, and I did not invent them. The skills have no version either; they satisfy the
version fact with `versionScheme: unversioned` on their publication.

### T4. Python cross-check

```text
manifest                                       schema   formats  types
caveman-commit.capability.yaml                 valid    valid    ok
caveman-plugin.capability.yaml                 valid    valid    ok
caveman-review.capability.yaml                 valid    valid    ok
caveman.capability.yaml                        valid    valid    ok
megacave.capability.yaml                       valid    valid    ok
ultracave.capability.yaml                      valid    valid    ok

storedModes[0] read by PyYAML: 'off' (str)
validation report: 6 manifests, 6 valid, 0 errors; contract check: conforms
Python and Node.js agree.
```

`jsonschema` 4.26.0 and PyYAML 6.0.3, Draft 2020-12, with and without format assertions. The PyYAML
loader rejects duplicate keys. The `storedModes[0]` line matters: see finding 1 in §4.

### T5. Exchange export

```text
ID                            TYPE    LEVEL       VERSION  RISK        OWNER
juliusbrussee/caveman         skill   assessable  -        UNASSESSED  Julius Brussee (external)
juliusbrussee/caveman-commit  skill   assessable  -        UNASSESSED  Julius Brussee (external)
juliusbrussee/caveman-plugin  plugin  adoptable   4.1.0    UNASSESSED  Julius Brussee (external)
juliusbrussee/caveman-review  skill   assessable  -        UNASSESSED  Julius Brussee (external)
juliusbrussee/megacave        skill   assessable  -        UNASSESSED  Julius Brussee (external)
juliusbrussee/ultracave       skill   assessable  -        UNASSESSED  Julius Brussee (external)
Exchange document 0.1: 6 capability manifest(s), 0 rejected input(s).
```

The JSON exchange document validates against
[`schema/contracts/exchange-document-0.1.schema.json`](../schema/contracts/exchange-document-0.1.schema.json)
with 0 errors (checked with Python `jsonschema`).

### T6. Fact check: are the values true?

`node case-studies/caveman/verify-facts.mjs <clone> --online` re-reads each claim against the clone
and the GitHub API.

| Group | Checks | What is verified |
|---|---|---|
| B1-B9 | 9 | Description, version, `caveman@caveman` coordinate, owner, contact, Apache-2.0 (package.json, LICENSE, LICENSING.md), Caveman Cloud being separate commercial software, tag `v4.1.0`, publication date |
| S1-S6 | 6 | `skills/` holds exactly 22 skills and the manifests account for all of them (5 + 17); `plugin.json` has no `skills` key, so no allowlist; every embedded skill description equals its `SKILL.md`; CLAUDE.md's independence statements |
| A1-A2 | 2 | The 3 subagents; their descriptions equal the front matter; `cavecrew-builder` is omitted because its native text is 301 characters |
| C1 | 1 | `commands/` holds exactly one `.md`, `caveman-init` |
| H1-H3 | 3 | The four hook events with script, flag, timeout and status message; the `node` guard; 25 embedded components |
| M1-M5 | 5 | `x-modes` equals `VALID_MODES`, `LEGACY_MODES`, and the `manual` startup mode in the source code; the default is `caveman`; the setup text names every accepted mode |
| P1 | 1 | The environment variables exist in the code |
| L1-L4 | 4 | Each limitation is stated in the repository: compress sends file text to a provider and needs `python3`; Cloud and CLI-login requirements; `caveman learn report --json`; the 3% / 35% / 9% figures and Copilot per-request billing |
| K1-K2 | 10 | For each of the five skills: description, path, `contractRef`, last-commit date, and the `disable-model-invocation` flag |
| R1-R3 | 3 | GitHub API: repository id `1201173969`, not archived, not a fork, Apache-2.0, homepage, topics, last push date |
| **Total** | **44** | **44 passed** |

### T7. Mutation tests

A check that has only passed proves little. `mutation-tests.mjs` damages copies of the manifests in
22 ways and requires each damage to be caught. It first confirms that the unmodified copy is clean.

| Caught by the validator (11) | Expected finding |
|---|---|
| V1 child loses its `parent` link | `PARENT_CHILD_MISMATCH` |
| V2 embedded component typed `skill` | `INVALID_VALUE` |
| V3 version written `v4.1.0` | `INVALID_FORMAT` |
| V4 two manifests share one id | `DUPLICATE_ID` |
| V5 `riskTier: low` without an assessment | `CONDITIONAL_FIELD_REQUIRED` |
| V6 `cavecrew-builder` given its native 301-character description | `CONSTRAINT_VIOLATION` |
| V7 mode id `off` left unquoted | `YAML_PORTABILITY` |
| V8 misspelled field `lifecyleStatus` | `UNKNOWN_FIELD` |
| V9 two skills with the same source path | `DUPLICATE_SOURCE` |
| V10 provenance points at a field that is not there | `PROVENANCE_FIELD_NOT_FOUND` |
| V11 `lastUpdated` in 2031 | `DATE_IN_FUTURE` |

| Caught by the fact check (11) | Check that failed |
|---|---|
| F1 version `4.0.1` instead of `4.1.0` | B2 |
| F2 typo in an embedded skill description | S5 |
| F3 one of the 22 skills removed | S1 and H3 |
| F4 `ultracave` said to allow model invocation | K2 |
| F5 wrong last-commit date | K1 |
| F6 mode order changed | M1 |
| F7 license changed to MIT | B7 |
| F8 owner contact pointing at another repository | B6 |
| F9 a hook timeout stated wrongly | H1 |
| F10 a setup variable the code does not read | P1 |
| F11 setup text drops the `compress` mode | M5 |

Result: baseline clean, **22 of 22 detected**.

### T8. Existing project tests

`npm test`: 206 tests, 204 pass, 2 fail. The same two fail with the new files moved away
("reports a duplicate id across files as an error on both files" and "explains that an unquoted
schemaVersion is a number, without duplicate findings"), so they are not caused by this work. I have
not investigated them. The case-study files are outside the test suite.

## 4. Findings during testing

1. **The validator caught a real portability trap.** The first run gave one warning: the mode id
   `off` was unquoted in `x-modes`. A YAML 1.1 parser such as PyYAML reads it as the boolean `false`.
   `off` is a genuine Caveman mode id, so this was not a contrived case. I quoted it; T4 now shows
   PyYAML reading `'off'` as a string, and mutation V7 keeps the check honest.
2. **The first fact check passed 43 of 43 on its first run.** That was suspicious, so I wrote the
   mutation tests. The first mutation run caught 20 of 21 and missed F6. The fault was in my mutation:
   the same words appear earlier in the prose of the `CAVEMAN_DEFAULT_MODE` setup text, so the edit
   changed the prose, not `storedModes`. I aimed the mutation correctly. The miss also showed that
   nothing checked the prose mode list against the code, so I added check M5 and mutation F11.
3. **The repository corrected my earlier document.** The first version of the modelling document
   was built from a README summary, and the real files contradicted it: the voice modes are three
   separate skills, not settings of one skill, and the plugin ships 22 skills, 3 subagents, 1 command
   and 4 hooks, which I had sketched in a few rows. The corrections are listed at the top of the
   modelling document.
4. **A native value did not fit the schema.** `cavecrew-builder`'s description is 301 characters and
   embedded components allow 300. It is left out, not shortened, as this project does for drafts.

## 5. What these tests do not show

| Not covered | Why it matters |
|---|---|
| The plugin was not installed or run in Claude Code | Nothing here shows that the hooks fire, the skills load, or `/caveman:caveman-commit` works |
| The component split is my judgment | The repository calls five skills independent or self-contained; the rest I kept inline. The validator reports `/components` as unconfirmed. Julius Brussee or a curator should confirm |
| Whether the other 17 skills could be adopted alone | Not checked skill by skill |
| License scope | Apache-2.0 is stated for the whole repository; `LICENSE_NEEDS_REVIEW` stays until someone confirms it per part |
| Risk | `unassessed` on all six. Mission 3 owns that. The facts that matter for it (compress sends file text to a provider; Cloud needs `CAVE_API_KEY`) are free text in `limitations`, not queryable fields |
| Time | The repository changes daily. The facts hold for commit `3dc497a`; a later commit can fail a check legitimately |
| Other packagings | The same repository also ships a Codex plugin, a Cursor plugin and a Gemini extension, each at 4.1.0. They are not in these manifests (open question U18) |
| The CLI, proxy, engine, MCP server and Caveman Cloud | Several skills depend on them. They have no manifests here, so the dependency is recorded as text |

## 6. How to reproduce

```bash
git clone https://github.com/JuliusBrussee/caveman.git ../caveman-clone
git -C ../caveman-clone checkout 3dc497a7f858c774d6e15b25e8c6120ef3a0eda8

node bin/capability-manifest.js validate case-studies/production-set/manifests/caveman                     # T1
node bin/capability-manifest.js validate case-studies/production-set/manifests/caveman --check-sources     # T2
node bin/capability-manifest.js validate case-studies/production-set/manifests/caveman --require-level adoptable   # T3
python case-studies/caveman/crosscheck.py                                         # T4
node bin/capability-manifest.js export case-studies/production-set/manifests/caveman                       # T5
node case-studies/caveman/verify-facts.mjs ../caveman-clone --online              # T6
node case-studies/caveman/mutation-tests.mjs ../caveman-clone                     # T7
npm test                                                                          # T8
```

Requires Node.js 22 and, for T4, `python3 -m pip install jsonschema pyyaml`. Do not run anything
from the clone; the scripts only read it.
